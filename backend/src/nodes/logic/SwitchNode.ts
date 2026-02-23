import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class SwitchNode implements INode {
  definition: NodeDefinition = {
    type: 'switch',
    name: 'Switch',
    description: 'Multi-way branching based on value',
    category: 'Logic',
    color: '#f97316',
    inputs: [
      {
        name: 'value',
        type: 'any',
        required: true,
        description: 'Value to match',
      },
      {
        name: 'cases',
        type: 'object',
        required: true,
        description: 'Object with case values as keys',
      },
      {
        name: 'default',
        type: 'any',
        description: 'Default value if no match',
      },
    ],
    outputs: [
      {
        name: 'result',
        type: 'any',
        description: 'Matched case result',
      },
      {
        name: 'matchedCase',
        type: 'string',
        description: 'Which case was matched',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { value, cases = {}, default: defaultValue } = data;

    const matchedCase = String(value);
    const result = cases[matchedCase] !== undefined ? cases[matchedCase] : defaultValue;

    return {
      result,
      matchedCase: cases[matchedCase] !== undefined ? matchedCase : 'default',
    };
  }
}
