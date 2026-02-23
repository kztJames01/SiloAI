import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Conversation Node - Multi-turn conversations with memory
 */
export class ConversationNode implements INode {
  definition: NodeDefinition = {
    type: 'conversation',
    name: 'Conversation',
    description: 'Multi-turn conversation with context memory',
    category: 'AI',
    color: '#8b5cf6',
    icon: '💬',
    inputs: [
      {
        name: 'message',
        type: 'string',
        required: true,
        description: 'User message',
      },
      {
        name: 'conversationId',
        type: 'string',
        description: 'Conversation ID to maintain context',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description: 'System prompt for conversation behavior',
      },
      {
        name: 'maxHistory',
        type: 'number',
        default: 10,
        description: 'Maximum messages to keep in history',
      },
      {
        name: 'provider',
        type: 'string',
        default: 'openai',
        description: 'LLM provider',
      },
      {
        name: 'model',
        type: 'string',
        default: 'gpt-4o',
        description: 'Model name',
      },
      {
        name: 'apiKey',
        type: 'string',
        description: 'API key',
      },
    ],
    outputs: [
      {
        name: 'response',
        type: 'string',
        description: 'Assistant response',
      },
      {
        name: 'conversationId',
        type: 'string',
        description: 'Conversation ID for next message',
      },
      {
        name: 'messageCount',
        type: 'number',
        description: 'Number of messages in conversation',
      },
    ],
  };

  // Simple in-memory storage (in production, use database)
  private static conversations: Map<string, Message[]> = new Map();

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      message,
      conversationId,
      systemPrompt,
      maxHistory = 10,
      provider = 'openai',
      model = 'gpt-4o',
      apiKey,
    } = data;

    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      temperature: 0.7,
    };

    const llmProvider = LLMProviderFactory.createProvider(config);

    // Get or create conversation history
    const convId = conversationId || this.generateConversationId();
    let history = ConversationNode.conversations.get(convId) || [];

    // Build messages
    const messages: Message[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    // Add conversation history (limited by maxHistory)
    const recentHistory = history.slice(-maxHistory);
    messages.push(...recentHistory);

    // Add current user message
    messages.push({ role: 'user', content: message });

    // Generate response
    const result = await llmProvider.complete(messages);

    // Update conversation history
    history.push({ role: 'user', content: message });
    history.push({ role: 'assistant', content: result.content });

    // Store updated history
    ConversationNode.conversations.set(convId, history);

    return {
      response: result.content,
      conversationId: convId,
      messageCount: history.length,
    };
  }

  private generateConversationId(): string {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Clear conversation history
  static clearConversation(conversationId: string): void {
    this.conversations.delete(conversationId);
  }
}
