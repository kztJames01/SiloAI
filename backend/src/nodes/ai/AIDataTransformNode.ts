import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Data Transformation Node - Transform data using AI
 */
export class AIDataTransformNode implements INode {
  definition: NodeDefinition = {
    type: 'aiDataTransform',
    name: 'AI Data Transform',
    description: 'Transform data from one format to another using AI',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🔄',
    inputs: [
      {
        name: 'data',
        type: 'any',
        required: true,
        description: 'Input data to transform',
      },
      {
        name: 'instructions',
        type: 'string',
        required: true,
        description: 'Transformation instructions',
      },
      {
        name: 'outputFormat',
        type: 'string',
        default: 'json',
        description: 'Desired output format (json, csv, xml, etc.)',
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
        name: 'transformed',
        type: 'any',
        description: 'Transformed data',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      data: inputData,
      instructions,
      outputFormat = 'json',
      provider = 'openai',
      model = 'gpt-4o',
      apiKey,
    } = data;

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
        content: 'You are a data transformation expert. Transform data accurately according to instructions.',
      },
      {
        role: 'user',
        content: `Transform the following data according to the instructions.

Data:
${JSON.stringify(inputData, null, 2)}

Instructions: ${instructions}

Output format: ${outputFormat}

Return only the transformed data, no explanations.`,
      },
    ];

    const result = await llmProvider.complete(messages);

    // Try to parse if JSON
    if (outputFormat.toLowerCase() === 'json') {
      try {
        return {
          transformed: JSON.parse(result.content),
        };
      } catch {
        return {
          transformed: result.content,
        };
      }
    }

    return {
      transformed: result.content,
    };
  }
}
