import { nodeRegistry } from './NodeRegistry';

// Core nodes
import { StartNode } from './core/StartNode';
import { HttpRequestNode } from './core/HttpRequestNode';
import { CodeNode } from './core/CodeNode';
import { DataTransformNode } from './core/DataTransformNode';
import { WebhookNode } from './core/WebhookNode';
import { ScheduleNode } from './core/ScheduleNode';

// Logic nodes
import { IfNode } from './logic/IfNode';
import { SwitchNode } from './logic/SwitchNode';

// Healthcare nodes
import { PatientIntakeNode } from './healthcare/PatientIntakeNode';
import { AppointmentSchedulerNode } from './healthcare/AppointmentSchedulerNode';

// Field Operations nodes
import { HazardReportNode } from './field/HazardReportNode';
import { TimeClockNode } from './field/TimeClockNode';
import { InventoryCheckNode } from './field/InventoryCheckNode';
import { WorkOrderNode } from './field/WorkOrderNode';

// AI nodes
import { LLMCompletionNode } from './ai/LLMCompletionNode';
import { PromptTemplateNode } from './ai/PromptTemplateNode';
import { AIAgentNode } from './ai/AIAgentNode';
import { TextClassificationNode } from './ai/TextClassificationNode';
import { EntityExtractionNode } from './ai/EntityExtractionNode';
import { SentimentAnalysisNode } from './ai/SentimentAnalysisNode';
import { AIDataTransformNode } from './ai/AIDataTransformNode';
import { WorkflowGenerationNode } from './ai/WorkflowGenerationNode';
import { ConversationNode } from './ai/ConversationNode';

// Register all nodes
export function registerAllNodes(): void {
  // Core
  nodeRegistry.register(new StartNode());
  nodeRegistry.register(new HttpRequestNode());
  nodeRegistry.register(new CodeNode());
  nodeRegistry.register(new DataTransformNode());
  nodeRegistry.register(new WebhookNode());
  nodeRegistry.register(new ScheduleNode());

  // Logic
  nodeRegistry.register(new IfNode());
  nodeRegistry.register(new SwitchNode());

  // Healthcare
  nodeRegistry.register(new PatientIntakeNode());
  nodeRegistry.register(new AppointmentSchedulerNode());

  // Field Operations
  nodeRegistry.register(new HazardReportNode());
  nodeRegistry.register(new TimeClockNode());
  nodeRegistry.register(new InventoryCheckNode());
  nodeRegistry.register(new WorkOrderNode());

  // AI
  nodeRegistry.register(new LLMCompletionNode());
  nodeRegistry.register(new PromptTemplateNode());
  nodeRegistry.register(new AIAgentNode());
  nodeRegistry.register(new TextClassificationNode());
  nodeRegistry.register(new EntityExtractionNode());
  nodeRegistry.register(new SentimentAnalysisNode());
  nodeRegistry.register(new AIDataTransformNode());
  nodeRegistry.register(new WorkflowGenerationNode());
  nodeRegistry.register(new ConversationNode());
}

// Initialize on import
registerAllNodes();

export { nodeRegistry };
