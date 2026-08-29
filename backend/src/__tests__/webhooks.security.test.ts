import 'express-async-errors';
import request from 'supertest';
import webhookRoutes from '../api/routes/webhook.routes';

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    workflow: {
      findUnique: jest.fn(),
    },
  },
}));

jest.mock('../engine/WorkflowEngine', () => ({
  WorkflowEngine: jest.fn().mockImplementation(() => ({
    executeWorkflow: jest.fn().mockResolvedValue('exec-1'),
  })),
}));

const prisma = require('../db/prisma').default;
const express = require('express');
const { errorHandler } = require('../api/middleware/error.middleware');

function buildWebhookApp() {
  const app = express();
  app.use(express.json());
  app.use('/api/webhooks', webhookRoutes);
  app.use(errorHandler);
  return app;
}

describe('Webhook security', () => {
  const workflowId = 'wf-webhook-1';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('rejects triggers with no secret configured (fail closed)', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: {} },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .send({ attack: true });

    expect(res.status).toBe(503);
    expect(res.body.error).toMatch(/secret/i);
  });

  it('rejects wrong secret in header', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: { secret: 'real-secret' } },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .set('x-webhook-secret', 'wrong')
      .send({});

    expect(res.status).toBe(401);
  });

  it('does not accept secret via query string (log leakage)', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: { secret: 'real-secret' } },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}?secret=real-secret`)
      .send({});

    expect(res.status).toBe(401);
  });

  it('accepts correct header secret', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: { secret: 'real-secret' } },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .set('x-webhook-secret', 'real-secret')
      .send({ ok: true });

    expect(res.status).toBe(202);
    expect(res.body.executionId).toBe('exec-1');
  });

  it('accepts hmac signature instead of secret header', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: { secret: 'real-secret' } },
    });

    const body = { ping: true };
    const raw = JSON.stringify(body);
    const crypto = require('crypto');
    const sig = crypto.createHmac('sha256', 'real-secret').update(raw).digest('hex');

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .set('x-silo-signature', `sha256=${sig}`)
      .set('Content-Type', 'application/json')
      .send(raw);

    expect(res.status).toBe(202);
  });

  it('rejects bad hmac signature', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: true,
      trigger: { type: 'webhook', config: { secret: 'real-secret' } },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .set('x-silo-signature', 'sha256=' + 'a'.repeat(64))
      .send({ ping: true });

    expect(res.status).toBe(401);
  });

  it('returns 404 for inactive workflows (no oracle leak)', async () => {
    prisma.workflow.findUnique.mockResolvedValue({
      id: workflowId,
      isActive: false,
      trigger: { type: 'webhook', config: { secret: 'x' } },
    });

    const res = await request(buildWebhookApp())
      .post(`/api/webhooks/${workflowId}`)
      .set('x-webhook-secret', 'x')
      .send({});

    expect(res.status).toBe(404);
  });
});
