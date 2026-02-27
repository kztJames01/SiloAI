import { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/Card';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface LLMConfigProps {
  config?: {
    provider: string;
    model: string;
    apiKey?: string;
    baseUrl?: string;
    temperature?: number;
    maxTokens?: number;
  };
  onChange: (config: any) => void;
}

export function LLMConfigPanel({ config, onChange }: LLMConfigProps) {
  const [provider, setProvider] = useState(config?.provider || 'openai');
  const [model, setModel] = useState(config?.model || 'gpt-4o');
  const [apiKey, setApiKey] = useState(config?.apiKey || '');
  const [baseUrl, setBaseUrl] = useState(config?.baseUrl || '');
  const [temperature, setTemperature] = useState(config?.temperature || 0.7);
  const [maxTokens, setMaxTokens] = useState(config?.maxTokens || 4096);

  const handleSave = () => {
    onChange({
      provider,
      model,
      apiKey: apiKey || undefined,
      baseUrl: baseUrl || undefined,
      temperature,
      maxTokens,
    });
  };

  const providerModels: Record<string, string[]> = {
    openai: ['gpt-4o', 'gpt-4-turbo', 'gpt-4', 'gpt-3.5-turbo'],
    anthropic: ['claude-3-5-sonnet-20241022', 'claude-3-opus', 'claude-3-sonnet', 'claude-3-haiku'],
    gemini: ['gemini-1.5-pro', 'gemini-1.5-flash', 'gemini-pro', 'gemini-ultra'],
    ollama: ['llama3', 'mistral', 'codellama', 'phi', 'neural-chat'],
    custom: [],
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>LLM Configuration</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Provider Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Provider</label>
          <select
            value={provider}
            onChange={(e) => {
              setProvider(e.target.value);
              // Set default model for provider
              const models = providerModels[e.target.value];
              if (models.length > 0) setModel(models[0]);
            }}
            className="w-full px-3 py-2 border rounded-md"
          >
            <option value="openai">OpenAI</option>
            <option value="anthropic">Anthropic (Claude)</option>
            <option value="gemini">Google Gemini</option>
            <option value="ollama">Ollama (Self-hosted)</option>
            <option value="custom">Custom Endpoint</option>
          </select>
        </div>

        {/* Model Selection */}
        <div>
          <label className="block text-sm font-medium mb-1">Model</label>
          {providerModels[provider].length > 0 ? (
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className="w-full px-3 py-2 border rounded-md"
            >
              {providerModels[provider].map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          ) : (
            <Input
              value={model}
              onChange={(e) => setModel(e.target.value)}
              placeholder="Enter model name"
            />
          )}
        </div>

        {/* API Key */}
        {provider !== 'ollama' && (
          <div>
            <label className="block text-sm font-medium mb-1">
              API Key {provider === 'custom' && '(optional)'}
            </label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder={`Enter ${provider} API key or leave empty to use environment variable`}
            />
          </div>
        )}

        {/* Base URL */}
        {(provider === 'ollama' || provider === 'custom') && (
          <div>
            <label className="block text-sm font-medium mb-1">Base URL</label>
            <Input
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              placeholder={
                provider === 'ollama'
                  ? 'http://localhost:11434'
                  : 'https://your-api.com/v1'
              }
            />
          </div>
        )}

        {/* Temperature */}
        <div>
          <label className="block text-sm font-medium mb-1">
            Temperature: {temperature}
          </label>
          <input
            type="range"
            min="0"
            max="2"
            step="0.1"
            value={temperature}
            onChange={(e) => setTemperature(parseFloat(e.target.value))}
            className="w-full"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Precise</span>
            <span>Balanced</span>
            <span>Creative</span>
          </div>
        </div>

        {/* Max Tokens */}
        <div>
          <label className="block text-sm font-medium mb-1">Max Tokens</label>
          <Input
            type="number"
            value={maxTokens}
            onChange={(e) => setMaxTokens(parseInt(e.target.value))}
            min={1}
            max={128000}
          />
        </div>

        <Button onClick={handleSave} className="w-full">
          Save Configuration
        </Button>

        {/* Info Box */}
        <div className="p-3 bg-info/10 border border-info/20 rounded-md text-sm">
          <p className="font-semibold mb-1">💡 Data Privacy</p>
          <p className="text-foreground">
            {provider === 'ollama'
              ? 'Using Ollama means your data stays on your own server. No external API calls.'
              : provider === 'custom'
              ? 'Custom endpoints allow you to use your own hosted models for full data control.'
              : 'Consider using Ollama or a custom endpoint for sensitive data.'}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
