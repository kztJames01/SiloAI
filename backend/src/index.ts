import './env';
import * as Sentry from '@sentry/node';

// init Sentry before anything else so it can instrument modules
const SENTRY_SCRUB_KEYS = /apikey|api_key|authorization|password|token|secret|cookie|credential|refresh|prompt|messages/i;

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  environment: process.env.SENTRY_ENVIRONMENT || process.env.NODE_ENV || 'development',
  release: process.env.GIT_SHA,
  tracesSampleRate: 0.1,
  enabled: !!process.env.SENTRY_DSN,
  beforeSend(event) {
    // strip sensitive fields from extras and request data
    function scrub(obj: any): any {
      if (!obj || typeof obj !== 'object') return obj;
      const out: any = Array.isArray(obj) ? [] : {};
      for (const k of Object.keys(obj)) {
        out[k] = SENTRY_SCRUB_KEYS.test(k) ? '[redacted]' : scrub(obj[k]);
      }
      return out;
    }
    if (event.extra) event.extra = scrub(event.extra);
    if (event.request?.data) event.request.data = '[redacted]';
    if (event.request?.headers) {
      const h = event.request.headers as Record<string, string>;
      if (h['authorization']) h['authorization'] = '[redacted]';
      if (h['x-api-key']) h['x-api-key'] = '[redacted]';
    }
    return event;
  },
});

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import 'express-async-errors';
import { createServer } from 'http';

// Initialize nodes
import './nodes';

// Import routes
import authRoutes from './api/routes/auth.routes';
import workflowRoutes from './api/routes/workflow.routes';
import executionRoutes from './api/routes/execution.routes';
import integrationRoutes from './api/routes/integration.routes';
import nodeRoutes from './api/routes/node.routes';
import aiRoutes from './api/routes/ai.routes';
import agentRoutes from './api/routes/agent.routes';
import fieldRoutes from './api/routes/field.routes';
import webhookRoutes from './api/routes/webhook.routes';
import apiKeyRoutes from './api/routes/apiKey.routes';

// Import middleware
import { errorHandler } from './api/middleware/error.middleware';
import { requestLogger } from './api/middleware/requestLogger.middleware';
import { rateLimiter, authRateLimiter } from './api/middleware/rateLimiter.middleware';
import metricsRoutes from './api/routes/metrics.routes';
import contactRoutes from './api/routes/contact.routes';
import orgRoutes from './api/routes/org.routes';
import deviceRoutes from './api/routes/device.routes';
import { startScheduleRunner } from './services/scheduleRunner';
import { startExecutionReconciler } from './services/executionSync';
import { startTokenRefreshJob } from './services/tokenRefresh';
import { logger } from './utils/logger';
import { formatDatabaseStartupError, getDatabaseUrlInfo, loadedEnvFiles } from './db/database-url';
import prisma from './db/prisma';

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
const allowedOrigins = [
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);

    const isProd = process.env.NODE_ENV === 'production';
    if (!isProd && (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:'))) {
      return callback(null, true);
    }

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    callback(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));
app.use(express.json({
  verify: (req: any, _res, buf) => {
    req.rawBody = buf;
  },
}));
app.use(express.urlencoded({ extended: true }));
app.use(requestLogger);
app.use(rateLimiter);

app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      database: 'connected',
      timestamp: new Date().toISOString(),
    });
  } catch {
    res.status(503).json({
      status: 'error',
      database: 'disconnected',
      timestamp: new Date().toISOString(),
    });
  }
});

app.get('/ready', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ ready: true });
  } catch {
    res.status(503).json({ ready: false });
  }
});

app.use('/metrics', metricsRoutes);

app.use('/api/webhooks', webhookRoutes);

// API routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);
app.use('/api/field', fieldRoutes);
app.use('/api/api-keys', apiKeyRoutes);
app.use('/api/contact', contactRoutes);
app.use('/api/orgs', orgRoutes);
app.use('/api/devices', deviceRoutes);

// Error handling — Sentry must be before our handler
Sentry.setupExpressErrorHandler(app);
app.use(errorHandler);

// Database connection test
async function testDatabaseConnection() {
  try {
    await prisma.$connect();
    // Test query
    await prisma.$queryRaw`SELECT 1`;
    logger.info('Database query test passed');
  } catch (error: any) {
    const info = getDatabaseUrlInfo();
    logger.error('Database connection failed');
    logger.error('Env files:', loadedEnvFiles().join(', ') || 'none found');
    logger.error('DATABASE_URL:', process.env.DATABASE_URL ? 'set' : 'NOT SET');
    if (info) {
      logger.error(`Target: ${info.user}@${info.host}:${info.port}/${info.database}`);
    }
    for (const line of formatDatabaseStartupError(error)) {
      logger.error(line);
    }
    process.exit(1);
  }
}

// Start server
const PORT = process.env.PORT || 5000;

async function startServer() {
  await testDatabaseConnection();
  await startScheduleRunner();
  startExecutionReconciler();
  startTokenRefreshJob();
  
  server.listen(Number(PORT), '0.0.0.0', () => {
    logger.info(`Server running on 0.0.0.0:${PORT}`);
    logger.info(`Environment: ${process.env.NODE_ENV}`);
    logger.info(`Database: ${process.env.DATABASE_URL ? 'Connected' : 'NOT CONFIGURED'}`);
  });
}

startServer().catch((error) => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  server.close(() => {
    logger.info('HTTP server closed');
    process.exit(0);
  });
});

export default app;
