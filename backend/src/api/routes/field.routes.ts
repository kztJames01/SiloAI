import { Router } from 'express';
import { z } from 'zod';
import prisma from '../../db/prisma';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { logger } from '../../utils/logger';

const router = Router();
router.use(authenticate);

const actionSchema = z.object({
  actionType: z.string().min(1),
  notes: z.string().optional(),
  jobType: z.string().optional(),
  payload: z.record(z.any()).optional(),
});

async function findWorkflowForAction(userId: string, actionType: string) {
  const workflows = await prisma.workflow.findMany({
    where: { userId, isActive: true },
    orderBy: { updatedAt: 'desc' },
  });

  return workflows.find((wf) => {
    const trigger = wf.trigger as any;
    if (trigger?.config?.fieldAction === actionType) return true;
    if (trigger?.config?.fieldActions?.includes?.(actionType)) return true;
    return false;
  });
}

router.get('/', async (req: AuthRequest, res) => {
  const actions = await prisma.fieldAction.findMany({
    where: { userId: req.userId! },
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json({ actions });
});

router.post('/', async (req: AuthRequest, res) => {
  const body = actionSchema.parse(req.body);
  let workflowExecutionId: string | null = null;
  let status = 'saved';

  const matched = await findWorkflowForAction(req.userId!, body.actionType);
  if (matched) {
    try {
      const engine = new WorkflowEngine();
      workflowExecutionId = await engine.executeWorkflow(matched as any, {
        fieldAction: body.actionType,
        notes: body.notes,
        jobType: body.jobType,
        payload: body.payload,
      });
      status = 'workflow_started';
    } catch (err: any) {
      logger.warn('Field action workflow failed', { error: err.message, actionType: body.actionType });
      status = 'workflow_failed';
    }
  }

  const action = await prisma.fieldAction.create({
    data: {
      userId: req.userId!,
      actionType: body.actionType,
      notes: body.notes,
      jobType: body.jobType,
      payload: body.payload || {},
      workflowExecutionId,
      status,
    },
  });

  res.status(201).json({ action, workflowExecutionId, status });
});

export default router;
