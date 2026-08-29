import express from 'express';
import 'express-async-errors';
import jwt from 'jsonwebtoken';
import { errorHandler } from '../../api/middleware/error.middleware';

process.env.JWT_SECRET = process.env.JWT_SECRET || 'test-jwt-secret-for-unit-tests';

export function signTestToken(userId: string, extra?: Record<string, unknown>) {
  return jwt.sign({ userId, ...extra }, process.env.JWT_SECRET!, { expiresIn: '1h' });
}

export function createTestApp(...routers: Array<{ path: string; router: express.Router }>) {
  const app = express();
  app.use(express.json());
  for (const { path, router } of routers) {
    app.use(path, router);
  }
  app.use(errorHandler);
  return app;
}

export function mockPrismaUser(overrides: Record<string, unknown> = {}) {
  return {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test',
    role: 'FIELD',
    password: '$2a$10$hashed',
    createdAt: new Date(),
    ...overrides,
  };
}
