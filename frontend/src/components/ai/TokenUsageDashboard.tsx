import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { api } from '../../lib/api';

interface TokenUsageStats {
  totalTokens: number;
  totalCost: number;
  byProvider: Record<string, { tokens: number; cost: number }>;
  byModel: Record<string, { tokens: number; cost: number }>;
  byWorkflow: Record<string, { tokens: number; cost: number }>;
}

export function TokenUsageDashboard() {
  const [stats, setStats] = useState<TokenUsageStats | null>(null);
  const [timeRange, setTimeRange] = useState('7'); // days
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [timeRange]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/ai/token-usage?days=${timeRange}`);
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch token usage:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-8 text-center">
          <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading token usage...</p>
        </CardContent>
      </Card>
    );
  }

  if (!stats) {
    return (
      <Card>
        <CardContent className="py-8 text-center text-muted-foreground">
          No token usage data available
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatCost = (cost: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(cost);
  };

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Token Usage Analytics</h2>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border rounded-md"
        >
          <option value="1">Last 24 hours</option>
          <option value="7">Last 7 days</option>
          <option value="30">Last 30 days</option>
          <option value="90">Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card>
          <CardHeader>
            <CardTitle>Total Tokens</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-600">
              {formatNumber(stats.totalTokens)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">tokens used</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Total Cost</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">
              {formatCost(stats.totalCost)}
            </div>
            <p className="text-sm text-muted-foreground mt-1">estimated cost</p>
          </CardContent>
        </Card>
      </div>

      {/* By Provider */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Provider</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byProvider).map(([provider, data]) => (
              <div key={provider} className="flex items-center justify-between">
                <div>
                  <div className="font-medium capitalize">{provider}</div>
                  <div className="text-sm text-muted-foreground">
                    {formatNumber(data.tokens)} tokens
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold">{formatCost(data.cost)}</div>
                  <div className="text-sm text-muted-foreground">
                    {((data.tokens / stats.totalTokens) * 100).toFixed(1)}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* By Model */}
      <Card>
        <CardHeader>
          <CardTitle>Usage by Model</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Object.entries(stats.byModel)
              .sort((a, b) => b[1].tokens - a[1].tokens)
              .slice(0, 5)
              .map(([model, data]) => (
                <div key={model} className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{model}</div>
                    <div className="text-sm text-muted-foreground">
                      {formatNumber(data.tokens)} tokens
                    </div>
                  </div>
                  <div className="font-semibold">{formatCost(data.cost)}</div>
                </div>
              ))}
          </div>
        </CardContent>
      </Card>

      {/* Cost Optimization Tips */}
      <Card className="bg-yellow-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="text-yellow-800">💡 Cost Optimization Tips</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-2 text-sm text-yellow-900">
            <li>• Use Ollama for development to avoid API costs</li>
            <li>• Choose appropriate models - not every task needs GPT-4</li>
            <li>• Implement caching for repeated queries</li>
            <li>• Use prompt templates to reduce token usage</li>
            <li>• Set max token limits to prevent runaway costs</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
