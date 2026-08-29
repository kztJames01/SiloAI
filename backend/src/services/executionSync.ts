import prisma from '../db/prisma';
import { logger } from '../utils/logger';

const STALE_MS = 30 * 60 * 1000;
const POLL_MS = 3000;
const MAX_POLLS = 200;

export async function reconcileStaleExecutions() {
  const cutoff = new Date(Date.now() - STALE_MS);

  const wf = await prisma.workflowExecution.updateMany({
    where: { status: 'RUNNING', startedAt: { lt: cutoff } },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
      error: 'Execution timed out',
    },
  });

  const agents = await prisma.aIAgentExecution.updateMany({
    where: { status: 'RUNNING', startedAt: { lt: cutoff } },
    data: {
      status: 'FAILED',
      finishedAt: new Date(),
      error: 'Execution timed out',
    },
  });

  if (wf.count || agents.count) {
    logger.warn(`Reconciled stale executions: workflows=${wf.count}, agents=${agents.count}`);
  }
}

export function watchAgentExecution(agentExecutionId: string, workflowExecutionId: string) {
  const poll = async () => {
    for (let i = 0; i < MAX_POLLS; i++) {
      const wf = await prisma.workflowExecution.findUnique({ where: { id: workflowExecutionId } });
      if (!wf) {
        await prisma.aIAgentExecution.update({
          where: { id: agentExecutionId },
          data: { status: 'FAILED', error: 'Workflow execution not found', finishedAt: new Date() },
        });
        return;
      }

      if (wf.status === 'RUNNING') {
        await new Promise((r) => setTimeout(r, POLL_MS));
        continue;
      }

      const ok = wf.status === 'SUCCESS';
      await prisma.aIAgentExecution.update({
        where: { id: agentExecutionId },
        data: {
          status: ok ? 'COMPLETED' : 'FAILED',
          output: wf.output ? JSON.stringify(wf.output) : null,
          error: wf.error ?? null,
          steps: [{ workflowExecutionId, status: wf.status, output: wf.output, error: wf.error }],
          finishedAt: wf.finishedAt ?? new Date(),
        },
      });
      return;
    }

    await prisma.aIAgentExecution.update({
      where: { id: agentExecutionId },
      data: { status: 'FAILED', error: 'Execution timed out', finishedAt: new Date() },
    });
  };

  poll().catch((err) => logger.error('Agent execution sync failed', { agentExecutionId, err }));
}

export function startExecutionReconciler() {
  reconcileStaleExecutions().catch((err) => logger.error('Initial execution reconcile failed', err));
  setInterval(() => {
    reconcileStaleExecutions().catch((err) => logger.error('Execution reconcile failed', err));
  }, 10 * 60 * 1000);
}
