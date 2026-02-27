import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Check,
  ExternalLink,
  Zap,
  Shield,
  Clock,
  Settings,
  Trash2,
  Plus,
  Play,
  RefreshCw,
  ChevronRight,
  Star,
  Globe,
  Lock,
  Key,
} from 'lucide-react';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';

interface IntegrationDetails {
  metadata: {
    provider: string;
    name: string;
    description: string;
    category: string;
    authType: string;
    logo?: string;
    color?: string;
    docUrl?: string;
    enabled: boolean;
    comingSoon?: boolean;
  };
  actions: Array<{
    id: string;
    name: string;
    description: string;
    parameters: Array<{
      name: string;
      type: string;
      required: boolean;
      description: string;
    }>;
  }>;
  triggers: Array<{
    id: string;
    name: string;
    description: string;
  }>;
}

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: 'ACTIVE' | 'EXPIRED' | 'ERROR' | 'DISCONNECTED';
  lastUsed?: string;
  lastTested?: string;
}

// Sample popular use-cases per integration type
const USE_CASES: Record<string, Array<{ title: string; description: string; icon: string }>> = {
  gmail: [
    { title: 'Send automated emails', description: 'Trigger emails when workflow events occur', icon: '📧' },
    { title: 'Read and parse inbox', description: 'Process incoming emails and extract data', icon: '📬' },
    { title: 'Email notifications', description: 'Get notified about critical workflow failures', icon: '🔔' },
  ],
  slack: [
    { title: 'Send team notifications', description: 'Post automated messages to channels or DMs', icon: '💬' },
    { title: 'Create incident alerts', description: 'Notify on-call teams when issues arise', icon: '🚨' },
    { title: 'Daily digests', description: 'Post daily summaries and reports to Slack', icon: '📊' },
  ],
  github: [
    { title: 'Create issues automatically', description: 'Log bugs and tasks from workflow outputs', icon: '🐛' },
    { title: 'Track deployments', description: 'Trigger workflows on new releases', icon: '🚀' },
    { title: 'PR notifications', description: 'Get alerts when PRs need review', icon: '👀' },
  ],
  stripe: [
    { title: 'Process payments', description: 'Create payment intents for workflow triggers', icon: '💳' },
    { title: 'Customer management', description: 'Sync customer data across systems', icon: '👥' },
    { title: 'Payment webhooks', description: 'Trigger workflows on payment events', icon: '🔗' },
  ],
  openai: [
    { title: 'AI text generation', description: 'Generate content and summaries with GPT', icon: '✨' },
    { title: 'Data classification', description: 'Categorize and tag data automatically', icon: '🏷️' },
    { title: 'Sentiment analysis', description: 'Analyze tone in customer messages', icon: '🎯' },
  ],
  google_sheets: [
    { title: 'Log workflow data', description: 'Save execution results to spreadsheets', icon: '📋' },
    { title: 'Read config data', description: 'Use sheet data to drive workflow logic', icon: '📖' },
    { title: 'Build reports', description: 'Automatically update reporting dashboards', icon: '📈' },
  ],
  notion: [
    { title: 'Create pages', description: 'Document workflow results in Notion', icon: '📝' },
    { title: 'Update databases', description: 'Keep Notion databases in sync', icon: '🗃️' },
    { title: 'Content pipeline', description: 'Route content through review workflows', icon: '🔄' },
  ],
  airtable: [
    { title: 'Log records', description: 'Store structured data in Airtable bases', icon: '📊' },
    { title: 'Read and filter', description: 'Query records to drive workflow decisions', icon: '🔍' },
    { title: 'CRM automation', description: 'Automate lead and contact management', icon: '🤝' },
  ],
};

const DEFAULT_USE_CASES = [
  { title: 'Automate repetitive tasks', description: 'Trigger actions automatically based on conditions', icon: '⚡' },
  { title: 'Connect with workflows', description: 'Use this integration as a workflow step', icon: '🔗' },
  { title: 'Real-time notifications', description: 'Get instant updates from this service', icon: '🔔' },
];

const PROVIDER_COLORS: Record<string, string> = {
  gmail: '#EA4335',
  slack: '#4A154B',
  google_sheets: '#34A853',
  notion: '#000000',
  airtable: '#F82B60',
  github: '#24292E',
  stripe: '#635BFF',
  twilio: '#F22F46',
  openai: '#10a37f',
  webhook: '#6366F1',
};

const AUTH_LABELS: Record<string, { label: string; icon: React.ReactNode }> = {
  oauth2: { label: 'OAuth 2.0', icon: <Shield className="h-4 w-4" /> },
  api_key: { label: 'API Key', icon: <Key className="h-4 w-4" /> },
  basic_auth: { label: 'Basic Auth', icon: <Lock className="h-4 w-4" /> },
  bearer_token: { label: 'Bearer Token', icon: <Key className="h-4 w-4" /> },
  none: { label: 'No Auth Required', icon: <Globe className="h-4 w-4" /> },
};

export default function AppDetailPage() {
  const { provider } = useParams<{ provider: string }>();
  const navigate = useNavigate();

  const [details, setDetails] = useState<IntegrationDetails | null>(null);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);
  const [testing, setTesting] = useState<string | null>(null);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [connectionName, setConnectionName] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'actions' | 'connections'>('overview');

  useEffect(() => {
    if (!provider) return;
    Promise.all([
      api.get(`/integrations/${provider}`).then((r) => setDetails(r.data)),
      api
        .get('/integrations/connections/list')
        .then((r) => {
          const providerConns = (r.data.connections || []).filter((c: any) => c.provider === provider);
          setConnections(providerConns);
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, [provider]);

  const handleConnect = async () => {
    if (!details) return;
    const { authType } = details.metadata;

    if (authType === 'oauth2') {
      setConnecting(true);
      try {
        const res = await api.post(`/integrations/${provider}/connect`, {});
        if (res.data.authUrl) {
          window.location.href = res.data.authUrl;
        }
      } catch {
        toast.error('Failed to start OAuth flow');
        setConnecting(false);
      }
    } else {
      setConnectionName(`${details.metadata.name} Connection`);
      setShowApiKeyModal(true);
    }
  };

  const handleSubmitApiKey = async () => {
    if (!apiKey) { toast.error('API key required'); return; }
    setConnecting(true);
    try {
      const res = await api.post(`/integrations/${provider}/connect`, {
        credentials: { apiKey },
        name: connectionName,
      });
      if (res.data.success) {
        toast.success('Connected successfully!');
        setShowApiKeyModal(false);
        setApiKey('');
        // refresh connections
        const r = await api.get('/integrations/connections/list');
        setConnections((r.data.connections || []).filter((c: any) => c.provider === provider));
      }
    } catch (e: any) {
      toast.error(e?.response?.data?.error || 'Failed to connect');
    } finally {
      setConnecting(false);
    }
  };

  const handleTest = async (connectionId: string) => {
    setTesting(connectionId);
    try {
      const res = await api.post(`/integrations/${provider}/test`, { connectionId });
      if (res.data.success) toast.success('Connection test passed ✓');
      else toast.error('Test failed: ' + (res.data.message || 'Unknown error'));
      const r = await api.get('/integrations/connections/list');
      setConnections((r.data.connections || []).filter((c: any) => c.provider === provider));
    } catch {
      toast.error('Test request failed');
    } finally {
      setTesting(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    if (!confirm('Disconnect this integration? Workflows using it may break.')) return;
    try {
      await api.delete(`/integrations/${provider}/disconnect`, { data: { connectionId } });
      toast.success('Disconnected');
      setConnections((prev) => prev.filter((c) => c.id !== connectionId));
    } catch {
      toast.error('Failed to disconnect');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!details) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen gap-4">
        <p className="text-muted-foreground">Integration not found.</p>
        <Button onClick={() => navigate('/integrations')}>Back to Explorer</Button>
      </div>
    );
  }

  const meta = details.metadata;
  const accentColor = meta.color || PROVIDER_COLORS[meta.provider] || '#6366F1';
  const authInfo = AUTH_LABELS[meta.authType] || AUTH_LABELS['api_key'];
  const useCases = USE_CASES[meta.provider] || DEFAULT_USE_CASES;
  const hasConnections = connections.length > 0;

  const tabs = [
    { id: 'overview', label: 'Overview' },
    { id: 'actions', label: `Actions (${details.actions.length})` },
    { id: 'connections', label: `My Connections (${connections.length})` },
  ] as const;

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <div className="bg-card border-b border-border sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center gap-4">
          <button
            onClick={() => navigate('/integrations')}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>All Apps</span>
          </button>
          <ChevronRight className="h-4 w-4 text-muted-foreground/50" />
          <span className="text-sm font-medium text-foreground">{meta.name}</span>
        </div>
      </div>

      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-6xl mx-auto px-6 py-12">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
            {/* Logo */}
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center text-white text-3xl font-bold shadow-lg flex-shrink-0"
              style={{ backgroundColor: accentColor }}
            >
              {meta.logo ? (
                <img src={meta.logo} alt={meta.name} className="w-full h-full rounded-3xl object-contain" />
              ) : (
                meta.name.charAt(0)
              )}
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-3xl font-extrabold text-foreground">{meta.name}</h1>
                {hasConnections && (
                  <span className="flex items-center gap-1 text-xs font-semibold text-green-600 bg-green-500/10 px-2.5 py-1 rounded-full">
                    <Check className="h-3.5 w-3.5" />
                    Connected
                  </span>
                )}
                {meta.comingSoon && (
                  <span className="text-xs font-semibold text-muted-foreground bg-muted px-2.5 py-1 rounded-full">
                    Coming Soon
                  </span>
                )}
              </div>
              <p className="text-muted-foreground text-base mb-3 max-w-2xl">{meta.description}</p>
              <div className="flex flex-wrap items-center gap-3">
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg capitalize">
                  <span>{meta.category}</span>
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg">
                  {authInfo.icon}
                  {authInfo.label}
                </span>
                <span className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1.5 rounded-lg">
                  <Zap className="h-3.5 w-3.5" />
                  {details.actions.length} Actions
                </span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:items-end gap-2 flex-shrink-0">
              {!meta.comingSoon && meta.enabled && (
                <Button
                  onClick={handleConnect}
                  disabled={connecting}
                  size="lg"
                  className="gap-2 min-w-[160px]"
                >
                  {connecting ? (
                    <RefreshCw className="h-4 w-4 animate-spin" />
                  ) : hasConnections ? (
                    <Plus className="h-4 w-4" />
                  ) : (
                    <Zap className="h-4 w-4" />
                  )}
                  {hasConnections ? 'Add Connection' : 'Connect App'}
                </Button>
              )}
              {meta.docUrl && (
                <a
                  href={meta.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  Documentation
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex gap-0 border-b border-border -mb-px">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-5 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
                  activeTab === tab.id
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Use cases */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-2xl p-6">
                <h2 className="text-lg font-semibold text-foreground mb-5 flex items-center gap-2">
                  <Star className="h-5 w-5 text-amber-400 fill-amber-400" />
                  Popular Use Cases
                </h2>
                <div className="space-y-4">
                  {useCases.map((uc, i) => (
                    <div
                      key={i}
                      className="flex items-start gap-4 p-4 rounded-xl bg-muted/50 hover:bg-muted transition-colors cursor-default"
                    >
                      <div className="text-2xl w-10 h-10 flex items-center justify-center bg-card rounded-xl shadow-sm flex-shrink-0">
                        {uc.icon}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{uc.title}</p>
                        <p className="text-muted-foreground text-xs mt-0.5">{uc.description}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground/50 ml-auto mt-0.5 flex-shrink-0" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Available actions preview */}
              {details.actions.length > 0 && (
                <div className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
                      <Play className="h-5 w-5 text-primary" />
                      Available Actions
                    </h2>
                    <button
                      onClick={() => setActiveTab('actions')}
                      className="text-sm text-primary hover:underline flex items-center gap-1"
                    >
                      View all <ChevronRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <div className="space-y-2">
                    {details.actions.slice(0, 4).map((action) => (
                      <div
                        key={action.id}
                        className="flex items-center gap-3 px-4 py-3 bg-muted/50 rounded-xl"
                      >
                        <div
                          className="w-2 h-2 rounded-full flex-shrink-0"
                          style={{ backgroundColor: accentColor }}
                        />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground">{action.name}</p>
                          <p className="text-xs text-muted-foreground truncate">{action.description}</p>
                        </div>
                        <span className="text-[10px] font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex-shrink-0">
                          {action.parameters.filter((p) => p.required).length} params
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Side panel */}
            <div className="space-y-4">
              {/* Connection status card */}
              <div className="bg-card border border-border rounded-2xl p-5">
                <h3 className="text-sm font-semibold text-foreground mb-4">Connection Status</h3>
                {hasConnections ? (
                  <div className="space-y-3">
                    {connections.map((conn) => (
                      <div key={conn.id} className="flex items-center gap-3">
                        <div
                          className={`w-2.5 h-2.5 rounded-full flex-shrink-0 ${
                            conn.status === 'ACTIVE' ? 'bg-green-500' : conn.status === 'ERROR' ? 'bg-red-500' : 'bg-orange-400'
                          }`}
                        />
                        <span className="text-sm font-medium text-foreground flex-1 truncate">{conn.name}</span>
                        <span
                          className={`text-xs capitalize ${
                            conn.status === 'ACTIVE' ? 'text-green-600' : conn.status === 'ERROR' ? 'text-red-500' : 'text-orange-500'
                          }`}
                        >
                          {conn.status.toLowerCase()}
                        </span>
                      </div>
                    ))}
                    <button
                      onClick={() => setActiveTab('connections')}
                      className="w-full mt-2 text-xs text-primary hover:underline text-center"
                    >
                      Manage connections →
                    </button>
                  </div>
                ) : (
                  <div className="text-center py-4">
                    <div className="text-3xl mb-2">🔌</div>
                    <p className="text-sm text-muted-foreground mb-3">Not connected yet</p>
                    {!meta.comingSoon && meta.enabled && (
                      <Button size="sm" onClick={handleConnect} disabled={connecting} className="w-full gap-1.5">
                        <Zap className="h-3.5 w-3.5" />
                        Connect Now
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Info card */}
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                <h3 className="text-sm font-semibold text-foreground">Details</h3>
                <InfoRow icon={<Shield className="h-4 w-4 text-muted-foreground" />} label="Auth" value={authInfo.label} />
                <InfoRow icon={<Zap className="h-4 w-4 text-muted-foreground" />} label="Actions" value={`${details.actions.length} available`} />
                <InfoRow icon={<Clock className="h-4 w-4 text-muted-foreground" />} label="Triggers" value={`${details.triggers.length} available`} />
                <InfoRow icon={<Globe className="h-4 w-4 text-muted-foreground" />} label="Category" value={<span className="capitalize">{meta.category}</span>} />
              </div>
            </div>
          </div>
        )}

        {/* Actions Tab */}
        {activeTab === 'actions' && (
          <div className="space-y-4">
            {details.actions.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <div className="text-4xl mb-3">⚡</div>
                <p className="text-muted-foreground">No actions available yet</p>
              </div>
            ) : (
              details.actions.map((action) => (
                <div key={action.id} className="bg-card border border-border rounded-2xl p-6">
                  <div className="flex items-start gap-4">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                      style={{ backgroundColor: accentColor }}
                    >
                      <Play className="h-4 w-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-foreground mb-1">{action.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{action.description}</p>

                      {action.parameters.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                            Parameters
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {action.parameters.map((param) => (
                              <span
                                key={param.name}
                                className={`text-xs px-2.5 py-1 rounded-lg font-mono ${
                                  param.required
                                    ? 'bg-primary/10 text-primary'
                                    : 'bg-muted text-muted-foreground'
                                }`}
                              >
                                {param.name}
                                {param.required && <span className="text-red-400 ml-0.5">*</span>}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Connections Tab */}
        {activeTab === 'connections' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-foreground">Your Connections</h2>
              {!meta.comingSoon && meta.enabled && (
                <Button onClick={handleConnect} disabled={connecting} size="sm" className="gap-1.5">
                  <Plus className="h-4 w-4" />
                  Add Connection
                </Button>
              )}
            </div>

            {connections.length === 0 ? (
              <div className="text-center py-16 bg-card border border-border rounded-2xl">
                <div className="text-4xl mb-3">🔌</div>
                <p className="text-lg font-semibold text-foreground mb-2">No connections yet</p>
                <p className="text-muted-foreground text-sm mb-6">
                  Connect {meta.name} to start using it in your workflows
                </p>
                {!meta.comingSoon && meta.enabled && (
                  <Button onClick={handleConnect} disabled={connecting} className="gap-1.5">
                    <Zap className="h-4 w-4" />
                    Connect {meta.name}
                  </Button>
                )}
              </div>
            ) : (
              connections.map((conn) => (
                <div
                  key={conn.id}
                  className="bg-card border border-border rounded-2xl p-5 flex items-center gap-4"
                >
                  <div
                    className="w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
                    style={{ backgroundColor: accentColor }}
                  >
                    {meta.name.charAt(0)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{conn.name}</p>
                    <div className="flex items-center gap-3 mt-1">
                      <span
                        className={`flex items-center gap-1 text-xs font-medium ${
                          conn.status === 'ACTIVE'
                            ? 'text-green-600'
                            : conn.status === 'ERROR'
                            ? 'text-red-500'
                            : 'text-orange-500'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full inline-block ${
                            conn.status === 'ACTIVE' ? 'bg-green-500' : conn.status === 'ERROR' ? 'bg-red-500' : 'bg-orange-400'
                          }`}
                        />
                        {conn.status.charAt(0) + conn.status.slice(1).toLowerCase()}
                      </span>
                      {conn.lastUsed && (
                        <span className="text-xs text-muted-foreground">
                          Last used {new Date(conn.lastUsed).toLocaleDateString()}
                        </span>
                      )}
                      {conn.lastTested && (
                        <span className="text-xs text-muted-foreground">
                          Tested {new Date(conn.lastTested).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(conn.id)}
                      disabled={testing === conn.id}
                      className="gap-1.5"
                    >
                      {testing === conn.id ? (
                        <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Settings className="h-3.5 w-3.5" />
                      )}
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(conn.id)}
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* API Key Modal */}
      {showApiKeyModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => !connecting && setShowApiKeyModal(false)}
        >
          <div
            className="bg-card rounded-2xl shadow-2xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 mb-6">
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-white font-bold"
                style={{ backgroundColor: accentColor }}
              >
                {meta.name.charAt(0)}
              </div>
              <div>
                <h2 className="text-lg font-bold text-foreground">Connect {meta.name}</h2>
                <p className="text-sm text-muted-foreground">Enter your API credentials below</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  Connection Name
                </label>
                <Input
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="My Connection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-1.5">
                  API Key <span className="text-red-400">*</span>
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                  autoFocus
                />
              </div>
              {meta.docUrl && (
                <a
                  href={meta.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-sm text-primary hover:underline"
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                  How to get your {meta.name} API key
                </a>
              )}
            </div>

            <div className="flex gap-3 mt-6">
              <Button
                variant="outline"
                onClick={() => setShowApiKeyModal(false)}
                disabled={connecting}
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleSubmitApiKey}
                disabled={!apiKey || connecting}
                className="flex-1 gap-1.5"
              >
                {connecting ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                {connecting ? 'Connecting...' : 'Connect'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-2.5">
      {icon}
      <span className="text-xs text-muted-foreground w-16">{label}</span>
      <span className="text-xs font-medium text-foreground">{value}</span>
    </div>
  );
}
