import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * LLM Completion Node - Generate text using LLM
 */
export class LLMCompletionNode implements INode {
  definition: NodeDefinition = {
    type: 'llmCompletion',
    name: 'LLM Completion',
    description: 'Generate text completions using various LLM providers (OpenAI, Claude, Gemini, Ollama)',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🤖',
    inputs: [
      {
        name: 'provider',
        type: 'string',
        required: true,
        default: 'openai',
        description: 'LLM provider (openai, anthropic, gemini, ollama, custom)',
      },
      {
        name: 'model',
        type: 'string',
        required: true,
        default: 'gpt-4o',
        description: 'Model name',
      },
      {
        name: 'apiKey',
        type: 'string',
        description: 'API key (leave empty to use environment variable)',
      },
      {
        name: 'baseUrl',
        type: 'string',
        description: 'Base URL for custom/self-hosted models',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description: 'System prompt to set behavior',
      },
      {
        name: 'prompt',
        type: 'string',
        required: true,
        description: 'User prompt/message',
      },
      {
        name: 'temperature',
        type: 'number',
        default: 0.7,
        description: 'Temperature (0-2)',
      },
      {
        name: 'maxTokens',
        type: 'number',
        description: 'Maximum tokens to generate',
      },
      {
        name: 'stream',
        type: 'boolean',
        default: false,
        description: 'Enable streaming response',
      },
    ],
    outputs: [
      {
        name: 'response',
        type: 'string',
        description: 'Generated text response',
      },
      {
        name: 'usage',
        type: 'object',
        description: 'Token usage and cost information',
      },
      {
        name: 'model',
        type: 'string',
        description: 'Model used for completion',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      provider = 'openai',
      model,
      apiKey,
      baseUrl,
      systemPrompt,
      prompt,
      temperature = 0.7,
      maxTokens,
      stream = false,
    } = data;

    // Build LLM config
    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      baseUrl,
      temperature,
      maxTokens,
    };

    // Get or create provider
    const llmProvider = LLMProviderFactory.createProvider(config);

    // Build messages
    const messages: Message[] = [];
    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }
    messages.push({ role: 'user', content: prompt });

    // Generate completion
    let result;
    if (stream) {
      const chunks: string[] = [];
      result = await llmProvider.streamComplete(messages, (chunk) => {
        chunks.push(chunk);
        // Could emit streaming events here
      });
    } else {
      result = await llmProvider.complete(messages);
    }

    return {
      response: result.content,
      usage: result.usage,
      model: result.model,
    };
  }
}
