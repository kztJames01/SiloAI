import request from 'supertest';
import deviceRoutes from '../api/routes/device.routes';
import { createTestApp, signTestToken } from './helpers/testApp';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    devicePushToken: { upsert: jest.fn(), deleteMany: jest.fn() },
  },
}));

const prisma = require('../db/prisma').default;

describe('device push token routes', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      email: 'f@test.com',
      name: 'Field',
      role: 'FIELD',
    });
  });

  it('rejects unauthenticated register', async () => {
    const app = createTestApp({ path: '/api/devices', router: deviceRoutes });
    const res = await request(app).post('/api/devices/push-token').send({
      token: 'ExponentPushToken[abc123]',
    });
    expect(res.status).toBe(401);
  });

  it('rejects garbage tokens', async () => {
    const app = createTestApp({ path: '/api/devices', router: deviceRoutes });
    const res = await request(app)
      .post('/api/devices/push-token')
      .set('Authorization', `Bearer ${signTestToken('user-1')}`)
      .send({ token: 'not-a-token' });
    expect(res.status).toBe(400);
  });

  it('stores a valid expo token', async () => {
    prisma.devicePushToken.upsert.mockResolvedValue({});
    const app = createTestApp({ path: '/api/devices', router: deviceRoutes });
    const res = await request(app)
      .post('/api/devices/push-token')
      .set('Authorization', `Bearer ${signTestToken('user-1')}`)
      .send({ token: 'ExponentPushToken[AbC_12-3]', platform: 'ios' });
    expect(res.status).toBe(200);
    expect(prisma.devicePushToken.upsert).toHaveBeenCalled();
    expect(res.body.token).toBeUndefined();
  });
});
