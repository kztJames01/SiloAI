import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class StartNode implements INode {
  definition: NodeDefinition = {
    type: 'start',
    name: 'Start',
    description: 'Entry point for the workflow',
    category: 'Core',
    color: '#3b82f6',
    inputs: [],
    outputs: [
      {
        name: 'data',
        type: 'any',
        description: 'Input data passed to the workflow',
      },
    ],
  };

  async execute(_data: any, context: ExecutionContext): Promise<any> {
    return context.data.input || {};
  }
}
