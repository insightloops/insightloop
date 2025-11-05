import { WorkflowEvent } from './workflow-events';

// Agent State Interface
export interface AgentState {
  sessionId: string;
  executionId: string;
  parentExecutionId?: string;
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
  }>;
  context: Record<string, any>;
  tokenUsage: number;
  costUsd: number;
  status: 'idle' | 'thinking' | 'calling_tool' | 'responding' | 'completed' | 'error';
}

// Tool Interface for hierarchical tools
export interface AgentTool {
  name: string;
  description: string;
  type: 'function' | 'agent' | 'workflow';
  schema?: any; // JSON schema for function tools
  agentConfig?: {
    agentType: string;
    capabilities: string[];
    purpose: string;
  };
  workflowConfig?: {
    workflowType: 'sequential' | 'parallel' | 'conditional';
    steps: WorkflowStep[];
  };
  execute: (input: any, state: AgentState, eventEmitter: EventEmitter) => Promise<any>;
}

// Workflow Step Interface
export interface WorkflowStep {
  id: string;
  name: string;
  type: 'agent' | 'tool' | 'condition';
  config: any;
  dependencies?: string[]; // Step IDs this step depends on
}

// Event Emitter Interface
export interface EventEmitter {
  emit(event: WorkflowEvent): void;
  generateExecutionId(): string;
}

// Agent Configuration
export interface AgentConfig {
  name: string;
  type: 'master' | 'sub' | 'tool';
  model: string;
  temperature?: number;
  maxTokens?: number;
  systemPrompt: string;
  tools: AgentTool[];
  capabilities: string[];
  purpose: string;
}

// Master Agent Interface
export interface MasterAgent {
  config: AgentConfig;
  state: AgentState;
  eventEmitter: EventEmitter;
  
  initialize(): Promise<void>;
  processMessage(message: string): AsyncGenerator<WorkflowEvent, void, unknown>;
  callTool(toolName: string, input: any): Promise<any>;
  createSubAgent(config: AgentConfig): Promise<SubAgent>;
  cleanup(): Promise<void>;
}

// Sub Agent Interface  
export interface SubAgent {
  config: AgentConfig;
  state: AgentState;
  parentAgent: MasterAgent;
  eventEmitter: EventEmitter;
  
  initialize(): Promise<void>;
  execute(input: any): AsyncGenerator<WorkflowEvent, any, unknown>;
  cleanup(): Promise<void>;
}

// Workflow Engine Interface
export interface WorkflowEngine {
  executeWorkflow(
    workflowConfig: any,
    input: any,
    state: AgentState,
    eventEmitter: EventEmitter
  ): AsyncGenerator<WorkflowEvent, any, unknown>;
}
