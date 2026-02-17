import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class IfNode implements INode {
  definition: NodeDefinition = {
    type: 'if',
    name: 'If/Else',
    description: 'Conditional branching based on conditions',
    category: 'Logic',
    color: '#f59e0b',
    inputs: [
      {
        name: 'condition',
        type: 'boolean',
        required: true,
        description: 'The condition to evaluate',
      },
      {
        name: 'trueValue',
        type: 'any',
        description: 'Value to return if condition is true',
      },
      {
        name: 'falseValue',
        type: 'any',
        description: 'Value to return if condition is false',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'any',
        description: 'The result based on the condition',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { condition, trueValue, falseValue } = data;

    return condition ? trueValue : falseValue;
  }
}
