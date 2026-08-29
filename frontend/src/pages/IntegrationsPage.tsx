import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { api } from '../lib/api';
import toast from 'react-hot-toast';
import { Search, Check, Plus, Settings, Trash2, ExternalLink } from 'lucide-react';
import { APP_INTEGRATIONS, INTEGRATION_CATEGORIES } from '../lib/integrations';

interface Integration {
  provider: string;
  name: string;
  description: string;
  category: string;
  authType: string;
  logo?: string;
  color?: string;
  icon?: string;
  docUrl?: string;
  enabled: boolean;
  comingSoon?: boolean;
}

interface Connection {
  id: string;
  name: string;
  provider: string;
  status: 'ACTIVE' | 'EXPIRED' | 'ERROR' | 'DISCONNECTED';
  needsReconnect?: boolean;
  lastUsed?: string;
  lastTested?: string;
  integration: {
    name: string;
    logo?: string;
    color?: string;
  };
}

export default function IntegrationsPage() {
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showConnectModal, setShowConnectModal] = useState<Integration | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [connectionName, setConnectionName] = useState('');

  useEffect(() => {
    fetchIntegrations();
    fetchConnections();
  }, []);

  const fetchIntegrations = async () => {
    try {
      // Use central data as base, merge with any extra API-only integrations
      const response = await api.get('/integrations');
      const apiIntegrations = response.data.integrations || [];
      const centralProviders = new Set(APP_INTEGRATIONS.map((a) => a.provider));
      const extras: Integration[] = apiIntegrations.filter(
        (i: Integration) => !centralProviders.has(i.provider)
      );
      // Central data takes precedence for display
      const merged: Integration[] = APP_INTEGRATIONS.map((app) => ({
        provider: app.provider,
        name: app.name,
        description: app.description,
        category: app.category,
        authType: app.authType,
        logo: app.logo,
        color: app.color,
        icon: app.icon,
        docUrl: app.docUrl,
        enabled: app.enabled,
        comingSoon: app.comingSoon,
      }));
      setIntegrations([...merged, ...extras]);
    } catch (error) {
      console.error('Failed to fetch integrations:', error);
      // Fallback to central data only
      setIntegrations(
        APP_INTEGRATIONS.map((app) => ({
          provider: app.provider,
          name: app.name,
          description: app.description,
          category: app.category,
          authType: app.authType,
          logo: app.logo,
          color: app.color,
          icon: app.icon,
          docUrl: app.docUrl,
          enabled: app.enabled,
          comingSoon: app.comingSoon,
        }))
      );
    } finally {
      setLoading(false);
    }
  };

  const fetchConnections = async () => {
    try {
      const response = await api.get('/integrations/connections/list');
      setConnections(response.data.connections || []);
    } catch (error) {
      console.error('Failed to fetch connections:', error);
    }
  };

  const handleConnect = async (integration: Integration) => {
    if (integration.authType === 'oauth2') {
      // Initiate OAuth2 flow
      try {
        const response = await api.post(`/integrations/${integration.provider}/connect`, {});
        if (response.data.authUrl) {
          window.location.href = response.data.authUrl;
        }
      } catch (error) {
        toast.error('Failed to start OAuth flow');
      }
    } else {
      // Show API key modal
      setShowConnectModal(integration);
      setConnectionName(`${integration.name} Connection`);
    }
  };

  const handleSubmitApiKey = async () => {
    if (!showConnectModal || !apiKey) {
      toast.error('API key required');
      return;
    }

    try {
      const response = await api.post(`/integrations/${showConnectModal.provider}/connect`, {
        credentials: {
          apiKey,
        },
        name: connectionName,
      });

      if (response.data.success) {
        toast.success('Integration connected successfully!');
        setShowConnectModal(null);
        setApiKey('');
        setConnectionName('');
        fetchConnections();
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to connect');
    }
  };

  const handleDisconnect = async (connectionId: string, provider: string) => {
    if (!confirm('Are you sure you want to disconnect this integration?')) {
      return;
    }

    try {
      await api.delete(`/integrations/${provider}/disconnect`, { connectionId });
      toast.success('Integration disconnected');
      fetchConnections();
    } catch (error) {
      toast.error('Failed to disconnect');
    }
  };

  const handleTest = async (connectionId: string, provider: string) => {
    try {
      const response = await api.post(`/integrations/${provider}/test`, { connectionId });
      if (response.data.success) {
        toast.success('Connection test successful!');
      } else {
        toast.error('Connection test failed');
      }
      fetchConnections();
    } catch (error) {
      toast.error('Connection test failed');
    }
  };

  const isConnected = (provider: string) => {
    return connections.some((c) => c.provider === provider && c.status === 'ACTIVE');
  };

  const categories = ['all', ...INTEGRATION_CATEGORIES.map((c) => c.label)];

  const filteredIntegrations = integrations.filter((integration) => {
    const matchesSearch =
      integration.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      integration.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || integration.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">App Integrations</h1>
        <p className="text-muted-foreground">Connect your favorite apps and services to Silo</p>
      </div>

      {/* Search and Filters */}
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
          <Input
            placeholder="Search integrations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {categories.map((category) => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                selectedCategory === category
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground'
              }`}
            >
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Active Connections */}
      {connections.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Your Connections</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-accent/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    {connection.integration.logo ? (
                      <img src={connection.integration.logo} alt="" className="w-10 h-10 rounded" />
                    ) : (
                      <div
                        className="w-10 h-10 rounded flex items-center justify-center text-white font-bold"
                        style={{ backgroundColor: connection.integration.color || '#3B82F6' }}
                      >
                        {connection.integration.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <div className="font-medium text-foreground">{connection.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {connection.status === 'ACTIVE' && (
                          <span className="text-green-600">● Connected</span>
                        )}
                        {connection.status === 'ERROR' && (
                          <span className="text-red-600">● Error</span>
                        )}
                        {connection.status === 'EXPIRED' && (
                          <span className="text-orange-600">● Expired</span>
                        )}
                        {connection.needsReconnect && connection.status === 'ACTIVE' && (
                          <span className="text-orange-600">● Reconnect</span>
                        )}
                        {connection.lastUsed && <span className="ml-2">Last used: {new Date(connection.lastUsed).toLocaleDateString()}</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleTest(connection.id, connection.provider)}
                    >
                      <Settings className="h-4 w-4 mr-1" />
                      Test
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDisconnect(connection.id, connection.provider)}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Integration Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredIntegrations.map((integration) => {
          const connected = isConnected(integration.provider);
          return (
            <Card key={integration.provider} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {(integration as any).icon ? (
                      <div
                        className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl shadow-sm"
                        style={{ backgroundColor: (integration.color || '#3B82F6') + '15' }}
                      >
                        {(integration as any).icon}
                      </div>
                    ) : integration.logo ? (
                      <img src={integration.logo} alt="" className="w-12 h-12 rounded" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded flex items-center justify-center text-white font-bold text-lg"
                        style={{ backgroundColor: integration.color || '#3B82F6' }}
                      >
                        {integration.name.charAt(0)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-semibold text-foreground">{integration.name}</h3>
                      <span className="text-xs text-muted-foreground">{integration.category}</span>
                    </div>
                  </div>
                  {connected && (
                    <div className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium flex items-center gap-1">
                      <Check className="h-3 w-3" />
                      Connected
                    </div>
                  )}
                  {integration.comingSoon && (
                    <div className="bg-muted text-muted-foreground px-2 py-1 rounded text-xs font-medium">
                      Coming Soon
                    </div>
                  )}
                </div>

                <p className="text-sm text-muted-foreground mb-4 h-10 line-clamp-2">
                  {integration.description}
                </p>

                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1"
                    onClick={() => handleConnect(integration)}
                    disabled={!integration.enabled || integration.comingSoon || connected}
                  >
                    {connected ? (
                      <>
                        <Check className="h-4 w-4 mr-1" />
                        Connected
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-1" />
                        Connect
                      </>
                    )}
                  </Button>
                  {integration.docUrl && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => window.open(integration.docUrl, '_blank')}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* API Key Modal */}
      {showConnectModal && (
        <div
          className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
          onClick={() => setShowConnectModal(null)}
        >
          <div
            className="bg-card rounded-lg shadow-xl max-w-md w-full p-6"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-foreground mb-4">Connect {showConnectModal.name}</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  Connection Name
                </label>
                <Input
                  value={connectionName}
                  onChange={(e) => setConnectionName(e.target.value)}
                  placeholder="My Connection"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-muted-foreground mb-2">
                  API Key
                </label>
                <Input
                  type="password"
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="Enter your API key"
                />
              </div>
              {showConnectModal.docUrl && (
                <a
                  href={showConnectModal.docUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-primary hover:underline flex items-center gap-1"
                >
                  <ExternalLink className="h-3 w-3" />
                  How to get your API key
                </a>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowConnectModal(null)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleSubmitApiKey} className="flex-1" disabled={!apiKey}>
                Connect
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
