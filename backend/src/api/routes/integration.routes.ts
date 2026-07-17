import { Router } from 'express';
import { integrationRegistry } from '../../integrations/providers';
import { oauth2Handler } from '../../integrations/auth/OAuth2Handler';
import { credentialManager } from '../../integrations/auth/CredentialManager';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { IntegrationProvider, OAuth2Config, AuthType } from '@silo/shared/types/integration';
import { logger } from '../../utils/logger';

const router = Router();

const frontendBase = () => process.env.FRONTEND_URL || 'http://localhost:5173';
const mobileScheme = () => process.env.MOBILE_APP_SCHEME || 'silomobile';

function integrationRedirect(platform: 'web' | 'mobile', status: 'success' | 'error', detail?: string) {
  if (platform === 'mobile') {
    const params = new URLSearchParams({ [status]: detail || 'true' });
    return `${mobileScheme()}://integration-callback?${params.toString()}`;
  }
  const params = new URLSearchParams({ [status]: detail || 'true' });
  return `${frontendBase()}/integrations?${params.toString()}`;
}

// OAuth2 callback must stay public (provider redirect has no JWT)
router.get('/oauth/callback', async (req, res) => {
  try {
    const { code, state, error } = req.query;

    if (error) {
      logger.error('OAuth error', { error });
      return res.redirect(integrationRedirect('web', 'error', 'oauth_failed'));
    }

    if (!code || !state) {
      return res.status(400).json({ error: 'Missing code or state' });
    }

    const stateData = oauth2Handler.verifyState(state as string);
    if (!stateData) {
      return res.status(400).json({ error: 'Invalid or expired state' });
    }

    const { userId, provider, platform } = stateData;
    const integration = integrationRegistry.get(provider as IntegrationProvider);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const oauth2Config = getOAuth2Config(provider as IntegrationProvider);
    if (!oauth2Config) {
      return res.status(500).json({ error: 'OAuth2 not configured' });
    }

    const credentials = await oauth2Handler.exchangeCodeForToken(oauth2Config, code as string);

    const testResult = await integration.testConnection(credentials);
    if (!testResult.success) {
      logger.error('OAuth connection test failed', { provider, error: testResult.message });
      return res.redirect(integrationRedirect(platform, 'error', 'connection_failed'));
    }

    const metadata = integration.getInfo().metadata;
    let integrationRecord = await prisma.integration.findFirst({ where: { provider } });
    if (!integrationRecord) {
      integrationRecord = await prisma.integration.create({
        data: {
          provider,
          name: metadata.name,
          description: metadata.description || '',
          category: metadata.category,
          authType: 'OAUTH2',
          logo: metadata.logo,
          color: metadata.color,
          docUrl: metadata.docUrl,
          enabled: metadata.enabled,
        },
      });
    }

    await prisma.integrationConnection.create({
      data: {
        userId,
        integrationId: integrationRecord.id,
        name: `${metadata.name} Connection`,
        credentials: credentialManager.encrypt(credentials),
        status: 'ACTIVE',
        lastTested: new Date(),
      },
    });

    return res.redirect(integrationRedirect(platform, 'success'));
  } catch (error: any) {
    logger.error('OAuth callback failed', { error: error.message });
    return res.redirect(integrationRedirect('web', 'error', 'oauth_failed'));
  }
});

router.use(authenticate);

// List all available integrations
router.get('/', async (_req: AuthRequest, res) => {
  try {
    const integrations = integrationRegistry.getAllMetadata();
    res.json({ integrations });
  } catch (error: any) {
    logger.error('Failed to list integrations', { error: error.message });
    res.status(500).json({ error: 'Failed to list integrations' });
  }
});

// List user connections — must be registered before /:provider or "user" is treated as a provider slug
router.get('/connections/list', async (req: AuthRequest, res) => {
  try {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId: req.userId },
      include: { integration: true },
      orderBy: { createdAt: 'desc' },
    });

    const masked = connections.map((conn: any) => ({
      ...conn,
      credentials: credentialManager.mask(credentialManager.decrypt(conn.credentials)),
    }));

    res.json({ connections: masked });
  } catch (error: any) {
    logger.error('Failed to list connections', { error: error.message });
    res.status(500).json({ error: 'Failed to list connections' });
  }
});

router.get('/user', async (req: AuthRequest, res) => {
  try {
    const connections = await prisma.integrationConnection.findMany({
      where: { userId: req.userId },
      include: { integration: true },
      orderBy: { createdAt: 'desc' },
    });

    const masked = connections.map((conn: any) => ({
      ...conn,
      credentials: credentialManager.mask(credentialManager.decrypt(conn.credentials)),
    }));

    res.json({ connections: masked });
  } catch (error: any) {
    logger.error('Failed to list user integrations', { error: error.message });
    res.status(500).json({ error: 'Failed to list connections' });
  }
});

// Get integration details
router.get('/:provider', async (req: AuthRequest, res) => {
  try {
    const { provider } = req.params;
    const integration = integrationRegistry.get(provider as IntegrationProvider);

    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    return res.json(integration.getInfo());
  } catch (error: any) {
    logger.error('Failed to get integration', { error: error.message });
    return res.status(500).json({ error: 'Failed to get integration' });
  }
});

// Connect integration
router.post('/:provider/connect', async (req: AuthRequest, res) => {
  try {
    const { provider } = req.params;
    const { credentials, name, platform } = req.body;
    const oauthPlatform: 'web' | 'mobile' = platform === 'mobile' ? 'mobile' : 'web';

    const integration = integrationRegistry.get(provider as IntegrationProvider);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const metadata = integration.getInfo().metadata;

    // OAuth2 flow
    if (metadata.authType === AuthType.OAUTH2) {
      const oauth2Config = getOAuth2Config(provider as IntegrationProvider);
      if (!oauth2Config) {
        return res.status(500).json({ error: 'OAuth2 not configured' });
      }

      const authUrl = oauth2Handler.generateAuthorizationUrl(oauth2Config, req.userId!, provider, oauthPlatform);
      return res.json({ authUrl, requiresOAuth: true });
    }

    // API Key flow
    if (!credentials) {
      return res.status(400).json({ error: 'Credentials required' });
    }

    const validation = credentialManager.validate(credentials);
    if (!validation.valid) {
      return res.status(400).json({ error: 'Invalid credentials', details: validation.errors });
    }

    const testResult = await integration.testConnection(credentials);
    if (!testResult.success) {
      return res.status(400).json({ error: 'Connection failed', details: testResult.message });
    }

    let integrationRecord = await prisma.integration.findFirst({ where: { provider } });
    if (!integrationRecord) {
      // Map AuthType enum to Prisma AuthType enum
      const authTypeMap: Record<AuthType, 'OAUTH2' | 'API_KEY' | 'BASIC' | 'BEARER' | 'NONE'> = {
        [AuthType.OAUTH2]: 'OAUTH2',
        [AuthType.API_KEY]: 'API_KEY',
        [AuthType.BASIC_AUTH]: 'BASIC',
        [AuthType.BEARER_TOKEN]: 'BEARER',
        [AuthType.NONE]: 'NONE',
      };
      
      integrationRecord = await prisma.integration.create({
        data: {
          provider,
          name: metadata.name,
          description: metadata.description || '',
          category: metadata.category,
          authType: authTypeMap[metadata.authType],
          logo: metadata.logo,
          color: metadata.color,
          docUrl: metadata.docUrl,
          enabled: metadata.enabled,
        },
      });
    }

    const connection = await prisma.integrationConnection.create({
      data: {
        userId: req.userId!,
        integrationId: integrationRecord.id,
        name: name || `${metadata.name} Connection`,
        credentials: credentialManager.encrypt(credentials),
        status: 'ACTIVE',
        lastTested: new Date(),
      },
    });

    return res.json({ success: true, connection: { id: connection.id, name: connection.name, provider, status: connection.status } });
  } catch (error: any) {
    logger.error('Failed to connect', { error: error.message });
    return res.status(500).json({ error: 'Failed to connect' });
  }
});

// Test connection
router.post('/:provider/test', async (req: AuthRequest, res) => {
  try {
    const { provider } = req.params;
    const { connectionId } = req.body;

    const connection = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId: req.userId },
      include: { integration: true },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.integration.provider !== provider) {
      return res.status(400).json({ error: 'Connection does not belong to this provider' });
    }

    const integration = integrationRegistry.get(provider as IntegrationProvider);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const credentials = credentialManager.decrypt(connection.credentials);
    const testResult = await integration.testConnection(credentials);

    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: {
        status: testResult.success ? 'ACTIVE' : 'ERROR',
        lastTested: new Date(),
        errorMessage: testResult.success ? null : testResult.message,
      },
    });

    return res.json(testResult);
  } catch (error: any) {
    logger.error('Test failed', { error: error.message });
    return res.status(500).json({ error: 'Test failed' });
  }
});

// Execute action
router.post('/:provider/execute', async (req: AuthRequest, res) => {
  try {
    const { provider } = req.params;
    const { actionId, parameters, connectionId } = req.body;

    if (!actionId || !connectionId) {
      return res.status(400).json({ error: 'actionId and connectionId required' });
    }

    const connection = await prisma.integrationConnection.findFirst({
      where: { id: connectionId, userId: req.userId },
      include: { integration: true },
    });

    if (!connection) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    if (connection.integration.provider !== provider) {
      return res.status(400).json({ error: 'Connection does not belong to this provider' });
    }

    const integration = integrationRegistry.get(provider as IntegrationProvider);
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    const credentials = credentialManager.decrypt(connection.credentials);
    const startTime = Date.now();
    const result = await integration.executeAction(actionId, parameters, credentials);
    const duration = Date.now() - startTime;

    await prisma.integrationLog.create({
      data: {
        userId: req.userId!,
        connectionId: connection.id,
        provider,
        action: actionId,
        success: result.success,
        duration,
        errorCode: result.error?.code,
        errorMessage: result.error?.message,
      },
    });

    await prisma.integrationConnection.update({
      where: { id: connectionId },
      data: { lastUsed: new Date() },
    });

    return res.json(result);
  } catch (error: any) {
    logger.error('Execution failed', { error: error.message });
    return res.status(500).json({ error: 'Execution failed' });
  }
});

// Disconnect
router.delete('/:provider/disconnect', async (req: AuthRequest, res) => {
  try {
    const { connectionId } = req.body;
    if (!connectionId) {
      return res.status(400).json({ error: 'connectionId is required' });
    }

    const deleted = await prisma.integrationConnection.deleteMany({
      where: { id: connectionId, userId: req.userId },
    });

    if (!deleted.count) {
      return res.status(404).json({ error: 'Connection not found' });
    }

    res.json({ success: true });
  } catch (error: any) {
    logger.error('Disconnect failed', { error: error.message });
    res.status(500).json({ error: 'Disconnect failed' });
  }
});

function getOAuth2Config(provider: IntegrationProvider): OAuth2Config | null {
  const configs: Partial<Record<IntegrationProvider, OAuth2Config>> = {
    [IntegrationProvider.GMAIL]: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      authorizationUrl: 'https://accounts.google.com/o/oauth2/v2/auth',
      tokenUrl: 'https://oauth2.googleapis.com/token',
      scopes: ['https://www.googleapis.com/auth/gmail.send', 'https://www.googleapis.com/auth/gmail.readonly'],
      redirectUri: `${process.env.API_URL || 'http://localhost:5000'}/api/integrations/oauth/callback`,
    },
    [IntegrationProvider.SLACK]: {
      clientId: process.env.SLACK_CLIENT_ID!,
      clientSecret: process.env.SLACK_CLIENT_SECRET!,
      authorizationUrl: 'https://slack.com/oauth/v2/authorize',
      tokenUrl: 'https://slack.com/api/oauth.v2.access',
      scopes: ['chat:write', 'channels:read'],
      redirectUri: `${process.env.API_URL || 'http://localhost:5000'}/api/integrations/oauth/callback`,
    },
  };

  return configs[provider] || null;
}

export default router;
