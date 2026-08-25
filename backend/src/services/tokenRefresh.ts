import prisma from '../db/prisma';
import { credentialManager } from '../integrations/auth/CredentialManager';
import { oauth2Handler } from '../integrations/auth/OAuth2Handler';
import { getOAuth2Config } from '../integrations/auth/oauthConfigs';
import { IntegrationProvider } from '@silo/shared/types/integration';
import { logger } from '../utils/logger';

const WINDOW_MS = 30 * 60 * 1000;

export async function refreshExpiringTokens() {
  const connections = await prisma.integrationConnection.findMany({
    where: { status: { in: ['ACTIVE', 'EXPIRED'] } },
    include: { integration: true },
  });

  for (const conn of connections) {
    let creds: any;
    try {
      creds = credentialManager.decrypt(conn.credentials);
    } catch {
      continue;
    }
    if (!creds?.refreshToken) continue;
    if (creds.expiresAt && !oauth2Handler.isTokenExpired(creds, 600)) continue;

    const provider = conn.integration.provider as IntegrationProvider;
    const cfg = getOAuth2Config(provider);
    if (!cfg) continue;

    try {
      const next = await oauth2Handler.refreshAccessToken(cfg, creds.refreshToken);
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: {
          credentials: credentialManager.encrypt(next),
          status: 'ACTIVE',
          errorMessage: null,
        },
      });
      logger.info('Refreshed oauth token', { connectionId: conn.id, provider });
    } catch (err: any) {
      await prisma.integrationConnection.update({
        where: { id: conn.id },
        data: { status: 'EXPIRED', errorMessage: err?.message || 'refresh failed' },
      });
      logger.warn('Oauth refresh failed', { connectionId: conn.id, error: err?.message });
    }
  }
}

export function startTokenRefreshJob() {
  refreshExpiringTokens().catch((err) => logger.error('token refresh startup failed', err));
  setInterval(() => {
    refreshExpiringTokens().catch((err) => logger.error('token refresh job failed', err));
  }, WINDOW_MS);
}
