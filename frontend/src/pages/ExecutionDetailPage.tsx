import { useQuery } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { executionApi } from '../lib/api';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { ArrowLeft, Clock, CheckCircle2, XCircle } from 'lucide-react';
import { formatDate, getStatusColor } from '../lib/utils';
import { useUiStore } from '../lib/store';

const safeKeys = new Set([
  'id',
  'status',
  'startedAt',
  'finishedAt',
  'timestamp',
  'workflowId',
  'executionId',
]);

const maskSensitive = (input: any, key?: string): any => {
  if (typeof input === 'string') {
    if (key && safeKeys.has(key)) {
      return input;
    }
    return input.replace(/[A-Za-z0-9]/g, '*');
  }
  if (Array.isArray(input)) {
    return input.map((item) => maskSensitive(item, key));
  }
  if (input && typeof input === 'object') {
    return Object.fromEntries(
      Object.entries(input).map(([entryKey, value]) => [entryKey, maskSensitive(value, entryKey)])
    );
  }
  return input;
};

export default function ExecutionDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isMaskingEnabled } = useUiStore();

  const { data, isLoading } = useQuery({
    queryKey: ['execution', id],
    queryFn: async () => {
      const response = await executionApi.get(id!);
      return response.data.execution;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-600">Execution not found</p>
        <Link to="/executions">
          <Button variant="outline" className="mt-4">
            Back to Executions
          </Button>
        </Link>
      </div>
    );
  }

  const execution = data;
  const maskedExecution = isMaskingEnabled ? maskSensitive(execution) : execution;
  const duration = execution.finishedAt
    ? Math.round(
        (new Date(execution.finishedAt).getTime() - new Date(execution.startedAt).getTime()) / 1000
      )
    : null;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center space-x-4">
        <Link to="/executions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>
        <div className="flex-1">
          <h1 className="text-3xl font-bold text-gray-900">Execution Details</h1>
          <p className="text-gray-600 mt-1">
            Workflow: <Link to={`/workflows/${execution.workflow.id}`} className="text-primary hover:underline">{execution.workflow.name}</Link>
          </p>
        </div>
      </div>

      {/* Execution Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p className="text-sm text-gray-600">Status</p>
              <p className="mt-1">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(execution.status)}`}>
                  {execution.status}
                </span>
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Started</p>
              <p className="mt-1 text-sm font-medium">{formatDate(execution.startedAt)}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Finished</p>
              <p className="mt-1 text-sm font-medium">
                {execution.finishedAt ? formatDate(execution.finishedAt) : '-'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Duration</p>
              <p className="mt-1 text-sm font-medium">{duration ? `${duration}s` : '-'}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Execution Logs */}
      <Card>
        <CardHeader>
          <CardTitle>Execution Logs</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {maskedExecution.logs.map((log: any) => (
              <div
                key={log.id}
                className="flex items-start space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100"
              >
                <div className="flex-shrink-0 mt-1">
                  {log.level === 'ERROR' ? (
                    <XCircle className="h-4 w-4 text-red-600" />
                  ) : log.level === 'INFO' ? (
                    <CheckCircle2 className="h-4 w-4 text-blue-600" />
                  ) : (
                    <Clock className="h-4 w-4 text-gray-600" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium text-gray-900">{log.nodeName}</p>
                    <p className="text-xs text-gray-500">
                      {new Date(log.timestamp).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">{log.message}</p>
                  {log.data && (
                    <details className="mt-2">
                      <summary className="text-xs text-gray-500 cursor-pointer hover:text-gray-700">
                        View data
                      </summary>
                      <pre className="mt-2 text-xs bg-gray-800 text-gray-100 p-3 rounded overflow-x-auto">
                        {JSON.stringify(log.data, null, 2)}
                      </pre>
                    </details>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Output Data */}
      {maskedExecution.output && (
        <Card>
          <CardHeader>
            <CardTitle>Output Data</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-gray-800 text-gray-100 p-4 rounded overflow-x-auto text-sm">
              {JSON.stringify(maskedExecution.output, null, 2)}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Error */}
      {maskedExecution.error && (
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-900">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-800">{maskedExecution.error}</p>
          </CardContent>
        </Card>
      )}
      </div>
    </div>
  );
}
