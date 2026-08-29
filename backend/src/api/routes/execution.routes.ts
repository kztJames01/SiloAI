import { Router } from 'express';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { getOrgUserIds } from '../../services/org';
import { logger } from '../../utils/logger';

const router = Router();

router.use(authenticate);

async function findReadableExecution(req: AuthRequest, id: string, withLogs: boolean) {
  const userIds = await getOrgUserIds(req.userId!);
  const include = withLogs
    ? {
        workflow: { select: { id: true, name: true } },
        logs: { orderBy: { timestamp: 'asc' as const } },
      }
    : { workflow: { select: { id: true, name: true } } };

  const owned = await prisma.workflowExecution.findFirst({
    where: { id, workflow: { userId: { in: userIds } } },
    include,
  });
  if (owned) return owned;

  const fieldHit = await prisma.fieldAction.findFirst({
    where: { userId: req.userId!, workflowExecutionId: id },
    select: { id: true },
  });
  if (!fieldHit) return null;

  return prisma.workflowExecution.findFirst({
    where: { id },
    include,
  });
}

// Get all executions for user's workflows
router.get('/', async (req: AuthRequest, res) => {
  const userIds = await getOrgUserIds(req.userId!);
  const executions = await prisma.workflowExecution.findMany({
    where: {
      workflow: {
        userId: { in: userIds },
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

// Get executions for a specific workflow (must be before /:id)
router.get('/workflow/:workflowId', async (req: AuthRequest, res) => {
  const userIds = await getOrgUserIds(req.userId!);
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.workflowId,
      userId: { in: userIds },
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

router.get('/:id/logs', async (req: AuthRequest, res) => {
  const { since } = req.query;
  const sinceDate = since ? new Date(since as string) : new Date(0);

  const execution = await findReadableExecution(req, req.params.id, false);
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

router.get('/:id/stream', async (req: AuthRequest, res) => {
  const execution = await findReadableExecution(req, req.params.id, false);
  if (!execution) {
    throw new AppError('Execution not found', 404);
  }

  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  (res as any).flushHeaders?.();

  let since = new Date(0);
  let stopped = false;

  const send = (event: string, data: any) => {
    res.write(`event: ${event}\n`);
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  const tick = async () => {
    if (stopped) return;
    const current = await prisma.workflowExecution.findUnique({
      where: { id: req.params.id },
      include: {
        logs: { where: { timestamp: { gt: since } }, orderBy: { timestamp: 'asc' } },
      },
    });
    if (!current) {
      send('error', { message: 'gone' });
      return;
    }
    if (current.logs.length) {
      since = current.logs[current.logs.length - 1].timestamp;
      send('logs', { logs: current.logs, status: current.status });
    } else {
      send('status', { status: current.status, finishedAt: current.finishedAt, error: current.error, output: current.output });
    }
    if (current.status !== 'RUNNING') {
      send('done', { status: current.status, finishedAt: current.finishedAt, error: current.error, output: current.output });
      stopped = true;
      clearInterval(timer);
      res.end();
    }
  };

  send('hello', { id: execution.id, status: execution.status });
  const timer = setInterval(() => {
    tick().catch((err) => logger.error('sse tick failed', err));
  }, 1500);
  tick().catch(() => {});

  req.on('close', () => {
    stopped = true;
    clearInterval(timer);
  });
});

router.get('/:id', async (req: AuthRequest, res) => {
  const execution = await findReadableExecution(req, req.params.id, true);
  if (!execution) {
    throw new AppError('Execution not found', 404);
  }
  res.json({ execution });
});

export default router;
