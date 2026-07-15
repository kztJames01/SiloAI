import crypto from 'crypto';
import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class HazardReportNode implements INode {
  definition: NodeDefinition = {
    type: 'hazardReport',
    name: 'Hazard Report',
    description: 'Log and process workplace hazard reports',
    category: 'Field Operations',
    color: '#dc2626',
    inputs: [
      {
        name: 'location',
        type: 'string',
        required: true,
        description: 'Location of the hazard',
      },
      {
        name: 'hazardType',
        type: 'string',
        required: true,
        description: 'Type of hazard (slip/electrical/chemical/equipment)',
      },
      {
        name: 'severity',
        type: 'string',
        required: true,
        description: 'Severity level (low/medium/high/critical)',
      },
      {
        name: 'description',
        type: 'string',
        description: 'Detailed hazard description',
      },
      {
        name: 'reportedBy',
        type: 'string',
        description: 'Employee who reported the hazard',
      },
    ],
    outputs: [
      {
        name: 'reportId',
        type: 'string',
        description: 'Hazard report ID',
      },
      {
        name: 'requiresImmediateAction',
        type: 'boolean',
        description: 'Whether immediate action is required',
      },
      {
        name: 'notificationsSent',
        type: 'array',
        description: 'List of people notified',
      },
    ],
  };

  async execute(data: any, context: ExecutionContext): Promise<any> {
    const { location, hazardType, severity, description, reportedBy, notifyEmails } = data;

    const reportId = `HAZ-${crypto.randomUUID()}`;
    const requiresImmediateAction = severity === 'high' || severity === 'critical';
    const notificationsSent = Array.isArray(notifyEmails)
      ? notifyEmails
      : requiresImmediateAction
        ? (data.supervisorEmail ? [data.supervisorEmail] : [])
        : [];

    return {
      reportId,
      location,
      hazardType,
      severity,
      description,
      reportedBy: reportedBy || context.data?.userId,
      requiresImmediateAction,
      notificationsSent,
      timestamp: new Date().toISOString(),
      status: requiresImmediateAction ? 'urgent' : 'pending_review',
    };
  }
}
