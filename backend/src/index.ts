import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
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
import { rateLimiter } from './api/middleware/rateLimiter.middleware';
import { logger } from './utils/logger';

// Load environment variables
dotenv.config();

const app = express();
const server = createServer(app);

// Middleware
app.use(helmet());
app.use(cors({
  origin: (origin, callback) => {
    // Allow all localhost origins in development
    if (!origin || origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
      callback(null, true);
    } else {
      callback(null, process.env.FRONTEND_URL || false);
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(rateLimiter);

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// API routes
app.use('/api/auth', authRoutes);
app.use('/api/workflows', workflowRoutes);
app.use('/api/executions', executionRoutes);
app.use('/api/integrations', integrationRoutes);
app.use('/api/nodes', nodeRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/agents', agentRoutes);

// Error handling
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  logger.info(`🚀 Server running on port ${PORT}`);
  logger.info(`📊 Environment: ${process.env.NODE_ENV}`);
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
