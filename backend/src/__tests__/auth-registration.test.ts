import 'express-async-errors';
import request from 'supertest';
import authRoutes from '../api/routes/auth.routes';
import { createTestApp } from './helpers/testApp';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const prisma = require('../db/prisma').default;

describe('POST /api/auth/register (adversarial)', () => {
  let app: ReturnType<typeof createTestApp>;

  beforeEach(() => {
    process.env.JWT_SECRET = 'register-adversarial-secret';
    app = createTestApp({ path: '/api/auth', router: authRoutes });
    jest.clearAllMocks();
  });

  it('ignores client-supplied role ADMIN and always creates FIELD', async () => {
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.user.create.mockImplementation(async ({ data }: any) => ({
      id: 'new-user',
      email: data.email,
      name: data.name,
      role: data.role,
      createdAt: new Date(),
    }));

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'attacker@evil.com', password: 'longpassword', role: 'ADMIN' });

    expect(res.status).toBe(201);
    expect(prisma.user.create).toHaveBeenCalledWith(
      expect.objectContaining({ data: expect.objectContaining({ role: 'FIELD' }) })
    );
    expect(res.body.user.role).toBe('FIELD');
  });

  it('returns 400 for password shorter than 8 chars', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'a@b.com', password: '1234567' });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('returns 400 when email is already taken', async () => {
    prisma.user.findUnique.mockResolvedValue({
      id: 'existing',
      email: 'taken@example.com',
      password: 'hash',
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({ email: 'taken@example.com', password: 'longpassword' });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/already exists/i);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
