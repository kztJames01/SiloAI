import 'express-async-errors';
import request from 'supertest';
import integrationRoutes from '../api/routes/integration.routes';
import { createTestApp, signTestToken } from './helpers/testApp';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    integrationConnection: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      deleteMany: jest.fn(),
      update: jest.fn(),
    },
    integration: { findFirst: jest.fn(), create: jest.fn() },
    integrationLog: { create: jest.fn() },
  },
}));

jest.mock('../integrations/providers', () => ({
  integrationRegistry: {
    getAllMetadata: jest.fn().mockReturnValue([]),
    get: jest.fn(),
  },
}));

jest.mock('../integrations/auth/CredentialManager', () => ({
  credentialManager: {
    mask: (v: unknown) => v,
    decrypt: (v: unknown) => v,
    encrypt: (v: unknown) => v,
    validate: () => ({ valid: true, errors: [] }),
  },
}));

jest.mock('../integrations/auth/OAuth2Handler', () => ({
  oauth2Handler: {
    generateAuthorizationUrl: jest.fn(),
    verifyState: jest.fn(),
    exchangeCodeForToken: jest.fn(),
  },
}));

const prisma = require('../db/prisma').default;
const { integrationRegistry } = require('../integrations/providers');

describe('Integration routes', () => {
  let app: ReturnType<typeof createTestApp>;
  let token: string;

  beforeEach(() => {
    process.env.JWT_SECRET = 'integration-route-test';
    token = signTestToken('user-1');
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'u@test.com',
      name: 'U',
      role: 'ADMIN',
    });
    app = createTestApp({ path: '/api/integrations', router: integrationRoutes });
  });

  it('GET /user returns connections instead of treating user as provider slug', async () => {
    prisma.integrationConnection.findMany.mockResolvedValue([
      { id: 'conn-1', integration: { provider: 'gmail', name: 'Gmail' } },
    ]);

    const res = await request(app)
      .get('/api/integrations/user')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toBe(200);
    expect(res.body.connections).toHaveLength(1);
    expect(integrationRegistry.get).not.toHaveBeenCalled();
  });

  it('rejects execute when connection belongs to a different provider', async () => {
    prisma.integrationConnection.findFirst.mockResolvedValue({
      id: 'conn-gmail',
      userId: 'user-1',
      integration: { provider: 'gmail' },
      credentials: 'enc',
    });
    integrationRegistry.get.mockReturnValue({
      executeAction: jest.fn(),
    });

    const res = await request(app)
      .post('/api/integrations/slack/execute')
      .set('Authorization', `Bearer ${token}`)
      .send({ actionId: 'send', connectionId: 'conn-gmail', parameters: {} });

    expect(res.status).toBe(400);
    expect(res.body.error).toMatch(/does not belong/i);
  });

  it('disconnect without connectionId returns 400 not fake success', async () => {
    const res = await request(app)
      .delete('/api/integrations/gmail/disconnect')
      .set('Authorization', `Bearer ${token}`)
      .send({});

    expect(res.status).toBe(400);
    expect(prisma.integrationConnection.deleteMany).not.toHaveBeenCalled();
  });

  it('disconnect with unknown connectionId returns 404', async () => {
    prisma.integrationConnection.deleteMany.mockResolvedValue({ count: 0 });

    const res = await request(app)
      .delete('/api/integrations/gmail/disconnect')
      .set('Authorization', `Bearer ${token}`)
      .send({ connectionId: 'missing' });

    expect(res.status).toBe(404);
  });
});
