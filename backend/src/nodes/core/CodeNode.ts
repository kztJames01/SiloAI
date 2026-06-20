import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class CodeNode implements INode {
  definition: NodeDefinition = {
    type: 'code',
    name: 'Code',
    description: 'Execute custom JavaScript code',
    category: 'Core',
    color: '#8b5cf6',
    inputs: [
      {
        name: 'code',
        type: 'string',
        required: true,
        description: 'JavaScript code to execute',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'any',
        description: 'Result of the code execution',
      },
    ],
  };

  async execute(data: any, context: ExecutionContext): Promise<any> {
    const { code } = data;

    if (process.env.ALLOW_CODE_NODE !== 'true') {
      throw new Error('Code node is disabled. Set ALLOW_CODE_NODE=true to enable (not recommended in production).');
    }

    const func = new Function('context', 'data', code);
    const result = await func(context, context.previousNodeData);

    return result;
  }
}
