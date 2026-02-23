import { BaseLLMProvider } from './BaseLLMProvider';
import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';
import axios from 'axios';

interface AnthropicMessage {
  role: string;
  content: string;
}

interface AnthropicResponse {
  id: string;
  type: string;
  role: string;
  content: Array<{
    type: string;
    text: string;
  }>;
  model: string;
  stop_reason: string;
  usage: {
    input_tokens: number;
    output_tokens: number;
  };
}

/**
 * Anthropic LLM Provider (Claude 3, etc.)
 */
export class AnthropicProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.validateConfig();
    this.apiKey = config.apiKey || process.env.ANTHROPIC_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.anthropic.com/v1';

    if (!this.apiKey) {
      throw new Error('Anthropic API key is required');
    }
  }

  async complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const config = this.mergeConfig(options);
    const { system, formattedMessages } = this.formatMessages(messages);

    const response = await axios.post<AnthropicResponse>(
      `${this.baseUrl}/messages`,
      {
        model: config.model,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        top_p: config.topP,
        system,
        messages: formattedMessages,
        stop_sequences: config.stopSequences,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
      }
    );

    const usage: TokenUsage = {
      promptTokens: response.data.usage.input_tokens,
      completionTokens: response.data.usage.output_tokens,
      totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      cost: this.calculateCost({
        promptTokens: response.data.usage.input_tokens,
        completionTokens: response.data.usage.output_tokens,
        totalTokens: response.data.usage.input_tokens + response.data.usage.output_tokens,
      }),
    };

    return {
      content: response.data.content[0]?.text || '',
      finishReason: this.mapStopReason(response.data.stop_reason),
      usage,
      model: response.data.model,
    };
  }

  async streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const config = this.mergeConfig(options);
    const { system, formattedMessages } = this.formatMessages(messages);
    let fullContent = '';
    let inputTokens = 0;
    let outputTokens = 0;

    const response = await axios.post(
      `${this.baseUrl}/messages`,
      {
        model: config.model,
        max_tokens: config.maxTokens || 4096,
        temperature: config.temperature ?? 0.7,
        top_p: config.topP,
        system,
        messages: formattedMessages,
        stop_sequences: config.stopSequences,
        stream: true,
      },
      {
        headers: {
          'x-api-key': this.apiKey,
          'anthropic-version': '2023-06-01',
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            
            try {
              const parsed = JSON.parse(data);
              
              if (parsed.type === 'content_block_delta') {
                const content = parsed.delta?.text || '';
                if (content) {
                  fullContent += content;
                  onChunk(content);
                }
              }
              
              if (parsed.type === 'message_start') {
                inputTokens = parsed.message?.usage?.input_tokens || 0;
              }
              
              if (parsed.type === 'message_delta') {
                outputTokens = parsed.usage?.output_tokens || 0;
              }
            } catch (e) {
              // Skip malformed chunks
            }
          }
        }
      });

      response.data.on('end', () => {
        const usage: TokenUsage = {
          promptTokens: inputTokens,
          completionTokens: outputTokens,
          totalTokens: inputTokens + outputTokens,
          cost: this.calculateCost({ promptTokens: inputTokens, completionTokens: outputTokens, totalTokens: inputTokens + outputTokens }),
        };

        resolve({
          content: fullContent,
          finishReason: 'stop',
          usage,
          model: config.model,
        });
      });

      response.data.on('error', reject);
    });
  }

  protected calculateCost(usage: TokenUsage): number {
    // Pricing per 1M tokens (as of 2026)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'claude-3-opus': { prompt: 15, completion: 75 },
      'claude-3-sonnet': { prompt: 3, completion: 15 },
      'claude-3-haiku': { prompt: 0.25, completion: 1.25 },
      'claude-3-5-sonnet': { prompt: 3, completion: 15 },
    };

    const modelPricing = pricing[this.config.model] || pricing['claude-3-sonnet'];
    const promptCost = (usage.promptTokens / 1000000) * modelPricing.prompt;
    const completionCost = (usage.completionTokens / 1000000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  private formatMessages(messages: Message[]): { system?: string; formattedMessages: AnthropicMessage[] } {
    let system: string | undefined;
    const formattedMessages: AnthropicMessage[] = [];

    for (const msg of messages) {
      if (msg.role === 'system') {
        system = msg.content;
      } else {
        formattedMessages.push({
          role: msg.role === 'assistant' ? 'assistant' : 'user',
          content: msg.content,
        });
      }
    }

    return { system, formattedMessages };
  }

  private mapStopReason(reason: string): 'stop' | 'length' | 'function_call' | 'content_filter' {
    switch (reason) {
      case 'end_turn':
        return 'stop';
      case 'max_tokens':
        return 'length';
      case 'stop_sequence':
        return 'stop';
      default:
        return 'stop';
    }
  }
}
