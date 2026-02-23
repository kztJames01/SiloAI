import { LLMConfig, LLMResponse, Message, TokenUsage } from '../../../../shared/src/types/ai';

/**
 * Abstract base class for LLM providers
 */
export abstract class BaseLLMProvider {
  protected config: LLMConfig;

  constructor(config: LLMConfig) {
    this.config = config;
  }

  /**
   * Generate a completion from the LLM
   */
  abstract complete(messages: Message[], options?: Partial<LLMConfig>): Promise<LLMResponse>;

  /**
   * Stream a completion from the LLM
   */
  abstract streamComplete(
    messages: Message[],
    onChunk: (chunk: string) => void,
    options?: Partial<LLMConfig>
  ): Promise<LLMResponse>;

  /**
   * Calculate token usage and cost
   */
  protected abstract calculateCost(usage: TokenUsage): number;

  /**
   * Validate the configuration
   */
  protected validateConfig(): void {
    if (!this.config.model) {
      throw new Error('Model is required');
    }
  }

  /**
   * Merge configuration with runtime options
   */
  protected mergeConfig(options?: Partial<LLMConfig>): LLMConfig {
    return {
      ...this.config,
      ...options,
    };
  }
}
