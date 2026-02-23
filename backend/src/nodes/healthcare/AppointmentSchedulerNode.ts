import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class AppointmentSchedulerNode implements INode {
  definition: NodeDefinition = {
    type: 'appointmentScheduler',
    name: 'Schedule Appointment',
    description: 'Schedule and manage patient appointments',
    category: 'Healthcare',
    color: '#0891b2',
    inputs: [
      {
        name: 'patientId',
        type: 'string',
        required: true,
        description: 'Patient identifier',
      },
      {
        name: 'appointmentType',
        type: 'string',
        required: true,
        description: 'Type of appointment (consultation/followup/procedure)',
      },
      {
        name: 'preferredDate',
        type: 'string',
        description: 'Preferred appointment date',
      },
      {
        name: 'providerId',
        type: 'string',
        description: 'Healthcare provider ID',
      },
    ],
    outputs: [
      {
        name: 'appointmentId',
        type: 'string',
        description: 'Scheduled appointment ID',
      },
      {
        name: 'scheduledTime',
        type: 'string',
        description: 'Confirmed appointment date and time',
      },
      {
        name: 'confirmationSent',
        type: 'boolean',
        description: 'Whether confirmation was sent',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { patientId, appointmentType, preferredDate, providerId } = data;

    const appointmentId = `APT-${Date.now()}`;
    const scheduledTime = preferredDate || new Date(Date.now() + 86400000).toISOString(); // Next day

    return {
      appointmentId,
      patientId,
      appointmentType,
      scheduledTime,
      providerId: providerId || 'DEFAULT_PROVIDER',
      confirmationSent: true,
      status: 'confirmed',
    };
  }
}
