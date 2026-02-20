export interface AuthUser {
  id: string;
  email: string;
  name: string | null;
  createdAt?: string;
}

export interface RegisterPayload {
  email: string;
  password: string;
  name?: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: AuthUser;
}

export interface MeResponse {
  user: AuthUser;
}

export interface WorkflowExecutionSummary {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  startedAt: string;
  finishedAt: string | null;
}

export interface Workflow {
  id: string;
  userId: string;
  name: string;
  description: string | null;
  nodes: unknown[];
  edges: unknown[];
  trigger: {
    type: 'manual' | 'webhook' | 'schedule' | string;
    config: unknown;
  };
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  executions?: WorkflowExecutionSummary[];
}

export interface WorkflowsListResponse {
  workflows: Workflow[];
}

export interface WorkflowResponse {
  workflow: Workflow;
}

export interface WorkflowDeleteResponse {
  message: string;
}

export interface WorkflowExecuteResponse {
  executionId: string;
  message: string;
}

export interface WorkflowExecutionLog {
  id: string;
  executionId: string;
  nodeId: string | null;
  nodeName: string;
  level: 'INFO' | 'WARN' | 'ERROR' | string;
  message: string;
  data: unknown;
  timestamp: string;
}

// Export AI types
export * from './ai';

// Export Integration types
export * from './integration';

export interface ExecutionWorkflowRef {
  id: string;
  name: string;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  status: 'PENDING' | 'RUNNING' | 'SUCCESS' | 'FAILED' | string;
  input: unknown;
  output: unknown;
  error: string | null;
  startedAt: string;
  finishedAt: string | null;
  workflow?: ExecutionWorkflowRef;
  logs?: WorkflowExecutionLog[];
}

export interface ExecutionsListResponse {
  executions: WorkflowExecution[];
}

export interface ExecutionResponse {
  execution: WorkflowExecution;
}

export interface Integration {
  id: string;
  name: string;
  type: string;
  authType: string;
  icon: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserIntegration {
  id: string;
  userId: string;
  integrationId: string;
  config: unknown;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  integration: Integration;
}

export interface IntegrationsListResponse {
  integrations: Integration[];
}

export interface UserIntegrationsListResponse {
  userIntegrations: UserIntegration[];
}

export interface NodeDefinition {
  type: string;
  name: string;
  description?: string;
  category?: string;
  color?: string;
  icon?: string;
  inputs?: unknown[];
  outputs?: unknown[];
  configSchema?: unknown;
}

export interface NodesListResponse {
  nodes: NodeDefinition[];
}

export interface NodeCategoriesResponse {
  categories: string[];
}
