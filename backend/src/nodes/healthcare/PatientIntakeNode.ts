import { INode, NodeDefinition } from '../NodeRegistry';
import { ExecutionContext } from '../../engine/WorkflowEngine';

export class PatientIntakeNode implements INode {
  definition: NodeDefinition = {
    type: 'patientIntake',
    name: 'Patient Intake',
    description: 'Process patient intake forms and medical records',
    category: 'Healthcare',
    color: '#059669',
    inputs: [
      {
        name: 'formData',
        type: 'object',
        required: true,
        description: 'Patient intake form data',
      },
      {
        name: 'validateInsurance',
        type: 'boolean',
        default: true,
        description: 'Whether to validate insurance information',
      },
    ],
    outputs: [
      {
        name: 'patientId',
        type: 'string',
        description: 'Generated patient ID',
      },
      {
        name: 'priorityLevel',
        type: 'string',
        description: 'Triage priority level (urgent/moderate/routine)',
      },
      {
        name: 'validationStatus',
        type: 'object',
        description: 'Insurance and form validation results',
      },
    ],
  };

  async execute(data: any, _context: ExecutionContext): Promise<any> {
    const { formData, validateInsurance = true } = data;

    // Simulate patient intake processing
    const patientId = `PAT-${Date.now()}`;
    
    // Basic triage logic
    const symptoms = formData.symptoms?.toLowerCase() || '';
    let priorityLevel = 'routine';
    
    if (symptoms.includes('chest pain') || symptoms.includes('breathing')) {
      priorityLevel = 'urgent';
    } else if (symptoms.includes('fever') || symptoms.includes('pain')) {
      priorityLevel = 'moderate';
    }

    const validationStatus = {
      formComplete: !!formData.name && !!formData.dob,
      insuranceValid: validateInsurance ? !!formData.insuranceId : true,
      contactInfoValid: !!formData.phone || !!formData.email,
    };

    return {
      patientId,
      priorityLevel,
      validationStatus,
      timestamp: new Date().toISOString(),
    };
  }
}
