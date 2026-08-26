import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { workflowApi, nodeApi, executionApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import {
  Play, X, MoreVertical, Clock3,
  Zap, MessageSquare, FileText, Database, Code, Undo2, Redo2, Settings, ChevronLeft, ChevronRight,
  Wrench, Bot, Boxes, History, Link2, StickyNote, Search, AppWindow,
  LayoutGrid, Save, CheckCheck, Cloud, CloudOff, Timer
} from 'lucide-react';
import toast from 'react-hot-toast';
import type { NodeDefinition } from '@silo/shared';
import { POPULAR_INTEGRATIONS } from '../lib/integrations';

type StepType = string; // Now using backend node types

interface WorkflowStep {
  id: string;
  type: StepType;
  label: string;
  prompt: string;
  config: Record<string, any>;
  position: { x: number; y: number };
  retryConfig?: {
    enabled: boolean;
    maxRetries: number;
    retryDelay: number;
  };
}

interface WorkflowSnapshot {
  timestamp: number;
  steps: WorkflowStep[];
  label?: string;   // present on explicit saved versions
  isSaved?: boolean;
}

interface TriggerConfig {
  type: 'manual' | 'webhook' | 'schedule';
  config: {
    cronExpression?: string;
    timezone?: string;
    method?: string;
    validateHeaders?: boolean;
    secret?: string;
  };
}

function nodeProblems(step: WorkflowStep) {
  const out: string[] = [];
  if (step.type === 'httpRequest') {
    const url = step.config?.url || '';
    if (!String(url).trim()) out.push('HTTP request needs a URL');
  }
  if (step.type === 'if') {
    if (!String(step.config?.condition || '').trim()) out.push('If node needs a condition');
  }
  if (step.type === 'llmCompletion' || step.type === 'promptTemplate' || step.type === 'code') {
    if (!String(step.prompt || '').trim() && !String(step.config?.code || '').trim()) {
      out.push(`${step.type} needs instructions`);
    }
  }
  return out;
}

function workflowProblems(steps: WorkflowStep[], trigger: TriggerConfig) {
  const out: string[] = [];
  if (trigger.type === 'webhook' && !String(trigger.config?.secret || '').trim()) {
    out.push('Webhook trigger needs a secret');
  }
  if (trigger.type === 'schedule' && !String(trigger.config?.cronExpression || '').trim()) {
    out.push('Schedule trigger needs a cron expression');
  }
  if (!steps.length) out.push('Add at least one step');
  steps.forEach((s, i) => {
    nodeProblems(s).forEach((p) => out.push(`Step ${i + 1}: ${p}`));
  });
  return out;
}

type TemplateStep = { type: string; label: string; prompt: string; config: Record<string, any> };
interface TemplateDef { name: string; triggerType: TriggerConfig['type']; triggerConfig?: TriggerConfig['config']; steps: TemplateStep[] }

const TEMPLATE_DATA: Record<string, TemplateDef> = {
  // Healthcare 
  'healthcare-intake': {
    name: 'Patient Intake Follow-up',
    triggerType: 'webhook',
    steps: [
      { type: 'patientIntake',   label: 'Patient Intake Form',   prompt: 'Collect and validate patient intake information including demographics, insurance, and chief complaint.', config: {} },
      { type: 'dataTransform',   label: 'Validate & Format',     prompt: 'Validate required fields and normalise date formats.', config: { mapping: { fullName: 'patient.name', dob: 'patient.dateOfBirth' } } },
      { type: 'if',              label: 'Form Complete?',         prompt: 'Check whether all required fields are present.',      config: { condition: 'data.isComplete === true' } },
      { type: 'httpRequest',     label: 'Notify Care Staff',      prompt: 'POST notification to care-team Slack channel.',        config: { method: 'POST', url: 'https://hooks.slack.com/services/YOUR_WEBHOOK' } },
    ],
  },
  'appointment-scheduler': {
    name: 'Appointment Scheduler',
    triggerType: 'webhook',
    steps: [
      { type: 'appointmentScheduler', label: 'Book Appointment',   prompt: 'Create the patient appointment and persist it.', config: {} },
      { type: 'dataTransform',        label: 'Build Reminder',    prompt: 'Build email + SMS reminder payload.', config: {} },
      { type: 'httpRequest',          label: 'Send Email Reminder', prompt: 'Send appointment reminder email via SendGrid.', config: { method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send' } },
      { type: 'httpRequest',          label: 'Send SMS Reminder',  prompt: 'Send SMS via Twilio.', config: { method: 'POST', url: 'https://api.twilio.com/2010-04-01/Accounts/ACXXXX/Messages.json' } },
    ],
  },
  // Field Service 
  'field-hazard': {
    name: 'Hazard Report Escalation',
    triggerType: 'webhook',
    steps: [
      { type: 'hazardReport',  label: 'Capture Hazard Report',  prompt: 'Capture hazard details, GPS location, and photo evidence.', config: {} },
      { type: 'if',            label: 'Severity Check',          prompt: 'Route critical incidents to supervisor immediately.', config: { condition: 'data.severity === "high"' } },
      { type: 'httpRequest',   label: 'Notify Supervisor',       prompt: 'Send urgent push notification to on-duty supervisor.', config: { method: 'POST', url: 'https://api.notifications.com/alert' } },
      { type: 'dataTransform', label: 'Log to Safety System',    prompt: 'Format and write incident record to the safety management system.', config: {} },
    ],
  },
  'inventory-check': {
    name: 'Daily Inventory Check',
    triggerType: 'schedule',
    triggerConfig: { cronExpression: '0 8 * * *', timezone: 'UTC' },
    steps: [
      { type: 'schedule',       label: 'Morning Trigger',       prompt: 'Runs every day at 08:00 UTC.', config: { cronExpression: '0 8 * * *' } },
      { type: 'inventoryCheck', label: 'Check Stock Levels',    prompt: 'Pull current stock levels from the warehouse system.', config: {} },
      { type: 'if',             label: 'Below Reorder Point?',  prompt: 'Flag items whose quantity is below the reorder threshold.', config: { condition: 'data.belowThreshold === true' } },
      { type: 'httpRequest',    label: 'Send Low-Stock Alert',  prompt: 'POST low-stock list to procurement Slack channel.', config: { method: 'POST', url: 'https://hooks.slack.com/services/YOUR_WEBHOOK' } },
    ],
  },
  'maintenance-request': {
    name: 'Maintenance Request Handler',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',       label: 'Receive Request',        prompt: 'Accept inbound maintenance request from the mobile app.', config: {} },
      { type: 'workOrder',     label: 'Create Work Order',      prompt: 'Generate a work order and assign to available technician.', config: {} },
      { type: 'if',            label: 'Urgent?',                prompt: 'Escalate if priority is marked urgent.', config: { condition: 'data.priority === "urgent"' } },
      { type: 'httpRequest',   label: 'Notify Technician',      prompt: 'Send work-order details to assigned technician via email.', config: { method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send' } },
    ],
  },
  // Invoicing / Finance 
  'invoice-approval': {
    name: 'Invoice Approval Workflow',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',       label: 'Receive Invoice',        prompt: 'Accept invoice submission via webhook.', config: {} },
      { type: 'dataTransform', label: 'Extract Line Items',     prompt: 'Parse invoice PDF and extract totals and vendor details.', config: {} },
      { type: 'if',            label: 'Exceeds Threshold?',     prompt: 'Route invoices over $5 000 for manager sign-off.', config: { condition: 'data.total > 5000' } },
      { type: 'httpRequest',   label: 'Post to Accounting',     prompt: 'Create approved invoice record in QuickBooks/Xero via REST.', config: { method: 'POST', url: 'https://api.accounting.com/invoices' } },
    ],
  },
  'expense-approval': {
    name: 'Expense Report Approval',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',       label: 'Receive Expense Report', prompt: 'Accept expense submission from the employee portal.', config: {} },
      { type: 'dataTransform', label: 'Validate Policy',        prompt: 'Check each line item against company expense policy.', config: {} },
      { type: 'if',            label: 'Policy Violation?',      prompt: 'Flag reports that breach spending limits.', config: { condition: 'data.hasViolation === true' } },
      { type: 'httpRequest',   label: 'Sync to Accounting',    prompt: 'Write approved expense record to Xero.', config: { method: 'POST', url: 'https://api.xero.com/api.xro/2.0/Receipts' } },
    ],
  },
  // HR / Data Collection 
  'onboarding': {
    name: 'Employee Onboarding',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',       label: 'New Hire Signal',        prompt: 'Trigger when a new hire record is created in the HRIS.', config: {} },
      { type: 'dataTransform', label: 'Provision Accounts',     prompt: 'Build payload to create accounts in Google Workspace, Slack, and Jira.', config: {} },
      { type: 'httpRequest',   label: 'Create Google Account',  prompt: 'POST to Google Directory API to provision email.', config: { method: 'POST', url: 'https://admin.googleapis.com/admin/directory/v1/users' } },
      { type: 'httpRequest',   label: 'Send Welcome Email',     prompt: 'Dispatch welcome and orientation schedule via SendGrid.', config: { method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send' } },
    ],
  },
  // Students 
  'student-research-assistant': {
    name: 'AI Research Assistant',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'Receive Research Query',   prompt: 'Accept a research topic from the student portal.', config: {} },
      { type: 'promptTemplate', label: 'Build Research Prompt',    prompt: 'Format the student topic into a structured research prompt.', config: { template: 'Research the following topic in depth: {{topic}}. Provide key findings, notable authors, and suggested reading.' } },
      { type: 'llmCompletion',  label: 'Generate Research Summary', prompt: 'Use the LLM to produce a comprehensive research summary.', config: { model: 'claude-3-5-sonnet-20241022', maxTokens: 1500 } },
      { type: 'dataTransform',  label: 'Format Output',            prompt: 'Structure the summary with headings and a citation list.', config: {} },
    ],
  },
  'student-essay-feedback': {
    name: 'Essay Feedback Bot',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'Receive Essay',            prompt: 'Accept essay text via the student submission form.', config: {} },
      { type: 'promptTemplate', label: 'Build Feedback Prompt',    prompt: 'Construct a detailed feedback prompt from the essay.', config: { template: 'Review the following essay and provide constructive feedback on structure, argument clarity, grammar, and citations:\n\n{{essay}}' } },
      { type: 'llmCompletion',  label: 'Generate Feedback',        prompt: 'Produce actionable writing feedback.', config: { model: 'claude-3-5-sonnet-20241022', maxTokens: 1000 } },
      { type: 'httpRequest',    label: 'Return Feedback',          prompt: 'POST formatted feedback back to the student portal.', config: { method: 'POST', url: '{{callbackUrl}}' } },
    ],
  },
  'student-study-scheduler': {
    name: 'Smart Study Planner',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'Receive Syllabus',         prompt: 'Accept course syllabus and exam dates from the student.', config: {} },
      { type: 'dataTransform',  label: 'Parse Deadlines',          prompt: 'Extract key deadlines and topic weights from the syllabus.', config: {} },
      { type: 'llmCompletion',  label: 'Generate Study Plan',      prompt: 'Create a week-by-week study schedule optimised for the exam dates.', config: { model: 'claude-3-5-sonnet-20241022', maxTokens: 800 } },
      { type: 'httpRequest',    label: 'Add to Google Calendar',   prompt: 'Create calendar events for each study block via Google Calendar API.', config: { method: 'POST', url: 'https://www.googleapis.com/calendar/v3/calendars/primary/events' } },
    ],
  },
  'student-citation-formatter': {
    name: 'Citation & Bibliography Builder',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'Receive Source List',      prompt: 'Accept list of raw source references from the student.', config: {} },
      { type: 'promptTemplate', label: 'Build Formatting Prompt',  prompt: 'Construct a prompt to reformat sources.', config: { template: 'Format the following references in APA 7th edition style:\n\n{{sources}}' } },
      { type: 'llmCompletion',  label: 'Format Citations',         prompt: 'Produce a correctly formatted bibliography.', config: { model: 'claude-3-5-sonnet-20241022', maxTokens: 600 } },
      { type: 'dataTransform',  label: 'Sort Alphabetically',      prompt: 'Sort entries alphabetically by author surname.', config: {} },
    ],
  },
  // SMB Owners 
  'smb-lead-capture': {
    name: 'Lead Capture & CRM Sync',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',          label: 'Capture Lead',           prompt: 'Accept inbound lead from website contact form.', config: {} },
      { type: 'entityExtraction', label: 'Extract Contact Info',   prompt: 'Extract name, email, company, and intent from the lead payload.', config: {} },
      { type: 'dataTransform',    label: 'Enrich & Score Lead',    prompt: 'Assign a lead score based on company size and intent signals.', config: {} },
      { type: 'httpRequest',      label: 'Create CRM Contact',     prompt: 'POST new contact to HubSpot CRM.', config: { method: 'POST', url: 'https://api.hubapi.com/crm/v3/objects/contacts' } },
    ],
  },
  'smb-customer-support': {
    name: 'Customer Support Triage',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',            label: 'Receive Support Ticket', prompt: 'Accept inbound support ticket from the help-desk widget.', config: {} },
      { type: 'textClassification', label: 'Classify Intent',        prompt: 'Classify the ticket into: billing, technical, general, or refund.', config: {} },
      { type: 'if',                 label: 'High Priority?',         prompt: 'Escalate billing and refund tickets immediately.', config: { condition: 'data.category === "billing" || data.category === "refund"' } },
      { type: 'conversation',       label: 'Draft AI Response',      prompt: 'Generate a helpful, on-brand first response for the ticket.', config: { tone: 'professional', language: 'en' } },
    ],
  },
  'smb-invoice-reminder': {
    name: 'Invoice Payment Reminders',
    triggerType: 'schedule',
    triggerConfig: { cronExpression: '0 9 * * 1', timezone: 'UTC' },
    steps: [
      { type: 'schedule',      label: 'Weekly Monday Trigger',  prompt: 'Runs every Monday at 09:00.', config: { cronExpression: '0 9 * * 1' } },
      { type: 'httpRequest',   label: 'Fetch Overdue Invoices', prompt: 'GET all invoices with status=overdue from accounting system.', config: { method: 'GET', url: 'https://api.xero.com/api.xro/2.0/Invoices?where=Status%3D%22OVERDUE%22' } },
      { type: 'if',            label: 'Any Overdue?',           prompt: 'Skip if no overdue invoices found.', config: { condition: 'data.invoices.length > 0' } },
      { type: 'httpRequest',   label: 'Send Reminder Emails',   prompt: 'Send payment reminders to each overdue customer via SendGrid.', config: { method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send' } },
    ],
  },
  'smb-review-request': {
    name: 'Post-Purchase Review Request',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'Order Fulfilled',        prompt: 'Trigger when an order is marked fulfilled in the e-commerce system.', config: {} },
      { type: 'schedule',       label: 'Wait 3 Days',            prompt: 'Delay the message by 3 days for better timing.', config: { delayDays: 3 } },
      { type: 'promptTemplate', label: 'Build Review Request',   prompt: 'Create a personalised review request message.', config: { template: 'Hi {{customerName}}, thanks for your order of {{productName}}! We\'d love a review: {{reviewLink}}' } },
      { type: 'httpRequest',    label: 'Send Email',             prompt: 'Dispatch review request email via SendGrid.', config: { method: 'POST', url: 'https://api.sendgrid.com/v3/mail/send' } },
    ],
  },
  // Startups 
  'startup-user-feedback': {
    name: 'User Feedback Analyzer',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',          label: 'Receive Feedback',        prompt: 'Accept user feedback from the in-app survey widget.', config: {} },
      { type: 'sentimentAnalysis', label: 'Analyse Sentiment',      prompt: 'Score the feedback as positive, neutral, or negative.', config: {} },
      { type: 'if',               label: 'Negative Feedback?',      prompt: 'Route negative responses to customer success immediately.', config: { condition: 'data.sentiment === "negative"' } },
      { type: 'httpRequest',      label: 'Log to Product Board',    prompt: 'POST feedback item to ProductBoard / Linear.', config: { method: 'POST', url: 'https://api.productboard.com/notes' } },
    ],
  },
  'startup-onboarding-email': {
    name: 'User Onboarding Email Series',
    triggerType: 'webhook',
    steps: [
      { type: 'webhook',        label: 'User Signed Up',           prompt: 'Trigger on new user registration event.', config: {} },
      { type: 'promptTemplate', label: 'Build Welcome Email',      prompt: 'Generate a personalised welcome message.', config: { template: 'Welcome to {{appName}}, {{firstName}}! Here\'s how to get started: {{onboardingSteps}}' } },
      { type: 'llmCompletion',  label: 'Personalise Content',      prompt: 'Tailor the onboarding copy to the user\'s role and use case.', config: { model: 'claude-3-5-sonnet-20241022', maxTokens: 500 } },
      { type: 'httpRequest',    label: 'Send via Customer.io',     prompt: 'Dispatch the welcome email through Customer.io transactional API.', config: { method: 'POST', url: 'https://api.customer.io/v1/send/email' } },
    ],
  },
  'startup-metrics-report': {
    name: 'Weekly Metrics Digest',
    triggerType: 'schedule',
    triggerConfig: { cronExpression: '0 7 * * 5', timezone: 'UTC' },
    steps: [
      { type: 'schedule',       label: 'Friday 07:00 Trigger',    prompt: 'Runs every Friday morning.', config: { cronExpression: '0 7 * * 5' } },
      { type: 'httpRequest',    label: 'Fetch KPIs',              prompt: 'GET weekly metrics from your analytics API.', config: { method: 'GET', url: 'https://api.mixpanel.com/data/export' } },
      { type: 'aiDataTransform', label: 'Summarise Metrics',      prompt: 'Use AI to write a plain-English summary of the week\'s KPIs, trends, and anomalies.', config: {} },
      { type: 'httpRequest',    label: 'Post to Slack',           prompt: 'Send the digest to the #metrics Slack channel.', config: { method: 'POST', url: 'https://hooks.slack.com/services/YOUR_WEBHOOK' } },
    ],
  },
  'startup-ab-test': {
    name: 'A/B Test Result Processor',
    triggerType: 'schedule',
    triggerConfig: { cronExpression: '0 9 * * 1', timezone: 'UTC' },
    steps: [
      { type: 'schedule',       label: 'Weekly Trigger',          prompt: 'Evaluate A/B tests every Monday.', config: { cronExpression: '0 9 * * 1' } },
      { type: 'httpRequest',    label: 'Fetch Experiment Data',   prompt: 'GET current A/B test results from LaunchDarkly / Statsig.', config: { method: 'GET', url: 'https://api.launchdarkly.com/api/v2/flags/default' } },
      { type: 'aiDataTransform', label: 'Analyse Statistical Significance', prompt: 'Determine winning variant and confidence level.', config: {} },
      { type: 'httpRequest',    label: 'Notify Product Team',     prompt: 'POST results summary to product Slack channel.', config: { method: 'POST', url: 'https://hooks.slack.com/services/YOUR_WEBHOOK' } },
    ],
  },
};

const getIconComponent = (nodeType: string) => {
  const iconMap: Record<string, any> = {
    httpRequest: Zap,
    code: Code,
    dataTransform: FileText,
    webhook: MessageSquare,
    schedule: Clock3,
    start: Database,
    if: MessageSquare,
    switch: MessageSquare,
  };
  return iconMap[nodeType] || Database;
};

const createStep = (type: StepType, yPosition: number, nodeDef?: NodeDefinition): WorkflowStep => ({
  id: `step-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
  type,
  label: nodeDef?.name || 'Step',
  prompt: '',
  config: {},
  position: { x: 400, y: yPosition },
  retryConfig: {
    enabled: false,
    maxRetries: 3,
    retryDelay: 1000,
  },
});

const getGuardrailsFromPrivacy = (mode: 'standard' | 'sensitive' | 'strict') => {
  if (mode === 'strict') {
    return { piiMasking: true, redactLogs: true, requireApprovalForExternal: true };
  }
  if (mode === 'sensitive') {
    return { piiMasking: true, redactLogs: true, requireApprovalForExternal: false };
  }
  return { piiMasking: false, redactLogs: false, requireApprovalForExternal: false };
};

export default function WorkflowEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const templateId = searchParams.get('template');
  const queryClient = useQueryClient();
  const isNewWorkflow = !id;

  const [name, setName] = useState('Untitled Workflow');
  const [isEditingName, setIsEditingName] = useState(false);
  const [description, setDescription] = useState('');
  const [steps, setSteps] = useState<WorkflowStep[]>([]);
  const [selectedStepId, setSelectedStepId] = useState<string | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [showTriggerPanel, setShowTriggerPanel] = useState(false);
  const [canvasOffset, setCanvasOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isPanning, setIsPanning] = useState(false);
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [draggingStep, setDraggingStep] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [history, setHistory] = useState<WorkflowSnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [triggerConfig, setTriggerConfig] = useState<TriggerConfig>({
    type: 'manual',
    config: {},
  });
  const [isPaletteOpen, setIsPaletteOpen] = useState(true);
  type SidebarTab = 'nodes' | 'versions' | 'assets' | 'notes';
  const [activeTab, setActiveTab] = useState<SidebarTab>('nodes');
  type NodeCategory = 'all' | 'built-in' | 'productivity' | 'ai';
  const [nodeCategory, setNodeCategory] = useState<NodeCategory>('all');
  const [nodeSearch, setNodeSearch] = useState('');
  const [workflowNotes, setWorkflowNotes] = useState('');
  const [notesSaved, setNotesSaved] = useState(false);
  const [isAiSummarizing, setIsAiSummarizing] = useState(false);
  const [aiSummary, setAiSummary] = useState('');
  const [workflowInputType, setWorkflowInputType] = useState<'manual' | 'form' | 'webhook' | 'schedule'>('manual');
  const [workflowOutputType, setWorkflowOutputType] = useState<'notification' | 'record' | 'api' | 'mixed'>('mixed');
  const [privacyMode, setPrivacyMode] = useState<'standard' | 'sensitive' | 'strict'>('standard');
  const [guardrails, setGuardrails] = useState(getGuardrailsFromPrivacy('standard'));
  const [insertAfterStepId, setInsertAfterStepId] = useState<string | null>(null);
  const [insertNodeSearch, setInsertNodeSearch] = useState('');
  const [isChangingNodeType, setIsChangingNodeType] = useState(false);
  const [isTestingStep, setIsTestingStep] = useState(false);
  const [lastStepTestResult, setLastStepTestResult] = useState<{ ok: boolean; message: string } | null>(null);
  // Version / save state
  const [savedVersions, setSavedVersions] = useState<WorkflowSnapshot[]>([]);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(true);
  const [sampleInput, setSampleInput] = useState('{\n  \n}');
  const canvasRef = useRef<HTMLDivElement>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);
  const nodeTypeSelectRef = useRef<HTMLSelectElement>(null);

  // Fetch available nodes from backend
  const { data: nodesData } = useQuery({
    queryKey: ['nodes'],
    queryFn: async () => {
      const response = await nodeApi.list();
      return response.data;
    },
  });

  const availableNodes = nodesData?.nodes || [];

  const selectedStep = useMemo(
    () => steps.find((step) => step.id === selectedStepId) || null,
    [selectedStepId, steps]
  );

  const { data: workflow, isLoading } = useQuery({
    queryKey: ['workflow', id],
    queryFn: async () => {
      const response = await workflowApi.get(id!);
      return response.data.workflow;
    },
    enabled: !isNewWorkflow,
  });

  const { data: lastRuns } = useQuery({
    queryKey: ['workflow-executions', id],
    queryFn: async () => {
      const response = await executionApi.listByWorkflow(id!);
      return response.data.executions as any[];
    },
    enabled: !isNewWorkflow && !!id,
  });

  const pushHistory = (nextSteps: WorkflowStep[]) => {
    const nextHistory = history.slice(0, historyIndex + 1);
    nextHistory.push({
      timestamp: Date.now(),
      steps: nextSteps.map((step) => ({
        ...step,
        config: { ...step.config },
      })),
    });
    setHistory(nextHistory);
    setHistoryIndex(nextHistory.length - 1);
  };

  useEffect(() => {
    if (!workflow && isNewWorkflow) {
      const tmpl = templateId ? TEMPLATE_DATA[templateId] : undefined;

      if (tmpl) {
        // Load pre-built template steps
        setName(tmpl.name);
        if (tmpl.triggerType !== 'manual') {
          setTriggerConfig({ type: tmpl.triggerType, config: tmpl.triggerConfig || {} });
        }
        const baseSteps: WorkflowStep[] = tmpl.steps.map((s, i) => ({
          id: `step-${Date.now()}-${i}`,
          type: s.type,
          label: s.label,
          prompt: s.prompt,
          config: s.config,
          position: { x: 400, y: 100 + i * 220 },
          retryConfig: { enabled: false, maxRetries: 3, retryDelay: 1000 },
        }));
        setSteps(baseSteps);
        setSelectedStepId(baseSteps[0]?.id || null);
        setHistory([{ timestamp: Date.now(), steps: baseSteps }]);
        setHistoryIndex(0);
        setShowRightPanel(true);
        toast.success(`Template "${tmpl.name}" loaded — customise and save!`);
        return;
      }

      // Blank new workflow — seed with a single Start node
      const firstNode = availableNodes.find((n: NodeDefinition) => n.type === 'start') || availableNodes[0];
      const baseSteps = firstNode ? [createStep(firstNode.type, 100, firstNode)] : [];

      setSteps(baseSteps);
      setSelectedStepId(baseSteps[0]?.id || null);
      setHistory([{ timestamp: Date.now(), steps: baseSteps }]);
      setHistoryIndex(0);
      setShowRightPanel(true);
      return;
    }

    if (workflow) {
      setName(workflow.name);
      setDescription(workflow.description || '');
      setTriggerConfig(workflow.trigger as TriggerConfig);

      const loadedSteps: WorkflowStep[] = (workflow.nodes || []).map((node: any, index: number) => ({
        id: node.id,
        type: node.type || 'start',
        label: node.data?.label || 'Step',
        prompt: node.data?.prompt || '',
        config: node.data?.config || {},
        position: node.position || { x: 400, y: 100 + index * 200 },
        retryConfig: node.data?.retryConfig || { enabled: false, maxRetries: 3, retryDelay: 1000 },
      }));

      const initial = loadedSteps.length ? loadedSteps : [];
      setSteps(initial);
      setSelectedStepId(initial[0]?.id || null);
      setHistory([{ timestamp: Date.now(), steps: initial }]);
      setHistoryIndex(0);
      setShowRightPanel(true);
    }
  }, [workflow, isNewWorkflow, availableNodes]);

  useEffect(() => {
    if (isEditingName && nameInputRef.current) {
      nameInputRef.current.focus();
      nameInputRef.current.select();
    }
  }, [isEditingName]);

  useEffect(() => {
    setIsChangingNodeType(false);
  }, [selectedStepId]);

  useEffect(() => {
    setGuardrails(getGuardrailsFromPrivacy(privacyMode));
  }, [privacyMode]);

  const applyGuardrailsToStep = (
    step: WorkflowStep,
    overrideGuardrails?: { piiMasking: boolean; redactLogs: boolean; requireApprovalForExternal: boolean }
  ) => {
    const active = overrideGuardrails || guardrails;
    const externalTypes = ['httpRequest', 'webhook', 'conversation'];
    const nextConfig: Record<string, any> = { ...step.config };

    if (active.piiMasking) nextConfig.maskSensitiveData = true;
    if (active.redactLogs) nextConfig.redactLogs = true;
    if (active.requireApprovalForExternal && externalTypes.includes(step.type)) {
      nextConfig.approvalRequired = true;
      nextConfig.approvalSlaMinutes = nextConfig.approvalSlaMinutes || 30;
    }

    return {
      ...step,
      config: nextConfig,
    };
  };

  const setAndTrackSteps = (nextSteps: WorkflowStep[]) => {
    setSteps(nextSteps);
    pushHistory(nextSteps);
    setHasUnsavedChanges(true);
  };

  /** Commits current state as a named version and persists to backend */
  const saveVersion = (label?: string) => {
    const problems = workflowProblems(steps, triggerConfig);
    if (problems.length) {
      toast.error(problems[0]);
      return;
    }
    const versionLabel = label || `Version ${savedVersions.length + 1}`;
    const snap: WorkflowSnapshot = {
      timestamp: Date.now(),
      steps: steps.map((s) => ({ ...s, config: { ...s.config } })),
      label: versionLabel,
      isSaved: true,
    };
    setSavedVersions((prev) => [snap, ...prev]);
    setLastSavedAt(new Date());
    setHasUnsavedChanges(false);
    saveMutation.mutate();
  };

  /** Auto-save every 10 minutes when enabled */
  useEffect(() => {
    if (!autoSaveEnabled) return;
    const interval = setInterval(() => {
      if (hasUnsavedChanges) {
        saveVersion('Auto-save');
      }
    }, 10 * 60 * 1000);
    return () => clearInterval(interval);
  }, [autoSaveEnabled, hasUnsavedChanges, steps]);

  const saveMutation = useMutation({
    mutationFn: async () => {
      const nodes = steps.map((step) => ({
        id: step.id,
        type: step.type,
        position: step.position,
        data: {
          label: step.label,
          nodeType: step.type,
          prompt: step.prompt,
          config: step.config,
          retryConfig: step.retryConfig,
        },
      }));

      const edges = steps.slice(0, -1).map((step, index) => ({
        id: `edge-${step.id}-${steps[index + 1].id}`,
        source: step.id,
        target: steps[index + 1].id,
      }));

      const payload = {
        name,
        description,
        nodes,
        edges,
        trigger: triggerConfig,
      };

      if (isNewWorkflow) {
        return workflowApi.create(payload);
      }
      return workflowApi.update(id!, payload);
    },
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['workflows'] });
      if (isNewWorkflow) {
        navigate(`/workflows/${response.data.workflow.id}`);
      }
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to save workflow');
    },
  });

  const executeMutation = useMutation({
    mutationFn: async () => {
      if (!id) {
        throw new Error('Please save before running');
      }
      let input: any = {};
      try {
        const raw = sampleInput.trim();
        input = raw ? JSON.parse(raw) : {};
      } catch {
        toast.error('Sample payload is not valid JSON');
        throw new Error('bad sample json');
      }
      if (input === null || typeof input !== 'object' || Array.isArray(input)) {
        toast.error('Sample payload must be a JSON object');
        throw new Error('bad sample json');
      }
      return workflowApi.execute(id, input);
    },
    onSuccess: (response) => {
      toast.success('Workflow started');
      navigate(`/executions/${response.data.executionId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.error || 'Failed to run workflow');
    },
  });

  const addStepToCanvas = (type: StepType) => {
    const nodeDef = availableNodes.find((n: NodeDefinition) => n.type === type);
    const nextY = steps.length > 0
      ? Math.max(...steps.map(s => s.position.y)) + 200
      : 100;
    const newStep = applyGuardrailsToStep(createStep(type, nextY, nodeDef));
    const next = [...steps, newStep];
    setAndTrackSteps(next);
    setSelectedStepId(newStep.id);
    setShowRightPanel(true);
  };

  const insertStepAfter = (afterStepId: string, type: StepType) => {
    const nodeDef = availableNodes.find((n: NodeDefinition) => n.type === type);
    const ordered = [...steps].sort((a, b) => a.position.y - b.position.y);
    const idx = ordered.findIndex((s) => s.id === afterStepId);
    if (idx === -1) {
      addStepToCanvas(type);
      return;
    }
    const before = ordered[idx];
    const after = ordered[idx + 1];
    const newY = after ? (before.position.y + after.position.y) / 2 : before.position.y + 200;
    const newStep = applyGuardrailsToStep(createStep(type, newY, nodeDef));
    newStep.position.x = before.position.x;

    let shifted = [...steps];
    if (after && Math.abs(after.position.y - before.position.y) < 120) {
      shifted = shifted.map((s) => {
        if (s.position.y > before.position.y) {
          return { ...s, position: { ...s.position, y: s.position.y + 140 } };
        }
        return s;
      });
    }

    const next = [...shifted, newStep].sort((a, b) => a.position.y - b.position.y);
    setAndTrackSteps(next);
    setSelectedStepId(newStep.id);
    setShowRightPanel(true);
    setInsertAfterStepId(null);
    setInsertNodeSearch('');
  };

  const filteredInsertNodes = availableNodes
    .filter((n: NodeDefinition) => n.category !== 'Triggers' && n.category !== 'Logic')
    .filter((n: NodeDefinition) => insertNodeSearch === '' || n.name.toLowerCase().includes(insertNodeSearch.toLowerCase()));

  const toggleDecisionChip = (chip: 'if' | 'retry' | 'approval' | 'wait') => {
    if (!selectedStep) return;
    if (chip === 'retry') {
      updateSelectedStep({
        retryConfig: {
          enabled: !selectedStep.retryConfig?.enabled,
          maxRetries: selectedStep.retryConfig?.maxRetries || 3,
          retryDelay: selectedStep.retryConfig?.retryDelay || 1000,
        },
      });
      return;
    }
    if (chip === 'if') {
      updateSelectedStep({
        config: {
          ...selectedStep.config,
          useIf: !selectedStep.config.useIf,
          condition: selectedStep.config.condition || '',
        },
      });
      return;
    }
    if (chip === 'approval') {
      updateSelectedStep({
        config: {
          ...selectedStep.config,
          approvalRequired: !selectedStep.config.approvalRequired,
          approver: selectedStep.config.approver || '',
          approvalSlaMinutes: selectedStep.config.approvalSlaMinutes || 60,
        },
      });
      return;
    }
    if (chip === 'wait') {
      updateSelectedStep({
        config: {
          ...selectedStep.config,
          waitEnabled: !selectedStep.config.waitEnabled,
          waitMinutes: selectedStep.config.waitMinutes || 10,
        },
      });
      return;
    }
  };

  const applyGuardrailsToAllSteps = () => {
    if (steps.length === 0) return;
    const next = steps.map((s) => applyGuardrailsToStep(s));
    setAndTrackSteps(next);
    toast.success('Guardrails applied to all steps');
  };

  const runStepCheck = async () => {
    if (!selectedStep) return;
    setIsTestingStep(true);
    setLastStepTestResult(null);
    await new Promise((r) => setTimeout(r, 700));

    const needsPrompt = ['llmCompletion', 'promptTemplate', 'code', 'httpRequest', 'conversation'];
    const missingPrompt = needsPrompt.includes(selectedStep.type) && String(selectedStep.prompt || '').trim() === '';
    const strictNeedsApproval = guardrails.requireApprovalForExternal && ['httpRequest', 'webhook', 'conversation'].includes(selectedStep.type);
    const hasApproval = !!selectedStep.config.approvalRequired;

    if (missingPrompt) {
      setLastStepTestResult({ ok: false, message: 'Step check failed: add instructions first.' });
      setIsTestingStep(false);
      return;
    }
    if (strictNeedsApproval && !hasApproval) {
      setLastStepTestResult({ ok: false, message: 'Step check failed: external step needs approval in this mode.' });
      setIsTestingStep(false);
      return;
    }

    setLastStepTestResult({ ok: true, message: 'Step check passed. Looks runnable.' });
    setIsTestingStep(false);
  };

  const deleteStep = (stepId: string) => {
    const next = steps.filter((step) => step.id !== stepId);
    setAndTrackSteps(next);
    if (selectedStepId === stepId) {
      setSelectedStepId(next[0]?.id || null);
    }
    if (next.length === 0) {
      setShowRightPanel(false);
    }
  };

  const updateSelectedStep = (updates: Partial<WorkflowStep>) => {
    if (!selectedStep) {
      return;
    }

    const next = steps.map((step) =>
      step.id === selectedStep.id
        ? {
          ...step,
          ...updates,
          config: updates.config ? { ...step.config, ...updates.config } : step.config,
        }
        : step
    );
    setAndTrackSteps(next);
  };

  const rollbackToVersion = (index: number) => {
    if (!history[index]) {
      return;
    }
    const version = history[index];
    const restored = version.steps.map((step) => ({ ...step, config: { ...step.config } }));
    setSteps(restored);
    setHistoryIndex(index);
  };

  const handleCanvasMouseDown = (e: React.MouseEvent) => {
    // Allow panning with any mouse button on canvas background
    if ((e.target as HTMLElement).closest('.step-card')) {
      return; // Don't pan if clicking on a step
    }
    setIsPanning(true);
    setPanStart({ x: e.clientX - canvasOffset.x, y: e.clientY - canvasOffset.y });
  };

  const handleCanvasMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      setCanvasOffset({
        x: e.clientX - panStart.x,
        y: e.clientY - panStart.y,
      });
    } else if (draggingStep) {
      const step = steps.find(s => s.id === draggingStep);
      if (step) {
        const newX = (e.clientX - dragOffset.x - canvasOffset.x) / zoom;
        const newY = (e.clientY - dragOffset.y - canvasOffset.y) / zoom;
        updateStepPosition(draggingStep, { x: newX, y: newY });
      }
    }
  };

  const handleCanvasMouseUp = () => {
    setIsPanning(false);
    if (draggingStep) {
      setDraggingStep(null);
      // Save to history when drag ends
      pushHistory(steps);
    }
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.1, Math.min(3, prev + delta)));
  };

  const handleStepMouseDown = (e: React.MouseEvent, stepId: string) => {
    e.stopPropagation();
    const step = steps.find(s => s.id === stepId);
    if (step) {
      setDraggingStep(stepId);
      const rect = (e.target as HTMLElement).getBoundingClientRect();
      setDragOffset({
        x: e.clientX - rect.left - canvasOffset.x,
        y: e.clientY - rect.top - canvasOffset.y,
      });
    }
  };

  const updateStepPosition = (stepId: string, position: { x: number; y: number }) => {
    setSteps(prevSteps => prevSteps.map(step =>
      step.id === stepId ? { ...step, position } : step
    ));
  };

  const zoomIn = () => setZoom(prev => Math.min(3, prev + 0.2));
  const zoomOut = () => setZoom(prev => Math.max(0.1, prev - 0.2));
  const resetZoom = () => setZoom(1);

  const getStepIcon = (type: StepType) => {
    return getIconComponent(type);
  };

  const getStepColor = (type: StepType) => {
    const nodeDef = availableNodes.find((n: NodeDefinition) => n.type === type);
    return nodeDef?.color || '#3B82F6';
  };

  const getNodeDef = (type: StepType) => {
    return availableNodes.find((n: NodeDefinition) => n.type === type);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const sortedSteps = [...steps].sort((a, b) => a.position.y - b.position.y);

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top Bar */}
      <div className="h-16 border-b border-border flex items-center justify-between px-6 bg-card z-30">
        <div className="flex items-center gap-4">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/workflows')}
            className="text-muted-foreground"
          >
            <ChevronLeft className="h-4 w-4 mr-1" />
            Back
          </Button>

          {isEditingName ? (
            <input
              ref={nameInputRef}
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onBlur={() => setIsEditingName(false)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') setIsEditingName(false);
                if (e.key === 'Escape') {
                  setIsEditingName(false);
                  setName(name);
                }
              }}
              className="text-lg font-semibold px-2 py-1 border border-primary rounded focus:outline-none focus:ring-1 focus:ring-primary bg-background"
            />
          ) : (
            <h1
              onClick={() => setIsEditingName(true)}
              className="text-lg font-semibold cursor-pointer hover:text-primary px-2 py-1 rounded hover:bg-accent"
            >
              {name}
            </h1>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => rollbackToVersion(Math.max(0, historyIndex - 1))}
            disabled={historyIndex <= 0}
          >
            <Undo2 className="h-4 w-4" />
            Undo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => rollbackToVersion(Math.min(history.length - 1, historyIndex + 1))}
            disabled={historyIndex >= history.length - 1}
          >
            <Redo2 className="h-4 w-4" />
            Redo
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowTriggerPanel(true)}
            className="text-muted-foreground"
          >
            <Settings className="h-4 w-4 mr-2" />
            Trigger: {triggerConfig.type}
          </Button>
          <div className="h-6 w-px bg-border mx-2" />

          {/* Last-saved indicator */}
          {lastSavedAt && !hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground hidden sm:block whitespace-nowrap">
              Saved {lastSavedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          )}
          {hasUnsavedChanges && (
            <span className="text-xs text-primary hidden sm:block whitespace-nowrap">
              Unsaved changes
            </span>
          )}

          {/* Auto-save toggle */}
          <button
            onClick={() => {
              const next = !autoSaveEnabled;
              setAutoSaveEnabled(next);
              toast(next ? 'Auto-save on — saves every 10 min' : 'Auto-save off', { icon: next ? '✅' : '⏸️' });
            }}
            title={autoSaveEnabled ? 'Auto-save ON (every 10 min) — click to disable' : 'Auto-save OFF — click to enable'}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
              autoSaveEnabled
                ? 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                : 'bg-muted border-border text-muted-foreground hover:bg-accent'
            }`}
          >
            {autoSaveEnabled ? <Cloud className="h-3.5 w-3.5" /> : <CloudOff className="h-3.5 w-3.5" />}
            <span className="hidden sm:block">{autoSaveEnabled ? 'Auto-save' : 'Auto-save off'}</span>
            <Timer className="h-3 w-3 opacity-60" />
          </button>

          {/* Manual Save */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => saveVersion()}
            disabled={saveMutation.isPending}
            className={`gap-1.5 ${
              hasUnsavedChanges
                ? 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
                : 'bg-primary/5 border-primary/30 text-primary hover:bg-primary/10'
            }`}
          >
            <Save className="h-4 w-4" />
            Save
          </Button>

          {/* Publish */}
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              saveVersion('Published');
              toast.success('Workflow published');
            }}
            disabled={saveMutation.isPending}
            className="bg-card"
          >
            <Zap className="h-4 w-4 mr-1" />
            Publish
          </Button>

          <Button
            size="sm"
            onClick={() => executeMutation.mutate()}
            disabled={isNewWorkflow || executeMutation.isPending}
            className="bg-primary text-primary-foreground hover:bg-primary/90"
          >
            <Play className="h-4 w-4 mr-2" />
            {executeMutation.isPending ? 'Running…' : 'Test run'}
          </Button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden relative">
        {/* Tabbed Sidebar */}
        {(() => {
          const SIDEBAR_TABS: { id: SidebarTab; label: string; icon: React.ElementType }[] = [
            { id: 'nodes', label: 'Nodes', icon: Boxes },
            { id: 'versions', label: 'Versions', icon: History },
            { id: 'assets', label: 'Assets', icon: Link2 },
            { id: 'notes', label: 'Notes', icon: StickyNote },
          ];

          const builtInCategories = ['Core', 'Logic', 'Healthcare', 'Field Operations', 'Triggers'];
          const filteredNodes = availableNodes
            .filter((n: NodeDefinition) => n.category !== 'Triggers' && n.category !== 'Logic')
            .filter((n: NodeDefinition) => {
              if (nodeCategory === 'built-in') return builtInCategories.includes(n.category ?? '');
              if (nodeCategory === 'ai') return n.category === 'AI';
              if (nodeCategory === 'productivity') return false;
              return true; // 'all'
            })
            .filter((n: NodeDefinition) =>
              nodeSearch === '' || n.name.toLowerCase().includes(nodeSearch.toLowerCase())
            );

          return (
            <aside
              className={`fixed left-4 top-20 bottom-4 z-50 flex bg-card  transition-all duration-300 ${isPaletteOpen ? 'w-[350px]' : 'w-16'
                }`}
            >
              {/* Narrow icon strip (always visible) */}
              <div className="w-16 flex-shrink-0 bg-[#1e1e1e] rounded-l-xl flex flex-col items-center py-3 gap-0.5 shadow-xl">
                {SIDEBAR_TABS.map((tab) => {
                  const Icon = tab.icon;
                  const isActive = activeTab === tab.id && isPaletteOpen;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => {
                        setActiveTab(tab.id);
                        if (!isPaletteOpen) setIsPaletteOpen(true);
                      }}
                      title={tab.label}
                      className={`relative w-10 h-10 mt-2 rounded-lg flex flex-col items-center justify-center gap-0.5 transition-all group ${isActive
                          ? 'bg-white/15 text-white'
                          : 'text-muted-foreground/60 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[9px] font-medium leading-none">{tab.label}</span>
                      {isActive && (
                        <span className="absolute left-0 top-2 bottom-2 w-0.5 bg-primary rounded-r" />
                      )}
                    </button>
                  );
                })}

                {/* Collapse toggle at bottom of strip */}
                <button
                  onClick={() => setIsPaletteOpen(!isPaletteOpen)}
                  title={isPaletteOpen ? 'Collapse' : 'Expand'}
                  className="mt-auto w-10 h-10 rounded-lg flex items-center justify-center text-muted-foreground/60 hover:text-white hover:bg-white/10 transition-all"
                >
                  {isPaletteOpen ? (
                    <ChevronLeft className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              </div>

              {/* Content panel */}
              {isPaletteOpen && (
                <div className="flex-1  rounded-r-xl shadow-xl border border-l-0 border-border flex flex-col overflow-hidden">

                  {activeTab === 'nodes' && (
                    <div className="flex flex-col h-full">
                      {/* Search */}
                      <div className="p-3 border-b border-border">
                        <div className="relative">
                          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                          <input
                            type="text"
                            value={nodeSearch}
                            onChange={(e) => setNodeSearch(e.target.value)}
                            placeholder="Search apps or modules"
                            className="w-full pl-8 pr-3 py-1.5 text-xs border border-primary/30 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground"
                          />
                        </div>
                      </div>
                      {/* Category pills */}
                      <div className="flex items-center gap-1 px-3 py-2 border-b border-border overflow-x-auto [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {([
                          { id: 'all', label: 'All', icon: Boxes },
                          { id: 'built-in', label: 'Built-in', icon: Wrench },
                          { id: 'productivity', label: 'Productivity', icon: AppWindow },
                          { id: 'ai', label: 'AI', icon: Bot },
                        ] as { id: NodeCategory; label: string; icon: React.ElementType }[]).map((cat) => {
                          const CatIcon = cat.icon;
                          return (
                            <button
                              key={cat.id}
                              onClick={() => setNodeCategory(cat.id)}
                              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-semibold whitespace-nowrap transition-all ${nodeCategory === cat.id
                                  ? 'bg-primary text-white'
                                  : 'bg-muted text-muted-foreground hover:bg-accent'
                                }`}
                            >
                              <CatIcon className="h-3 w-3" />
                              {cat.label}
                            </button>
                          );
                        })}
                      </div>
                      {/* Node grid */}
                      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {nodeCategory === 'productivity' ? (
                          <div className="flex flex-col items-center justify-center h-full text-center gap-3 py-8">
                            <AppWindow className="h-10 w-10 text-muted-foreground/40" />
                            <p className="text-xs font-medium text-muted-foreground">Connect apps &amp; services</p>
                            <p className="text-[10px] text-muted-foreground/70">Integration nodes coming soon</p>
                            <button
                              onClick={() => window.open('/integrations', '_blank')}
                              className="text-[10px] text-primary hover:text-primary/80 font-semibold underline"
                            >
                              Browse integrations
                            </button>
                          </div>
                        ) : filteredNodes.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-8 text-center">
                            <Search className="h-8 w-8 text-muted-foreground/20 mb-2" />
                            <p className="text-xs text-muted-foreground">No matching nodes</p>
                          </div>
                        ) : (
                          <div className="grid grid-cols-2 gap-2">
                            {filteredNodes.map((node: NodeDefinition) => {
                              const Icon = getIconComponent(node.type);
                              return (
                                <button
                                  key={node.type}
                                  onClick={() => addStepToCanvas(node.type)}
                                  className="flex flex-col items-center justify-center p-2 rounded-xl hover:bg-accent transition-colors border border-border hover:border-primary/30 hover:shadow-sm group"
                                  title={node.name}
                                >
                                  <div
                                    className="w-9 h-9 rounded-xl flex items-center justify-center mb-1.5"
                                    style={{
                                      backgroundColor: `${node.color || '#7C3AED'}18`,
                                      color: node.color || '#7C3AED',
                                    }}
                                  >
                                    <Icon className="h-4.5 w-4.5 h-[18px] w-[18px]" />
                                  </div>
                                  <span className="text-[10px] text-foreground text-center leading-tight font-medium group-hover:text-primary">
                                    {node.name}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'versions' && (
                    <div className="flex flex-col h-full">
                      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
                        <h3 className="text-sm font-semibold text-foreground">Versions</h3>
                        <button
                          onClick={() => saveVersion()}
                          disabled={saveMutation.isPending || !hasUnsavedChanges}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-primary text-white text-[10px] font-semibold hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                        >
                          <Save className="h-3 w-3" /> Save now
                        </button>
                      </div>

                      {/* Auto-save status strip */}
                      <div className={`px-4 py-2 flex items-center gap-2 text-[10px] border-b border-border ${
                        autoSaveEnabled ? 'bg-primary/5 text-primary' : 'bg-muted text-muted-foreground'
                      }`}>
                        {autoSaveEnabled
                          ? <><Cloud className="h-3 w-3" /> Auto-saves every 10 min</>
                          : <><CloudOff className="h-3 w-3" /> Auto-save is off</>}
                        <button
                          onClick={() => setAutoSaveEnabled(v => !v)}
                          className="ml-auto underline font-semibold"
                        >
                          {autoSaveEnabled ? 'Disable' : 'Enable'}
                        </button>
                      </div>

                      <div className="flex-1 overflow-y-auto p-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
                        {savedVersions.length === 0 ? (
                          <div className="flex flex-col items-center justify-center h-full py-10 text-center gap-3">
                            <History className="h-10 w-10 text-muted-foreground/20" />
                            <p className="text-xs text-muted-foreground">No saved versions yet.</p>
                            <p className="text-[10px] text-muted-foreground/70">Hit "Save" or wait for auto-save.</p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            {savedVersions.map((snap, idx) => {
                              const isLatest = idx === 0;
                              const d = new Date(snap.timestamp);
                              const timeStr = d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                              const dateStr = d.toLocaleDateString([], { month: 'short', day: 'numeric' });
                              return (
                                <div
                                  key={snap.timestamp}
                                  className={`rounded-xl border p-3 transition-all ${
                                    isLatest
                                      ? 'border-primary bg-primary/5'
                                      : 'border-border hover:border-primary/30 hover:bg-accent/50'
                                  }`}
                                >
                                  <div className="flex items-start gap-2.5">
                                    <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold flex-shrink-0">
                                      KT
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-xs font-semibold text-foreground truncate">{snap.label}</p>
                                      <p className="text-[10px] text-muted-foreground">{dateStr} · {timeStr}</p>
                                      <p className="text-[10px] text-muted-foreground/70">{snap.steps.length} node{snap.steps.length !== 1 ? 's' : ''}</p>
                                    </div>
                                    {isLatest && (
                                      <span className="text-[9px] font-bold text-primary bg-primary/10 px-1.5 py-0.5 rounded-full flex-shrink-0">
                                        Latest
                                      </span>
                                    )}
                                  </div>
                                  {!isLatest && (
                                    <button
                                      onClick={() => {
                                        const restored = snap.steps.map(s => ({ ...s, config: { ...s.config } }));
                                        setSteps(restored);
                                        setHasUnsavedChanges(true);
                                        toast('Restored to ' + snap.label);
                                      }}
                                      className="mt-2 w-full text-[10px] font-semibold text-primary hover:text-primary/80 text-center py-1 rounded-lg hover:bg-primary/5 transition-colors"
                                    >
                                      Restore this version
                                    </button>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {activeTab === 'assets' && (
                    <div className="flex flex-col h-full">
                      <div className="px-4 py-3 border-b border-border">
                        <h3 className="text-sm font-semibold text-foreground">Linked assets</h3>
                        <p className="text-[10px] text-muted-foreground mt-0.5">Assets and app integrations for this workflow.</p>
                      </div>
                      <div className="p-3 border-b border-border flex gap-2">
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                          <span className="text-orange-500">⊞</span> Import APIs
                        </button>
                        <button className="flex items-center gap-1.5 px-3 py-1.5 border border-border rounded-lg text-xs font-semibold text-foreground hover:bg-accent transition-colors">
                          <span className="text-red-500">□</span> Upload Files
                        </button>
                      </div>

                      {/* App Integrations */}
                      <div className="px-3 pt-3 pb-2">
                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2">App Integrations</p>
                        <div className="grid grid-cols-2 gap-1.5">
                          {POPULAR_INTEGRATIONS.slice(0, 10).map((app) => (
                            <button
                              key={app.provider}
                              className="flex items-center gap-2 px-2.5 py-2 border border-border rounded-lg text-xs text-muted-foreground hover:border-primary/40 hover:text-primary transition-all"
                              onClick={() => window.open(`/integrations/${app.provider}`, '_blank')}
                            >
                              <span className="text-base flex-shrink-0">{app.icon}</span>
                              <span className="truncate font-medium">{app.name}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="flex-1 flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-full bg-muted/50 rounded-xl p-6 border border-border">
                          <Link2 className="h-8 w-8 text-muted-foreground/40 mx-auto mb-2" />
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            APIs and Files used in this workflow will be displayed here.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes Tab */}
                  {activeTab === 'notes' && (
                    <div className="flex flex-col h-full">

                      {/* Top Half: Notes */}
                      <div className="flex flex-col" style={{ flex: '0 0 50%', minHeight: 0 }}>
                        <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">

                          <h3 className="text-sm font-semibold text-foreground">Notes</h3>

                          <button
                            onClick={() => {
                              setNotesSaved(true);
                              toast.success('Notes saved');
                              setTimeout(() => setNotesSaved(false), 2500);
                            }}
                            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${notesSaved
                                ? 'bg-green-100 text-green-700'
                                : 'bg-primary text-primary-foreground hover:bg-primary/90'
                              }`}
                          >
                            {notesSaved ? (
                              <><CheckCheck className="h-3.5 w-3.5" /> Saved</>
                            ) : (
                              <><Save className="h-3.5 w-3.5" /> Save</>
                            )}
                          </button>
                        </div>
                        <div className="flex-1 p-3 overflow-hidden">
                          <textarea
                            value={workflowNotes}
                            onChange={(e) => { setWorkflowNotes(e.target.value); setNotesSaved(false); }}
                            placeholder="Write notes about this workflow, e.g. purpose, owner, edge cases..."
                            className="w-full h-full resize-none text-xs border border-border rounded-xl p-3 focus:outline-none focus:ring-2 focus:ring-primary bg-background text-foreground placeholder:text-muted-foreground [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                          />
                        </div>
                      </div>

                      {/* Divider */}
                      <div className="border-t border-border" />

                      <div className="flex flex-col" style={{ flex: '0 0 50%', minHeight: 0 }}>
                        <div className="px-4 py-2.5 border-b border-border">
                          <h3 className="text-sm font-semibold text-foreground">AI Tools</h3>
                          <p className="text-[10px] text-muted-foreground">Analyse and tidy your workflow.</p>
                        </div>
                        <div className="flex-1 overflow-y-auto p-3 space-y-3 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">

                          {/* Summarize with AI */}
                          <div className="rounded-xl border border-border overflow-hidden">
                            <button
                              onClick={async () => {
                                if (isAiSummarizing) return;
                                setIsAiSummarizing(true);
                                setAiSummary('');
                                // Simulate AI call — replace with real API call when ready
                                await new Promise((r) => setTimeout(r, 1400));
                                const nodeList = steps.map((s, i) => `${i + 1}. ${s.label} (${s.type})`).join(', ');
                                setAiSummary(
                                  nodeList
                                    ? `This workflow has ${steps.length} step${steps.length !== 1 ? 's' : ''}: ${nodeList}. It processes data sequentially through each node.`
                                    : 'No steps found — add nodes to the canvas to generate a summary.'
                                );
                                setIsAiSummarizing(false);
                              }}
                              className="w-full flex items-center gap-2 px-3 py-2.5 bg-gradient-to-r from-primary/5 to-secondary/5 hover:from-primary/10 hover:to-secondary/10 transition-colors text-left"
                            >
                              <div className="w-7 h-7 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                                <FileText className="h-3.5 w-3.5 text-primary-foreground" />
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-semibold text-foreground">Summarise with AI</p>
                                <p className="text-[10px] text-muted-foreground">Generate a plain-English description</p>
                              </div>
                              {isAiSummarizing && (
                                <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin flex-shrink-0" />
                              )}
                            </button>
                            {aiSummary && (
                              <div className="px-3 py-2.5 bg-card border-t border-border">
                                <p className="text-[11px] text-foreground leading-relaxed">{aiSummary}</p>
                              </div>
                            )}
                          </div>

                          {/* Auto Align Boxes */}
                          <button
                            onClick={() => {
                              // Lay out steps in a tidy vertical column
                              if (steps.length === 0) return;
                              const aligned = steps.map((step, i) => ({
                                ...step,
                                position: { x: 400, y: 100 + i * 200 },
                              }));
                              setSteps(aligned);
                              pushHistory(aligned);
                              toast.success('Boxes aligned');
                            }}
                            className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl border border-border hover:border-primary/30 hover:bg-accent transition-all text-left group"
                          >
                            <div className="w-7 h-7 rounded-lg bg-muted group-hover:bg-primary/10 flex items-center justify-center flex-shrink-0 transition-colors">
                              <LayoutGrid className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                            </div>
                            <div>
                              <p className="text-xs font-semibold text-foreground group-hover:text-primary">Auto Align Boxes</p>
                              <p className="text-[10px] text-muted-foreground">Tidy nodes into a vertical layout</p>
                            </div>
                          </button>

                        </div>
                      </div>

                    </div>
                  )}

                </div>
              )}
            </aside>
          );
        })()}

        {/* Canvas */}
        <div
          ref={canvasRef}
          className="flex-1 overflow-auto relative bg-muted/30"
          style={{ cursor: isPanning ? 'grabbing' : draggingStep ? 'move' : 'default' }}
          onMouseDown={handleCanvasMouseDown}
          onMouseMove={handleCanvasMouseMove}
          onMouseUp={handleCanvasMouseUp}
          onMouseLeave={handleCanvasMouseUp}
          onWheel={handleWheel}
        >
          {/* Zoom Controls */}
          <div className="absolute bottom-6 right-6 z-20 bg-card rounded-lg shadow-lg border border-border p-2 flex flex-col gap-1" style={{ marginRight: '24px' }}>
            <button
              onClick={zoomIn}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-accent transition-colors"
              title="Zoom In"
            >
              <span className="text-xl font-bold">+</span>
            </button>
            <button
              onClick={resetZoom}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-accent transition-colors text-xs font-semibold"
              title={`${Math.round(zoom * 100)}%`}
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              onClick={zoomOut}
              className="w-10 h-10 flex items-center justify-center rounded hover:bg-accent transition-colors"
              title="Zoom Out"
            >
              <span className="text-xl font-bold">−</span>
            </button>
          </div>
          <div
            className="relative"
            style={{
              width: '200%',
              height: '200%',
              minHeight: '2000px',
              transform: `translate(${canvasOffset.x}px, ${canvasOffset.y}px) scale(${zoom})`,
              transformOrigin: '0 0',
            }}
          >
            {/* Connection Lines */}
            <svg className="absolute inset-0 pointer-events-none" style={{ width: '100%', height: '100%' }}>
              {sortedSteps.map((step, index) => {
                if (index === sortedSteps.length - 1) return null;
                const nextStep = sortedSteps[index + 1];

                // Calculate start and end points
                const startX = step.position.x + 150; // center of card
                const startY = step.position.y + 70; // bottom of card
                const endX = nextStep.position.x + 150;
                const endY = nextStep.position.y;

                // Calculate control points for smooth curve
                const midY = (startY + endY) / 2;
                const curvature = Math.min(Math.abs(endY - startY) / 3, 60);

                const path = `M ${startX} ${startY} 
                  C ${startX} ${startY + curvature}, 
                  ${endX} ${endY - curvature}, 
                  ${endX} ${endY}`;

                return (
                  <g key={`line-${step.id}`}>
                    <path
                      d={path}
                      stroke="#E5E7EB"
                      strokeWidth="2"
                      fill="none"
                    />
                    {/* Add node button in the middle */}
                    <g transform={`translate(${(startX + endX) / 2}, ${midY})`}>
                      <circle
                        cx="0"
                        cy="0"
                        r="12"
                        fill="white"
                        stroke="#E5E7EB"
                        strokeWidth="2"
                        className="cursor-pointer"
                        style={{ pointerEvents: 'all' }}
                        onClick={() => {
                          setInsertAfterStepId(step.id);
                        }}
                      />
                      <line x1="-5" y1="0" x2="5" y2="0" stroke="#9CA3AF" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                      <line x1="0" y1="-5" x2="0" y2="5" stroke="#9CA3AF" strokeWidth="2" style={{ pointerEvents: 'none' }} />
                    </g>
                  </g>
                );
              })}
            </svg>

            {/* Step Cards */}
            {steps.map((step, index) => {
              const Icon = getStepIcon(step.type);
              const color = getStepColor(step.type);
              const isSelected = selectedStepId === step.id;
              const nodeDef = getNodeDef(step.type);

              const problems = nodeProblems(step);
              const isInvalid = problems.length > 0;
              return (
                <div
                  key={step.id}
                  className={`step-card absolute w-[300px] bg-card rounded-lg shadow-sm border-2 cursor-move transition-all ${
                    isInvalid ? 'border-red-500' : isSelected ? 'border-primary shadow-md' : 'border-border hover:border-border/80'
                    }`}
                  onMouseDown={(e) => {
                    e.stopPropagation();
                    handleStepMouseDown(e, step.id);
                    setSelectedStepId(step.id);
                    setShowRightPanel(true);
                  }}
                  style={{
                    left: step.position.x,
                    top: step.position.y,
                    userSelect: 'none',
                  }}
                >
                  <div className="flex items-center gap-3 p-4">
                    <div
                      className="w-10 h-10 rounded flex items-center justify-center flex-shrink-0"
                      style={{ backgroundColor: `${color}15`, color }}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {nodeDef?.name || step.type}
                        </p>
                        {step.retryConfig?.enabled && (
                          <span className="text-xs px-1.5 py-0.5 rounded bg-amber-100 text-amber-700">
                            Retry
                          </span>
                        )}
                      </div>
                      {isInvalid ? (
                        <p className="text-[11px] text-red-500 mt-1">{problems[0]}</p>
                      ) : null}
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {index + 1}. {step.label}
                      </p>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                      }}
                      className="p-1 hover:bg-accent rounded"
                    >
                      <MoreVertical className="h-4 w-4 text-muted-foreground" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {insertAfterStepId && (
          <div className="absolute right-6 top-24 z-40 w-[300px] bg-card border border-border rounded-xl shadow-xl">
            <div className="px-3 py-2.5 border-b border-border flex items-center justify-between">
              <p className="text-xs font-semibold text-foreground">Insert step here</p>
              <button
                onClick={() => { setInsertAfterStepId(null); setInsertNodeSearch(''); }}
                className="text-xs text-muted-foreground hover:text-foreground"
              >
                Close
              </button>
            </div>
            <div className="p-3 space-y-2">
              <input
                type="text"
                value={insertNodeSearch}
                onChange={(e) => setInsertNodeSearch(e.target.value)}
                placeholder="Search node type..."
                className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
              />
              <div className="max-h-56 overflow-y-auto space-y-1.5">
                {filteredInsertNodes.slice(0, 20).map((node: NodeDefinition) => (
                  <button
                    key={`insert-${node.type}`}
                    onClick={() => insertStepAfter(insertAfterStepId, node.type)}
                    className="w-full text-left px-2.5 py-2 rounded-lg border border-border hover:border-primary/40 hover:bg-accent transition-all"
                  >
                    <p className="text-xs font-medium text-foreground">{node.name}</p>
                    <p className="text-[10px] text-muted-foreground">{node.type}</p>
                  </button>
                ))}
                {filteredInsertNodes.length === 0 && (
                  <p className="text-xs text-muted-foreground px-1 py-2">No nodes found</p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Right Configuration Panel */}
        {showRightPanel && selectedStep && (
          <div className="w-[420px] bg-card border-l border-border flex flex-col z-20 shadow-lg">
            <div className="h-16 px-6 flex items-center justify-between border-b border-border">
              <div className="flex items-center gap-3">
                <div
                  className="w-8 h-8 rounded flex items-center justify-center"
                  style={{
                    backgroundColor: `${getStepColor(selectedStep.type)}15`,
                    color: getStepColor(selectedStep.type)
                  }}
                >
                  {(() => {
                    const Icon = getStepIcon(selectedStep.type);
                    return <Icon className="h-4 w-4" />;
                  })()}
                </div>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {sortedSteps.findIndex(s => s.id === selectedStep.id) + 1}. {selectedStep.label}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowRightPanel(false)}
                className="p-1.5 hover:bg-accent rounded-lg"
              >
                <X className="h-4 w-4 text-muted-foreground" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Basics</p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Node Type <span className="text-red-500">*</span>
                </label>
                <button
                  onClick={() => {
                    const next = !isChangingNodeType;
                    setIsChangingNodeType(next);
                    if (next) {
                      setTimeout(() => {
                        nodeTypeSelectRef.current?.focus();
                      }, 0);
                    }
                  }}
                  className="w-full px-4 py-2.5 text-left border border-border rounded-lg hover:bg-accent flex items-center justify-between"
                >
                  <span className="text-sm text-foreground">
                    {getNodeDef(selectedStep.type)?.name || selectedStep.type}
                  </span>
                  <span className="text-primary text-xs font-medium">
                    {isChangingNodeType ? 'Cancel' : 'Change'}
                  </span>
                </button>
              </div>

              {isChangingNodeType && (
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Select Node Type
                </label>
                <select
                  ref={nodeTypeSelectRef}
                  value={selectedStep.type}
                  onChange={(e) => {
                    const nextType = e.target.value as StepType;
                    const def = availableNodes.find((n: NodeDefinition) => n.type === nextType);
                    updateSelectedStep({
                      type: nextType,
                      label: def?.name || selectedStep.label,
                    });
                    setIsChangingNodeType(false);
                  }}
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
                >
                  <option value="">Choose a node...</option>
                  {availableNodes.filter((n: NodeDefinition) => n.category !== 'Triggers' && n.category !== 'Logic').map((node: NodeDefinition) => (
                    <option key={node.type} value={node.type}>
                      {node.name}
                    </option>
                  ))}
                </select>
              </div>
              )}

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Flow Controls</p>
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Decision Chips
                </label>
                <div className="flex items-center gap-2 flex-wrap">
                  <button
                    onClick={() => toggleDecisionChip('if')}
                    className={`text-xs px-2.5 py-1 rounded-full border ${selectedStep.config.useIf ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    If
                  </button>
                  <button
                    onClick={() => toggleDecisionChip('retry')}
                    className={`text-xs px-2.5 py-1 rounded-full border ${selectedStep.retryConfig?.enabled ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Retry
                  </button>
                  <button
                    onClick={() => toggleDecisionChip('approval')}
                    className={`text-xs px-2.5 py-1 rounded-full border ${selectedStep.config.approvalRequired ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Approval
                  </button>
                  <button
                    onClick={() => toggleDecisionChip('wait')}
                    className={`text-xs px-2.5 py-1 rounded-full border ${selectedStep.config.waitEnabled ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Wait
                  </button>
                </div>
              </div>

              {selectedStep.config.useIf && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">If condition</label>
                  <Input
                    value={selectedStep.config.condition || ''}
                    onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, condition: e.target.value } })}
                    placeholder="ex: data.priority === 'high'"
                  />
                </div>
              )}

              {selectedStep.config.approvalRequired && (
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">Approver</label>
                    <Input
                      value={selectedStep.config.approver || ''}
                      onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, approver: e.target.value } })}
                      placeholder="email or role"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">SLA (minutes)</label>
                    <Input
                      type="number"
                      min="1"
                      value={selectedStep.config.approvalSlaMinutes || 60}
                      onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, approvalSlaMinutes: parseInt(e.target.value) || 60 } })}
                    />
                  </div>
                </div>
              )}

              {selectedStep.config.waitEnabled && (
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Wait (minutes)</label>
                  <Input
                    type="number"
                    min="1"
                    value={selectedStep.config.waitMinutes || 10}
                    onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, waitMinutes: parseInt(e.target.value) || 10 } })}
                  />
                </div>
              )}

              <div className="rounded-xl border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-semibold text-foreground">Step Check</p>
                  <button
                    onClick={runStepCheck}
                    disabled={isTestingStep}
                    className="text-xs px-2.5 py-1 rounded-lg border border-border hover:border-primary/40 disabled:opacity-60"
                  >
                    {isTestingStep ? 'Checking...' : 'Run check'}
                  </button>
                </div>
                {lastStepTestResult && (
                  <p className={`text-[11px] mt-2 ${lastStepTestResult.ok ? 'text-green-600' : 'text-amber-600'}`}>
                    {lastStepTestResult.message}
                  </p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Step Instructions
                </label>
                {selectedStep.type === 'httpRequest' ? (
                  <input
                    className="w-full mb-2 px-4 py-2.5 border border-border rounded-lg text-sm bg-background"
                    placeholder="https://..."
                    value={selectedStep.config.url || ''}
                    onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, url: e.target.value } })}
                  />
                ) : null}
                {selectedStep.type === 'if' ? (
                  <input
                    className="w-full mb-2 px-4 py-2.5 border border-border rounded-lg text-sm bg-background"
                    placeholder="{{prev.status}} === ok"
                    value={selectedStep.config.condition || ''}
                    onChange={(e) => updateSelectedStep({ config: { ...selectedStep.config, condition: e.target.value } })}
                  />
                ) : null}
                <textarea
                  value={selectedStep.prompt}
                  onChange={(e) => updateSelectedStep({ prompt: e.target.value })}
                  rows={4}
                  placeholder="Describe what you want this step to do..."
                  className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-background text-foreground"
                />
              </div>

              {(() => {
                const ordered = [...steps].sort((a, b) => a.position.y - b.position.y);
                const idx = ordered.findIndex((s) => s.id === selectedStep.id);
                const prev = idx > 0 ? ordered[idx - 1] : null;
                const lastOut = lastRuns?.[0]?.output;
                const hints: string[] = [];
                if (prev) hints.push(`{{prev.*}} from "${prev.label}"`);
                const walk = (obj: any, prefix: string, n = 0) => {
                  if (!obj || typeof obj !== 'object' || n > 12) return;
                  for (const k of Object.keys(obj)) {
                    if (/api[_-]?key|authorization|secret|password|token|cookie|credential/i.test(k)) continue;
                    if (prefix) hints.push(`{{${prefix}.${k}}}`);
                    else if (k !== 'input' && typeof obj[k] === 'object') walk(obj[k], k, n + 1);
                    if (hints.length > 20) return;
                  }
                };
                if (lastOut?.input && typeof lastOut.input === 'object') {
                  Object.keys(lastOut.input).forEach((k) => {
                    if (!/api[_-]?key|authorization|secret|password|token|cookie|credential/i.test(k)) {
                      hints.push(`{{input.${k}}}`);
                    }
                  });
                }
                walk(lastOut, '');
                return (
                  <div className="rounded-xl border border-border p-3 space-y-2">
                    <p className="text-xs font-semibold text-foreground">Data flow</p>
                    <p className="text-[11px] text-muted-foreground">
                      Use {'{{input.field}}'} or {'{{prev.field}}'} in URLs and conditions.
                    </p>
                    {prev ? (
                      <p className="text-[11px] text-muted-foreground">Previous step: {prev.label}</p>
                    ) : (
                      <p className="text-[11px] text-muted-foreground">This is the first step. Use input fields.</p>
                    )}
                    {hints.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {hints.slice(0, 16).map((h) => (
                          <button
                            key={h}
                            type="button"
                            className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40 font-mono"
                            onClick={() => navigator.clipboard.writeText(h)}
                            title="Copy"
                          >
                            {h}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Conditional Logic for Code nodes */}
              {selectedStep.type === 'code' && (
                <div className="pt-4 border-t border-border">
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Execution Logic
                  </label>
                  <select
                    value={selectedStep.config.executionType || 'sequential'}
                    onChange={(e) => updateSelectedStep({
                      config: { ...selectedStep.config, executionType: e.target.value }
                    })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
                  >
                    <option value="sequential">Sequential</option>
                    <option value="if-else">If/Else Conditional</option>
                    <option value="switch">Switch/Case</option>
                  </select>

                  {selectedStep.config.executionType === 'if-else' && (
                    <div className="mt-3 space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">Condition</label>
                        <Input
                          placeholder="e.g., data.value > 10"
                          value={selectedStep.config.condition || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, condition: e.target.value }
                          })}
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">True Branch</label>
                        <textarea
                          placeholder="Code to execute if true..."
                          value={selectedStep.config.trueBranch || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, trueBranch: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-background text-foreground"
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-muted-foreground mb-1">False Branch</label>
                        <textarea
                          placeholder="Code to execute if false..."
                          value={selectedStep.config.falseBranch || ''}
                          onChange={(e) => updateSelectedStep({
                            config: { ...selectedStep.config, falseBranch: e.target.value }
                          })}
                          rows={3}
                          className="w-full px-3 py-2 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm resize-none bg-background text-foreground"
                        />
                      </div>
                    </div>
                  )}

                  {selectedStep.config.executionType === 'switch' && (
                    <div className="mt-3">
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Switch Variable</label>
                      <Input
                        placeholder="e.g., data.status"
                        value={selectedStep.config.switchVar || ''}
                        onChange={(e) => updateSelectedStep({
                          config: { ...selectedStep.config, switchVar: e.target.value }
                        })}
                      />
                      <p className="mt-2 text-xs text-muted-foreground">Define cases in your code using switch statement</p>
                    </div>
                  )}
                </div>
              )}
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Contract</p>
              <div className="rounded-xl border border-border p-3 space-y-2.5">
                <select
                  value={workflowInputType}
                  onChange={(e) => { setWorkflowInputType(e.target.value as any); setHasUnsavedChanges(true); }}
                  className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="manual">Input: Manual</option>
                  <option value="form">Input: Form</option>
                  <option value="webhook">Input: Webhook</option>
                  <option value="schedule">Input: Schedule</option>
                </select>
                <select
                  value={workflowOutputType}
                  onChange={(e) => { setWorkflowOutputType(e.target.value as any); setHasUnsavedChanges(true); }}
                  className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="notification">Output: Notifications</option>
                  <option value="record">Output: Records</option>
                  <option value="api">Output: API Call</option>
                  <option value="mixed">Output: Mixed</option>
                </select>
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Privacy</p>
              <div className="rounded-xl border border-border p-3 space-y-2.5">
                <select
                  value={privacyMode}
                  onChange={(e) => { setPrivacyMode(e.target.value as any); setHasUnsavedChanges(true); }}
                  className="w-full text-xs px-2.5 py-2 border border-border rounded-lg bg-background"
                >
                  <option value="standard">Privacy: Standard</option>
                  <option value="sensitive">Privacy: Sensitive</option>
                  <option value="strict">Privacy: Strict / Healthcare</option>
                </select>
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setGuardrails((p) => ({ ...p, piiMasking: !p.piiMasking })); setHasUnsavedChanges(true); }}
                    className={`text-[10px] px-2 py-1 rounded-full border ${guardrails.piiMasking ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Mask PII
                  </button>
                  <button
                    onClick={() => { setGuardrails((p) => ({ ...p, redactLogs: !p.redactLogs })); setHasUnsavedChanges(true); }}
                    className={`text-[10px] px-2 py-1 rounded-full border ${guardrails.redactLogs ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Redact Logs
                  </button>
                  <button
                    onClick={() => { setGuardrails((p) => ({ ...p, requireApprovalForExternal: !p.requireApprovalForExternal })); setHasUnsavedChanges(true); }}
                    className={`text-[10px] px-2 py-1 rounded-full border ${guardrails.requireApprovalForExternal ? 'bg-primary/10 text-primary border-primary/40' : 'border-border text-muted-foreground'}`}
                  >
                    Approval on External
                  </button>
                </div>
                <button
                  onClick={applyGuardrailsToAllSteps}
                  className="text-[10px] px-2 py-1 rounded-full border border-border text-muted-foreground hover:text-foreground hover:border-primary/40"
                >
                  Apply to all steps
                </button>
              </div>
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Reliability</p>
              {/* Retry Configuration */}
              <div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedStep.retryConfig?.enabled || false}
                    onChange={(e) => updateSelectedStep({
                      retryConfig: {
                        ...selectedStep.retryConfig,
                        enabled: e.target.checked,
                        maxRetries: selectedStep.retryConfig?.maxRetries || 3,
                        retryDelay: selectedStep.retryConfig?.retryDelay || 1000,
                      }
                    })}
                    className="rounded border-border"
                  />
                  <span className="text-sm font-medium text-foreground">Enable Retry on Failure</span>
                </label>

                {selectedStep.retryConfig?.enabled && (
                  <div className="mt-3 space-y-3 pl-6">
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Max Retries</label>
                      <Input
                        type="number"
                        min="1"
                        max="10"
                        value={selectedStep.retryConfig.maxRetries}
                        onChange={(e) => updateSelectedStep({
                          retryConfig: {
                            ...selectedStep.retryConfig!,
                            maxRetries: parseInt(e.target.value) || 3,
                          }
                        })}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-muted-foreground mb-1">Retry Delay (ms)</label>
                      <Input
                        type="number"
                        min="100"
                        step="100"
                        value={selectedStep.retryConfig.retryDelay}
                        onChange={(e) => updateSelectedStep({
                          retryConfig: {
                            ...selectedStep.retryConfig!,
                            retryDelay: parseInt(e.target.value) || 1000,
                          }
                        })}
                      />
                    </div>
                  </div>
                )}
              </div>

              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Danger Zone</p>
              <div className="pt-4 border-t border-border">
                <Button
                  variant="ghost"
                  className="w-full text-destructive hover:bg-red-500"
                  onClick={() => {
                    deleteStep(selectedStep.id);
                    setShowRightPanel(false);
                  }}
                >
                  Delete Step
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Trigger Configuration Panel */}
        {showTriggerPanel && (
          <div className="absolute inset-0 z-50 bg-black/50 flex items-center justify-center" onClick={() => setShowTriggerPanel(false)}>
            <div className="bg-card rounded-lg shadow-xl w-full max-w-md m-4" onClick={(e) => e.stopPropagation()}>
              <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                <h2 className="text-lg font-semibold">Workflow Trigger</h2>
                <button onClick={() => setShowTriggerPanel(false)} className="p-1 hover:bg-accent rounded">
                  <X className="h-5 w-5 text-muted-foreground" />
                </button>
              </div>

              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Trigger Type</label>
                  <select
                    value={triggerConfig.type}
                    onChange={(e) => setTriggerConfig({ type: e.target.value as any, config: {} })}
                    className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
                  >
                    <option value="manual">Manual</option>
                    <option value="webhook">Webhook</option>
                    <option value="schedule">Schedule</option>
                  </select>
                </div>

                {triggerConfig.type === 'webhook' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">HTTP Method</label>
                      <select
                        value={triggerConfig.config.method || 'POST'}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, method: e.target.value }
                        })}
                        className="w-full px-4 py-2.5 border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary text-sm bg-background text-foreground"
                      >
                        <option>GET</option>
                        <option>POST</option>
                        <option>PUT</option>
                        <option>DELETE</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Webhook secret</label>
                      <Input
                        type="password"
                        value={triggerConfig.config.secret || ''}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, secret: e.target.value }
                        })}
                        placeholder="Required for inbound webhooks"
                        autoComplete="off"
                      />
                    </div>
                  </>
                )}

                {triggerConfig.type === 'schedule' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Cron Expression</label>
                      <Input
                        value={triggerConfig.config.cronExpression || ''}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, cronExpression: e.target.value }
                        })}
                        placeholder="0 0 * * *"
                      />
                      <p className="mt-1 text-xs text-muted-foreground">e.g., 0 0 * * * = Daily at midnight</p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-foreground mb-2">Timezone</label>
                      <Input
                        value={triggerConfig.config.timezone || 'UTC'}
                        onChange={(e) => setTriggerConfig({
                          ...triggerConfig,
                          config: { ...triggerConfig.config, timezone: e.target.value }
                        })}
                        placeholder="UTC"
                      />
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Sample payload (Test run)</label>
                  <textarea
                    value={sampleInput}
                    onChange={(e) => setSampleInput(e.target.value)}
                    rows={5}
                    className="w-full px-3 py-2 border border-border rounded-lg text-xs font-mono bg-background"
                    placeholder='{ "orderId": "123" }'
                  />
                </div>
              </div>

              <div className="px-6 py-4 border-t border-border bg-muted/50 flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowTriggerPanel(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowTriggerPanel(false)}>
                  Save Trigger
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
