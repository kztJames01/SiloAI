import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class WebhookNode implements INode {
  definition: NodeDefinition = {
    type: 'webhook',
    name: 'Webhook Trigger',
    description: 'Trigger workflow from webhook',
    category: 'Triggers',
    color: '#ec4899',
    inputs: [
      {
        name: 'method',
        type: 'string',
        required: false,
        default: 'POST',
        description: 'HTTP method to accept',
      },
      {
        name: 'validateHeaders',
        type: 'boolean',
        default: false,
        description: 'Validate incoming headers',
      },
    ],
    outputs: [
      {
        name: 'body',
        type: 'any',
        description: 'Request body',
      },
      {
        name: 'headers',
        type: 'object',
        description: 'Request headers',
      },
      {
        name: 'query',
        type: 'object',
        description: 'Query parameters',
      },
    ],
  };

  async execute(_data: any, context: ExecutionContext): Promise<any> {
    // Webhook data is passed via context.data.input
    const webhookData = context.data.input || {};

    return {
      body: webhookData.body || {},
      headers: webhookData.headers || {},
      query: webhookData.query || {},
    };
  }
}
