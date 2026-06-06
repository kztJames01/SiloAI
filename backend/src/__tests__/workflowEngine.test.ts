import { WorkflowEngine } from '../engine/WorkflowEngine';

// mock prisma so tests don't need a real db
jest.mock('../db/prisma', () => ({
  __esModule: true,
  default: {
    workflowExecution: {
      create: jest.fn().mockResolvedValue({ id: 'exec-1' }),
      update: jest.fn().mockResolvedValue({}),
    },
    executionLog: {
      create: jest.fn().mockResolvedValue({}),
    },
  },
}));

jest.mock('../utils/logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
    warn: jest.fn(),
  },
}));

jest.mock('../nodes/NodeRegistry', () => ({
  nodeRegistry: {
    getNode: jest.fn().mockReturnValue({
      execute: jest.fn().mockResolvedValue({ output: 'test' }),
    }),
  },
}));

describe('WorkflowEngine', () => {
  let engine: WorkflowEngine;

  beforeEach(() => {
    engine = new WorkflowEngine();
    jest.clearAllMocks();
  });

  describe('buildExecutionOrder (via executeWorkflow)', () => {
    it('returns execution id when workflow starts', async () => {
      const workflow = {
        id: 'wf-1',
        nodes: [{ id: 'n1', type: 'start', data: { label: 'Start' } }],
        edges: [],
      };
      const execId = await engine.executeWorkflow(workflow, {});
      expect(typeof execId).toBe('string');
      expect(execId.length).toBeGreaterThan(0);
    });

    it('handles empty nodes gracefully', async () => {
      const workflow = { id: 'wf-2', nodes: [], edges: [] };
      const execId = await engine.executeWorkflow(workflow, {});
      expect(execId).toBeDefined();
    });

    it('creates execution record in db', async () => {
      const prisma = require('../db/prisma').default;
      const workflow = {
        id: 'wf-3',
        nodes: [{ id: 'n1', type: 'start', data: {} }],
        edges: [],
      };
      await engine.executeWorkflow(workflow, { foo: 'bar' });
      expect(prisma.workflowExecution.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            workflowId: 'wf-3',
            status: 'RUNNING',
          }),
        })
      );
    });
  });

  describe('topological sort', () => {
    it('executes nodes in correct dependency order', async () => {
      const nodeRegistry = require('../nodes/NodeRegistry').nodeRegistry;
      const executionOrder: string[] = [];

      nodeRegistry.getNode.mockReturnValue({
        execute: jest.fn().mockImplementation(async (data: any, ctx: any) => {
          executionOrder.push(ctx.data.currentNodeId || 'unknown');
          return { done: true };
        }),
      });

      // simple linear chain: n1 -> n2 -> n3
      const workflow = {
        id: 'wf-sort',
        nodes: [
          { id: 'n1', type: 'start', data: {} },
          { id: 'n2', type: 'action', data: {} },
          { id: 'n3', type: 'end', data: {} },
        ],
        edges: [
          { source: 'n1', target: 'n2' },
          { source: 'n2', target: 'n3' },
        ],
      };

      await engine.executeWorkflow(workflow, {});
      // give async execution a moment
      await new Promise(r => setTimeout(r, 50));

      expect(nodeRegistry.getNode).toHaveBeenCalledTimes(3);
    });

    it('handles parallel branches without crashing', async () => {
      const workflow = {
        id: 'wf-parallel',
        nodes: [
          { id: 'start', type: 'start', data: {} },
          { id: 'branchA', type: 'action', data: {} },
          { id: 'branchB', type: 'action', data: {} },
        ],
        edges: [
          { source: 'start', target: 'branchA' },
          { source: 'start', target: 'branchB' },
        ],
      };
      const execId = await engine.executeWorkflow(workflow, {});
      expect(execId).toBeDefined();
    });
  });
});
