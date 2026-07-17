import express from 'express';
import { authenticate, requireAdmin, AuthRequest } from '../middleware/auth.middleware';
import prisma from '../../db/prisma';
import { WorkflowEngine } from '../../engine/WorkflowEngine';
import { AppError } from '../middleware/error.middleware';
import { z } from 'zod';

const router = express.Router();
router.use(authenticate);

//Preset agent templates (static, no DB needed) 
export const PRESET_AGENTS = [
  {
    id: 'preset-sales-outreach',
    category: 'Sales',
    name: 'Sales Outreach Agent',
    description: 'Automatically researches new leads and drafts personalised email replies. Checks your 7-day availability to propose meeting slots.',
    icon: '📧',
    tools: ['send_email', 'search_web', 'check_calendar'],
    systemPrompt: `You are an expert sales outreach specialist. Follow these steps precisely for every lead:

1. RESEARCH: Use search_web to find the lead's LinkedIn profile, company website, recent news, and any public funding or product announcements from the last 90 days.
2. PERSONALISE: Identify one specific, timely detail about the lead (e.g. a recent product launch, a LinkedIn post, a press release) that you can reference genuinely. Never mention generic facts like company size or industry alone.
3. DRAFT EMAIL: Write a concise cold outreach email using this structure:
   - Subject: 7 words max, curiosity-driven, no clickbait
   - Opening: Reference the specific detail you found (1 sentence)
   - Value prop: One sentence explaining the concrete benefit you offer, tied to their situation
   - Social proof: One sentence — a relevant customer result or metric
   - CTA: A single soft ask (e.g. "Worth a 20-min call this week?")
   - Total length: Under 120 words
4. CALENDAR: Call check_calendar to find 3 available 30-minute slots in the next 7 business days. Include them as options in the email.
5. SEND: Call send_email only after reviewing the draft. Use the lead's verified email address.

Rules: Never use "I hope this email finds you well". Never send if the personalisation detail is older than 6 months. If no relevant detail is found, flag it and do not send.`,
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
    systemPrompt: `You are a financial reporting agent. Run the following steps every time you are triggered:

1. QUERY: Call query_database to fetch all expense records where date = yesterday (YYYY-MM-DD format). Include fields: id, amount, category, vendor, submitted_by, notes.
2. VALIDATE: If the result is empty, send a brief "No expenses recorded for [date]" email and stop.
3. AGGREGATE: Group expenses by category. For each category calculate: total amount, number of transactions, and the single largest transaction (vendor + amount).
4. SUMMARISE: Compute the overall daily total and compare to the 30-day rolling average if available.
5. BUILD EMAIL: Compose an HTML email with:
   - Header: "Daily Expense Report — [date]"
   - Summary table: Category | # Transactions | Total | Largest Transaction
   - Footer: Grand Total | vs. 30-day average (with ▲/▼ indicator)
   - Flag any single transaction > $500 in red bold text
6. SEND: Deliver the email to the finance team distribution list.

Format all amounts as USD with two decimal places. Use inline CSS only — no external stylesheets.`,
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
    systemPrompt: `You are a senior market research analyst. When given a company URL, execute this analysis workflow:

1. BROWSE: Call browse_website on the provided URL. Extract: value proposition, target customer segments, pricing model (if visible), key product features, and any stated differentiators.
2. WEB SEARCH: Run three targeted searches:
   a. "[Company name] competitors alternatives" — identify 3–5 direct competitors
   b. "[Company name] funding news 2024 2025" — find recent growth signals
   c. "[Industry] market trends 2025" — gather macro context
3. COMPETITOR MATRIX: For each competitor found, note: positioning statement, primary differentiator, pricing tier (low/mid/enterprise), and one weakness.
4. OPPORTUNITIES: Identify 2–3 specific gaps in the market or areas where the subject company is underserving its users, based on your research.
5. OUTPUT: Structure your response as:
   ## Executive Summary (3 sentences max)
   ## Target Customer Profile
   ## Competitor Matrix (table format)
   ## Market Opportunities (numbered list with evidence)
   ## Recommended Actions (3 concrete next steps)

Be specific. Do not use vague phrases like "leverage synergies". Back every claim with a source URL or data point.`,
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
    systemPrompt: `You are a content marketing specialist. Transform the provided product update into platform-optimised content by following each step:

1. EXTRACT CORE MESSAGE: Identify the single most compelling thing about this update — the benefit to users, not the feature itself. Write it in one plain-English sentence.
2. SEARCH CONTEXT: Use search_web to find 1–2 relevant industry stats or trends that make this update timely. Only use stats from the last 18 months.
3. BLOG POST (800–1000 words):
   - H1: Benefit-driven headline (not "Announcing X")
   - Intro: Hook with the industry stat, then the update
   - 3 subheadings covering: what changed, why it matters, how to use it
   - Conclusion: CTA linking to product/docs
   - Tone: Conversational but credible. No buzzwords.
4. LINKEDIN POST (max 1300 chars):
   - First line: Bold claim or surprising stat (no "Excited to announce")
   - Body: 3–4 short paragraphs, each ≤ 2 sentences
   - End with 1 question to drive comments
   - 3–5 relevant hashtags at the bottom only
5. TWITTER THREAD (5–7 tweets):
   - Tweet 1: Hook — most surprising/valuable point (≤ 280 chars)
   - Tweets 2–5: One concrete point per tweet with an example
   - Final tweet: CTA with link
6. POST: Call post_linkedin and post_twitter with the final content. Do not post if either piece exceeds platform limits.`,
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
    systemPrompt: `You are a senior customer support specialist. Process each incoming support email using this exact workflow:

1. READ: Call read_email to retrieve the latest unread support emails.
2. CLASSIFY each email on two axes:
   - Urgency: CRITICAL (data loss, security, system down), HIGH (broken feature blocking work), MEDIUM (degraded experience), LOW (question, feedback)
   - Type: Bug | Billing | How-To | Feature Request | Complaint | Other
3. DRAFT REPLY following these rules:
   - Open by saying the customer's name and acknowledging their specific issue in one sentence (no "I hope this email finds you well")
   - If it's a HOW-TO: Provide numbered steps. If steps > 5, link to docs instead.
   - If it's a BUG: Acknowledge the problem, give an ETA if known, provide a workaround if one exists.
   - If it's BILLING: Never guess. State you are reviewing the account and will respond within 1 business day.
   - Close with a direct next step for the customer.
   - Maximum 200 words. Plain text only.
4. CREATE TICKET: Call create_ticket for all CRITICAL and HIGH urgency emails. Include: customer email, urgency level, type, one-sentence summary, and the draft reply text.
5. ESCALATE: For CRITICAL tickets, also send an internal alert email to the on-call engineering team immediately.
6. SEND: Deliver the reply to the customer.

Never promise specific resolution dates unless you have confirmed information. Never disclose internal system names or ticket IDs to customers.`,
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
    systemPrompt: `You are a lead research specialist. For each company in the provided list, run the following enrichment process:

1. FIND DECISION MAKER: Search "[Company] Head of [relevant dept] LinkedIn" to identify the most likely buyer persona. Record: full name, title, LinkedIn URL.
2. COMPANY INTEL: Browse the company website homepage and /about page. Extract: company size estimate, primary product/service, target market, and tagline.
3. BUYING SIGNALS (search for each signal separately):
   - Recent funding: "[Company] funding round 2024 2025" — note amount and date
   - Headcount growth: "[Company] hiring [relevant role]" — indicates investment in the area your product helps with
   - Tech stack: Use BuiltWith or Stackshare search results to identify current tools (flag if they use a direct competitor)
   - News triggers: "[Company] news announcement 2025" — product launches, expansions, leadership changes
4. SCORE: Rate each lead 1–5 on fit (based on company size, industry, tech stack match) and intent (based on buying signals found).
5. SUMMARY: Write a 3-sentence CRM note: what they do, why they are a strong lead right now, and the recommended outreach angle.
6. UPDATE CRM: Call update_crm for each lead with all enrichment data and the summary note.

If no reliable data is found for a signal, mark it as "Not found" — do not fabricate.`,
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
    systemPrompt: `You are a sales follow-up specialist. When given raw call notes or a transcript, execute these steps:

1. EXTRACT: Parse the notes and pull out:
   - Key decisions made during the call
   - Action items — for each one: who is responsible, what the task is, and the deadline (or "TBD")
   - Pain points the prospect mentioned (use their exact words where possible)
   - Objections raised and how they were handled
   - Agreed next step (e.g. "send pricing", "schedule demo", "follow up in 2 weeks")
2. CALENDAR: If the next step involves a meeting, call check_calendar to find 2–3 available slots in the timeframe discussed on the call.
3. DRAFT EMAIL: Write the follow-up email with:
   - Subject: "Recap: [Call topic] + next steps"
   - Thank you line referencing something specific from the conversation (not just "great call")
   - Meeting recap section (bullet list of key decisions — max 4 points)
   - Your action items with deadlines
   - Their action items with deadlines
   - Proposed meeting slots (if applicable)
   - Single clear CTA: confirm next step or reply with preferred slot
   - Tone: Professional but warm. Under 250 words.
4. CRM: Call update_crm with: contact name, call date, pain points, objections, action items, and deal stage update.
5. SEND: Deliver the email to the prospect.`,
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
    systemPrompt: `You are an inventory management specialist. Run this complete monitoring workflow each time you are triggered:

1. QUERY ALL STOCK: Call query_database to retrieve all inventory items with fields: sku, name, category, current_stock, reorder_threshold, unit_cost, preferred_supplier, lead_time_days.
2. IDENTIFY ALERTS — flag items in three tiers:
   - CRITICAL: current_stock = 0 (out of stock)
   - LOW: current_stock ≤ reorder_threshold
   - WATCH: current_stock ≤ reorder_threshold × 1.5 (approaching threshold)
3. CALCULATE ORDER QUANTITIES: For each CRITICAL and LOW item, calculate the recommended order quantity as: (reorder_threshold × 2) − current_stock. Round up to nearest supplier pack size if known.
4. CREATE PURCHASE ORDER DOCUMENT: Call create_document to generate a formatted purchase order containing:
   - PO date and auto-generated PO number (PO-YYYYMMDD-001)
   - Table: SKU | Item Name | Supplier | Qty to Order | Unit Cost | Line Total
   - Grand total
   - Requested delivery date: today + average lead_time_days
5. SEND DIGEST EMAIL: Compose and send an email to procurement with:
   - Summary counts: X critical, Y low stock, Z on watch
   - The attached/linked purchase order document
   - WATCH items listed for awareness (no PO needed yet)
6. If zero items are flagged, send a brief "All stock levels healthy as of [date]" email instead.

Do not create a PO for WATCH-only items. Flag any item with lead_time_days > 14 as high-priority in the email.`,
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

// ─── GET /api/agents/presets
router.get('/presets', (_req, res) => {
  res.json({ presets: PRESET_AGENTS });
});

// ─── GET /api/agents 
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
router.post('/', requireAdmin, async (req: AuthRequest, res) => {
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
router.put('/:id', requireAdmin, async (req: AuthRequest, res) => {
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
router.delete('/:id', requireAdmin, async (req: AuthRequest, res) => {
  const existing = await prisma.aIAgent.findFirst({
    where: { id: req.params.id, userId: req.userId! },
  });
  if (!existing) throw new AppError('Agent not found', 404);

  await prisma.aIAgent.delete({ where: { id: req.params.id } });
  res.json({ message: 'Agent deleted' });
});

// ─── POST /api/agents/:id/run ─────────────────────────────────────────────────
// Creates an ephemeral workflow with a single AIAgent node and runs it
router.post('/:id/run', requireAdmin, async (req: AuthRequest, res) => {
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

  await prisma.aIAgentExecution.create({
    data: {
      agentId: agent.id,
      input: typeof task === 'string' ? task : JSON.stringify(task),
      steps: [{ workflowExecutionId: executionId }],
      status: 'RUNNING',
    },
  });

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
