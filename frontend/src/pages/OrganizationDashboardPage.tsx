import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  subValue?: string;
  badge?: string;
  color?: string;
  linkIcon?: boolean;
}

function StatCard({ icon, label, value, subValue, badge, color = 'bg-purple-100', linkIcon }: StatCardProps) {
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className={`${color} rounded-xl p-3 flex items-center justify-center`}>
            {icon}
          </div>
          {linkIcon && (
            <ExternalLink className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-600" />
          )}
        </div>
        <div className="space-y-1">
          <p className="text-sm text-gray-500">{label}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-3xl font-bold text-gray-900">{value}</p>
            {subValue && <span className="text-sm text-gray-400">{subValue}</span>}
            {badge && (
              <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full">
                {badge}
              </span>
            )}
          </div>
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

interface SuggestedApp {
  name: string;
  color: string;
  icon?: string;
}

interface TrendingAgent {
  name: string;
  apps: { name: string; color: string; icon?: string }[];
  count?: number;
}

const SUGGESTED_APPS: SuggestedApp[] = [
  { name: 'Make AI Agents', color: '#6B46C1', icon: '🤖' },
  { name: 'Make AI Tools', color: '#8B5CF6', icon: '🛠️' },
  { name: 'OpenAI', color: '#10A37F', icon: '✨' },
  { name: 'Google Sheets', color: '#34A853', icon: '📊' },
  { name: 'Slack', color: '#4A154B', icon: '💬' },
  { name: 'Gmail', color: '#EA4335', icon: '📧' },
  { name: 'Notion', color: '#000000', icon: '📝' },
  { name: 'Airtable', color: '#F82B60', icon: '🗃️' },
];

const TRENDING_AGENTS: TrendingAgent[] = [
  {
    name: 'Sales Outreach Agent',
    apps: [
      { name: 'Gmail', color: '#EA4335', icon: '📧' },
      { name: 'Make AI', color: '#6B46C1', icon: '🤖' },
      { name: 'Google Sheets', color: '#34A853', icon: '📊' },
    ],
    count: 2,
  },
  {
    name: 'Social Media Comment Responder',
    apps: [
      { name: 'Twitter', color: '#1DA1F2', icon: '🐦' },
      { name: 'Facebook', color: '#1877F2', icon: '👥' },
      { name: 'Make AI', color: '#8B5CF6', icon: '🤖' },
    ],
    count: 1,
  },
  {
    name: 'Inventory and Order Management Agent',
    apps: [
      { name: 'Shopify', color: '#96BF48', icon: '🛍️' },
      { name: 'Make AI', color: '#6B46C1', icon: '🤖' },
      { name: 'Google Sheets', color: '#34A853', icon: '📊' },
    ],
  },
  {
    name: 'Market Research Analyst',
    apps: [
      { name: 'LinkedIn', color: '#0A66C2', icon: '💼' },
      { name: 'Make AI', color: '#8B5CF6', icon: '🤖' },
      { name: 'Twitter', color: '#1DA1F2', icon: '🐦' },
    ],
    count: 2,
  },
];

export default function OrganizationDashboardPage() {
  const [stats] = useState({
    averageDailyUsage: 0,
    percentageUsage: 0,
    creditsLeft: 1000,
    totalCredits: 1000,
    resetDate: '3/18/26, 2:07 AM',
    resetDays: 28,
    activeScenarios: 0,
    totalScenarios: 2,
  });

  useEffect(() => {
    // Fetch organization stats here
    // For now using mock data
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-sm text-gray-500 mb-2">
            <span className="text-purple-600 font-medium">Organization</span>
          </div>
          <div className="flex items-center justify-between">
            <h1 className="text-3xl font-bold text-gray-900">My Organization</h1>
            <Button variant="outline" size="sm" className="gap-2">
              <Settings className="h-4 w-4" />
              Organization settings
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Zap className="h-6 w-6 text-purple-600" />}
            label="Average daily usage"
            value={stats.averageDailyUsage}
            badge={`${stats.percentageUsage}%`}
            color="bg-purple-100"
            linkIcon
          />
          <StatCard
            icon={<Sparkles className="h-6 w-6 text-purple-600" />}
            label="Credits left"
            value={stats.creditsLeft.toLocaleString()}
            subValue={`/ ${stats.totalCredits.toLocaleString()}`}
            color="bg-purple-100"
            linkIcon
          />
          <StatCard
            icon={<Calendar className="h-6 w-6 text-purple-600" />}
            label="Usage reset in"
            value={`${stats.resetDays} days`}
            subValue={stats.resetDate}
            color="bg-purple-100"
          />
          <StatCard
            icon={<Play className="h-6 w-6 text-purple-600" />}
            label="Active scenarios"
            value={stats.activeScenarios}
            subValue={`/ ${stats.totalScenarios}`}
            color="bg-purple-100"
          />
        </div>

        {/* Webinar Promotion Banner */}
        <Card className="mb-8 bg-gradient-to-r from-purple-50 to-pink-50 border-purple-200 overflow-hidden">
          <CardContent className="p-6">
            <div className="flex items-center gap-6">
              {/* Illustration placeholder */}
              <div className="hidden md:block flex-shrink-0">
                <div className="w-48 h-32 bg-gradient-to-br from-purple-400 to-pink-400 rounded-2xl flex items-center justify-center">
                  <div className="text-white text-5xl">🚀</div>
                </div>
              </div>
              {/* Content */}
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900 mb-2">
                  Go from zero to your first automation in 45 mins
                </h3>
                <p className="text-gray-600 text-sm mb-4">
                  Join our live webinar and learn to connect apps, map data, integrate AI, and master
                  filters live. Includes a Q&amp;A session to answer your questions.
                </p>
                <Button className="gap-2 bg-purple-600 hover:bg-purple-700">
                  Save my spot
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Suggested Apps */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 mb-1">Suggested apps</h2>
              <p className="text-sm text-gray-500">Choose an app to explore more resources and start automating!</p>
            </div>
            <Link
              to="/integrations"
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              More resources
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-4">
            {SUGGESTED_APPS.map((app) => (
              <Link
                key={app.name}
                to={`/integrations/${app.name.toLowerCase().replace(/\s+/g, '-')}`}
                className="group bg-white border border-gray-200 rounded-xl p-4 flex flex-col items-center gap-3 hover:shadow-md hover:border-purple-300 transition-all cursor-pointer"
              >
                <AppIcon name={app.name} icon={app.icon} color={app.color} size="md" />
                <span className="text-xs font-medium text-center text-gray-700 group-hover:text-purple-600">
                  {app.name}
                </span>
              </Link>
            ))}
          </div>
        </div>

        {/* Trending Agents */}
        <div>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              <h2 className="text-xl font-bold text-gray-900">Trending Agents</h2>
            </div>
            <Link
              to="/agents"
              className="flex items-center gap-1 text-sm font-medium text-purple-600 hover:text-purple-700 hover:underline"
            >
              Explore library of agents
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {TRENDING_AGENTS.map((agent, idx) => (
              <Card
                key={idx}
                className="group hover:shadow-lg hover:border-purple-300 transition-all cursor-pointer"
              >
                <CardContent className="p-5">
                  {/* App Icons */}
                  <div className="flex items-center justify-center mb-4 relative h-12">
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
                    {agent.count && (
                      <div className="ml-2 w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                        +{agent.count}
                      </div>
                    )}
                  </div>
                  {/* Agent Name */}
                  <h3 className="text-sm font-semibold text-gray-800 text-center group-hover:text-purple-600 transition-colors">
                    {agent.name}
                  </h3>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Info Footer */}
        <div className="mt-12 flex items-start gap-3 p-4 bg-blue-50 border border-blue-200 rounded-xl">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-700">
            <p className="font-medium mb-1">Need help getting started?</p>
            <p className="text-gray-600">
              Check out our{' '}
              <a href="#" className="text-purple-600 hover:underline font-medium">
                documentation
              </a>{' '}
              and{' '}
              <a href="#" className="text-purple-600 hover:underline font-medium">
                video tutorials
              </a>{' '}
              to learn more about building workflows and connecting apps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
