import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { LLMProviderFactory } from '../../ai/providers';
import { PromptLibrary } from '../../ai/PromptTemplateEngine';
import { tokenTracker } from '../../ai/TokenUsageTracker';
import { aiDebugger } from '../../ai/AIDebugger';
import { contextManager } from '../../ai/AIContextManager';
import { assertSafeOutboundUrl } from '../../utils/security';
import prisma from '../../db/prisma';

const router = express.Router();

// Apply auth middleware
router.use(authenticate);
router.post('/complete', async (req: AuthRequest, res) => {
  try {
    const { provider, model, apiKey, baseUrl, messages, temperature, maxTokens } = req.body;

    if (baseUrl) {
      assertSafeOutboundUrl(baseUrl);
    }

    const config = {
      provider,
      model,
      apiKey,
      baseUrl,
      temperature,
      maxTokens,
    };

    const llmProvider = LLMProviderFactory.createProvider(config);
    const startTime = Date.now();
    const result = await llmProvider.complete(messages);
    const latency = Date.now() - startTime;

    // Track usage
    tokenTracker.logUsage({
      userId: req.user!.id,
      provider,
      model,
      usage: result.usage,
    });

    res.json({
      response: result.content,
      usage: result.usage,
      model: result.model,
      latency,
    });
  } catch (error) {
    console.error('AI completion error:', error);
    res.status(500).json({ error: 'Failed to generate completion' });
  }
});

/**
 * GET /api/ai/token-usage
 * Get token usage analytics
 */
router.get('/token-usage', async (req: AuthRequest, res) => {
  try {
    const { days = '30' } = req.query;
    const analytics = tokenTracker.getUserUsage(req.user!.id, parseInt(days as string));

    res.json(analytics);
  } catch (error) {
    console.error('Token usage error:', error);
    res.status(500).json({ error: 'Failed to fetch token usage' });
  }
});

/**
 * GET /api/ai/debug/:executionId
 * Get debug logs for an execution
 */
router.get('/debug/:executionId', async (req: AuthRequest, res) => {
  try {
    const { executionId } = req.params;

    const owned = await prisma.workflowExecution.findFirst({
      where: { id: executionId, workflow: { userId: req.user!.id } },
    });
    if (!owned) {
      res.status(404).json({ error: 'Execution not found' });
      return;
    }

    const logs = aiDebugger.getExecutionLogs(executionId);
    const session = aiDebugger.getSession(executionId);
    const summary = aiDebugger.getSessionSummary(executionId);
    const performance = aiDebugger.analyzePerformance(executionId);

    res.json({
      logs,
      session,
      summary,
      performance,
    });
  } catch (error) {
    console.error('Debug logs error:', error);
    res.status(500).json({ error: 'Failed to fetch debug logs' });
  }
});

/**
 * GET /api/ai/templates
 * Get all prompt templates
 */
router.get('/templates', async (_req, res) => {
  try {
    const templates = PromptLibrary.getAll();
    res.json({ templates });
  } catch (error) {
    console.error('Templates error:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

/**
 * GET /api/ai/templates/:id
 * Get a specific template
 */
router.get('/templates/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const template = PromptLibrary.get(id);

    if (!template) {
      res.status(404).json({ error: 'Template not found' });
      return;
    }

    res.json({ template });
  } catch (error) {
    console.error('Template error:', error);
    res.status(500).json({ error: 'Failed to fetch template' });
  }
});

/**
 * POST /api/ai/templates
 * Create a new template
 */
router.post('/templates', async (req: AuthRequest, res) => {
  try {
    const template = req.body;
    if (!template?.id || !template?.name) {
      res.status(400).json({ error: 'Template id and name are required' });
      return;
    }
    PromptLibrary.register(template);
    res.json({ template });
  } catch (error) {
    console.error('Template creation error:', error);
    res.status(500).json({ error: 'Failed to create template' });
  }
});

router.put('/templates/:id', async (req: AuthRequest, res) => {
  try {
    const { id } = req.params;
    const template = { ...req.body, id };
    if (!template.name) {
      res.status(400).json({ error: 'Template name is required' });
      return;
    }
    PromptLibrary.register(template);
    res.json({ template });
  } catch (error) {
    console.error('Template update error:', error);
    res.status(500).json({ error: 'Failed to update template' });
  }
});

/**
 * POST /api/ai/config
 * Save LLM configuration
 */
router.post('/config', async (req, res) => {
  try {
    // In production, save to database
    // For now, just validate the config
    const { provider, model, apiKey, baseUrl } = req.body;

    if (baseUrl) {
      assertSafeOutboundUrl(baseUrl);
    }

    const config = {
      provider,
      model,
      apiKey,
      baseUrl,
    };

    // Test the configuration
    try {
      LLMProviderFactory.createProvider(config);
      res.json({ success: true, message: 'Configuration saved' });
    } catch (error) {
      res.status(400).json({ error: 'Invalid configuration' });
    }
  } catch (error) {
    console.error('Config save error:', error);
    res.status(500).json({ error: 'Failed to save configuration' });
  }
});

/**
 * GET /api/ai/context/:conversationId
 * Get AI context
 */
router.get('/context/:conversationId', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const context = contextManager.getContext(conversationId);

    if (!context) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    const ownerId = context.metadata?.userId;
    if (ownerId && ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    res.json({ context });
  } catch (error) {
    console.error('Context error:', error);
    res.status(500).json({ error: 'Failed to fetch context' });
  }
});

/**
 * DELETE /api/ai/context/:conversationId
 * Clear AI context
 */
router.delete('/context/:conversationId', async (req: AuthRequest, res) => {
  try {
    const { conversationId } = req.params;
    const context = contextManager.getContext(conversationId);

    if (!context) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    const ownerId = context.metadata?.userId;
    if (ownerId && ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Forbidden' });
      return;
    }

    const deleted = contextManager.deleteContext(conversationId);

    if (!deleted) {
      res.status(404).json({ error: 'Context not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Context deletion error:', error);
    res.status(500).json({ error: 'Failed to delete context' });
  }
});

/**
 * GET /api/ai/providers
 * Get list of available providers and models
 */
router.get('/providers', async (_req, res) => {
  try {
    const providers = {
      openai: {
        name: 'OpenAI',
        models: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
        requiresApiKey: true,
      },
      anthropic: {
        name: 'Anthropic (Claude)',
        models: ['claude-3-5-sonnet-20241022', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
        requiresApiKey: true,
      },
      gemini: {
        name: 'Google Gemini',
        models: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
        requiresApiKey: true,
      },
      ollama: {
        name: 'Ollama (Self-hosted)',
        models: ['llama3', 'mistral', 'codellama', 'phi'],
        requiresApiKey: false,
        requiresBaseUrl: true,
      },
      openrouter: {
        name: 'OpenRouter',
        models: [
          'openai/gpt-4o',
          'openai/gpt-4-turbo',
          'anthropic/claude-3-5-sonnet',
          'anthropic/claude-3-opus',
          'google/gemini-pro-1.5',
          'meta-llama/llama-3.1-70b-instruct',
          'mistralai/mistral-large',
          'qwen/qwen-2.5-72b-instruct',
        ],
        requiresApiKey: true,
        baseUrl: 'https://openrouter.ai/api/v1',
        description: 'Access 100+ models via a single OpenAI-compatible API',
      },
      custom: {
        name: 'Custom Endpoint',
        models: [],
        requiresApiKey: false,
        requiresBaseUrl: true,
      },
    };

    res.json({ providers });
  } catch (error) {
    console.error('Providers error:', error);
    res.status(500).json({ error: 'Failed to fetch providers' });
  }
});

export default router;
