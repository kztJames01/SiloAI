import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus,
  Search,
  Bot,
  Play,
  Trash2,
  Settings,
  Zap,
  ChevronRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
  Brain,
  BarChart2,
  FileText,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { agentApi, api } from '../lib/api';
import { LLMConfigPanel } from '../components/ai/LLMConfigPanel';
import { TokenUsageDashboard } from '../components/ai/TokenUsageDashboard';
import { PromptTemplateEditor } from '../components/ai/PromptTemplateEditor';
import { POPULAR_INTEGRATIONS } from '../lib/integrations';

//Types 
interface PresetAgent {
  id: string;
  category: string;
  name: string;
  description: string;
  icon: string;
  tools: string[];
  systemPrompt: string;
  llmProvider: string;
  llmModel: string;
  maxIterations: number;
  triggerType: string;
  featured: boolean;
}

interface Agent {
  id: string;
  name: string;
  description?: string;
  systemPrompt: string;
  llmProvider: string;
  llmModel: string;
  isActive: boolean;
  createdAt: string;
  executions?: { status: string; startedAt: string }[];
}

// ─── New Agent Modal ──────────────────────────────────────────────────────────
function NewAgentModal({
  presets,
  onClose,
  onScratch,
}: {
  presets: PresetAgent[];
  onClose: () => void;
  onScratch: () => void;
}) {
  const [hovered, setHovered] = useState<string | null>(null);
  const [cat, setCat] = useState('All');
  const navigate = useNavigate();
  const categories = ['All', ...Array.from(new Set(presets.map((p) => p.category)))];
  const filtered = cat === 'All' ? presets : presets.filter((p) => p.category === cat);
  const hoveredPreset = presets.find((x) => x.id === hovered) ?? null;

  const handleSelectPreset = (preset: PresetAgent) => {
    onClose();
    navigate('/agents/new', { state: { preset } });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={onClose}>
      <div
        className="bg-input rounded-2xl shadow-2xl overflow-hidden flex"
        style={{ width: 960, maxHeight: '85vh' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/*Panel 1: Category sidebar ── */}
        <div className="w-48 border-r border-border bg-muted/50 flex flex-col flex-shrink-0">
          <div className="p-4 border-b border-border">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">New Agent</p>
          </div>
          <div className="p-3">
            <button
              onClick={onScratch}
              className="w-full text-left px-3 py-2.5 rounded-xl text-md font-semibold text-primary bg-primary/10 hover:bg-primary/20 transition-colors mb-3"
            >
              Create from scratch
            </button>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
              Use a template
            </p>
            <div className="space-y-0.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCat(c)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    cat === c
                      ? 'bg-card shadow-sm font-semibold text-foreground'
                      : 'text-muted-foreground hover:bg-card'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/*Panel 2: Agent grid (always visible)*/}
        <div className="flex-1 overflow-y-auto border-r border-border">
          <div className="p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-3">
              {cat} · {filtered.length} agents
            </p>
            <div className="grid grid-cols-2 gap-2">
              {filtered.map((p) => (
                <button
                  key={p.id}
                  onMouseEnter={() => setHovered(p.id)}
                  onMouseLeave={() => setHovered(null)}
                  onClick={() => handleSelectPreset(p)}
                  className={`text-left rounded-xl border p-3 transition-all group ${
                    hovered === p.id
                      ? 'border-primary bg-primary/5 shadow-md scale-[1.02]'
                      : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                  }`}
                >
                  <div className="flex items-start gap-2.5 mb-2">
                    <span className="text-2xl flex-shrink-0 leading-none mt-0.5">{p.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">{p.name}</p>
                      {p.featured && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded font-medium">
                          Featured
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2 leading-relaxed">{p.description}</p>
                  <div className="flex gap-1 flex-wrap">
                    <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md capitalize font-medium">
                      {p.triggerType}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                      {p.category}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ── Panel 3: Preview (shows on hover) ── */}
        <div className="w-72 flex-shrink-0 flex flex-col bg-card overflow-y-auto">
          {hoveredPreset ? (
            <div className="p-5 flex flex-col h-full">
              <div className="flex items-start gap-3 mb-4">
                <span className="text-4xl leading-none mt-1">{hoveredPreset.icon}</span>
                <div>
                  <h2 className="text-base font-bold text-foreground leading-snug">{hoveredPreset.name}</h2>
                  <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-full font-medium mt-1 inline-block">
                    {hoveredPreset.category}
                  </span>
                </div>
              </div>

              <p className="text-sm text-muted-foreground leading-relaxed mb-5">{hoveredPreset.description}</p>

              <div className="space-y-3 mb-6">
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Trigger</p>
                  <span className="text-xs px-2.5 py-1 bg-muted rounded-lg capitalize inline-block">
                    {hoveredPreset.triggerType}
                  </span>
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Model</p>
                  <span className="text-xs px-2.5 py-1 bg-muted rounded-lg inline-block">
                    {hoveredPreset.llmModel}
                  </span>
                </div>
                {hoveredPreset.tools.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Tools</p>
                    <div className="flex flex-wrap gap-1">
                      {hoveredPreset.tools.map((t) => (
                        <span key={t} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md">
                          {t.replace(/_/g, ' ')}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              <div className="mt-auto">
                <Button className="w-full" onClick={() => handleSelectPreset(hoveredPreset)}>
                  Use this agent
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6 text-center text-muted-foreground">
              <Bot className="h-10 w-10 mb-3 opacity-30" />
              <p className="text-sm font-medium">Hover an agent</p>
              <p className="text-xs mt-1 opacity-70">to preview details and actions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Quick Run Modal ──────────────────────────────────────────────────────────
function RunModal({
  agent,
  onClose,
  onRun,
  isRunning,
}: {
  agent: Agent;
  onClose: () => void;
  onRun: (task: string) => void;
  isRunning: boolean;
}) {
  const [task, setTask] = useState('');

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-card rounded-2xl shadow-2xl w-[480px] p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-bold text-foreground">{agent.name}</h2>
            <p className="text-xs text-muted-foreground">Run this agent manually</p>
          </div>
        </div>
        <label className="block text-sm font-medium text-foreground mb-1">Task</label>
        <textarea
          className="w-full border border-border rounded-xl p-3 text-sm text-foreground bg-background resize-none focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[100px]"
          placeholder="Describe what you want the agent to do…"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          autoFocus
        />
        <div className="flex gap-2 mt-4">
          <Button variant="outline" className="flex-1" onClick={onClose}>
            Cancel
          </Button>
          <Button
            className="flex-1 gap-2"
            disabled={!task.trim() || isRunning}
            onClick={() => onRun(task.trim())}
          >
            {isRunning ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4" />}
            {isRunning ? 'Starting…' : 'Run Agent'}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Agent Card ───────────────────────────────────────────────────────────────
function AgentCard({
  agent,
  onRun,
  onDelete,
}: {
  agent: Agent;
  onRun: (agent: Agent) => void;
  onDelete: (id: string) => void;
}) {
  const lastExec = agent.executions?.[0];

  const statusIcon = lastExec
    ? {
        SUCCESS: <CheckCircle2 className="h-3 w-3 text-green-500" />,
        COMPLETED: <CheckCircle2 className="h-3 w-3 text-green-500" />,
        FAILED: <XCircle className="h-3 w-3 text-red-500" />,
        RUNNING: <Loader2 className="h-3 w-3 text-blue-500 animate-spin" />,
      }[lastExec.status] ?? <Clock className="h-3 w-3 text-muted-foreground" />
    : null;

  return (
    <Card className="hover:shadow-md transition-all border border-border hover:border-primary/40 group">
      <CardContent className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-2 mb-3">
          <div className="h-10 w-10 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-xl flex items-center justify-center flex-shrink-0">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div
            className={`px-2 py-0.5 rounded-full text-xs font-medium ${
              agent.isActive ? 'bg-green-500/10 text-green-600' : 'bg-muted text-muted-foreground'
            }`}
          >
            {agent.isActive ? 'Active' : 'Inactive'}
          </div>
        </div>

        {/* Name & description */}
        <h3 className="font-semibold text-foreground text-sm mb-1 leading-snug">{agent.name}</h3>
        {agent.description && (
          <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{agent.description}</p>
        )}

        {/* Model badge */}
        <div className="flex flex-wrap gap-1 mb-4">
          <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-md font-medium">
            {agent.llmModel}
          </span>
          <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
            {agent.llmProvider}
          </span>
        </div>

        {/* Last run */}
        {lastExec && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-4">
            {statusIcon}
            <span>Last run {new Date(lastExec.startedAt).toLocaleDateString()}</span>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-2 pt-3 border-t border-border">
          <Button
            size="sm"
            className="flex-1 gap-1.5 text-xs h-8"
            onClick={() => onRun(agent)}
          >
            <Play className="h-3.5 w-3.5" />
            Run
          </Button>
          <Link to={`/agents/${agent.id}`}>
            <Button size="sm" variant="outline" className="h-8 w-8 p-0">
              <Settings className="h-3.5 w-3.5" />
            </Button>
          </Link>
          <Button
            size="sm"
            variant="ghost"
            className="h-8 w-8 p-0 text-red-400 hover:text-red-600 hover:bg-red-500/10"
            onClick={() => onDelete(agent.id)}
          >
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

//Preset Card
function PresetCard({
  preset,
}: {
  preset: PresetAgent;
}) {
  const [hovered, setHovered] = useState(false);
  const navigate = useNavigate();

  const handleUseTemplate = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate('/agents/new', { state: { preset } });
  };

  return (
    <div
      className={`relative transition-all duration-200 ${hovered ? 'z-10' : 'z-0'}`}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <Card
        className={`border transition-all duration-200 h-full cursor-default ${
          hovered
            ? 'shadow-2xl border-primary/60 scale-[1.04] bg-card'
            : 'shadow-sm border-border hover:border-primary/30'
        }`}
      >
        <CardContent className="p-5">
          <div className="flex items-start gap-3 mb-3">
            <span className="text-3xl flex-shrink-0">{preset.icon}</span>
            <div className="flex-1 min-w-0">
              {preset.featured && (
                <span className="text-xs px-1.5 py-0.5 bg-amber-500/10 text-amber-600 rounded-md font-medium mb-1 inline-block">
                  Featured
                </span>
              )}
              <h3 className="font-semibold text-foreground text-sm leading-snug">{preset.name}</h3>
            </div>
          </div>

          <p className={`text-xs text-muted-foreground mb-4 leading-relaxed transition-all duration-200 ${hovered ? '' : 'line-clamp-2'}`}>
            {preset.description}
          </p>

          <div className="flex flex-wrap gap-1 mb-3">
            <span className="text-xs px-2 py-0.5 bg-primary/10 text-primary rounded-md font-medium capitalize">
              {preset.triggerType}
            </span>
            <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
              {preset.category}
            </span>
            <span className="text-xs px-2 py-0.5 bg-secondary/10 text-secondary rounded-md">
              {preset.llmModel}
            </span>
          </div>

          {/* Tool icons */}
          {preset.tools.length > 0 && (
            <div className="flex flex-wrap gap-1 mb-4">
              {(hovered ? preset.tools : preset.tools.slice(0, 3)).map((t) => (
                <span key={t} className="text-xs px-2 py-0.5 bg-blue-500/10 text-blue-500 rounded-md">
                  {t.replace(/_/g, ' ')}
                </span>
              ))}
              {!hovered && preset.tools.length > 3 && (
                <span className="text-xs px-2 py-0.5 bg-muted text-muted-foreground rounded-md">
                  +{preset.tools.length - 3} more
                </span>
              )}
            </div>
          )}

          <Button
            size="sm"
            className={`w-full text-xs h-8 gap-1.5 transition-all duration-200 ${hovered ? 'opacity-100' : 'opacity-80'}`}
            onClick={handleUseTemplate}
          >
            <Zap className="h-3.5 w-3.5" />
            Use this template
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

//Main page
type Tab = 'my-agents' | 'library' | 'config' | 'tokens' | 'templates';

export default function AgentsPage() {
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<Tab>('my-agents');
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [showNewModal, setShowNewModal] = useState(false);
  const [runTarget, setRunTarget] = useState<Agent | null>(null);

  // ── AI Settings state ──
  const [templates, setTemplates] = useState<any[]>([]);
  const [editingTemplate, setEditingTemplate] = useState<any | null>(null);

  const fetchTemplates = async () => {
    try {
      const res = await api.get('/api/ai/templates');
      setTemplates(res.data.templates || []);
    } catch (e) {
      console.error('Failed to fetch templates', e);
    }
  };

  const handleSaveLLMConfig = async (config: any) => {
    try {
      await api.post('/api/ai/config', config);
      alert('Configuration saved!');
    } catch (e) {
      console.error('Failed to save config', e);
      alert('Failed to save configuration');
    }
  };

  const handleSaveTemplate = async (template: any) => {
    try {
      if (template.id) {
        await api.put(`/api/ai/templates/${template.id}`, template);
      } else {
        await api.post('/api/ai/templates', template);
      }
      setEditingTemplate(null);
      fetchTemplates();
    } catch (e) {
      console.error('Failed to save template', e);
      alert('Failed to save template');
    }
  };

  // Data fetching
  const { data: agentsData, isLoading: loadingAgents } = useQuery({
    queryKey: ['agents'],
    queryFn: async () => {
      const res = await agentApi.list();
      return res.data.agents as Agent[];
    },
  });

  const { data: presetsData, isLoading: loadingPresets } = useQuery({
    queryKey: ['agent-presets'],
    queryFn: async () => {
      const res = await agentApi.presets();
      return res.data.presets as PresetAgent[];
    },
  });

  const agents = agentsData ?? [];
  const presets = presetsData ?? [];

  // Mutations
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => agentApi.delete(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['agents'] }),
  });

  const runMutation = useMutation({
    mutationFn: async ({ id, task }: { id: string; task: string }) =>
      agentApi.run(id, { task }),
    onSuccess: () => {
      setRunTarget(null);
    },
  });

  // Handlers
  const handleScratch = () => {
    setShowNewModal(false);
    // Navigate to new agent form — route handled below
    window.location.href = '/agents/new';
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Delete this agent?')) {
      deleteMutation.mutate(id);
    }
  };

  // Filter helpers
  const categories = ['All', ...Array.from(new Set(presets.map((p) => p.category)))];

  const filteredAgents = agents.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      (a.description ?? '').toLowerCase().includes(search.toLowerCase())
  );

  const filteredPresets =
    selectedCategory === 'All'
      ? presets.filter(
          (p) =>
            p.name.toLowerCase().includes(search.toLowerCase()) ||
            p.description.toLowerCase().includes(search.toLowerCase())
        )
      : presets.filter(
          (p) =>
            p.category === selectedCategory &&
            (p.name.toLowerCase().includes(search.toLowerCase()) ||
              p.description.toLowerCase().includes(search.toLowerCase()))
        );

  const featuredPresets = filteredPresets.filter((p) => p.featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">AI Agents</h1>
          <p className="text-muted-foreground mt-1 text-sm">
            Build autonomous agents that think, decide, and act — no workflow nodes required
          </p>
        </div>
        <Button className="gap-2" onClick={() => setShowNewModal(true)}>
          <Plus className="h-4 w-4" />
          New Agent
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between border-b border-border mb-6">
        <div className="flex gap-1">
          {[
            { id: 'my-agents' as Tab, label: 'My Agents', Icon: Bot, count: agents.length },
            { id: 'library' as Tab, label: 'Library', Icon: Zap, count: presets.length },
            { id: 'config' as Tab, label: 'LLM Config', Icon: Brain, count: null },
            { id: 'tokens' as Tab, label: 'Usage', Icon: BarChart2, count: null },
            { id: 'templates' as Tab, label: 'Prompt Templates', Icon: FileText, count: null },
          ].map(({ id: tId, label, Icon, count }) => (
            <button
              key={tId}
              onClick={() => { setTab(tId); if (tId === 'templates') fetchTemplates(); }}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === tId
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {label}
              {count !== null && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                  tab === tId ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
                }`}>
                  {count}
                </span>
              )}
            </button>
          ))}
        </div>
        {/* Search — only for agent tabs */}
        {(tab === 'my-agents' || tab === 'library') && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search agents…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 pr-4 py-2 text-sm border border-border bg-card text-foreground rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/30 w-56 placeholder:text-muted-foreground"
            />
          </div>
        )}
      </div>

      {/*MY AGENTS TAB */}
      {tab === 'my-agents' && (
        <>
          {loadingAgents ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
            </div>
          ) : agents.length === 0 ? (
            <Card>
              <CardContent className="py-16 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 bg-gradient-to-br from-primary/20 to-secondary/20 rounded-2xl flex items-center justify-center mb-5">
                    <Bot className="h-10 w-10 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold text-foreground mb-2">No agents yet</h3>
                  <p className="text-muted-foreground mb-6 text-sm max-w-xs">
                    Create your first AI agent or browse the library to start with a proven template.
                  </p>
                  <div className="flex gap-3">
                    <Button onClick={() => setShowNewModal(true)} className="gap-2">
                      <Plus className="h-4 w-4" />
                      New Agent
                    </Button>
                    <Button variant="outline" onClick={() => setTab('library')}>
                      Browse Library
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAgents.map((agent) => (
                <AgentCard
                  key={agent.id}
                  agent={agent}
                  onRun={setRunTarget}
                  onDelete={handleDelete}
                />
              ))}
            </div>
          )}
        </>
      )}

      {/*LIBRARY TAB*/}
      {tab === 'library' && (
        <div className="flex gap-6">
          {/* Category sidebar */}
          <aside className="w-44 flex-shrink-0">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3 px-1">
              Browse by category
            </p>
            <nav className="space-y-0.5">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setSelectedCategory(c)}
                  className={`w-full flex items-center justify-between text-left px-3 py-2 rounded-lg text-sm transition-colors ${
                    selectedCategory === c
                      ? 'bg-primary/10 text-primary font-semibold'
                      : 'text-muted-foreground hover:bg-accent'
                  }`}
                >
                  <span>{c}</span>
                  <ChevronRight
                    className={`h-3.5 w-3.5 ${
                      selectedCategory === c ? 'text-primary' : 'text-muted-foreground/40'
                    }`}
                  />
                </button>
              ))}
            </nav>
          </aside>

          {/* Grid */}
          <div className="flex-1 min-w-0">
            {loadingPresets ? (
              <div className="flex justify-center items-center min-h-[300px]">
                <Loader2 className="h-10 w-10 animate-spin text-primary/60" />
              </div>
            ) : (
              <>
                {selectedCategory === 'All' && featuredPresets.length > 0 && (
                  <div className="mb-8">
                    <h2 className="text-base font-bold text-foreground mb-4">
                      Featured agents
                    </h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible py-2">
                      {featuredPresets.map((p) => (
                        <PresetCard key={p.id} preset={p} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedCategory === 'All' && filteredPresets.filter(p => !p.featured).length > 0 && (
                  <div>
                    {featuredPresets.length > 0 && (
                      <h2 className="text-base font-bold text-foreground mb-4">All agents</h2>
                    )}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible py-2">
                      {filteredPresets.filter(p => !p.featured).map((p) => (
                        <PresetCard key={p.id} preset={p} />
                      ))}
                    </div>
                  </div>
                )}

                {selectedCategory !== 'All' && (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 overflow-visible py-2">
                    {filteredPresets.map((p) => (
                      <PresetCard key={p.id} preset={p} />
                    ))}
                  </div>
                )}

                {filteredPresets.length === 0 && (
                  <div className="text-center py-16 text-muted-foreground">
                    <Bot className="h-10 w-10 mx-auto mb-3 opacity-40" />
                    <p className="text-sm">No presets found</p>
                  </div>
                )}

                {/* Popular Integrations */}
                {selectedCategory === 'All' && (
                  <div className="mt-8 pt-6 border-t border-border">
                    <h2 className="text-base font-bold text-foreground mb-1">Connect Apps to Your Agents</h2>
                    <p className="text-xs text-muted-foreground mb-4">These integrations power agent tools like sending emails, updating CRMs, and more.</p>
                    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                      {POPULAR_INTEGRATIONS.slice(0, 12).map((app) => (
                        <Link key={app.provider} to={`/integrations/${app.provider}`}>
                          <div className="group bg-card border border-border rounded-xl p-3 flex flex-col items-center gap-2 hover:shadow-sm hover:border-primary/40 transition-all cursor-pointer text-center">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl" style={{ backgroundColor: app.color + '15' }}>
                              {app.icon}
                            </div>
                            <span className="text-xs font-medium text-muted-foreground group-hover:text-primary line-clamp-1">{app.name}</span>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/*LLM CONFIG TAB*/}
      {tab === 'config' && (
        <div className="max-w-3xl">
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">LLM Configuration</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Set the default AI provider and model used across all agents</p>
          </div>
          <LLMConfigPanel onChange={handleSaveLLMConfig} />
        </div>
      )}

      {/*TOKEN USAGE TAB */}
      {tab === 'tokens' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Token Usage</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Monitor AI usage and costs across all agents</p>
          </div>
          <TokenUsageDashboard />
        </div>
      )}

      {/*PROMPT TEMPLATES TAB*/}
      {tab === 'templates' && (
        <div>
          <div className="mb-5">
            <h2 className="text-lg font-bold text-foreground">Prompt Templates</h2>
            <p className="text-sm text-muted-foreground mt-0.5">Reusable prompts with variable substitution for your agents</p>
          </div>
          {editingTemplate ? (
            <PromptTemplateEditor
              template={editingTemplate}
              onSave={handleSaveTemplate}
              onCancel={() => setEditingTemplate(null)}
            />
          ) : (
            <div className="space-y-4">
              <div className="flex justify-end">
                <Button onClick={() => setEditingTemplate({})} className="gap-2">
                  <Plus className="h-4 w-4" />
                  New Template
                </Button>
              </div>
              {templates.length === 0 ? (
                <Card>
                  <CardContent className="py-12 text-center">
                    <FileText className="h-10 w-10 mx-auto mb-3 text-muted-foreground/40" />
                    <p className="text-sm text-muted-foreground">No templates yet. Create your first prompt template.</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templates.map((tpl) => (
                    <Card key={tpl.id}>
                      <CardHeader>
                        <CardTitle className="text-base">{tpl.name}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-muted-foreground mb-3">{tpl.description || 'No description'}</p>
                        <p className="text-xs text-muted-foreground mb-3">{tpl.variables?.length || 0} variables</p>
                        <Button variant="outline" className="w-full" onClick={() => setEditingTemplate(tpl)}>
                          Edit
                        </Button>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ── New Agent Modal ── */}
      {showNewModal && (
        <NewAgentModal
          presets={presets}
          onClose={() => setShowNewModal(false)}
          onScratch={handleScratch}
        />
      )}

      {/* ── Run Modal ── */}
      {runTarget && (
        <RunModal
          agent={runTarget}
          onClose={() => setRunTarget(null)}
          isRunning={runMutation.isPending}
          onRun={(task) => runMutation.mutate({ id: runTarget.id, task })}
        />
      )}
    </div>
  );
}
