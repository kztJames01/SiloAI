import { LLMProviderFactory } from '../ai/providers';

describe('LLMProviderFactory', () => {
  describe('createProvider', () => {
    it('throws for unknown provider', () => {
      expect(() =>
        LLMProviderFactory.createProvider({ provider: 'unknown' as any, model: 'test' })
      ).toThrow('Unsupported LLM provider');
    });

    it('throws when openai api key is missing', () => {
      delete process.env.OPENAI_API_KEY;
      expect(() =>
        LLMProviderFactory.createProvider({ provider: 'openai', model: 'gpt-4o' })
      ).toThrow();
    });

    it('creates openrouter provider with api key', () => {
      process.env.OPENROUTER_API_KEY = 'sk-or-test-key';
      const provider = LLMProviderFactory.createProvider({
        provider: 'openrouter',
        model: 'openai/gpt-4o',
      });
      expect(provider).toBeDefined();
      delete process.env.OPENROUTER_API_KEY;
    });

    it('getDefaultConfig returns model for each provider', () => {
      const providers = ['openai', 'anthropic', 'gemini', 'ollama', 'openrouter', 'custom'] as const;
      for (const p of providers) {
        const config = LLMProviderFactory.getDefaultConfig(p);
        expect(config).toBeDefined();
      }
    });

    it('openrouter default config uses openrouter base url', () => {
      const config = LLMProviderFactory.getDefaultConfig('openrouter');
      expect(config.baseUrl).toBe('https://openrouter.ai/api/v1');
    });
  });
});
