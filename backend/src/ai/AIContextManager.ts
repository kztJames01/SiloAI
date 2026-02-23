import { AIContext, Message } from '../../../shared/src/types/ai';

/**
 * Context Manager for AI conversations and workflows
 * Manages conversation history, variables, and metadata
 */
export class AIContextManager {
  private contexts: Map<string, AIContext> = new Map();

  /**
   * Create a new context
   */
  createContext(conversationId?: string, metadata?: Record<string, any>): AIContext {
    const id = conversationId || this.generateContextId();
    const context: AIContext = {
      conversationId: id,
      messages: [],
      variables: {},
      metadata: metadata || {},
    };

    this.contexts.set(id, context);
    return context;
  }

  /**
   * Get an existing context
   */
  getContext(conversationId: string): AIContext | undefined {
    return this.contexts.get(conversationId);
  }

  /**
   * Get or create a context
   */
  getOrCreateContext(conversationId?: string, metadata?: Record<string, any>): AIContext {
    if (conversationId) {
      const existing = this.getContext(conversationId);
      if (existing) return existing;
    }
    return this.createContext(conversationId, metadata);
  }

  /**
   * Add a message to context
   */
  addMessage(conversationId: string, message: Message): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      context.messages.push(message);
    }
  }

  /**
   * Add multiple messages to context
   */
  addMessages(conversationId: string, messages: Message[]): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      context.messages.push(...messages);
    }
  }

  /**
   * Get messages with optional filtering
   */
  getMessages(
    conversationId: string,
    options?: {
      limit?: number;
      role?: 'system' | 'user' | 'assistant' | 'function';
      fromIndex?: number;
    }
  ): Message[] {
    const context = this.contexts.get(conversationId);
    if (!context) return [];

    let messages = [...context.messages];

    // Filter by role
    if (options?.role) {
      messages = messages.filter(m => m.role === options.role);
    }

    // Slice from index
    if (options?.fromIndex !== undefined) {
      messages = messages.slice(options.fromIndex);
    }

    // Limit number of messages
    if (options?.limit) {
      messages = messages.slice(-options.limit);
    }

    return messages;
  }

  /**
   * Clear messages from context
   */
  clearMessages(conversationId: string): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      context.messages = [];
    }
  }

  /**
   * Set a variable in context
   */
  setVariable(conversationId: string, key: string, value: any): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      context.variables[key] = value;
    }
  }

  /**
   * Set multiple variables in context
   */
  setVariables(conversationId: string, variables: Record<string, any>): void {
    const context = this.contexts.get(conversationId);
    if (context) {
      Object.assign(context.variables, variables);
    }
  }

  /**
   * Get a variable from context
   */
  getVariable(conversationId: string, key: string): any {
    const context = this.contexts.get(conversationId);
    return context?.variables[key];
  }

  /**
   * Get all variables from context
   */
  getVariables(conversationId: string): Record<string, any> {
    const context = this.contexts.get(conversationId);
    return context?.variables || {};
  }

  /**
   * Set metadata
   */
  setMetadata(conversationId: string, key: string, value: any): void {
    const context = this.contexts.get(conversationId);
    if (context && context.metadata) {
      context.metadata[key] = value;
    }
  }

  /**
   * Get metadata
   */
  getMetadata(conversationId: string, key?: string): any {
    const context = this.contexts.get(conversationId);
    if (!context || !context.metadata) return undefined;
    return key ? context.metadata[key] : context.metadata;
  }

  /**
   * Delete a context
   */
  deleteContext(conversationId: string): boolean {
    return this.contexts.delete(conversationId);
  }

  /**
   * Check if context exists
   */
  hasContext(conversationId: string): boolean {
    return this.contexts.has(conversationId);
  }

  /**
   * Get context summary
   */
  getContextSummary(conversationId: string): {
    messageCount: number;
    variableCount: number;
    metadata: Record<string, any>;
  } | null {
    const context = this.contexts.get(conversationId);
    if (!context) return null;

    return {
      messageCount: context.messages.length,
      variableCount: Object.keys(context.variables).length,
      metadata: context.metadata || {},
    };
  }

  /**
   * Clone a context
   */
  cloneContext(sourceId: string, targetId?: string): AIContext | null {
    const source = this.contexts.get(sourceId);
    if (!source) return null;

    const id = targetId || this.generateContextId();
    const cloned: AIContext = {
      conversationId: id,
      messages: [...source.messages],
      variables: { ...source.variables },
      metadata: { ...source.metadata },
    };

    this.contexts.set(id, cloned);
    return cloned;
  }

  /**
   * Merge two contexts
   */
  mergeContexts(sourceId: string, targetId: string): boolean {
    const source = this.contexts.get(sourceId);
    const target = this.contexts.get(targetId);

    if (!source || !target) return false;

    // Merge messages
    target.messages.push(...source.messages);

    // Merge variables (target takes precedence)
    Object.assign(target.variables, source.variables);

    // Merge metadata
    if (source.metadata && target.metadata) {
      Object.assign(target.metadata, source.metadata);
    }

    return true;
  }

  /**
   * Prune old messages from context
   */
  pruneMessages(conversationId: string, maxMessages: number): number {
    const context = this.contexts.get(conversationId);
    if (!context) return 0;

    const originalLength = context.messages.length;
    if (originalLength > maxMessages) {
      // Keep system messages and recent messages
      const systemMessages = context.messages.filter(m => m.role === 'system');
      const otherMessages = context.messages.filter(m => m.role !== 'system');
      const recentMessages = otherMessages.slice(-maxMessages);
      
      context.messages = [...systemMessages, ...recentMessages];
      return originalLength - context.messages.length;
    }

    return 0;
  }

  /**
   * Get all context IDs
   */
  getAllContextIds(): string[] {
    return Array.from(this.contexts.keys());
  }

  /**
   * Get number of active contexts
   */
  getContextCount(): number {
    return this.contexts.size;
  }

  /**
   * Clear all contexts (use with caution)
   */
  clearAllContexts(): void {
    this.contexts.clear();
  }

  private generateContextId(): string {
    return `ctx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

// Export singleton instance
export const contextManager = new AIContextManager();
