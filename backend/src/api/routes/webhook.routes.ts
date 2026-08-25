import { Router } from 'express';
import prisma from '../../db/prisma';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { logger } from '../../utils/logger';
import { signaturesMatch } from '../../utils/webhookSig';

const router = Router();

router.all('/:workflowId', async (req, res) => {
  const { workflowId } = req.params;
  const workflow = await prisma.workflow.findUnique({ where: { id: workflowId } });

  if (!workflow || !workflow.isActive) {
    return res.status(404).json({ error: 'Workflow not found or inactive' });
  }

  const trigger = workflow.trigger as any;
  if (trigger?.type !== 'webhook') {
    return res.status(400).json({ error: 'Workflow is not configured for webhook triggers' });
  }

  const expectedSecret = trigger?.config?.secret;
  if (!expectedSecret) {
    return res.status(503).json({ error: 'Webhook secret is not configured for this workflow' });
  }

  const sigHeader = req.headers['x-silo-signature'] || req.headers['x-hub-signature-256'];
  const rawBody = (req as any).rawBody as Buffer | undefined;
  const bodyForHmac = rawBody || Buffer.from(JSON.stringify(req.body || {}));

  let ok = false;
  if (sigHeader) {
    ok = signaturesMatch(expectedSecret, bodyForHmac, sigHeader);
  } else {
    const provided = req.headers['x-webhook-secret'];
    ok = !!provided && provided === expectedSecret;
  }

  if (!ok) {
    return res.status(401).json({ error: 'Invalid webhook signature' });
  }

  try {
    const engine = new WorkflowEngine();
    const executionId = await engine.executeWorkflow(workflow as any, {
      body: req.body,
      headers: req.headers,
      query: req.query,
      method: req.method,
    });
    return res.status(202).json({ executionId, message: 'Webhook accepted' });
  } catch (err: any) {
    logger.error('Webhook execution failed', { workflowId, error: err.message });
    return res.status(500).json({ error: 'Webhook execution failed' });
  }
});

export default router;
