import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Sentiment Analysis Node - Analyze sentiment of text
 */
export class SentimentAnalysisNode implements INode {
  definition: NodeDefinition = {
    type: 'sentimentAnalysis',
    name: 'Sentiment Analysis',
    description: 'Analyze the sentiment and emotion in text',
    category: 'AI',
    color: '#8b5cf6',
    icon: '😊',
    inputs: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to analyze',
      },
      {
        name: 'provider',
        type: 'string',
        default: 'openai',
        description: 'LLM provider',
      },
      {
        name: 'model',
        type: 'string',
        default: 'gpt-4o',
        description: 'Model name',
      },
      {
        name: 'apiKey',
        type: 'string',
        description: 'API key',
      },
    ],
    outputs: [
      {
        name: 'sentiment',
        type: 'string',
        description: 'Overall sentiment (positive, negative, neutral)',
      },
      {
        name: 'score',
        type: 'number',
        description: 'Sentiment score (-1 to 1)',
      },
      {
        name: 'emotions',
        type: 'object',
        description: 'Detected emotions with scores',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { text, provider = 'openai', model = 'gpt-4o', apiKey } = data;

    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      temperature: 0.3,
    };

    const llmProvider = LLMProviderFactory.createProvider(config);

    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a sentiment analysis expert. Analyze text sentiment and emotions accurately.',
      },
      {
        role: 'user',
        content: `Analyze the sentiment of this text: "${text}"

Return JSON with:
{
  "sentiment": "positive|negative|neutral",
  "score": -1 to 1,
  "emotions": {
    "joy": 0-1,
    "anger": 0-1,
    "sadness": 0-1,
    "fear": 0-1,
    "surprise": 0-1
  }
}`,
      },
    ];

    const result = await llmProvider.complete(messages);

    try {
      const analysis = JSON.parse(result.content);
      return {
        sentiment: analysis.sentiment,
        score: analysis.score,
        emotions: analysis.emotions,
      };
    } catch (error) {
      return {
        sentiment: 'neutral',
        score: 0,
        emotions: {},
      };
    }
  }
}
