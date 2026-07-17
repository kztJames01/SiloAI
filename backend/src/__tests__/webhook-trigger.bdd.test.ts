import 'express-async-errors';
import { defineFeature, loadFeature } from 'jest-cucumber';
import request from 'supertest';
import webhookRoutes from '../api/routes/webhook.routes';
import { createTestApp } from './helpers/testApp';

const feature = loadFeature('./src/__tests__/features/webhook-trigger.feature');

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    workflow: { findUnique: jest.fn() },
  },
}));

jest.mock('../engine/WorkflowEngine', () => ({
  WorkflowEngine: jest.fn().mockImplementation(() => ({
    executeWorkflow: jest.fn().mockResolvedValue('exec-bdd-1'),
  })),
}));

const prisma = require('../db/prisma').default;

defineFeature(feature, (test) => {
  let app: ReturnType<typeof createTestApp>;
  let lastResponse: request.Response;
  const workflowId = 'wf-bdd-1';

  beforeEach(() => {
    app = createTestApp({ path: '/api/webhooks', router: webhookRoutes });
    jest.clearAllMocks();
  });

  test('Unauthenticated webhook cannot fire without configured secret', ({ given, when, then }) => {
    given('a webhook workflow exists without a secret', () => {
      prisma.workflow.findUnique.mockResolvedValue({
        id: workflowId,
        isActive: true,
        trigger: { type: 'webhook', config: {} },
      });
    });

    when('an anonymous caller POSTs to the webhook URL', async () => {
      lastResponse = await request(app)
        .post(`/api/webhooks/${workflowId}`)
        .send({ payload: 'free execution' });
    });

    then('the server must reject the request', () => {
      expect(lastResponse.status).toBeGreaterThanOrEqual(400);
      expect(lastResponse.status).not.toBe(202);
    });
  });
});
