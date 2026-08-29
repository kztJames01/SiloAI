/// <reference types="node" />
import { OpenAIProvider } from './OpenAIProvider';
import { LLMConfig, TokenUsage } from '../../../../shared/src/types/ai'; // TokenUsage used in calculateCost

// OpenRouter is OpenAI-compatible, just needs different base URL + headers
export class OpenRouterProvider extends OpenAIProvider {
  constructor(config: LLMConfig) {
    const openRouterConfig: LLMConfig = {
      ...config,
      baseUrl: config.baseUrl || 'https://openrouter.ai/api/v1',
      apiKey: config.apiKey || process.env.OPENROUTER_API_KEY || '',
    };
    super(openRouterConfig);
  }

  protected calculateCost(usage: TokenUsage): number {
    // OpenRouter pricing varies by model, estimate with a generic rate
    const promptCost = (usage.promptTokens / 1000) * 0.001;
    const completionCost = (usage.completionTokens / 1000) * 0.002;
    return promptCost + completionCost;
  }
}
