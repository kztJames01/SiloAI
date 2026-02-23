import { BaseLLMProvider } from './BaseLLMProvider';
import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';
import axios from 'axios';

interface OllamaMessage {
  role: string;
  content: string;
}

interface OllamaResponse {
  model: string;
  created_at: string;
  message: {
    role: string;
    content: string;
  };
  done: boolean;
  total_duration?: number;
  load_duration?: number;
  prompt_eval_count?: number;
  eval_count?: number;
}

/**
 * Ollama LLM Provider (Self-hosted local models)
 */
export class OllamaProvider extends BaseLLMProvider {
  private baseUrl: string;

  constructor(config: LLMConfig) {
    super(config);
    this.validateConfig();
    this.baseUrl = config.baseUrl || process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
  }

  async complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse> {
    const config = this.mergeConfig(options);

    const response = await axios.post<OllamaResponse>(
      `${this.baseUrl}/api/chat`,
      {
        model: config.model,
        messages: this.formatMessages(messages),
        stream: false,
        options: {
          temperature: config.temperature ?? 0.7,
          top_p: config.topP,
          num_predict: config.maxTokens,
          stop: config.stopSequences,
        },
      },
      {
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    const usage: TokenUsage = {
      promptTokens: response.data.prompt_eval_count || 0,
      completionTokens: response.data.eval_count || 0,
      totalTokens: (response.data.prompt_eval_count || 0) + (response.data.eval_count || 0),
      cost: 0, // Local models are free
    };

    return {
      content: response.data.message.content,
      finishReason: 'stop',
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

    const response = await axios.post(
      `${this.baseUrl}/api/chat`,
      {
        model: config.model,
        messages: this.formatMessages(messages),
        stream: true,
        options: {
          temperature: config.temperature ?? 0.7,
          top_p: config.topP,
          num_predict: config.maxTokens,
          stop: config.stopSequences,
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
            const parsed: OllamaResponse = JSON.parse(line);
            const content = parsed.message?.content || '';
            
            if (content) {
              fullContent += content;
              onChunk(content);
            }
            
            if (parsed.done) {
              promptTokens = parsed.prompt_eval_count || 0;
              completionTokens = parsed.eval_count || 0;
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
          cost: 0, // Local models are free
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
    // Local models are free
    return 0;
  }

  private formatMessages(messages: Message[]): OllamaMessage[] {
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  /**
   * List available models from Ollama
   */
  async listModels(): Promise<string[]> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to list Ollama models:', error);
      return [];
    }
  }

  /**
   * Pull a model from Ollama library
   */
  async pullModel(modelName: string): Promise<void> {
    await axios.post(`${this.baseUrl}/api/pull`, {
      name: modelName,
    });
  }
}
