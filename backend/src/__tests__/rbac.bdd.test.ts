import 'express-async-errors';
import { defineFeature, loadFeature } from 'jest-cucumber';
import request from 'supertest';
import express from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../api/middleware/auth.middleware';
import { errorHandler } from '../api/middleware/error.middleware';
import { signTestToken } from './helpers/testApp';

const feature = loadFeature('./src/__tests__/features/rbac.feature');

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: { user: { findUnique: jest.fn() } },
}));

const prisma = require('../db/prisma').default;

function buildApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.post('/admin-only', requireAdmin, (_req: AuthRequest, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
}

defineFeature(feature, (test) => {
  let app: ReturnType<typeof buildApp>;
  let token: string;
  let lastStatus: number;

  beforeEach(() => {
    process.env.JWT_SECRET = 'rbac-bdd-secret';
    app = buildApp();
    jest.clearAllMocks();
  });

  test('Field worker cannot hit admin-only workflow mutation endpoint', ({ given, when, then }) => {
    given('a field worker is authenticated', () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'field-1',
        email: 'field@test.com',
        name: 'Field',
        role: 'FIELD',
      });
      token = signTestToken('field-1');
    });

    when('they POST to an admin-only route', async () => {
      const res = await request(app).post('/admin-only').set('Authorization', `Bearer ${token}`).send({});
      lastStatus = res.status;
    });

    then('the response status should be 403', () => {
      expect(lastStatus).toBe(403);
    });
  });

  test('Admin user passes requireAdmin gate', ({ given, when, then }) => {
    given('an admin user is authenticated', () => {
      prisma.user.findUnique.mockResolvedValue({
        id: 'admin-1',
        email: 'admin@test.com',
        name: 'Admin',
        role: 'ADMIN',
      });
      token = signTestToken('admin-1');
    });

    when('they POST to an admin-only route', async () => {
      const res = await request(app).post('/admin-only').set('Authorization', `Bearer ${token}`).send({});
      lastStatus = res.status;
    });

    then('the response status should be 200', () => {
      expect(lastStatus).toBe(200);
    });
  });
});
