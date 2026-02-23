import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Text Classification Node - Classify text into categories
 */
export class TextClassificationNode implements INode {
  definition: NodeDefinition = {
    type: 'textClassification',
    name: 'Text Classification',
    description: 'Classify text into predefined categories using AI',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🏷️',
    inputs: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to classify',
      },
      {
        name: 'categories',
        type: 'array',
        required: true,
        description: 'List of possible categories',
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
        name: 'category',
        type: 'string',
        description: 'Predicted category',
      },
      {
        name: 'confidence',
        type: 'number',
        description: 'Confidence score (0-1)',
      },
      {
        name: 'allScores',
        type: 'object',
        description: 'All category scores',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { text, categories, provider = 'openai', model = 'gpt-4o', apiKey } = data;

    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      temperature: 0.3, // Lower temperature for more consistent classification
    };

    const llmProvider = LLMProviderFactory.createProvider(config);

    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are a text classification expert. Classify text accurately and provide confidence scores in JSON format.',
      },
      {
        role: 'user',
        content: `Classify the following text into one of these categories: ${categories.join(', ')}

Text: "${text}"

Respond with JSON only:
{
  "category": "selected_category",
  "confidence": 0.95,
  "scores": {
    "category1": 0.95,
    "category2": 0.03,
    "category3": 0.02
  }
}`,
      },
    ];

    const result = await llmProvider.complete(messages);

    // Parse JSON response
    try {
      const parsed = JSON.parse(result.content);
      return {
        category: parsed.category,
        confidence: parsed.confidence,
        allScores: parsed.scores,
      };
    } catch (error) {
      // Fallback if parsing fails
      return {
        category: categories[0],
        confidence: 0.5,
        allScores: {},
      };
    }
  }
}
