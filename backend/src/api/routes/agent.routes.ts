import express from 'express';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../../db/prisma';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

const router = express.Router();
router.use(authenticate);

// ─── Preset agent templates (static, no DB needed) ──────────────────────────
export const PRESET_AGENTS = [
  {
    id: 'preset-sales-outreach',
    category: 'Sales',
    name: 'Sales Outreach Agent',
    description: 'Automatically researches new leads and drafts personalised email replies. Checks your 7-day availability to propose meeting slots.',
    icon: '📧',
    tools: ['send_email', 'search_web', 'check_calendar'],
    systemPrompt: 'You are a sales outreach specialist. Research each lead thoroughly, draft personalised emails that reference their specific situation, and propose 2-3 concrete meeting slots from the user\'s calendar. Never send generic templates.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 8,
    triggerType: 'webhook',
    featured: true,
  },
  {
    id: 'preset-daily-expense',
    category: 'Finance',
    name: 'Daily Expense Summary',
    description: 'Finds all records added in the previous day, groups them by category, drafts an HTML email and sends it automatically.',
    icon: '💰',
    tools: ['query_database', 'send_email'],
    systemPrompt: 'You are a financial reporting agent. Every day, retrieve all expense records from the previous day, group them by category, and draft a clean HTML email with totals per category.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 5,
    triggerType: 'schedule',
    featured: true,
  },
  {
    id: 'preset-market-research',
    category: 'Marketing',
    name: 'Market Research Analyst',
    description: 'Instantly analyses any company URL to uncover product positioning, competitor insights, and market opportunities.',
    icon: '🔍',
    tools: ['browse_website', 'search_web'],
    systemPrompt: 'You are a market research analyst. Given a company URL, analyse their product positioning, identify key competitors, and surface actionable insights. Provide structured output with executive summary, competitor matrix, and recommendations.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 10,
    triggerType: 'manual',
    featured: true,
  },
  {
    id: 'preset-social-media',
    category: 'Marketing',
    name: 'Multi-Channel Content Agent',
    description: 'Transforms a single product update into a blog post, social media updates for LinkedIn and Twitter, and an announcement simultaneously.',
    icon: '📢',
    tools: ['search_web', 'post_linkedin', 'post_twitter'],
    systemPrompt: 'You are a content marketing specialist. Take product updates and transform them into platform-optimised content: a long-form blog post, a professional LinkedIn post, a concise Twitter thread, and a newsletter announcement. Adapt tone for each channel.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 6,
    triggerType: 'webhook',
    featured: true,
  },
  {
    id: 'preset-support-triage',
    category: 'Customer Support',
    name: 'Support Email Triage',
    description: 'Reads incoming support emails, classifies urgency, drafts context-aware replies, and escalates critical issues to the right team.',
    icon: '🎧',
    tools: ['read_email', 'send_email', 'create_ticket'],
    systemPrompt: 'You are a customer support specialist. Classify incoming emails by urgency (critical/high/medium/low), draft empathetic and technically accurate replies, and escalate critical issues to the engineering team immediately. Always reference the customer\'s specific issue.',
    llmProvider: 'ANTHROPIC',
    llmModel: 'claude-3-5-sonnet-20241022',
    maxIterations: 6,
    triggerType: 'webhook',
    featured: false,
  },
  {
    id: 'preset-lead-enrichment',
    category: 'Sales',
    name: 'Lead Enrichment Agent',
    description: 'Takes a list of company names and enriches each with LinkedIn profiles, recent news, tech stack, and buying signals.',
    icon: '🧩',
    tools: ['search_web', 'browse_website', 'update_crm'],
    systemPrompt: 'You are a lead research specialist. For each company, find the decision-maker on LinkedIn, recent funding news, tech stack signals, and any buying intent signals. Update the CRM with a structured enrichment summary.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 10,
    triggerType: 'manual',
    featured: false,
  },
  {
    id: 'preset-call-followup',
    category: 'Sales',
    name: 'Call Follow-Up Assistant',
    description: 'Processes call notes, extracts action items, and sends a personalised follow-up email with a meeting summary and next steps.',
    icon: '📞',
    tools: ['send_email', 'update_crm', 'check_calendar'],
    systemPrompt: 'You are a sales follow-up specialist. Process call notes to extract key action items, decisions made, and next steps. Draft a personalised follow-up email that summarises the meeting and proposes concrete next steps with dates.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 5,
    triggerType: 'webhook',
    featured: false,
  },
  {
    id: 'preset-inventory-monitor',
    category: 'Operations',
    name: 'Inventory Monitor',
    description: 'Monitors stock levels daily, identifies low-stock items, drafts purchase orders, and notifies the procurement team.',
    icon: '📦',
    tools: ['query_database', 'send_email', 'create_document'],
    systemPrompt: 'You are an inventory management specialist. Monitor stock levels and alert when items fall below the reorder threshold. Draft purchase orders for low-stock items and send a daily digest to the procurement team.',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 5,
    triggerType: 'schedule',
    featured: false,
  },
];

const agentSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  systemPrompt: z.string().min(1),
  llmProvider: z.enum(['OPENAI', 'ANTHROPIC', 'GEMINI', 'OLLAMA', 'CUSTOM']),
  llmModel: z.string().min(1),
  tools: z.array(z.any()).optional(),
  maxIterations: z.number().int().min(1).max(20).default(5),
  enableMemory: z.boolean().optional().default(false),
  ragConfig: z.any().optional(),
  isActive: z.boolean().optional().default(true),
});

// ─── GET /api/agents/presets ─────────────────────────────────────────────────
router.get('/presets', (_req, res) => {
  res.json({ presets: PRESET_AGENTS });
});

// ─── GET /api/agents ─────────────────────────────────────────────────────────
router.get('/', async (req: AuthRequest, res) => {
  const agents = await prisma.aIAgent.findMany({
    where: { userId: req.userId! },
    include: {
      executions: {
        take: 1,
        orderBy: { startedAt: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  });

  res.json({ agents });
});

// ─── GET /api/agents/:id ─────────────────────────────────────────────────────
router.get('/:id', async (req: AuthRequest, res) => {
  const agent = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
    include: {
      executions: {
        take: 10,
        orderBy: { startedAt: 'desc' },
      },
    },
  });

  if (!agent) throw new AppError('Agent not found', 404);
  res.json({ agent });
});

// ─── POST /api/agents ────────────────────────────────────────────────────────
router.post('/', async (req: AuthRequest, res) => {
  const data = agentSchema.parse(req.body);

  const agent = await prisma.aIAgent.create({
    data: {
      ...data,
      userId: req.userId!,
      tools: data.tools ?? [],
    },
  });

  res.status(201).json({ agent });
});

// ─── PUT /api/agents/:id ──────────────────────────────────────────────────────
router.put('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Agent not found', 404);

  const data = agentSchema.partial().parse(req.body);

  const agent = await prisma.aIAgent.update({
    where: { id: req.params.id },
    data,
  });

  res.json({ agent });
});

// ─── DELETE /api/agents/:id ───────────────────────────────────────────────────
router.delete('/:id', async (req: AuthRequest, res) => {
  const existing = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Agent not found', 404);

  await prisma.aIAgent.delete({ where: { id: req.params.id } });
  res.json({ message: 'Agent deleted' });
});

// ─── POST /api/agents/:id/run ─────────────────────────────────────────────────
// Creates an ephemeral workflow with a single AIAgent node and runs it
router.post('/:id/run', async (req: AuthRequest, res) => {
  const agent = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!agent) throw new AppError('Agent not found', 404);

  const { task, context } = req.body;
  if (!task) throw new AppError('task is required to run an agent', 400);

  // Build an ephemeral workflow definition around this agent
  const ephemeralWorkflow = {
    id: agent.id,
    userId: req.userId!,
    name: agent.name,
    description: agent.description ?? '',
    isActive: true,
    trigger: { type: 'manual', config: {} },
    nodes: [
      {
        id: 'agent-node',
        type: 'aiAgent',
        name: agent.name,
        data: {
          provider: agent.llmProvider.toLowerCase(),
          model: agent.llmModel,
          systemPrompt: agent.systemPrompt,
          task,
          context: context ?? {},
          maxIterations: agent.maxIterations,
          tools: agent.tools ?? [],
        },
      },
    ],
    edges: [],
  };

  const engine = new WorkflowEngine();
  // WorkflowEngine expects a Workflow record — we create a temporary execution record pointing at a real workflow
  // Instead, we use a lightweight wrapper: find or create a workflow shell for this agent
  let agentWorkflow = await prisma.workflow.findFirst({
    where: { userId: req.userId!, name: `__agent__${agent.id}` },
  });

  if (!agentWorkflow) {
    agentWorkflow = await prisma.workflow.create({
      data: {
        userId: req.userId!,
        name: `__agent__${agent.id}`,
        description: `Backing workflow for agent: ${agent.name}`,
        nodes: ephemeralWorkflow.nodes as any,
        edges: [],
        trigger: { type: 'manual', config: {} },
        isActive: false,
      },
    });
  } else {
    // Keep nodes up-to-date with latest agent config
    agentWorkflow = await prisma.workflow.update({
      where: { id: agentWorkflow.id },
      data: { nodes: ephemeralWorkflow.nodes as any },
    });
  }

  const executionId = await engine.executeWorkflow(agentWorkflow as any, { task, context });
  res.json({ executionId, message: 'Agent run started' });
});

// ─── GET /api/agents/:id/executions ──────────────────────────────────────────
router.get('/:id/executions', async (req: AuthRequest, res) => {
  const agent = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!agent) throw new AppError('Agent not found', 404);

  const executions = await prisma.aIAgentExecution.findMany({
    where: { agentId: agent.id },
    orderBy: { startedAt: 'desc' },
    take: 20,
  });

  res.json({ executions });
});

export default router;
