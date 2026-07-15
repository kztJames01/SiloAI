import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { AppError } from '../middleware/error.middleware';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { refreshScheduleForWorkflow } from '../../services/scheduleRunner';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation schema
const workflowSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  nodes: z.array(z.any()),
  edges: z.array(z.any()),
  trigger: z.object({
    type: z.enum(['manual', 'webhook', 'schedule']),
    config: z.any(),
  }),
});

// Get all workflows
router.get('/', async (req: AuthRequest, res) => {
  const workflows = await prisma.workflow.findMany({
    where: { userId: req.userId },
    orderBy: { updatedAt: 'desc' },
    include: {
      executions: {
        take: 1,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  res.json({ workflows });
});

// Get single workflow
router.get('/:id', async (req: AuthRequest, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
    include: {
      executions: {
        take: 10,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  res.json({ workflow });
});

// Create workflow
router.post('/', async (req: AuthRequest, res) => {
  const data = workflowSchema.parse(req.body);

  const workflow = await prisma.workflow.create({
    data: {
      ...data,
      userId: req.userId!,
    },
  });

  refreshScheduleForWorkflow(workflow.id, workflow.trigger, workflow.isActive);

  res.status(201).json({ workflow });
});

// Update workflow
router.put('/:id', async (req: AuthRequest, res) => {
  const data = workflowSchema.partial().parse(req.body);

  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  const updated = await prisma.workflow.update({
    where: { id: req.params.id },
    data,
  });

  refreshScheduleForWorkflow(updated.id, updated.trigger, updated.isActive);

  res.json({ workflow: updated });
});

// Delete workflow
router.delete('/:id', async (req: AuthRequest, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  await prisma.workflow.delete({
    where: { id: req.params.id },
  });

  res.json({ message: 'Workflow deleted' });
});

// Toggle workflow active status
router.patch('/:id/toggle', async (req: AuthRequest, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  const updated = await prisma.workflow.update({
    where: { id: req.params.id },
    data: { isActive: !workflow.isActive },
  });

  refreshScheduleForWorkflow(updated.id, updated.trigger, updated.isActive);

  res.json({ workflow: updated });
});

// Execute workflow manually
router.post('/:id/execute', async (req: AuthRequest, res) => {
  const workflow = await prisma.workflow.findFirst({
    where: {
      id: req.params.id,
      userId: req.userId,
    },
  });

  if (!workflow) {
    throw new AppError('Workflow not found', 404);
  }

  const engine = new WorkflowEngine();
  const executionId = await engine.executeWorkflow(workflow as any, req.body);

  res.json({ executionId, message: 'Workflow execution started' });
});

export default router;
