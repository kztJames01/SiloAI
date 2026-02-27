import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Check, Star, Zap, ArrowRight, Grid3x3, List } from 'lucide-react';
import { api } from '../lib/api';

interface Integration {
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
}

// Map provider to a tailwind/hex color for gradient logo avatars
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
  dropbox: '#0061FE',
  trello: '#0052CC',
  sendgrid: '#1A82E2',
  hubspot: '#FF5C35',
  zoom: '#2D8CFF',
};

const CATEGORY_ICONS: Record<string, string> = {
  communication: '💬',
  productivity: '⚡',
  storage: '🗂️',
  development: '🛠️',
  payments: '💳',
  marketing: '📣',
  ai: '🤖',
  custom: '🔧',
};

const FEATURED = ['gmail', 'slack', 'github', 'stripe', 'openai', 'google_sheets', 'notion', 'airtable'];

export default function AppExplorerPage() {
  const navigate = useNavigate();
  const [integrations, setIntegrations] = useState<Integration[]>([]);
  const [connections, setConnections] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/integrations').then((r) => setIntegrations(r.data.integrations || [])),
      api
        .get('/integrations/connections/list')
        .then((r) => {
          const active = (r.data.connections || [])
            .filter((c: any) => c.status === 'ACTIVE')
            .map((c: any) => c.provider as string);
          setConnections(new Set(active));
        })
        .catch(() => {}),
    ]).finally(() => setLoading(false));
  }, []);

  const categories = useMemo(
    () => ['all', ...Array.from(new Set(integrations.map((i) => i.category)))],
    [integrations]
  );

  const featured = integrations.filter((i) => FEATURED.includes(i.provider));

  const filtered = integrations.filter((i) => {
    const q = searchQuery.toLowerCase();
    const matchSearch =
      !q || i.name.toLowerCase().includes(q) || i.description?.toLowerCase().includes(q);
    const matchCat = selectedCategory === 'all' || i.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const IntegrationLogo = ({
    integration,
    size = 'md',
  }: {
    integration: Integration;
    size?: 'sm' | 'md' | 'lg' | 'xl';
  }) => {
    const dims = { sm: 'w-8 h-8 text-sm', md: 'w-12 h-12 text-lg', lg: 'w-16 h-16 text-2xl', xl: 'w-20 h-20 text-3xl' };
    const bg = integration.color || PROVIDER_COLORS[integration.provider] || '#6366F1';
    if (integration.logo) {
      return (
        <img
          src={integration.logo}
          alt={integration.name}
          className={`${dims[size]} rounded-2xl object-contain`}
        />
      );
    }
    return (
      <div
        className={`${dims[size]} rounded-2xl flex items-center justify-center text-white font-bold shadow-sm flex-shrink-0`}
        style={{ backgroundColor: bg }}
      >
        {integration.name.charAt(0)}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin h-10 w-10 rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted-foreground text-sm">Loading integrations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-card border-b border-border">
        <div className="max-w-7xl mx-auto px-6 py-14 text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-semibold px-3 py-1 rounded-full mb-4">
            <Zap className="h-3.5 w-3.5" />
            {integrations.length} Apps Available
          </div>
          <h1 className="text-5xl font-extrabold text-foreground tracking-tight mb-4">
            App Integrations
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Save time and resources by connecting all your favorite apps on Silo with just a few
            clicks.
          </p>
          {/* Search */}
          <div className="max-w-2xl mx-auto relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />
            <input
              type="text"
              placeholder="Search apps..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-12 pr-4 py-4 text-base rounded-2xl border border-border shadow-sm bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all"
            />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 flex gap-8">
        {/* Sidebar */}
        <aside className="hidden lg:flex flex-col gap-1 w-56 flex-shrink-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-3">
            Browse by Category
          </p>
          {categories.map((cat) => {
            const active = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                  active ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                }`}
              >
                {cat !== 'all' && (
                  <span className="text-base">{CATEGORY_ICONS[cat] || '📦'}</span>
                )}
                <span className="capitalize">{cat}</span>
                {active && (
                  <span className="ml-auto bg-white/20 text-white text-xs px-1.5 py-0.5 rounded-md">
                    {filtered.length}
                  </span>
                )}
              </button>
            );
          })}
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Featured — only when no search/filter applied */}
          {!searchQuery && selectedCategory === 'all' && featured.length > 0 && (
            <section className="mb-10">
              <div className="flex items-center gap-2 mb-4">
                <Star className="h-4.5 w-4.5 text-amber-400 fill-amber-400" />
                <h2 className="text-lg font-semibold text-foreground">Featured Apps</h2>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {featured.map((integration) => {
                  const connected = connections.has(integration.provider);
                  return (
                    <button
                      key={integration.provider}
                      onClick={() => navigate(`/integrations/${integration.provider}`)}
                      className="group bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all text-center relative"
                    >
                      {connected && (
                        <span className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                          <Check className="h-3 w-3 text-white" />
                        </span>
                      )}
                      <IntegrationLogo integration={integration} size="lg" />
                      <span className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                        {integration.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>
          )}

          {/* All Apps header */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedCategory === 'all'
                  ? 'All Apps'
                  : <span className="capitalize">{selectedCategory}</span>}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Showing {filtered.length} of {integrations.length} apps
              </p>
            </div>
            <div className="flex items-center gap-1 bg-muted rounded-lg p-1">
              <button
                onClick={() => setViewMode('grid')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <Grid3x3 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setViewMode('list')}
                className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground hover:text-foreground'}`}
              >
                <List className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Mobile category pills */}
          <div className="flex lg:hidden gap-2 overflow-x-auto pb-3 mb-4 -mx-1 px-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap flex-shrink-0 transition-colors ${
                  selectedCategory === cat
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card border border-border text-muted-foreground hover:bg-accent'
                }`}
              >
                {cat !== 'all' && CATEGORY_ICONS[cat] ? `${CATEGORY_ICONS[cat]} ` : ''}
                <span className="capitalize">{cat}</span>
              </button>
            ))}
          </div>

          {/* Grid / List view */}
          {filtered.length === 0 ? (
            <div className="text-center py-20 bg-card border border-border rounded-2xl">
              <div className="text-5xl mb-4">🔍</div>
              <h3 className="text-lg font-semibold text-foreground mb-2">No apps found</h3>
              <p className="text-muted-foreground text-sm">Try a different search term or category</p>
            </div>
          ) : viewMode === 'grid' ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4">
              {filtered.map((integration) => {
                const connected = connections.has(integration.provider);
                return (
                  <button
                    key={integration.provider}
                    onClick={() => navigate(`/integrations/${integration.provider}`)}
                    className="group bg-card border border-border rounded-2xl p-5 flex flex-col items-center gap-3 hover:shadow-md hover:border-primary/30 transition-all text-center relative w-full"
                  >
                    {connected && (
                      <span className="absolute top-3 right-3 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                        <Check className="h-3 w-3 text-white" />
                      </span>
                    )}
                    {integration.comingSoon && (
                      <span className="absolute top-3 left-3 bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                        Soon
                      </span>
                    )}
                    <IntegrationLogo integration={integration} size="md" />
                    <div className="w-full">
                      <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors text-center">
                        {integration.name}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2 text-center">
                        {integration.description}
                      </p>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {filtered.map((integration) => {
                const connected = connections.has(integration.provider);
                return (
                  <button
                    key={integration.provider}
                    onClick={() => navigate(`/integrations/${integration.provider}`)}
                    className="group bg-card border border-border rounded-xl px-5 py-4 flex items-center gap-4 hover:shadow-md hover:border-primary/30 transition-all text-left w-full"
                  >
                    <IntegrationLogo integration={integration} size="sm" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {integration.name}
                        </p>
                        {integration.comingSoon && (
                          <span className="bg-muted text-muted-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-full">
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate mt-0.5">
                        {integration.description}
                      </p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <span className="text-xs text-muted-foreground capitalize hidden sm:block">
                        {integration.category}
                      </span>
                      {connected ? (
                        <span className="flex items-center gap-1 text-xs font-medium text-green-600 bg-green-500/10 px-2 py-1 rounded-full">
                          <Check className="h-3 w-3" /> Connected
                        </span>
                      ) : (
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                          View
                        </span>
                      )}
                      <ArrowRight className="h-4 w-4 text-muted-foreground/50 group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
