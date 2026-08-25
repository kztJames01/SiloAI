import request from 'supertest';
import orgRoutes from '../api/routes/org.routes';
import { createTestApp, signTestToken } from './helpers/testApp';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    organization: { create: jest.fn(), update: jest.fn(), findUnique: jest.fn() },
    organizationMember: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      upsert: jest.fn(),
      update: jest.fn(),
    },
    organizationInvite: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

const prisma = require('../db/prisma').default;

describe('org routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'admin-1',
      email: 'owner@test.com',
      name: 'Owner',
      role: 'ADMIN',
    });
    prisma.organizationMember.findFirst.mockResolvedValue({
      orgId: 'org-1',
      userId: 'admin-1',
      role: 'OWNER',
      org: { id: 'org-1', name: 'Acme', ownerId: 'admin-1' },
    });
    prisma.organizationMember.findUnique.mockResolvedValue({
      orgId: 'org-1',
      userId: 'admin-1',
      role: 'OWNER',
    });
    prisma.organizationMember.findMany.mockResolvedValue([]);
    prisma.organizationInvite.findMany.mockResolvedValue([]);
  });

  it('lists current org for signed-in user', async () => {
    const app = createTestApp({ path: '/api/orgs', router: orgRoutes });
    const res = await request(app)
      .get('/api/orgs')
      .set('Authorization', `Bearer ${signTestToken('admin-1')}`);
    expect(res.status).toBe(200);
    expect(res.body.org.id).toBe('org-1');
  });

  it('creates an invite', async () => {
    prisma.user.findUnique.mockImplementation(async ({ where }: any) => {
      if (where.email) return null;
      return { id: 'admin-1', email: 'owner@test.com', name: 'Owner', role: 'ADMIN' };
    });
    prisma.organizationInvite.create.mockResolvedValue({
      id: 'inv-1',
      email: 'new@test.com',
      role: 'MEMBER',
      token: 'tok',
      expiresAt: new Date(Date.now() + 10000),
    });
    const app = createTestApp({ path: '/api/orgs', router: orgRoutes });
    const res = await request(app)
      .post('/api/orgs/invite')
      .set('Authorization', `Bearer ${signTestToken('admin-1')}`)
      .send({ email: 'new@test.com', role: 'MEMBER' });
    expect(res.status).toBe(201);
    expect(res.body.invite.url).toContain('/invite/');
  });
});
