import request from 'supertest';
import executionRoutes from '../api/routes/execution.routes';
import { createTestApp, signTestToken } from './helpers/testApp';

jest.mock('../services/org', () => ({
  getOrgUserIds: jest.fn().mockResolvedValue(['admin-1']),
}));

jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    user: { findUnique: jest.fn() },
    workflow: { findFirst: jest.fn() },
    workflowExecution: { findFirst: jest.fn(), findMany: jest.fn() },
    fieldAction: { findFirst: jest.fn() },
    executionLog: { findMany: jest.fn() },
  },
}));

const prisma = require('../db/prisma').default;

describe('execution field access', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    prisma.user.findUnique.mockResolvedValue({
      id: 'field-1',
      email: 'f@test.com',
      name: 'Field',
      role: 'FIELD',
    });
  });

  it('lets a field worker read an execution they started', async () => {
    prisma.workflowExecution.findFirst
      .mockResolvedValueOnce(null)
      .mockResolvedValueOnce({
        id: 'exec-1',
        status: 'SUCCESS',
        workflow: { id: 'wf-1', name: 'Hazard' },
        logs: [],
      });
    prisma.fieldAction.findFirst.mockResolvedValue({ id: 'fa-1' });

    const app = createTestApp({ path: '/api/executions', router: executionRoutes });
    const res = await request(app)
      .get('/api/executions/exec-1')
      .set('Authorization', `Bearer ${signTestToken('field-1')}`);
    expect(res.status).toBe(200);
    expect(res.body.execution.id).toBe('exec-1');
  });

  it('404s if the field worker does not own the run', async () => {
    prisma.workflowExecution.findFirst.mockResolvedValue(null);
    prisma.fieldAction.findFirst.mockResolvedValue(null);
    const app = createTestApp({ path: '/api/executions', router: executionRoutes });
    const res = await request(app)
      .get('/api/executions/exec-1')
      .set('Authorization', `Bearer ${signTestToken('field-1')}`);
    expect(res.status).toBe(404);
  });

  it('does not treat /workflow/:id as an execution id', async () => {
    prisma.workflow.findFirst.mockResolvedValue({ id: 'wf-1' });
    prisma.workflowExecution.findMany.mockResolvedValue([]);
    const app = createTestApp({ path: '/api/executions', router: executionRoutes });
    const res = await request(app)
      .get('/api/executions/workflow/wf-1')
      .set('Authorization', `Bearer ${signTestToken('field-1')}`);
    expect(res.status).toBe(200);
    expect(res.body.executions).toEqual([]);
  });
});
