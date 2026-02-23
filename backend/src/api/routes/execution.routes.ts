import { Router } from 'express';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';

const router = Router();

router.use(authenticate);

// Get all executions for user's workflows
router.get('/', async (req: AuthRequest, res) => {
  const executions = await prisma.workflowExecution.findMany({
    where: {
      workflow: {
        userId: req.userId,
      },
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  res.json({ executions });
});

// Get single execution with logs
router.get('/:id', async (req: AuthRequest, res) => {
  const execution = await prisma.workflowExecution.findFirst({
    where: {
      id: req.params.id,
      workflow: {
        userId: req.userId,
      },
    },
    include: {
      workflow: {
        select: {
          id: true,
          name: true,
        },
      },
      logs: {
        orderBy: { timestamp: 'asc' },
      },
    },
  });

  if (!execution) {
    throw new AppError('Execution not found', 404);
  }

  res.json({ execution });
});

// Get executions for a specific workflow
router.get('/workflow/:workflowId', async (req: AuthRequest, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.workflowId,
      userId: req.userId,
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  const executions = await prisma.workflowExecution.findMany({
    where: { workflowId: req.params.workflowId },
    include: {
      logs: {
        orderBy: { timestamp: 'asc' },
      },
    },
    orderBy: { startedAt: 'desc' },
    take: 50,
  });

  res.json({ executions });
});

// Get real-time logs for an execution (polling endpoint)
router.get('/:id/logs', async (req: AuthRequest, res) => {
  const { since } = req.query;
  const sinceDate = since ? new Date(since as string) : new Date(0);

  const execution = await prisma.workflowExecution.findFirst({
    where: {
      id: req.params.id,
      workflow: {
        userId: req.userId,
      },
    },
  });

  if (!execution) {
    throw new AppError('Execution not found', 404);
  }

  const logs = await prisma.executionLog.findMany({
    where: {
      executionId: req.params.id,
      timestamp: {
        gt: sinceDate,
      },
    },
    orderBy: { timestamp: 'asc' },
  });

  res.json({ logs, status: execution.status });
});

export default router;
