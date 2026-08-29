// AI Integration Types

export type LLMProvider = 'openai' | 'anthropic' | 'gemini' | 'ollama' | 'openrouter' | 'custom';

export interface LLMConfig {
  provider: LLMProvider;
  model: string;
  apiKey?: string;
  baseUrl?: string; // For custom/self-hosted models
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
  stopSequences?: string[];
}

export interface Message {
  role: 'system' | 'user' | 'assistant' | 'function';
  content: string;
  name?: string;
  functionCall?: {
    name: string;
    arguments: string;
  };
}

export interface LLMResponse {
  content: string;
  finishReason: 'stop' | 'length' | 'function_call' | 'content_filter';
  usage: TokenUsage;
  model: string;
  functionCall?: {
    name: string;
    arguments: any;
  };
}

export interface TokenUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
  cost?: number; // Estimated cost in USD
}

export interface PromptTemplate {
  id: string;
  name: string;
  description?: string;
  template: string;
  variables: PromptVariable[];
  systemPrompt?: string;
  examples?: Message[];
}

export interface PromptVariable {
  name: string;
  type: 'string' | 'number' | 'boolean' | 'array' | 'object';
  required: boolean;
  default?: any;
  description?: string;
}

export interface AIContext {
  conversationId?: string;
  messages: Message[];
  variables: Record<string, any>;
  metadata?: Record<string, any>;
}

export interface RAGConfig {
  enabled: boolean;
  vectorStore?: 'pinecone' | 'weaviate' | 'chroma' | 'local';
  embeddingModel?: string;
  topK?: number;
  similarityThreshold?: number;
  indexName?: string;
}

export interface RAGDocument {
  id: string;
  content: string;
  metadata: Record<string, any>;
  embedding?: number[];
}

export interface RAGQuery {
  query: string;
  topK?: number;
  filter?: Record<string, any>;
}

export interface RAGResult {
  documents: RAGDocument[];
  scores: number[];
}

export interface AIAgentConfig {
  name: string;
  description: string;
  llmConfig: LLMConfig;
  systemPrompt: string;
  tools?: AITool[];
  maxIterations?: number;
  enableMemory?: boolean;
  ragConfig?: RAGConfig;
}

export interface AITool {
  name: string;
  description: string;
  parameters: Record<string, any>; // JSON Schema
  function: (args: any) => Promise<any>;
}

export interface AIAgentExecution {
  id: string;
  agentId: string;
  input: string;
  output?: string;
  steps: AIAgentStep[];
  tokenUsage: TokenUsage;
  status: 'running' | 'completed' | 'failed';
  error?: string;
  startedAt: Date;
  finishedAt?: Date;
}

export interface AIAgentStep {
  stepNumber: number;
  action: string;
  thought: string;
  observation: string;
  tokenUsage: TokenUsage;
}

// Token tracking and analytics
export interface TokenUsageLog {
  id: string;
  userId: string;
  workflowId?: string;
  executionId?: string;
  nodeId?: string;
  provider: LLMProvider;
  model: string;
  usage: TokenUsage;
  timestamp: Date;
}

export interface TokenUsageAnalytics {
  totalTokens: number;
  totalCost: number;
  byProvider: Record<LLMProvider, { tokens: number; cost: number }>;
  byModel: Record<string, { tokens: number; cost: number }>;
  byWorkflow: Record<string, { tokens: number; cost: number }>;
  timeRange: {
    start: Date;
    end: Date;
  };
}

// AI Debugging
export interface AIDebugLog {
  id: string;
  timestamp: Date;
  nodeId: string;
  executionId: string;
  type: 'prompt' | 'response' | 'error' | 'tool_call';
  provider: LLMProvider;
  model: string;
  messages: Message[];
  response?: LLMResponse;
  error?: string;
  latency: number; // ms
  tokenUsage?: TokenUsage;
}

export interface AIDebugSession {
  executionId: string;
  logs: AIDebugLog[];
  totalTokens: number;
  totalCost: number;
  totalLatency: number;
  errors: number;
}

// Workflow generation
export interface WorkflowGenerationRequest {
  description: string;
  requirements?: string[];
  industry?: string;
  complexity?: 'simple' | 'moderate' | 'complex';
}

export interface WorkflowGenerationResponse {
  workflow: {
    name: string;
    description: string;
    nodes: any[];
    edges: any[];
  };
  explanation: string;
  suggestions: string[];
}
