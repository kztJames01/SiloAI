import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { PromptTemplateEngine, PromptLibrary } from '../../ai/PromptTemplateEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig } from '../../../../shared/src/types/ai';

/**
 * Prompt Template Node - Use predefined or custom prompt templates
 */
export class PromptTemplateNode implements INode {
  definition: NodeDefinition = {
    type: 'promptTemplate',
    name: 'Prompt Template',
    description: 'Use prompt templates with variable substitution',
    category: 'AI',
    color: '#8b5cf6',
    icon: '📝',
    inputs: [
      {
        name: 'templateId',
        type: 'string',
        description: 'Template ID from library (or leave empty for custom)',
      },
      {
        name: 'customTemplate',
        type: 'string',
        description: 'Custom template string (use {{ variable }} syntax)',
      },
      {
        name: 'systemPrompt',
        type: 'string',
        description: 'System prompt template',
      },
      {
        name: 'variables',
        type: 'object',
        required: true,
        description: 'Variables to substitute in template',
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
        required: true,
        default: 'gpt-4o',
        description: 'Model name',
      },
      {
        name: 'apiKey',
        type: 'string',
        description: 'API key',
      },
      {
        name: 'baseUrl',
        type: 'string',
        description: 'Base URL for custom models',
      },
      {
        name: 'temperature',
        type: 'number',
        default: 0.7,
        description: 'Temperature',
      },
    ],
    outputs: [
      {
        name: 'response',
        type: 'string',
        description: 'Generated response',
      },
      {
        name: 'renderedPrompt',
        type: 'string',
        description: 'The rendered prompt that was sent',
      },
      {
        name: 'usage',
        type: 'object',
        description: 'Token usage',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      templateId,
      customTemplate,
      systemPrompt,
      variables,
      provider = 'openai',
      model,
      apiKey,
      baseUrl,
      temperature = 0.7,
    } = data;

    // Get or create template
    let template;
    if (templateId) {
      template = PromptLibrary.get(templateId);
      if (!template) {
        throw new Error(`Template with ID "${templateId}" not found`);
      }
    } else if (customTemplate) {
      template = PromptTemplateEngine.createTemplate(
        'custom',
        customTemplate,
        systemPrompt
      );
    } else {
      throw new Error('Either templateId or customTemplate must be provided');
    }

    // Build messages from template
    const messages = PromptTemplateEngine.buildMessages(template, variables, false);

    // Create LLM provider
    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      baseUrl,
      temperature,
    };
    const llmProvider = LLMProviderFactory.createProvider(config);

    // Generate completion
    const result = await llmProvider.complete(messages);

    return {
      response: result.content,
      renderedPrompt: messages[messages.length - 1].content,
      usage: result.usage,
    };
  }
}
