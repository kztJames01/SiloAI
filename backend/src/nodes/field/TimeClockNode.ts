import crypto from 'crypto';
import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class TimeClockNode implements INode {
  definition: NodeDefinition = {
    type: 'timeClock',
    name: 'Time Clock',
    description: 'Clock in/out and track employee work hours',
    category: 'Field Operations',
    color: '#7c3aed',
    inputs: [
      {
        name: 'employeeId',
        type: 'string',
        required: true,
        description: 'Employee identifier',
      },
      {
        name: 'action',
        type: 'string',
        required: true,
        description: 'Clock action (in/out/break_start/break_end)',
      },
      {
        name: 'location',
        type: 'object',
        description: 'GPS location (lat, lng)',
      },
      {
        name: 'jobSiteId',
        type: 'string',
        description: 'Job site identifier',
      },
    ],
    outputs: [
      {
        name: 'recordId',
        type: 'string',
        description: 'Time record ID',
      },
      {
        name: 'timestamp',
        type: 'string',
        description: 'Timestamp of the clock action',
      },
      {
        name: 'hoursWorked',
        type: 'number',
        description: 'Total hours worked (for clock out)',
      },
    ],
  };

  async execute(data: any, context: ExecutionContext): Promise<any> {
    const { employeeId, action, location, jobSiteId } = data;

    const recordId = `TIME-${crypto.randomUUID()}`;
    const timestamp = new Date().toISOString();
    const hoursWorked = action === 'out' ? Number(data.hoursWorked || 0) : 0;

    return {
      recordId,
      employeeId: employeeId || context.data?.userId,
      action,
      timestamp,
      location,
      jobSiteId,
      hoursWorked,
      status: 'recorded',
    };
  }
}
