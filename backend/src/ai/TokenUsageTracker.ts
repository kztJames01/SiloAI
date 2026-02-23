import {
  TokenUsageLog,
  TokenUsageAnalytics,
  LLMProvider,
  TokenUsage,
} from '../../../shared/src/types/ai';

/**
 * Token Usage Tracker for monitoring and analytics
 */
export class TokenUsageTracker {
  private logs: TokenUsageLog[] = [];
  private maxLogsInMemory = 10000;

  /**
   * Log token usage
   */
  logUsage(log: Omit<TokenUsageLog, 'id' | 'timestamp'>): TokenUsageLog {
    const fullLog: TokenUsageLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      ...log,
    };

    this.logs.push(fullLog);

    // Trim logs if exceeding max
    if (this.logs.length > this.maxLogsInMemory) {
      this.logs = this.logs.slice(-this.maxLogsInMemory);
    }

    return fullLog;
  }

  /**
   * Get usage analytics for a time range
   */
  getAnalytics(
    startDate: Date,
    endDate: Date,
    filters?: {
      userId?: string;
      workflowId?: string;
      provider?: LLMProvider;
    }
  ): TokenUsageAnalytics {
    let filteredLogs = this.logs.filter(
      log => log.timestamp >= startDate && log.timestamp <= endDate
    );

    // Apply filters
    if (filters?.userId) {
      filteredLogs = filteredLogs.filter(log => log.userId === filters.userId);
    }
    if (filters?.workflowId) {
      filteredLogs = filteredLogs.filter(log => log.workflowId === filters.workflowId);
    }
    if (filters?.provider) {
      filteredLogs = filteredLogs.filter(log => log.provider === filters.provider);
    }

    // Calculate totals
    let totalTokens = 0;
    let totalCost = 0;
    const byProvider: Record<LLMProvider, { tokens: number; cost: number }> = {} as any;
    const byModel: Record<string, { tokens: number; cost: number }> = {};
    const byWorkflow: Record<string, { tokens: number; cost: number }> = {};

    for (const log of filteredLogs) {
      totalTokens += log.usage.totalTokens;
      totalCost += log.usage.cost || 0;

      // By provider
      if (!byProvider[log.provider]) {
        byProvider[log.provider] = { tokens: 0, cost: 0 };
      }
      byProvider[log.provider].tokens += log.usage.totalTokens;
      byProvider[log.provider].cost += log.usage.cost || 0;

      // By model
      if (!byModel[log.model]) {
        byModel[log.model] = { tokens: 0, cost: 0 };
      }
      byModel[log.model].tokens += log.usage.totalTokens;
      byModel[log.model].cost += log.usage.cost || 0;

      // By workflow
      if (log.workflowId) {
        if (!byWorkflow[log.workflowId]) {
          byWorkflow[log.workflowId] = { tokens: 0, cost: 0 };
        }
        byWorkflow[log.workflowId].tokens += log.usage.totalTokens;
        byWorkflow[log.workflowId].cost += log.usage.cost || 0;
      }
    }

    return {
      totalTokens,
      totalCost,
      byProvider,
      byModel,
      byWorkflow,
      timeRange: {
        start: startDate,
        end: endDate,
      },
    };
  }

  /**
   * Get usage for a specific user
   */
  getUserUsage(userId: string, days: number = 30): TokenUsageAnalytics {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return this.getAnalytics(startDate, endDate, { userId });
  }

  /**
   * Get usage for a specific workflow
   */
  getWorkflowUsage(workflowId: string): TokenUsageAnalytics {
    const endDate = new Date();
    const startDate = new Date(0); // All time

    return this.getAnalytics(startDate, endDate, { workflowId });
  }

  /**
   * Get recent usage logs
   */
  getRecentLogs(limit: number = 100): TokenUsageLog[] {
    return this.logs.slice(-limit);
  }

  /**
   * Get logs by filter
   */
  getLogs(filter: {
    userId?: string;
    workflowId?: string;
    executionId?: string;
    provider?: LLMProvider;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): TokenUsageLog[] {
    let filtered = [...this.logs];

    if (filter.userId) {
      filtered = filtered.filter(log => log.userId === filter.userId);
    }
    if (filter.workflowId) {
      filtered = filtered.filter(log => log.workflowId === filter.workflowId);
    }
    if (filter.executionId) {
      filtered = filtered.filter(log => log.executionId === filter.executionId);
    }
    if (filter.provider) {
      filtered = filtered.filter(log => log.provider === filter.provider);
    }
    if (filter.startDate) {
      filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
    }
    if (filter.endDate) {
      filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
    }

    if (filter.limit) {
      filtered = filtered.slice(-filter.limit);
    }

    return filtered;
  }

  /**
   * Calculate estimated cost for usage
   */
  estimateCost(provider: LLMProvider, model: string, usage: TokenUsage): number {
    // Pricing per 1M tokens (as of 2026)
    const pricing: Record<string, Record<string, { prompt: number; completion: number }>> = {
      openai: {
        'gpt-4': { prompt: 30, completion: 60 },
        'gpt-4-turbo': { prompt: 10, completion: 30 },
        'gpt-4o': { prompt: 5, completion: 15 },
        'gpt-3.5-turbo': { prompt: 0.5, completion: 1.5 },
      },
      anthropic: {
        'claude-3-opus': { prompt: 15, completion: 75 },
        'claude-3-sonnet': { prompt: 3, completion: 15 },
        'claude-3-5-sonnet': { prompt: 3, completion: 15 },
        'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
      },
      gemini: {
        'gemini-pro': { prompt: 0.5, completion: 1.5 },
        'gemini-1.5-pro': { prompt: 1.25, completion: 5 },
        'gemini-1.5-flash': { prompt: 0.075, completion: 0.3 },
        'gemini-ultra': { prompt: 2, completion: 6 },
      },
      ollama: {}, // Local models are free
      custom: {}, // Custom models don't have standard pricing
    };

    if (provider === 'ollama' || provider === 'custom') {
      return 0;
    }

    const providerPricing = pricing[provider];
    if (!providerPricing) return 0;

    // Find matching model (partial match for flexibility)
    let modelPricing;
    for (const [key, value] of Object.entries(providerPricing)) {
      if (model.includes(key)) {
        modelPricing = value;
        break;
      }
    }

    if (!modelPricing) return 0;

    const promptCost = (usage.promptTokens / 1000000) * modelPricing.prompt;
    const completionCost = (usage.completionTokens / 1000000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  /**
   * Get top consumers
   */
  getTopConsumers(
    type: 'user' | 'workflow' | 'model',
    limit: number = 10,
    days: number = 30
  ): Array<{ id: string; tokens: number; cost: number }> {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    const analytics = this.getAnalytics(startDate, endDate);

    let data: Record<string, { tokens: number; cost: number }>;
    switch (type) {
      case 'workflow':
        data = analytics.byWorkflow;
        break;
      case 'model':
        data = analytics.byModel;
        break;
      default:
        // User-based would need to be calculated differently
        return [];
    }

    return Object.entries(data)
      .map(([id, stats]) => ({ id, ...stats }))
      .sort((a, b) => b.tokens - a.tokens)
      .slice(0, limit);
  }

  /**
   * Clear old logs
   */
  clearOldLogs(daysToKeep: number = 90): number {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - daysToKeep);

    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.timestamp >= cutoffDate);

    return originalLength - this.logs.length;
  }

  /**
   * Export logs as JSON
   */
  exportLogs(startDate?: Date, endDate?: Date): string {
    let logs = this.logs;

    if (startDate || endDate) {
      logs = logs.filter(log => {
        if (startDate && log.timestamp < startDate) return false;
        if (endDate && log.timestamp > endDate) return false;
        return true;
      });
    }

    return JSON.stringify(logs, null, 2);
  }

  /**
   * Import logs from JSON
   */
  importLogs(json: string): number {
    try {
      const imported: TokenUsageLog[] = JSON.parse(json);
      this.logs.push(...imported);
      return imported.length;
    } catch (error) {
      throw new Error(`Failed to import logs: ${error}`);
    }
  }

  private generateLogId(): string {
    return `log_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const tokenTracker = new TokenUsageTracker();
