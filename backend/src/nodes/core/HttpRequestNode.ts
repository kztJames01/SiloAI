import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';
import axios from 'axios';
import { assertSafeOutboundUrl } from '../../utils/security';

export class HttpRequestNode implements INode {
  definition: NodeDefinition = {
    type: 'httpRequest',
    name: 'HTTP Request',
    description: 'Make HTTP requests to any API',
    category: 'Core',
    color: '#10b981',
    inputs: [
      {
        name: 'url',
        type: 'string',
        required: true,
        description: 'The URL to make the request to',
      },
      {
        name: 'method',
        type: 'string',
        required: true,
        default: 'GET',
        description: 'HTTP method (GET, POST, PUT, DELETE, etc.)',
      },
      {
        name: 'headers',
        type: 'object',
        description: 'Request headers',
      },
      {
        name: 'body',
        type: 'any',
        description: 'Request body',
      },
    ],
    outputs: [
      {
        name: 'data',
        type: 'any',
        description: 'Response data',
      },
      {
        name: 'status',
        type: 'number',
        description: 'HTTP status code',
      },
      {
        name: 'headers',
        type: 'object',
        description: 'Response headers',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { url, method = 'GET', headers = {}, body } = data;

    assertSafeOutboundUrl(url);

    const response = await axios({
      url,
      method,
      headers,
      data: body,
    });

    return {
      data: response.data,
      status: response.status,
      headers: response.headers,
    };
  }
}
