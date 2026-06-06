import { BaseLLMProvider } from './BaseLLMProvider';
import { OpenAIProvider } from './OpenAIProvider';
import { AnthropicProvider } from './AnthropicProvider';
import { GeminiProvider } from './GeminiProvider';
import { OllamaProvider } from './OllamaProvider';
import { CustomProvider } from './CustomProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { LLMConfig, LLMProvider as LLMProviderType } from '../../../../shared/src/types/ai';

export * from './BaseLLMProvider';
export * from './OpenAIProvider';
export * from './AnthropicProvider';
export * from './GeminiProvider';
export * from './OllamaProvider';
export * from './CustomProvider';
export * from './OpenRouterProvider';

export class LLMProviderFactory {
  static createProvider(config: LLMConfig): BaseLLMProvider {
    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'anthropic':
        return new AnthropicProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      case 'ollama':
        return new OllamaProvider(config);
      case 'openrouter':
        return new OpenRouterProvider(config);
      case 'custom':
        return new CustomProvider(config);
      default:
        throw new Error(`Unsupported LLM provider: ${config.provider}`);
    }
  }

  static getDefaultConfig(provider: LLMProviderType): Partial<LLMConfig> {
    switch (provider) {
      case 'openai':
        return { model: 'gpt-4o', temperature: 0.7, maxTokens: 4096 };
      case 'anthropic':
        return { model: 'claude-3-5-sonnet-20241022', temperature: 0.7, maxTokens: 4096 };
      case 'gemini':
        return { model: 'gemini-1.5-pro', temperature: 0.7, maxTokens: 8192 };
      case 'ollama':
        return { model: 'llama3', temperature: 0.7, baseUrl: 'http://localhost:11434' };
      case 'openrouter':
        return {
          model: 'openai/gpt-4o',
          temperature: 0.7,
          maxTokens: 4096,
          baseUrl: 'https://openrouter.ai/api/v1',
        };
      case 'custom':
        return { model: 'default', temperature: 0.7 };
      default:
        return {};
    }
  }
}
