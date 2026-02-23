import { BaseLLMProvider } from './BaseLLMProvider';
import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';
import axios from 'axios';

/**
 * Custom LLM Provider for self-hosted or compatible APIs
 * Supports OpenAI-compatible endpoints
 */
export class CustomProvider extends BaseLLMProvider {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: LLMConfig) {
    super(config);
    this.validateConfig();
    
    if (!config.baseUrl) {
      throw new Error('Base URL is required for custom provider');
    }
    
    this.baseUrl = config.baseUrl;
    this.apiKey = config.apiKey;
  }

  async complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const config = this.mergeConfig(options);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stopSequences,
      },
      { headers }
    );

    const choice = response.data.choices[0];
    const usage: TokenUsage = {
      promptTokens: response.data.usage?.prompt_tokens || 0,
      completionTokens: response.data.usage?.completion_tokens || 0,
      totalTokens: response.data.usage?.total_tokens || 0,
      cost: 0, // Custom providers don't have standard pricing
    };

    return {
      content: choice.message.content || '',
      finishReason: choice.finish_reason as any,
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
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.apiKey) {
      headers['Authorization'] = `Bearer ${this.apiKey}`;
    }

    const response = await axios.post(
      `${this.baseUrl}/v1/chat/completions`,
      {
        model: config.model,
        messages: messages.map(msg => ({
          role: msg.role,
          content: msg.content,
        })),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stopSequences,
        stream: true,
      },
      {
        headers,
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            
            try {
              const parsed = JSON.parse(data);
              const content = parsed.choices[0]?.delta?.content || '';
              if (content) {
                fullContent += content;
                onChunk(content);
              }
              
              if (parsed.usage) {
                promptTokens = parsed.usage.prompt_tokens;
                completionTokens = parsed.usage.completion_tokens;
              }
            } catch (e) {
              // Skip malformed chunks
            }
          }
        }
      });

      response.data.on('end', () => {
        const usage: TokenUsage = {
          promptTokens,
          completionTokens,
          totalTokens: promptTokens + completionTokens,
          cost: 0,
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

  protected calculateCost(_usage: TokenUsage): number {
    // Custom providers don't have standard pricing
    return 0;
  }
}
