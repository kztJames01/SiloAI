import express from 'express';
import request from 'supertest';
import rateLimit from 'express-rate-limit';
import { errorHandler } from '../api/middleware/error.middleware';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
  },
}));

const prisma = require('../db/prisma').default;
const { authenticate } = require('../api/middleware/auth.middleware');
const { signTestToken } = require('./helpers/testApp');

function app() {
  const limiter = rateLimit({
    windowMs: 60000,
    max: 2,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many AI requests, try again later.' },
    keyGenerator: (req: any) => (req.userId ? `u:${req.userId}` : req.ip || 'anon'),
    validate: false,
  });
  const r = express();
  r.use(express.json());
  r.post('/run', authenticate, limiter, (_req, res) => res.json({ ok: true }));
  r.use(errorHandler);
  return r;
}

describe('per-user llm rate limit', () => {
  beforeEach(() => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'a@test.com',
      name: 'A',
      role: 'ADMIN',
    });
  });

  it('returns 429 after the per-user cap without echoing the body', async () => {
    const server = app();
    const tok = signTestToken('user-1');
    const a = await request(server).post('/run').set('Authorization', `Bearer ${tok}`).send({ prompt: 'p' });
    const b = await request(server).post('/run').set('Authorization', `Bearer ${tok}`).send({ prompt: 'p' });
    const c = await request(server).post('/run').set('Authorization', `Bearer ${tok}`).send({ prompt: 'p' });
    expect(a.status).toBe(200);
    expect(b.status).toBe(200);
    expect(c.status).toBe(429);
    expect(JSON.stringify(c.body)).not.toMatch(/prompt/);
  });
});
