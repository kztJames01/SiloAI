import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import { LLMProviderFactory } from '../../ai/providers';
import { LLMConfig, Message } from '../../../../shared/src/types/ai';

/**
 * Workflow Generation Node - Generate workflows from natural language
 */
export class WorkflowGenerationNode implements INode {
  definition: NodeDefinition = {
    type: 'workflowGeneration',
    name: 'Workflow Generation',
    description: 'Generate workflow automation from natural language description',
    category: 'AI',
    color: '#8b5cf6',
    icon: '🎯',
    inputs: [
      {
        name: 'description',
        type: 'string',
        required: true,
        description: 'Natural language description of the workflow',
      },
      {
        name: 'requirements',
        type: 'array',
        description: 'Additional requirements or constraints',
      },
      {
        name: 'industry',
        type: 'string',
        description: 'Industry context (healthcare, manufacturing, etc.)',
      },
      {
        name: 'complexity',
        type: 'string',
        default: 'moderate',
        description: 'Workflow complexity (simple, moderate, complex)',
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
        name: 'workflow',
        type: 'object',
        description: 'Generated workflow structure',
      },
      {
        name: 'explanation',
        type: 'string',
        description: 'Explanation of the workflow',
      },
      {
        name: 'suggestions',
        type: 'array',
        description: 'Improvement suggestions',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const {
      description,
      requirements = [],
      industry = 'general',
      complexity = 'moderate',
      provider = 'openai',
      model = 'gpt-4o',
      apiKey,
    } = data;

    const config: LLMConfig = {
      provider,
      model,
      apiKey,
      temperature: 0.7,
    };

    const llmProvider = LLMProviderFactory.createProvider(config);

    const requirementsText = requirements.length > 0
      ? `\n\nRequirements:\n${requirements.map((r: string) => `- ${r}`).join('\n')}`
      : '';

    const messages: Message[] = [
      {
        role: 'system',
        content: `You are a workflow automation expert. Design efficient and practical workflows based on requirements.

Available node types:
- Core: httpRequest, dataTransform, webhook, schedule, code
- AI: llmCompletion, promptTemplate, aiAgent, textClassification, entityExtraction, sentimentAnalysis
- Logic: if, switch
- Field: workOrder, inventoryCheck, hazardReport, timeClock
- Healthcare: patientIntake, appointmentScheduler

Return a JSON structure with:
{
  "workflow": {
    "name": "Workflow Name",
    "description": "Description",
    "nodes": [
      {
        "id": "node_1",
        "type": "nodeType",
        "position": { "x": 100, "y": 100 },
        "data": { "label": "Node Label", "config": {} }
      }
    ],
    "edges": [
      { "id": "edge_1", "source": "node_1", "target": "node_2" }
    ]
  },
  "explanation": "How the workflow works",
  "suggestions": ["Suggestion 1", "Suggestion 2"]
}`,
      },
      {
        role: 'user',
        content: `Create a ${complexity} workflow for: ${description}

Industry: ${industry}${requirementsText}

Generate the workflow structure.`,
      },
    ];

    const result = await llmProvider.complete(messages);

    try {
      const generated = JSON.parse(result.content);
      return {
        workflow: generated.workflow,
        explanation: generated.explanation,
        suggestions: generated.suggestions || [],
      };
    } catch (error) {
      throw new Error(`Failed to generate workflow: ${error}`);
    }
  }
}
