import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft,
  Bot,
  Play,
  Save,
  Loader2,
  Plus,
  Trash2,
  ChevronDown,
  CheckCircle2,
  XCircle,
  Clock,
  Expand,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { agentApi } from '../lib/api';

// ─── Types ────────────────────────────────────────────────────────────────────
type TriggerType = 'manual' | 'schedule' | 'webhook';
type LLMProvider = 'OPENAI' | 'ANTHROPIC' | 'GEMINI' | 'OLLAMA' | 'CUSTOM';

interface AgentForm {
  name: string;
  description: string;
  systemPrompt: string;
  llmProvider: LLMProvider;
  llmModel: string;
  maxIterations: number;
  triggerType: TriggerType;
  tools: { name: string; type: string }[];
  isActive: boolean;
}

const MODEL_OPTIONS: Record<LLMProvider, string[]> = {
  OPENAI: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'],
  ANTHROPIC: ['claude-3-5-sonnet-20241022', 'claude-3-haiku-20240307', 'claude-3-opus-20240229'],
  GEMINI: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro'],
  OLLAMA: ['llama3.2', 'mistral', 'codellama'],
  CUSTOM: [],
};

const TRIGGER_LABELS: Record<TriggerType, string> = {
  manual: 'Manual (run on demand)',
  schedule: 'Schedule (run automatically)',
  webhook: 'Webhook (triggered by event)',
};

const DEFAULT_TOOLS = [
  'search_web',
  'send_email',
  'read_email',
  'query_database',
  'browse_website',
  'check_calendar',
  'create_document',
  'update_crm',
  'create_ticket',
  'post_linkedin',
  'post_twitter',
];

// ─── Status badge ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
    SUCCESS: {
      cls: 'bg-green-50 text-green-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Success',
    },
    COMPLETED: {
      cls: 'bg-green-50 text-green-700',
      icon: <CheckCircle2 className="h-3 w-3" />,
      label: 'Completed',
    },
    FAILED: {
      cls: 'bg-red-50 text-red-600',
      icon: <XCircle className="h-3 w-3" />,
      label: 'Failed',
    },
    RUNNING: {
      cls: 'bg-blue-50 text-blue-600',
      icon: <Loader2 className="h-3 w-3 animate-spin" />,
      label: 'Running',
    },
  };
  const s = map[status] ?? { cls: 'bg-gray-100 text-gray-500', icon: <Clock className="h-3 w-3" />, label: status };
  return (
    <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium ${s.cls}`}>
      {s.icon}
      {s.label}
    </span>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export default function AgentDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const isNew = id === 'new';

  const [form, setForm] = useState<AgentForm>({
    name: '',
    description: '',
    systemPrompt: '',
    llmProvider: 'OPENAI',
    llmModel: 'gpt-4o',
    maxIterations: 5,
    triggerType: 'manual',
    tools: [],
    isActive: true,
  });
  const [dirty, setDirty] = useState(false);
  const [runTask, setRunTask] = useState('');
  const [showRunPanel, setShowRunPanel] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [customTool, setCustomTool] = useState('');

  // Fetch existing agent
  const { isLoading, data: agentData } = useQuery({
    queryKey: ['agent', id],
    queryFn: async () => {
      const res = await agentApi.get(id!);
      return res.data.agent;
    },
    enabled: !isNew,
    refetchOnWindowFocus: false,
  });

  // Populate form when agent loads (only once — don't overwrite user edits)
  useEffect(() => {
    if (!agentData) return;
    setForm({
      name: agentData.name,
      description: agentData.description ?? '',
      systemPrompt: agentData.systemPrompt,
      llmProvider: agentData.llmProvider,
      llmModel: agentData.llmModel,
      maxIterations: agentData.maxIterations,
      triggerType: 'manual',
      tools: (agentData.tools ?? []) as { name: string; type: string }[],
      isActive: agentData.isActive,
    });
    setDirty(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [agentData?.id]);

  // Fetch executions
  const { data: execData, refetch: refetchExecs } = useQuery({
    queryKey: ['agent-executions', id],
    queryFn: async () => {
      const res = await agentApi.executions(id!);
      return res.data.executions;
    },
    enabled: !isNew,
    refetchInterval: showRunPanel ? 3000 : false,
  });

  const executions: any[] = execData ?? [];

  const patch = (key: keyof AgentForm, value: any) => {
    setForm((f) => ({ ...f, [key]: value }));
    setDirty(true);
  };

  // Save mutation
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name,
        description: form.description || undefined,
        systemPrompt: form.systemPrompt,
        llmProvider: form.llmProvider,
        llmModel: form.llmModel,
        maxIterations: form.maxIterations,
        tools: form.tools,
        isActive: form.isActive,
      };
      if (isNew) {
        return agentApi.create(payload);
      }
      return agentApi.update(id!, payload);
    },
    onSuccess: (res) => {
      setDirty(false);
      queryClient.invalidateQueries({ queryKey: ['agents'] });
      if (isNew) {
        navigate(`/agents/${res.data.agent.id}`, { replace: true });
      }
    },
  });

  // Run mutation
  const runMutation = useMutation({
    mutationFn: async () => agentApi.run(id!, { task: runTask }),
    onSuccess: () => {
      setRunTask('');
      refetchExecs();
    },
  });

  if (isLoading && !isNew) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-10 w-10 animate-spin text-purple-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Top Bar */}
      <div className="bg-white border-b border-gray-200 px-6 py-3 flex items-center justify-between sticky top-0 z-30">
        <div className="flex items-center gap-4">
          <Link to="/agents" className="text-gray-400 hover:text-gray-700 transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 bg-gradient-to-br from-purple-100 to-indigo-100 rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4 text-purple-600" />
            </div>
            {form.name ? (
              <span className="font-semibold text-gray-900">{form.name}</span>
            ) : (
              <span className="text-gray-400 italic text-sm">Unnamed agent</span>
            )}
          </div>

          {/* Status toggle */}
          {!isNew && (
            <label className="flex items-center gap-2 cursor-pointer ml-2">
              <div
                onClick={() => patch('isActive', !form.isActive)}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  form.isActive ? 'bg-purple-600' : 'bg-gray-300'
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${
                    form.isActive ? 'translate-x-4' : 'translate-x-0.5'
                  }`}
                />
              </div>
              <span className="text-xs text-gray-500">{form.isActive ? 'Active' : 'Inactive'}</span>
            </label>
          )}
        </div>

        <div className="flex items-center gap-2">
          {!isNew && (
            <Button
              size="sm"
              variant="outline"
              className="gap-1.5"
              onClick={() => setShowRunPanel(!showRunPanel)}
            >
              <Play className="h-3.5 w-3.5" />
              Run
            </Button>
          )}
          <Button
            size="sm"
            className="gap-1.5"
            disabled={!dirty || saveMutation.isPending}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Save className="h-3.5 w-3.5" />
            )}
            {isNew ? 'Create Agent' : 'Save'}
          </Button>
        </div>
      </div>

      {/* Body: two columns */}
      <div className="flex max-w-7xl mx-auto gap-0 min-h-[calc(100vh-57px)]">
        {/* ── LEFT: Activity ── */}
        {!isNew && (
          <div className="w-80 flex-shrink-0 border-r border-gray-200 bg-white flex flex-col">
            <div className="p-4 border-b border-gray-100">
              <p className="text-sm font-semibold text-gray-700">Activity</p>
              <p className="text-xs text-gray-400 mt-0.5">Recent agent runs</p>
            </div>

            {/* Run input */}
            {showRunPanel && (
              <div className="p-4 border-b border-gray-100 bg-purple-50/50">
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 min-h-[80px] bg-white"
                  placeholder="Describe the task for this agent…"
                  value={runTask}
                  onChange={(e) => setRunTask(e.target.value)}
                />
                <Button
                  size="sm"
                  className="w-full mt-2 gap-1.5"
                  disabled={!runTask.trim() || runMutation.isPending}
                  onClick={() => runMutation.mutate()}
                >
                  {runMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Play className="h-3.5 w-3.5" />
                  )}
                  {runMutation.isPending ? 'Starting…' : 'Run'}
                </Button>
              </div>
            )}

            {/* Execution list */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100">
              {executions.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-gray-400">
                  <Clock className="h-8 w-8 mb-3 opacity-40" />
                  <p className="text-xs">No runs yet</p>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="mt-3 text-xs"
                    onClick={() => setShowRunPanel(true)}
                  >
                    Run this agent
                  </Button>
                </div>
              ) : (
                executions.map((exec: any) => (
                  <div key={exec.id} className="p-4 hover:bg-gray-50 cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <StatusBadge status={exec.status} />
                      <span className="text-xs text-gray-400">
                        {new Date(exec.startedAt).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 truncate mt-1">{exec.input}</p>
                    {exec.output && (
                      <p className="text-xs text-gray-700 mt-1 line-clamp-2">{exec.output}</p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── RIGHT: Config Panel ── */}
        <div className="flex-1 p-6 overflow-y-auto">
          <div className="max-w-2xl mx-auto space-y-6">

            {/* Name */}
            <section>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Agent name <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                placeholder="e.g. Sales Outreach Agent"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={form.name}
                onChange={(e) => patch('name', e.target.value)}
              />
            </section>

            {/* Description */}
            <section>
              <label className="block text-sm font-semibold text-gray-700 mb-1">
                Description
              </label>
              <input
                type="text"
                placeholder="What does this agent do?"
                className="w-full border border-gray-200 rounded-xl px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                value={form.description}
                onChange={(e) => patch('description', e.target.value)}
              />
            </section>

            {/* Trigger */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Trigger</label>
                <span className="text-xs text-gray-400">How will this agent start?</span>
              </div>
              <div className="grid grid-cols-3 gap-2">
                {(['manual', 'schedule', 'webhook'] as TriggerType[]).map((t) => (
                  <button
                    key={t}
                    onClick={() => patch('triggerType', t)}
                    className={`px-3 py-2.5 rounded-xl border text-xs font-medium transition-all ${
                      form.triggerType === t
                        ? 'border-purple-400 bg-purple-50 text-purple-700 shadow-sm'
                        : 'border-gray-200 text-gray-600 hover:border-gray-300'
                    }`}
                  >
                    <span className="block text-base mb-1">
                      {t === 'manual' ? '▶️' : t === 'schedule' ? '🕐' : '🔗'}
                    </span>
                    {t.charAt(0).toUpperCase() + t.slice(1)}
                  </button>
                ))}
              </div>
              <p className="text-xs text-gray-400 mt-2">{TRIGGER_LABELS[form.triggerType]}</p>
            </section>

            {/* Instructions */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Instructions <span className="text-red-400">*</span>
                </label>
                <button
                  onClick={() => setExpanded(!expanded)}
                  className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1"
                >
                  <Expand className="h-3 w-3" />
                  {expanded ? 'Collapse' : 'Expand'}
                </button>
              </div>
              <textarea
                placeholder={`Tell the agent what to do, how to behave, and what constraints to follow.\n\nExample:\n- Always address the customer by name\n- Keep emails under 150 words\n- Never promise specific delivery dates`}
                className={`w-full border border-gray-200 rounded-xl px-4 py-3 text-sm text-gray-900 resize-none focus:outline-none focus:ring-2 focus:ring-purple-300 leading-relaxed ${
                  expanded ? 'min-h-[400px]' : 'min-h-[160px]'
                }`}
                value={form.systemPrompt}
                onChange={(e) => patch('systemPrompt', e.target.value)}
              />
              <p className="text-xs text-gray-400 mt-1.5">
                Use plain language. Be specific about decisions, tone, and constraints.
              </p>
            </section>

            {/* Tools */}
            <section>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">
                  Tools this agent can use
                </label>
                <span className="text-xs text-gray-400">{form.tools.length} selected</span>
              </div>
              <div className="border border-gray-200 rounded-xl overflow-hidden">
                <div className="p-3 flex flex-wrap gap-2 min-h-[60px]">
                  {form.tools.map((tool, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1.5 text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg font-medium"
                    >
                      {tool.name.replace(/_/g, ' ')}
                      <button
                        onClick={() => patch('tools', form.tools.filter((_, idx) => idx !== i))}
                        className="text-blue-400 hover:text-red-500 transition-colors"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                  {form.tools.length === 0 && (
                    <span className="text-xs text-gray-400 py-1">No tools selected — add from the list below</span>
                  )}
                </div>
                <div className="border-t border-gray-100 p-3 bg-gray-50">
                  <p className="text-xs font-medium text-gray-500 mb-2">Available tools</p>
                  <div className="flex flex-wrap gap-1.5">
                    {DEFAULT_TOOLS.filter(
                      (t) => !form.tools.some((ft) => ft.name === t)
                    ).map((t) => (
                      <button
                        key={t}
                        onClick={() =>
                          patch('tools', [...form.tools, { name: t, type: 'builtin' }])
                        }
                        className="inline-flex items-center gap-1 text-xs px-2 py-1 bg-white border border-gray-200 text-gray-600 rounded-lg hover:border-purple-300 hover:text-purple-600 transition-all"
                      >
                        <Plus className="h-3 w-3" />
                        {t.replace(/_/g, ' ')}
                      </button>
                    ))}
                  </div>
                  {/* Custom tool */}
                  <div className="flex gap-2 mt-3">
                    <input
                      type="text"
                      placeholder="Add custom tool…"
                      className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5 text-xs focus:outline-none focus:ring-2 focus:ring-purple-200"
                      value={customTool}
                      onChange={(e) => setCustomTool(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && customTool.trim()) {
                          patch('tools', [
                            ...form.tools,
                            { name: customTool.trim().replace(/\s+/g, '_'), type: 'custom' },
                          ]);
                          setCustomTool('');
                        }
                      }}
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      className="text-xs h-7"
                      disabled={!customTool.trim()}
                      onClick={() => {
                        if (customTool.trim()) {
                          patch('tools', [
                            ...form.tools,
                            { name: customTool.trim().replace(/\s+/g, '_'), type: 'custom' },
                          ]);
                          setCustomTool('');
                        }
                      }}
                    >
                      Add
                    </Button>
                  </div>
                </div>
              </div>
            </section>

            {/* Model config */}
            <section>
              <label className="block text-sm font-semibold text-gray-700 mb-3">Model</label>
              <div className="grid grid-cols-2 gap-3">
                {/* Provider */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Provider</label>
                  <div className="relative">
                    <select
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none bg-white pr-8"
                      value={form.llmProvider}
                      onChange={(e) => {
                        const p = e.target.value as LLMProvider;
                        patch('llmProvider', p);
                        patch('llmModel', MODEL_OPTIONS[p][0] ?? '');
                      }}
                    >
                      {(['OPENAI', 'ANTHROPIC', 'GEMINI', 'OLLAMA', 'CUSTOM'] as LLMProvider[]).map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Model */}
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Model</label>
                  {MODEL_OPTIONS[form.llmProvider].length > 0 ? (
                    <div className="relative">
                      <select
                        className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300 appearance-none bg-white pr-8"
                        value={form.llmModel}
                        onChange={(e) => patch('llmModel', e.target.value)}
                      >
                        {MODEL_OPTIONS[form.llmProvider].map((m) => (
                          <option key={m} value={m}>{m}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                    </div>
                  ) : (
                    <input
                      type="text"
                      placeholder="Enter model name"
                      className="w-full border border-gray-200 rounded-xl px-3 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-300"
                      value={form.llmModel}
                      onChange={(e) => patch('llmModel', e.target.value)}
                    />
                  )}
                </div>
              </div>

              {/* Max iterations */}
              <div className="mt-3">
                <label className="block text-xs text-gray-500 mb-1">
                  Max reasoning steps: <span className="font-semibold text-gray-700">{form.maxIterations}</span>
                </label>
                <input
                  type="range"
                  min={1}
                  max={20}
                  value={form.maxIterations}
                  onChange={(e) => patch('maxIterations', parseInt(e.target.value))}
                  className="w-full accent-purple-600"
                />
                <div className="flex justify-between text-xs text-gray-400 mt-0.5">
                  <span>1 (fast)</span>
                  <span>20 (thorough)</span>
                </div>
              </div>
            </section>

            {/* Danger zone */}
            {!isNew && (
              <section className="border border-red-100 rounded-xl p-4">
                <p className="text-sm font-semibold text-red-600 mb-1">Danger zone</p>
                <p className="text-xs text-gray-500 mb-3">
                  Deleting this agent will also remove all execution history.
                </p>
                <Button
                  variant="destructive"
                  size="sm"
                  className="gap-1.5"
                  onClick={async () => {
                    if (window.confirm('Permanently delete this agent?')) {
                      await agentApi.delete(id!);
                      navigate('/agents');
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete agent
                </Button>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
