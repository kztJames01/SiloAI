import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { executionApi, workflowApi } from '../lib/api';
import {
  Zap,
  Calendar,
  Play,
  ExternalLink,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Info,
  Settings,
} from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card, CardContent } from '../components/ui/Card';
import { POPULAR_INTEGRATIONS, getIntegration } from '../lib/integrations';

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  color?: string;
  linkIcon?: boolean;
}

function StatCard({ icon, label, value, subValue, badge, color = 'bg-primary/10', linkIcon }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`${color} rounded-xl p-3 flex items-center justify-center`}>
            {icon}
          </div>
          {linkIcon && (
            <ExternalLink className="h-4 w-4 text-muted-foreground cursor-pointer hover:text-foreground" />
          )}
        </div>
        <div className="text-sm text-muted-foreground">
            <p className="text-xl font-bold text-foreground">{value}</p>
            <p className="text-sm text-muted-foreground mt-0.5">{label}</p>
            {subValue && <span className="text-sm text-muted-foreground">{subValue}</span>}
            {badge && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
      </CardContent>
    </Card>
  );
}

interface AppIconProps {
  name: string;
  icon?: string;
  color: string;
  size?: 'sm' | 'md' | 'lg';
}

function AppIcon({ name, icon, color, size = 'md' }: AppIconProps) {
  const sizes = {
    sm: 'w-8 h-8 text-sm',
    md: 'w-12 h-12 text-base',
    lg: 'w-16 h-16 text-xl',
  };

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center text-white font-bold shadow-md`}
      style={{ backgroundColor: color }}
    >
      {icon || name.charAt(0)}
    </div>
  );
}

interface TrendingAgent {
  name: string;
  apps: { name: string; color: string; icon?: string }[];
  count?: number;
}

const SUGGESTED_APPS = POPULAR_INTEGRATIONS.slice(0, 8).map((app) => ({
  name: app.name,
  color: app.color,
  icon: app.icon,
  provider: app.provider,
}));

function resolveApps(providers: string[]): { name: string; color: string; icon: string }[] {
  return providers.map((p) => {
    const app = getIntegration(p);
    return app
      ? { name: app.name, color: app.color, icon: app.icon }
      : { name: p, color: '#6B7280', icon: '🔌' };
  });
}

const TRENDING_AGENTS: TrendingAgent[] = [
  {
    name: 'Sales Outreach Agent',
    apps: resolveApps(['gmail', 'chatgpt', 'google_sheets']),
  },
  {
    name: 'Social Media Comment Responder',
    apps: resolveApps(['facebook_ads', 'slack', 'chatgpt']),
  },
  {
    name: 'Inventory and Order Management Agent',
    apps: resolveApps(['stripe', 'chatgpt', 'google_sheets']),
  },
  {
    name: 'Market Research Analyst',
    apps: resolveApps(['hubspot', 'chatgpt', 'notion']),
  },
];

export default function OrganizationDashboardPage() {
  const { data: workflows = [] } = useQuery({
    queryKey: ['org-workflows'],
    queryFn: async () => {
      const res = await workflowApi.list();
      return res.data.workflows || [];
    },
  });

  const { data: executions = [] } = useQuery({
    queryKey: ['org-executions'],
    queryFn: async () => {
      const res = await executionApi.list();
      return res.data.executions || [];
    },
  });

  const activeWorkflows = workflows.filter((w: any) => w.isActive).length;
  const totalWorkflows = workflows.length;

  const weekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
  const recentRuns = executions.filter((e: any) => new Date(e.startedAt).getTime() >= weekAgo);
  const averageDailyUsage = Math.round(recentRuns.length / 7);
  const successRuns = recentRuns.filter((e: any) => e.status === 'SUCCESS').length;
  const failedRuns = recentRuns.filter((e: any) => e.status === 'FAILED').length;

  const stats = {
    runsThisWeek: recentRuns.length,
    successRate: recentRuns.length ? Math.round((successRuns / recentRuns.length) * 100) : 0,
    failedRuns,
    averageDailyUsage,
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        <Card className="border-primary/25 bg-gradient-to-br from-primary/10 via-card to-card">
          <CardContent className="p-6 md:p-7">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-5">
              <div>
                <p className="text-xs uppercase tracking-widest text-primary font-bold mb-2">Organization Command Center</p>
                <h1 className="text-3xl font-bold text-foreground">My Organization</h1>
                <p className="text-sm text-muted-foreground mt-1">Monitor usage, discover apps, and launch agent playbooks.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                </Button>
                <Link to="/workflows">
                  <Button size="sm" className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                    Open workflows
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6">
          <div className="xl:col-span-8 space-y-6">
            <Card>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-foreground">Usage Pulse</h2>
                  <span className="text-xs text-muted-foreground">Live summary</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <StatCard
                    icon={<Zap className="h-6 w-6 text-primary" />}
                    label="Average daily usage"
                    value={averageDailyUsage}
                    badge={`${executions.length} total runs`}
                    color="bg-primary/10"
                    linkIcon
                  />
                  <StatCard
                    icon={<Sparkles className="h-6 w-6 text-primary" />}
                    label="Runs this week"
                    value={stats.runsThisWeek}
                    subValue={`${stats.successRate}% success`}
                    color="bg-primary/10"
                    linkIcon
                  />
                  <StatCard
                    icon={<Calendar className="h-6 w-6 text-primary" />}
                    label="Failed runs (7d)"
                    value={stats.failedRuns}
                    subValue="from your account"
                    color="bg-primary/10"
                  />
                  <StatCard
                    icon={<Play className="h-6 w-6 text-primary" />}
                    label="Active Workflows"
                    value={activeWorkflows}
                    subValue={`/ ${totalWorkflows}`}
                    color="bg-primary/10"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Suggested apps</h2>
                    <p className="text-sm text-muted-foreground">Pick an app and jump straight into templates.</p>
                  </div>
                  <Link
                    to="/integrations"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    Browse all
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-4">
                  {SUGGESTED_APPS.map((app) => (
                    <Link
                      key={app.name}
                      to={`/integrations/${(app as any).provider || app.name.toLowerCase().replace(/\s+/g, '-')}`}
                      className="group bg-card border border-border rounded-xl p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-primary/40 transition-all cursor-pointer"
                    >
                      <AppIcon name={app.name} icon={app.icon} color={app.color} size="md" />
                      <span className="text-xs font-medium text-center text-muted-foreground group-hover:text-primary">
                        {app.name}
                      </span>
                    </Link>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-5 md:p-6">
                <div className="flex items-center justify-between mb-5">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">Trending Agents</h2>
                  </div>
                  <Link
                    to="/agents"
                    className="flex items-center gap-1 text-sm font-medium text-primary hover:text-primary/80 hover:underline"
                  >
                    Agent library
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {TRENDING_AGENTS.map((agent, idx) => (
                    <Card
                      key={idx}
                      className="group hover:shadow-lg hover:border-primary/30 transition-all cursor-pointer"
                    >
                      <CardContent className="p-4">
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center relative h-10">
                            {agent.apps.map((app, appIdx) => (
                              <div
                                key={appIdx}
                                className="relative"
                                style={{
                                  marginLeft: appIdx > 0 ? '-8px' : '0',
                                  zIndex: agent.apps.length - appIdx,
                                }}
                              >
                                <AppIcon name={app.name} icon={app.icon} color={app.color} size="sm" />
                              </div>
                            ))}
                          </div>
                          <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                        <h3 className="mt-3 text-sm font-semibold text-foreground group-hover:text-primary transition-colors">
                          {agent.name}
                        </h3>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="xl:col-span-4 space-y-6">
            <Card className="bg-gradient-to-b from-primary/15 to-card border-primary/25 overflow-hidden">
              <CardContent className="p-5">
                <div className="w-full h-28 mb-4 rounded-xl bg-gradient-to-br from-primary/70 to-secondary/60 flex items-center justify-center">
                  <div className="text-4xl">⚡</div>
                </div>
                <h3 className="text-lg font-bold text-foreground mb-2">
                  45-minute onboarding sprint
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Learn app connections, mappings, and filters in one guided live session.
                </p>
                <Button className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  Save my spot
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </CardContent>
            </Card>

            <div className="flex items-start gap-3 p-4 bg-info/10 border border-info/20 rounded-xl">
              <Info className="h-5 w-5 text-info flex-shrink-0 mt-0.5" />
              <div className="text-sm text-foreground">
                <p className="font-medium mb-1">Need help getting started?</p>
                <p className="text-muted-foreground">
                  Check out our{' '}
                  <a href="#" className="text-primary hover:underline font-medium">
                    documentation
                  </a>{' '}
                  and{' '}
                  <a href="#" className="text-primary hover:underline font-medium">
                    video tutorials
                  </a>{' '}
                  to build workflows faster.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
