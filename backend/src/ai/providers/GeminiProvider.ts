import { BaseLLMProvider } from './BaseLLMProvider';
import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';
import axios from 'axios';

interface GeminiMessage {
  role: string;
  parts: Array<{ text: string }>;
}

interface GeminiResponse {
  candidates: Array<{
    content: {
      parts: Array<{ text: string }>;
      role: string;
    };
    finishReason: string;
    index: number;
  }>;
  usageMetadata: {
    promptTokenCount: number;
    candidatesTokenCount: number;
    totalTokenCount: number;
  };
}

/**
 * Google Gemini LLM Provider
 */
export class GeminiProvider extends BaseLLMProvider {
  private apiKey: string;
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.validateConfig();
    this.apiKey = config.apiKey || process.env.GEMINI_API_KEY || '';
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';

    if (!this.apiKey) {
      throw new Error('Gemini API key is required');
    }
  }

  async complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const config = this.mergeConfig(options);
    const formattedMessages = this.formatMessages(messages);

    const response = await axios.post<GeminiResponse>(
      `${this.baseUrl}/models/${config.model}:generateContent?key=${this.apiKey}`,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
          stopSequences: config.stopSequences,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const candidate = response.data.candidates[0];
    const usage: TokenUsage = {
      promptTokens: response.data.usageMetadata.promptTokenCount,
      completionTokens: response.data.usageMetadata.candidatesTokenCount,
      totalTokens: response.data.usageMetadata.totalTokenCount,
      cost: this.calculateCost({
        promptTokens: response.data.usageMetadata.promptTokenCount,
        completionTokens: response.data.usageMetadata.candidatesTokenCount,
        totalTokens: response.data.usageMetadata.totalTokenCount,
      }),
    };

    return {
      content: candidate.content.parts[0]?.text || '',
      finishReason: this.mapFinishReason(candidate.finishReason),
      usage,
      model: config.model,
    };
  }

  async streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse> {
    const config = this.mergeConfig(options);
    const formattedMessages = this.formatMessages(messages);
    let fullContent = '';
    let promptTokens = 0;
    let completionTokens = 0;

    const response = await axios.post(
      `${this.baseUrl}/models/${config.model}:streamGenerateContent?key=${this.apiKey}`,
      {
        contents: formattedMessages,
        generationConfig: {
          temperature: config.temperature ?? 0.7,
          topP: config.topP,
          maxOutputTokens: config.maxTokens,
          stopSequences: config.stopSequences,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
        responseType: 'stream',
      }
    );

    return new Promise((resolve, reject) => {
      response.data.on('data', (chunk: Buffer) => {
        const lines = chunk.toString().split('\n').filter(line => line.trim() !== '');
        
        for (const line of lines) {
          try {
            const parsed = JSON.parse(line);
            const content = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
            
            if (content) {
              fullContent += content;
              onChunk(content);
            }
            
            if (parsed.usageMetadata) {
              promptTokens = parsed.usageMetadata.promptTokenCount;
              completionTokens = parsed.usageMetadata.candidatesTokenCount;
            }
          } catch (e) {
            // Skip malformed chunks
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
    // Pricing per 1M tokens (as of 2026)
    const pricing: Record<string, { prompt: number; completion: number }> = {
      'gemini-pro': { prompt: 0.5, completion: 1.5 },
      'gemini-1.5-pro': { prompt: 1.25, completion: 5 },
      'gemini-1.5-flash': { prompt: 0.075, completion: 0.3 },
      'gemini-ultra': { prompt: 2, completion: 6 },
    };

    const modelKey = Object.keys(pricing).find(key => this.config.model.includes(key)) || 'gemini-pro';
    const modelPricing = pricing[modelKey];
    const promptCost = (usage.promptTokens / 1000000) * modelPricing.prompt;
    const completionCost = (usage.completionTokens / 1000000) * modelPricing.completion;

    return promptCost + completionCost;
  }

  private formatMessages(messages: Message[]): GeminiMessage[] {
    return messages
      .filter(msg => msg.role !== 'system') // Gemini handles system messages differently
      .map(msg => ({
        role: msg.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: msg.content }],
      }));
  }

  private mapFinishReason(reason: string): 'stop' | 'length' | 'function_call' | 'content_filter' {
    switch (reason) {
      case 'STOP':
        return 'stop';
      case 'MAX_TOKENS':
        return 'length';
      case 'SAFETY':
        return 'content_filter';
      default:
        return 'stop';
    }
  }
}
