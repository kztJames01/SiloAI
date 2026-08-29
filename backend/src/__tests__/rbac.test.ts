import request from 'supertest';
import express from 'express';
import { AuthRequest, authenticate, requireAdmin } from '../api/middleware/auth.middleware';
import { errorHandler } from '../api/middleware/error.middleware';
import { signTestToken } from './helpers/testApp';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
    },
  },
}));

const prisma = require('../db/prisma').default;

function buildRbacApp() {
  const app = express();
  app.use(express.json());
  app.use(authenticate);
  app.post('/admin-only', requireAdmin, (_req: AuthRequest, res) => {
    res.json({ ok: true });
  });
  app.use(errorHandler);
  return app;
}

describe('RBAC middleware', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects FIELD users from admin-only routes', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'field-user',
      email: 'field@test.com',
      name: 'Field',
      role: 'FIELD',
    });
    const app = buildRbacApp();
    const token = signTestToken('field-user');

    const res = await request(app)
      .post('/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(403);
    expect(res.body.error).toMatch(/admin/i);
  });

  it('allows ADMIN users through requireAdmin', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-user',
      email: 'admin@test.com',
      name: 'Admin',
      role: 'ADMIN',
    });
    const app = buildRbacApp();
    const token = signTestToken('admin-user');

    const res = await request(app)
      .post('/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(200);
    expect(res.body.ok).toBe(true);
  });

  it('does not trust role embedded in JWT — reloads from database', async () => {
    // attacker forges token with admin claim in payload (middleware only reads userId)
    prisma.user.findUnique.mockResolvedValue({
      id: 'field-user',
      email: 'field@test.com',
      name: 'Field',
      role: 'FIELD',
    });
    const app = buildRbacApp();
    const token = signTestToken('field-user', { role: 'ADMIN' });

    const res = await request(app)
      .post('/admin-only')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(403);
  });

  it('rejects missing Authorization header', async () => {
    const app = buildRbacApp();
    const res = await request(app).post('/admin-only').send({});
    expect(res.status).toBe(401);
  });

  it('rejects garbage tokens', async () => {
    const app = buildRbacApp();
    const res = await request(app)
      .post('/admin-only')
      .set('Authorization', 'Bearer not.a.jwt')
      .send({});
    expect(res.status).toBe(401);
  });
});
