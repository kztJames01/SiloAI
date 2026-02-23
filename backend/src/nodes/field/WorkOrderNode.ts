import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class WorkOrderNode implements INode {
  definition: NodeDefinition = {
    type: 'workOrder',
    name: 'Work Order',
    description: 'Create and manage field service work orders',
    category: 'Field Operations',
    color: '#2563eb',
    inputs: [
      {
        name: 'customerId',
        type: 'string',
        required: true,
        description: 'Customer identifier',
      },
      {
        name: 'serviceType',
        type: 'string',
        required: true,
        description: 'Type of service required',
      },
      {
        name: 'priority',
        type: 'string',
        default: 'normal',
        description: 'Priority level (low/normal/high/urgent)',
      },
      {
        name: 'location',
        type: 'object',
        description: 'Service location details',
      },
      {
        name: 'assignedTechnicianId',
        type: 'string',
        description: 'Assigned technician ID',
      },
    ],
    outputs: [
      {
        name: 'workOrderId',
        type: 'string',
        description: 'Work order ID',
      },
      {
        name: 'scheduledDate',
        type: 'string',
        description: 'Scheduled service date',
      },
      {
        name: 'estimatedDuration',
        type: 'number',
        description: 'Estimated duration in minutes',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { customerId, serviceType, priority, location, assignedTechnicianId } = data;

    const workOrderId = `WO-${Date.now()}`;
    
    // Calculate scheduling based on priority
    const hoursOffset = priority === 'urgent' ? 2 : priority === 'high' ? 24 : 48;
    const scheduledDate = new Date(Date.now() + hoursOffset * 3600000).toISOString();
    
    const estimatedDuration = 120; // 2 hours default

    return {
      workOrderId,
      customerId,
      serviceType,
      priority,
      location,
      assignedTechnicianId: assignedTechnicianId || 'UNASSIGNED',
      scheduledDate,
      estimatedDuration,
      status: 'scheduled',
      createdAt: new Date().toISOString(),
    };
  }
}
