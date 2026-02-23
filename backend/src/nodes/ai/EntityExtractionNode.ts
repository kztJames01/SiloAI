import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Entity Extraction Node - Extract entities from text
 */
export class EntityExtractionNode implements INode {
  definition: NodeDefinition = {
    type: 'entityExtraction',
    name: 'Entity Extraction',
    description: 'Extract structured entities from unstructured text',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🔍',
    inputs: [
      {
        name: 'text',
        type: 'string',
        required: true,
        description: 'Text to extract entities from',
      },
      {
        name: 'entityTypes',
        type: 'array',
        required: true,
        description: 'Types of entities to extract (e.g., names, dates, locations)',
      },
      {
        name: 'schema',
        type: 'object',
        description: 'JSON schema for structured extraction',
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
        name: 'entities',
        type: 'object',
        description: 'Extracted entities',
      },
      {
        name: 'count',
        type: 'number',
        description: 'Number of entities extracted',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      text,
      entityTypes,
      schema,
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

    const schemaString = schema
      ? `\n\nUse this schema:\n${JSON.stringify(schema, null, 2)}`
      : '';

    const messages: Message[] = [
      {
        role: 'system',
        content: 'You are an entity extraction expert. Extract entities accurately and return them as JSON.',
      },
      {
        role: 'user',
        content: `Extract the following entity types from the text: ${entityTypes.join(', ')}

Text: "${text}"
${schemaString}

Return a JSON object with extracted entities.`,
      },
    ];

    const result = await llmProvider.complete(messages);

    // Parse JSON response
    try {
      const entities = JSON.parse(result.content);
      const count = Object.values(entities).reduce((acc: number, val: any) => {
        return acc + (Array.isArray(val) ? val.length : 1);
      }, 0);

      return {
        entities,
        count,
      };
    } catch (error) {
      return {
        entities: {},
        count: 0,
      };
    }
  }
}
