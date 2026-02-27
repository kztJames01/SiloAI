
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDate, getStatusColor } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock, Play, Plus, XCircle, Zap, ExternalLink, ListChecks, Workflow as WorkflowIcon } from 'lucide-react';
import { workflowApi, executionApi } from '@/lib/api';

type Tab = 'workflows' | 'executions';

export default function WorkflowDashboardPage() {
  const [tab, setTab] = useState<Tab>('workflows');

  const { data: workflowData, isLoading: loadingWorkflows } = useQuery({
    queryKey: ['workflows'],
    queryFn: async () => {
      const response = await workflowApi.list();
      return response.data.workflows;
    },
  });

  const { data: execData, isLoading: loadingExecs } = useQuery({
    queryKey: ['executions'],
    queryFn: async () => {
      const response = await executionApi.list();
      return response.data.executions;
    },
  });

  const workflows = (workflowData || []).filter((w: any) => !w.name.startsWith('__agent__'));
  const executions = execData || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

      {/* Page header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Workflows</h1>
          <p className="text-muted-foreground mt-1 text-sm">Build automations and monitor their execution history</p>
        </div>
        <Link to="/workflows/new">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            New Workflow
          </Button>
        </Link>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-border mb-6">
        {([
          { id: 'workflows', label: 'Workflows', icon: WorkflowIcon, count: workflows.length },
          { id: 'executions', label: 'Executions', icon: ListChecks, count: executions.length },
        ] as { id: Tab; label: string; icon: React.ElementType; count: number }[]).map(t => {
          const Icon = t.icon;
          return (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 transition-colors ${
                tab === t.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {t.label}
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                tab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground'
              }`}>{t.count}</span>
            </button>
          );
        })}
      </div>

      {/* ── WORKFLOWS TAB ── */}
      {tab === 'workflows' && (
        <section className="space-y-4">
          {loadingWorkflows ? (
            <div className="flex justify-center items-center min-h-[300px]">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
            </div>
          ) : workflows.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <div className="flex flex-col items-center">
                  <div className="h-20 w-20 bg-muted rounded-full flex items-center justify-center mb-4">
                    <Zap className="h-10 w-10 text-muted-foreground" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">No workflows yet</h3>
                  <p className="text-muted-foreground mb-6 text-sm">Get started by creating your first automation</p>
                  <Link to="/workflows/new">
                    <Button><Plus className="h-4 w-4 mr-2" />Create First Workflow</Button>
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
                        <div className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${
                          workflow.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400' : 'bg-muted text-muted-foreground'
                        }`}>
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
                        {workflow.executions?.[0] && (
                          <div className="flex items-center gap-2">
                            {workflow.executions[0].status === 'SUCCESS' ? (
                              <CheckCircle2 className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
                            ) : workflow.executions[0].status === 'FAILED' ? (
                              <XCircle className="h-3.5 w-3.5 text-red-600 dark:text-red-400" />
                            ) : (
                              <Clock className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
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
      )}

      {/* ── EXECUTIONS TAB ── */}
      {tab === 'executions' && (
        <Card>
          <CardHeader>
            <CardTitle>Execution History</CardTitle>
          </CardHeader>
          <CardContent>
            {loadingExecs ? (
              <div className="flex justify-center items-center min-h-[200px]">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary" />
              </div>
            ) : executions.length === 0 ? (
              <p className="text-center text-muted-foreground py-8">No executions yet</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Workflow</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Started</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Duration</th>
                      <th className="text-left py-3 px-4 font-medium text-muted-foreground text-sm">Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {executions.map((execution: any) => {
                      const duration = execution.finishedAt
                        ? Math.round(
                            (new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000
                          )
                        : null;
                      return (
                        <tr key={execution.id} className="border-b border-border hover:bg-accent/50">
                          <td className="py-3 px-4">
                            <Link to={`/workflows/${execution.workflow.id}`} className="text-primary hover:underline text-sm font-medium">
                              {execution.workflow.name}
                            </Link>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                              {execution.status}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{formatDate(execution.startedAt)}</td>
                          <td className="py-3 px-4 text-sm text-muted-foreground">{duration ? `${duration}s` : '—'}</td>
                          <td className="py-3 px-4">
                            <Link
                              to={`/executions/${execution.id}`}
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              View <ExternalLink className="h-3 w-3" />
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
