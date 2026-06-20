import './env';
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

// Import middleware
import { errorHandler } from './api/middleware/error.middleware';
import { rateLimiter, authRateLimiter } from './api/middleware/rateLimiter.middleware';
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ 
      status: 'ok', 
      database: 'connected',
      timestamp: new Date().toISOString() 
    });
  } catch (error: any) {
    res.status(503).json({ 
      status: 'error', 
      database: 'disconnected',
      error: error.message,
      timestamp: new Date().toISOString() 
    });
  }
});

// API routes
app.use('/api/auth', authRateLimiter, authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);

// Error handling
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
  
  server.listen(PORT, () => {
    logger.info(`Server running on port ${PORT}`);
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
