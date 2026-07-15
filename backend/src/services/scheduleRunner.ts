import cron, { ScheduledTask } from 'node-cron';
import prisma from '../db/prisma';
import { WorkflowEngine } from '../engine/WorkflowEngine';
import { logger } from '../utils/logger';

const scheduled = new Map<string, ScheduledTask>();

function getCronExpression(trigger: any) {
  return trigger?.config?.cronExpression || trigger?.config?.cron || null;
}

async function runScheduledWorkflow(workflowId: string) {
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });
  if (!workflow || !workflow.isActive) return;

  const trigger = workflow.trigger as any;
  if (trigger?.type !== 'schedule') return;

  try {
    const engine = new WorkflowEngine();
    await engine.executeWorkflow(workflow as any, {
      scheduledAt: new Date().toISOString(),
      source: 'schedule',
    });
  } catch (err: any) {
    logger.error('Scheduled workflow failed', { workflowId, error: err.message });
  }
}

function registerWorkflow(workflow: { id: string; trigger: unknown }) {
  const trigger = workflow.trigger as any;
  if (trigger?.type !== 'schedule') return;

  const expression = getCronExpression(trigger);
  if (!expression || !cron.validate(expression)) {
    logger.warn('Invalid cron for workflow', { workflowId: workflow.id, expression });
    return;
  }

  scheduled.get(workflow.id)?.stop();

  const task = cron.schedule(expression, () => runScheduledWorkflow(workflow.id), {
    timezone: trigger?.config?.timezone || 'UTC',
  });

  scheduled.set(workflow.id, task);
  logger.info('Scheduled workflow registered', { workflowId: workflow.id, expression });
}

export async function startScheduleRunner() {
  if (process.env.DISABLE_SCHEDULE_RUNNER === 'true') return;

  const workflows = await prisma.workflow.findMany({
    where: { isActive: true },
  });

  for (const wf of workflows) {
    registerWorkflow(wf);
  }

  logger.info(`Schedule runner loaded ${scheduled.size} cron jobs`);
}

export function refreshScheduleForWorkflow(workflowId: string, trigger: unknown, isActive: boolean) {
  scheduled.get(workflowId)?.stop();
  scheduled.delete(workflowId);

  if (!isActive) return;
  registerWorkflow({ id: workflowId, trigger });
}
