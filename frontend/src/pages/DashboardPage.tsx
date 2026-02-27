import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { workflowApi, integrationApi } from '../lib/api';
import { Button } from '../components/ui/Button';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Plus, Play, Clock, CheckCircle2, XCircle, LayoutGrid, Sparkles, Zap, Globe } from 'lucide-react';
import { formatDate } from '../lib/utils';

const templates = [
  {
    id: 'healthcare-intake',
    category: 'Healthcare',
    title: 'Patient Intake Follow-up',
    description: 'When a patient form arrives, notify care staff and wait for approval.',
    icon: '🏥',
  },
  {
    id: 'field-hazard',
    category: 'Field Service',
    title: 'Hazard Report Escalation',
    description: 'Capture hazard details, notify supervisor, and request confirmation.',
    icon: '⚠️',
  },
  {
    id: 'invoice-approval',
    category: 'Invoicing',
    title: 'Invoice Approval',
    description: 'Read invoice totals, send for review, and post approved records.',
    icon: '📄',
  },
];

export default function DashboardPage() {
  const navigate = useNavigate();
  const [aiPrompt, setAiPrompt] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowApi.list();
      return response.data.workflows;
    },
  });

  const { data: integrationsData } = useQuery({
    queryKey: ['integrations'],
    queryFn: async () => {
      const response = await integrationApi.list();
      return response.data.integrations;
    },
  });

  const handleAiPromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (aiPrompt.trim()) {
      navigate(`/workflows/new?prompt=${encodeURIComponent(aiPrompt)}`);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const workflows = data || [];
  const integrations = integrationsData || [];

  return (
    <div className="min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="max-w-6xl mx-auto px-6 py-8 space-y-12">
          {/* Hero Section with AI Prompt */}
          <section className="text-center space-y-6">
            <div>
              <h1 className="text-4xl font-bold text-foreground mb-2">What would you like to automate?</h1>
              <p className="text-muted-foreground">Describe your workflow in plain English</p>
            </div>
            
            <form onSubmit={handleAiPromptSubmit} className="max-w-2xl mx-auto">
              <div className="relative">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded">AI beta</span>
                </div>
                <input
                  type="text"
                  value={aiPrompt}
                  onChange={(e) => setAiPrompt(e.target.value)}
                  placeholder="Enter an idea or app name to get started"
                  className="w-full pl-32 pr-24 py-4 text-base border border-border rounded-lg bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
                <button
                  type="submit"
                  disabled={!aiPrompt.trim()}
                  className="absolute right-3 top-1/2 -translate-y-1/2 px-4 py-2 bg-primary text-white rounded-md text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Start building
                </button>
              </div>
            </form>

            <div className="flex items-center justify-center gap-4 text-sm">
              <a href="#template-gallery" className="text-primary hover:underline flex items-center gap-1">
                <LayoutGrid className="h-4 w-4" />
                For you
              </a>
              <a href="#discover-apps" className="text-primary hover:underline flex items-center gap-1">
                <Globe className="h-4 w-4" />
                Browse apps
              </a>
            </div>
          </section>

          {/* Start from Scratch - Template Gallery */}
          <section id="template-gallery" className="space-y-6 scroll-mt-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground mb-2">Start from scratch</h2>
              <p className="text-muted-foreground text-sm">Choose a template to get started quickly</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
              {templates.map((template) => (
                <Link
                  key={template.id}
                  to={`/workflows/new?template=${template.id}`}
                  className="group"
                >
                  <Card className="text-center hover:shadow-md transition-shadow cursor-pointer border-2 hover:border-primary/50">
                    <CardContent className="pt-6 pb-4">
                      <div className="text-4xl mb-3">{template.icon}</div>
                      <h3 className="font-semibold text-foreground mb-1">{template.category}</h3>
                      <p className="text-xs text-muted-foreground">{template.description.split('.')[0]}</p>
                    </CardContent>
                  </Card>
                </Link>
              ))}
            </div>
          </section>

          {/* Your Workflows */}
          <section className="space-y-4">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-foreground">Your Workflows</h2>
                <p className="text-sm text-muted-foreground mt-1">Manage and monitor your automations</p>
              </div>
              <Link to="/workflows/new">
                <Button size="sm">
                  <Plus className="h-4 w-4 mr-2" />
                  New Workflow
                </Button>
              </Link>
            </div>

            {workflows.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <div className="flex flex-col items-center">
                    <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                      <Zap className="h-10 w-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-lg font-medium text-foreground mb-2">No workflows yet</h3>
                    <p className="text-muted-foreground mb-6 text-sm">Get started by creating your first automation</p>
                    <Link to="/workflows/new">
                      <Button>
                        <Plus className="h-4 w-4 mr-2" />
                        Create First Workflow
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {workflows.map((workflow: any) => (
                  <Link key={workflow.id} to={`/workflows/${workflow.id}`}>
                    <Card className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer h-full">
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base flex-1">{workflow.name}</CardTitle>
                          <div
                            className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                              workflow.isActive
                                ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                                : 'bg-muted text-muted-foreground'
                            }`}
                          >
                            {workflow.isActive ? 'Active' : 'Inactive'}
                          </div>
                        </div>
                        {workflow.description && (
                          <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{workflow.description}</p>
                        )}
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 text-xs text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Clock className="h-3.5 w-3.5" />
                            <span>Updated {formatDate(workflow.updatedAt)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Play className="h-3.5 w-3.5" />
                            <span>{workflow.nodes?.length || 0} steps</span>
                          </div>
                          {workflow.executions && workflow.executions[0] && (
                            <div className="flex items-center gap-2">
                              {workflow.executions[0].status === 'SUCCESS' ? (
                                <CheckCircle2 className="h-3.5 w-3.5 text-green-600" />
                              ) : workflow.executions[0].status === 'FAILED' ? (
                                <XCircle className="h-3.5 w-3.5 text-red-600" />
                              ) : (
                                <Clock className="h-3.5 w-3.5 text-blue-600" />
                              )}
                              <span>Last: {workflow.executions[0].status}</span>
                            </div>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </section>

          {/* Discover Applications */}
          <section id="discover-apps" className="space-y-4 scroll-mt-8">
            <div>
              <h2 className="text-2xl font-semibold text-foreground">Discover Applications</h2>
              <p className="text-sm text-muted-foreground mt-1">Connect apps to power your workflows</p>
            </div>
            {integrations.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center">
                  <p className="text-sm text-muted-foreground">No applications found yet.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {integrations.slice(0, 8).map((integration: any) => (
                  <Card key={integration.id} className="hover:shadow-md hover:border-primary/30 transition-all cursor-pointer">
                    <CardContent className="p-4 text-center">
                      <div className="w-12 h-12 mx-auto mb-2 bg-muted rounded-lg flex items-center justify-center">
                        {integration.iconUrl ? (
                          <img src={integration.iconUrl} alt={integration.displayName} className="w-8 h-8" />
                        ) : (
                          <Globe className="w-6 h-6 text-muted-foreground" />
                        )}
                      </div>
                      <h3 className="text-sm font-medium text-foreground truncate">
                        {integration.displayName || integration.name}
                      </h3>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
