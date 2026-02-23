import { BaseLLMProvider } from './BaseLLMProvider';
import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';
import axios from 'axios';

interface OpenAIMessage {
  role: string;
  content: string;
  name?: string;
  function_call?: any;
}

interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
      function_call?: any;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * OpenAI LLM Provider (GPT-3.5, GPT-4, etc.)
 */
export class OpenAIProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.validateConfig();
    this.apiKey = config.apiKey || process.env.OPENAI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://api.openai.com/v1';

    if (!this.apiKey) {
      throw new Error('OpenAI API key is required');
    }
  }

  async complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const config = this.mergeConfig(options);

    const response = await axios.post<OpenAIResponse>(
      `${this.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages: this.formatMessages(messages),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stopSequences,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const choice = response.data.choices[0];
    const usage: TokenUsage = {
      promptTokens: response.data.usage.prompt_tokens,
      completionTokens: response.data.usage.completion_tokens,
      totalTokens: response.data.usage.total_tokens,
      cost: this.calculateCost({
        promptTokens: response.data.usage.prompt_tokens,
        completionTokens: response.data.usage.completion_tokens,
        totalTokens: response.data.usage.total_tokens,
      }),
    };

    return {
      content: choice.message.content || '',
      finishReason: choice.finish_reason as any,
      usage,
      model: response.data.model,
      functionCall: choice.message.function_call,
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

    const response = await axios.post(
      `${this.baseUrl}/chat/completions`,
      {
        model: config.model,
        messages: this.formatMessages(messages),
        temperature: config.temperature ?? 0.7,
        max_tokens: config.maxTokens,
        top_p: config.topP,
        frequency_penalty: config.frequencyPenalty,
        presence_penalty: config.presencePenalty,
        stop: config.stopSequences,
        stream: true,
      },
      {
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
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
          cost: this.calculateCost({ promptTokens, completionTokens, totalTokens: promptTokens + completionTokens }),
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
    // Pricing per 1K tokens (as of 2026)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gpt-4': { prompt: 0.03, completion: 0.06 },
      'gpt-4-turbo': { prompt: 0.01, completion: 0.03 },
      'gpt-4o': { prompt: 0.005, completion: 0.015 },
      'gpt-3.5-turbo': { prompt: 0.0005, completion: 0.0015 },
    };

    const modelPricing = pricing[this.config.model] || pricing['gpt-3.5-turbo'];
    const promptCost = (usage.promptTokens / 1000) * modelPricing.prompt;
    const completionCost = (usage.completionTokens / 1000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  private formatMessages(messages: Message[]): OpenAIMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
      name: msg.name,
      function_call: msg.functionCall,
    }));
  }
}
