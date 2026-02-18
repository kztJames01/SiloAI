import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { api } from '../../lib/api';

interface DebugLog {
  id: string;
  timestamp: string;
  nodeId: string;
  type: string;
  provider: string;
  model: string;
  messages?: any[];
  response?: any;
  error?: string;
  latency: number;
  tokenUsage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
    cost?: number;
  };
}

interface AIDebugPanelProps {
  executionId: string;
}

export function AIDebugPanel({ executionId }: AIDebugPanelProps) {
  const [logs, setLogs] = useState<DebugLog[]>([]);
  const [selectedLog, setSelectedLog] = useState<DebugLog | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDebugLogs();
  }, [executionId]);

  const fetchDebugLogs = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ai/debug/${executionId}`);
      setLogs(response.data.logs || []);
    } catch (error) {
      console.error('Failed to fetch debug logs:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatLatency = (ms: number) => {
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(2)}s`;
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'prompt':
        return 'bg-blue-100 text-blue-800';
      case 'response':
        return 'bg-green-100 text-green-800';
      case 'error':
        return 'bg-red-100 text-red-800';
      case 'tool_call':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-gray-600">Loading debug logs...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* Logs List */}
      <Card>
        <CardHeader>
          <CardTitle>AI Debug Logs ({logs.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {logs.map((log) => (
              <div
                key={log.id}
                onClick={() => setSelectedLog(log)}
                className={`p-3 border rounded-md cursor-pointer hover:bg-gray-50 transition ${
                  selectedLog?.id === log.id ? 'border-blue-500 bg-blue-50' : ''
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`px-2 py-0.5 rounded text-xs font-medium ${getTypeColor(log.type)}`}>
                    {log.type}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatLatency(log.latency)}
                  </span>
                </div>
                <div className="text-sm">
                  <span className="font-medium">{log.provider}</span> / {log.model}
                </div>
                {log.tokenUsage && (
                  <div className="text-xs text-gray-600 mt-1">
                    {log.tokenUsage.totalTokens} tokens
                    {log.tokenUsage.cost && ` • $${log.tokenUsage.cost.toFixed(4)}`}
                  </div>
                )}
                {log.error && (
                  <div className="text-xs text-red-600 mt-1 truncate">
                    Error: {log.error}
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Log Detail */}
      <Card>
        <CardHeader>
          <CardTitle>Log Details</CardTitle>
        </CardHeader>
        <CardContent>
          {selectedLog ? (
            <div className="space-y-4">
              {/* Metadata */}
              <div className="grid grid-cols-2 gap-2 text-sm">
                <div>
                  <span className="font-medium">Type:</span> {selectedLog.type}
                </div>
                <div>
                  <span className="font-medium">Latency:</span>{' '}
                  {formatLatency(selectedLog.latency)}
                </div>
                <div>
                  <span className="font-medium">Provider:</span> {selectedLog.provider}
                </div>
                <div>
                  <span className="font-medium">Model:</span> {selectedLog.model}
                </div>
                <div className="col-span-2">
                  <span className="font-medium">Timestamp:</span>{' '}
                  {new Date(selectedLog.timestamp).toLocaleString()}
                </div>
              </div>

              {/* Messages */}
              {selectedLog.messages && selectedLog.messages.length > 0 && (
                <div>
                  <h4 className="font-medium mb-2">Messages</h4>
                  <div className="space-y-2 max-h-[200px] overflow-y-auto">
                    {selectedLog.messages.map((msg, idx) => (
                      <div key={idx} className="p-2 bg-gray-50 rounded text-sm">
                        <div className="font-medium text-xs text-gray-600 mb-1">
                          {msg.role}
                        </div>
                        <div className="whitespace-pre-wrap">{msg.content}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Response */}
              {selectedLog.response && (
                <div>
                  <h4 className="font-medium mb-2">Response</h4>
                  <div className="p-3 bg-gray-50 rounded text-sm">
                    <pre className="whitespace-pre-wrap">
                      {selectedLog.response.content}
                    </pre>
                  </div>
                </div>
              )}

              {/* Token Usage */}
              {selectedLog.tokenUsage && (
                <div>
                  <h4 className="font-medium mb-2">Token Usage</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>Prompt: {selectedLog.tokenUsage.promptTokens}</div>
                    <div>Completion: {selectedLog.tokenUsage.completionTokens}</div>
                    <div>Total: {selectedLog.tokenUsage.totalTokens}</div>
                    {selectedLog.tokenUsage.cost && (
                      <div>Cost: ${selectedLog.tokenUsage.cost.toFixed(4)}</div>
                    )}
                  </div>
                </div>
              )}

              {/* Error */}
              {selectedLog.error && (
                <div>
                  <h4 className="font-medium mb-2 text-red-600">Error</h4>
                  <div className="p-3 bg-red-50 border border-red-200 rounded text-sm text-red-800">
                    {selectedLog.error}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="text-center text-gray-500 py-8">
              Select a log to view details
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
