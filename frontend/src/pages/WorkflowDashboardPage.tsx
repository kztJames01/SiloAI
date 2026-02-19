
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { formatDate } from '../lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '@/components/ui/Button';
import { CheckCircle2, Clock, Play, Plus, XCircle, Zap } from 'lucide-react';
import { workflowApi } from '@/lib/api';
export default function WorkflowDashboardPage() {

    const { data, isLoading } = useQuery({
        queryKey: ['workflows'],
        queryFn: async () => {
            const response = await workflowApi.list();
            return response.data.workflows;
        },
    });
    if (isLoading) {
        return (
            <div className="flex justify-center items-center min-h-[400px]">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }
    const workflows = data || [];
    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            
            {/* Your Workflows */}
            < section className="space-y-4" >
                <div className="flex justify-between items-center">
                    <div>
                        <h2 className="text-3xl font-bold text-gray-900">Your Workflows</h2>
                        <p className=" text-gray-600 mt-1">Manage and monitor your automations</p>
                    </div>
                    <Link to="/workflows/new">
                        <Button size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            New Workflow
                        </Button>
                    </Link>
                </div>

                {
                    workflows.length === 0 ? (
                        <Card>
                            <CardContent className="py-12 text-center">
                                <div className="flex flex-col items-center">
                                    <div className="h-20 w-20 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                                        <Zap className="h-10 w-10 text-gray-400" />
                                    </div>
                                    <h3 className="text-lg font-medium text-gray-900 mb-2">No workflows yet</h3>
                                    <p className="text-gray-600 mb-6 text-sm">Get started by creating your first automation</p>
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
                                                    className={`px-2 py-0.5 rounded-full text-xs font-medium flex-shrink-0 ${workflow.isActive
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-gray-100 text-gray-600'
                                                        }`}
                                                >
                                                    {workflow.isActive ? 'Active' : 'Inactive'}
                                                </div>
                                            </div>
                                            {workflow.description && (
                                                <p className="text-sm text-gray-600 line-clamp-2 mt-1">{workflow.description}</p>
                                            )}
                                        </CardHeader>
                                        <CardContent>
                                            <div className="space-y-2 text-xs text-gray-600">
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
                    )
                }
            </section >
        </div>
    );
}