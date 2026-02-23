import {
  AIDebugLog,
  AIDebugSession,
  LLMProvider,
  Message,
  LLMResponse,
} from '../../../shared/src/types/ai';

/**
 * AI Debugger for tracking and analyzing AI operations
 */
export class AIDebugger {
  private logs: AIDebugLog[] = [];
  private sessions: Map<string, AIDebugSession> = new Map();
  private enabled: boolean = true;
  private maxLogsPerSession: number = 1000;

  /**
   * Enable/disable debugging
   */
  setEnabled(enabled: boolean): void {
    this.enabled = enabled;
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Log a prompt
   */
  logPrompt(
    executionId: string,
    nodeId: string,
    provider: LLMProvider,
    model: string,
    messages: Message[]
  ): string {
    if (!this.enabled) return '';

    const logId = this.generateLogId();
    const log: AIDebugLog = {
      id: logId,
      timestamp: new Date(),
      nodeId,
      executionId,
      type: 'prompt',
      provider,
      model,
      messages,
      latency: 0,
    };

    this.logs.push(log);
    this.addToSession(executionId, log);

    return logId;
  }

  /**
   * Log a response
   */
  logResponse(
    logId: string,
    executionId: string,
    nodeId: string,
    provider: LLMProvider,
    model: string,
    response: LLMResponse,
    latency: number
  ): void {
    if (!this.enabled) return;

    const log: AIDebugLog = {
      id: logId,
      timestamp: new Date(),
      nodeId,
      executionId,
      type: 'response',
      provider,
      model,
      messages: [],
      response,
      latency,
      tokenUsage: response.usage,
    };

    this.logs.push(log);
    this.addToSession(executionId, log);
  }

  /**
   * Log an error
   */
  logError(
    executionId: string,
    nodeId: string,
    provider: LLMProvider,
    model: string,
    error: string,
    messages?: Message[]
  ): void {
    if (!this.enabled) return;

    const log: AIDebugLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      nodeId,
      executionId,
      type: 'error',
      provider,
      model,
      messages: messages || [],
      error,
      latency: 0,
    };

    this.logs.push(log);
    this.addToSession(executionId, log);
  }

  /**
   * Log a tool/function call
   */
  logToolCall(
    executionId: string,
    nodeId: string,
    provider: LLMProvider,
    model: string,
    toolName: string,
    toolArgs: any
  ): void {
    if (!this.enabled) return;

    const log: AIDebugLog = {
      id: this.generateLogId(),
      timestamp: new Date(),
      nodeId,
      executionId,
      type: 'tool_call',
      provider,
      model,
      messages: [
        {
          role: 'function',
          content: `Tool: ${toolName}, Args: ${JSON.stringify(toolArgs)}`,
        },
      ],
      latency: 0,
    };

    this.logs.push(log);
    this.addToSession(executionId, log);
  }

  /**
   * Get debug session
   */
  getSession(executionId: string): AIDebugSession | undefined {
    return this.sessions.get(executionId);
  }

  /**
   * Get all logs for an execution
   */
  getExecutionLogs(executionId: string): AIDebugLog[] {
    return this.logs.filter(log => log.executionId === executionId);
  }

  /**
   * Get logs by node
   */
  getNodeLogs(executionId: string, nodeId: string): AIDebugLog[] {
    return this.logs.filter(
      log => log.executionId === executionId && log.nodeId === nodeId
    );
  }

  /**
   * Get session summary
   */
  getSessionSummary(executionId: string): {
    totalCalls: number;
    totalTokens: number;
    totalCost: number;
    avgLatency: number;
    errors: number;
    byProvider: Record<LLMProvider, number>;
    byNode: Record<string, number>;
  } | null {
    const logs = this.getExecutionLogs(executionId);
    if (logs.length === 0) return null;

    let totalTokens = 0;
    let totalCost = 0;
    let totalLatency = 0;
    let latencyCount = 0;
    let errors = 0;
    const byProvider: Record<string, number> = {};
    const byNode: Record<string, number> = {};

    for (const log of logs) {
      if (log.tokenUsage) {
        totalTokens += log.tokenUsage.totalTokens;
        totalCost += log.tokenUsage.cost || 0;
      }

      if (log.latency > 0) {
        totalLatency += log.latency;
        latencyCount++;
      }

      if (log.type === 'error') {
        errors++;
      }

      byProvider[log.provider] = (byProvider[log.provider] || 0) + 1;
      byNode[log.nodeId] = (byNode[log.nodeId] || 0) + 1;
    }

    return {
      totalCalls: logs.length,
      totalTokens,
      totalCost,
      avgLatency: latencyCount > 0 ? totalLatency / latencyCount : 0,
      errors,
      byProvider: byProvider as any,
      byNode,
    };
  }

  /**
   * Analyze performance issues
   */
  analyzePerformance(executionId: string): {
    slowNodes: Array<{ nodeId: string; avgLatency: number; calls: number }>;
    highTokenNodes: Array<{ nodeId: string; totalTokens: number; calls: number }>;
    errorNodes: Array<{ nodeId: string; errors: number; totalCalls: number }>;
    recommendations: string[];
  } {
    const logs = this.getExecutionLogs(executionId);
    const nodeStats: Record<
      string,
      {
        latencies: number[];
        tokens: number;
        errors: number;
        calls: number;
      }
    > = {};

    // Collect stats
    for (const log of logs) {
      if (!nodeStats[log.nodeId]) {
        nodeStats[log.nodeId] = {
          latencies: [],
          tokens: 0,
          errors: 0,
          calls: 0,
        };
      }

      const stats = nodeStats[log.nodeId];
      stats.calls++;

      if (log.latency > 0) {
        stats.latencies.push(log.latency);
      }

      if (log.tokenUsage) {
        stats.tokens += log.tokenUsage.totalTokens;
      }

      if (log.type === 'error') {
        stats.errors++;
      }
    }

    // Analyze slow nodes
    const slowNodes = Object.entries(nodeStats)
      .map(([nodeId, stats]) => ({
        nodeId,
        avgLatency: stats.latencies.reduce((a, b) => a + b, 0) / stats.latencies.length || 0,
        calls: stats.calls,
      }))
      .filter(n => n.avgLatency > 5000) // Slower than 5 seconds
      .sort((a, b) => b.avgLatency - a.avgLatency);

    // Analyze high token usage
    const highTokenNodes = Object.entries(nodeStats)
      .map(([nodeId, stats]) => ({
        nodeId,
        totalTokens: stats.tokens,
        calls: stats.calls,
      }))
      .filter(n => n.totalTokens > 10000) // More than 10k tokens
      .sort((a, b) => b.totalTokens - a.totalTokens);

    // Analyze error-prone nodes
    const errorNodes = Object.entries(nodeStats)
      .map(([nodeId, stats]) => ({
        nodeId,
        errors: stats.errors,
        totalCalls: stats.calls,
      }))
      .filter(n => n.errors > 0)
      .sort((a, b) => b.errors - a.errors);

    // Generate recommendations
    const recommendations: string[] = [];

    if (slowNodes.length > 0) {
      recommendations.push(
        `${slowNodes.length} node(s) have high latency. Consider using faster models or caching.`
      );
    }

    if (highTokenNodes.length > 0) {
      recommendations.push(
        `${highTokenNodes.length} node(s) use many tokens. Consider shorter prompts or context pruning.`
      );
    }

    if (errorNodes.length > 0) {
      recommendations.push(
        `${errorNodes.length} node(s) have errors. Review error logs and add error handling.`
      );
    }

    const session = this.getSession(executionId);
    if (session && session.totalCost > 1.0) {
      recommendations.push(
        'High cost detected ($' + session.totalCost.toFixed(2) + '). Consider using cheaper models.'
      );
    }

    return {
      slowNodes,
      highTokenNodes,
      errorNodes,
      recommendations,
    };
  }

  /**
   * Export debug logs
   */
  exportLogs(executionId: string): string {
    const logs = this.getExecutionLogs(executionId);
    const session = this.getSession(executionId);
    const summary = this.getSessionSummary(executionId);
    const performance = this.analyzePerformance(executionId);

    return JSON.stringify(
      {
        executionId,
        session,
        summary,
        performance,
        logs,
      },
      null,
      2
    );
  }

  /**
   * Clear logs for an execution
   */
  clearExecutionLogs(executionId: string): number {
    const originalLength = this.logs.length;
    this.logs = this.logs.filter(log => log.executionId !== executionId);
    this.sessions.delete(executionId);
    return originalLength - this.logs.length;
  }

  /**
   * Clear all logs
   */
  clearAllLogs(): void {
    this.logs = [];
    this.sessions.clear();
  }

  /**
   * Get recent errors
   */
  getRecentErrors(limit: number = 10): AIDebugLog[] {
    return this.logs
      .filter(log => log.type === 'error')
      .slice(-limit)
      .reverse();
  }

  private addToSession(executionId: string, log: AIDebugLog): void {
    let session = this.sessions.get(executionId);

    if (!session) {
      session = {
        executionId,
        logs: [],
        totalTokens: 0,
        totalCost: 0,
        totalLatency: 0,
        errors: 0,
      };
      this.sessions.set(executionId, session);
    }

    session.logs.push(log);

    if (log.tokenUsage) {
      session.totalTokens += log.tokenUsage.totalTokens;
      session.totalCost += log.tokenUsage.cost || 0;
    }

    if (log.latency) {
      session.totalLatency += log.latency;
    }

    if (log.type === 'error') {
      session.errors++;
    }

    // Trim logs if exceeding max
    if (session.logs.length > this.maxLogsPerSession) {
      session.logs = session.logs.slice(-this.maxLogsPerSession);
    }
  }

  private generateLogId(): string {
    return `dbg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const aiDebugger = new AIDebugger();
