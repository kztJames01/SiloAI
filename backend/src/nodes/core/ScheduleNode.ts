import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class ScheduleNode implements INode {
  definition: NodeDefinition = {
    type: 'schedule',
    name: 'Schedule Trigger',
    description: 'Trigger workflow on a schedule',
    category: 'Triggers',
    color: '#8b5cf6',
    inputs: [
      {
        name: 'cronExpression',
        type: 'string',
        required: true,
        description: 'Cron expression for schedule',
      },
      {
        name: 'timezone',
        type: 'string',
        default: 'UTC',
        description: 'Timezone for schedule',
      },
    ],
    outputs: [
      {
        name: 'timestamp',
        type: 'string',
        description: 'Execution timestamp',
      },
    ],
  };

  async execute(_data: any, _context: ExecutionContext): Promise<any> {
    return {
      timestamp: new Date().toISOString(),
    };
  }
}
