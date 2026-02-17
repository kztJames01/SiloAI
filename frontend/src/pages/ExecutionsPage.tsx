import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { executionApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { ExternalLink } from 'lucide-react';
import { formatDate, getStatusColor } from '../lib/utils';

export default function ExecutionsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['executions'],
    queryFn: async () => {
      const response = await executionApi.list();
      return response.data.executions;
    },
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const executions = data || [];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Workflow Executions</h1>
          <p className="text-gray-600 mt-1">View all workflow execution history</p>
        </div>

      <Card>
        <CardHeader>
          <CardTitle>Recent Executions</CardTitle>
        </CardHeader>
        <CardContent>
          {executions.length === 0 ? (
            <p className="text-center text-gray-600 py-8">No executions yet</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Workflow</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Started</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Duration</th>
                    <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {executions.map((execution: any) => {
                    const duration = execution.finishedAt
                      ? Math.round(
                          (new Date(execution.finishedAt).getTime() -
                            new Date(execution.startedAt).getTime()) /
                            1000
                        )
                      : null;

                    return (
                      <tr key={execution.id} className="border-b hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <Link
                            to={`/workflows/${execution.workflow.id}`}
                            className="text-primary hover:underline"
                          >
                            {execution.workflow.name}
                          </Link>
                        </td>
                        <td className="py-3 px-4">
                          <span
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                              execution.status
                            )}`}
                          >
                            {execution.status}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(execution.startedAt)}
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {duration ? `${duration}s` : '-'}
                        </td>
                        <td className="py-3 px-4">
                          <Link
                            to={`/executions/${execution.id}`}
                            className="text-primary hover:underline flex items-center text-sm"
                          >
                            <span>View</span>
                            <ExternalLink className="h-3 w-3 ml-1" />
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
      </div>
    </div>
  );
}
