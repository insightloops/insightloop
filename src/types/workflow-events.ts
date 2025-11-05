// Base interface for all workflow events
export interface BaseWorkflowEvent {
  type: string;
  timestamp: Date;
  executionId: string;
  parentExecutionId?: string;
  sessionId: string;
}

// Agent Events
export interface AgentStartEvent extends BaseWorkflowEvent {
  type: 'agent_start';
  payload: {
    agentId: string;
    agentType: 'master' | 'sub' | 'tool';
    name: string;
    capabilities: string[];
    purpose: string;
  };
}

export interface SubAgentStartEvent extends BaseWorkflowEvent {
  type: 'sub_agent_start';
  payload: {
    subAgentId: string;
    parentAgentId: string;
    agentType: string;
    purpose: string;
    capabilities: string[];
  };
}

export interface AgentResponseEvent extends BaseWorkflowEvent {
  type: 'agent_response';
  payload: {
    agentId: string;
    response: string;
    reasoning?: string;
    confidence?: number;
    tokensUsed: number;
    costUsd: number;
  };
}

// Workflow Events
export interface WorkflowStartEvent extends BaseWorkflowEvent {
  type: 'workflow_start';
  payload: {
    workflowId: string;
    workflowType: 'sequential' | 'parallel' | 'conditional';
    name: string;
    description: string;
    totalSteps: number;
  };
}

export interface WorkflowStepEvent extends BaseWorkflowEvent {
  type: 'workflow_step';
  payload: {
    workflowId: string;
    stepId: string;
    stepName: string;
    stepType: 'agent' | 'tool' | 'condition';
    currentStep: number;
    totalSteps: number;
    stepData?: any;
  };
}

export interface WorkflowCompleteEvent extends BaseWorkflowEvent {
  type: 'workflow_complete';
  payload: {
    workflowId: string;
    success: boolean;
    result?: any;
    totalTokens: number;
    totalCostUsd: number;
    duration: number;
  };
}

// Tool Events
export interface ToolCallEvent extends BaseWorkflowEvent {
  type: 'tool_call';
  payload: {
    toolId: string;
    toolName: string;
    toolType: 'function' | 'agent' | 'workflow';
    agentId: string;
    input: any;
    metadata?: Record<string, any>;
  };
}

export interface ToolResultEvent extends BaseWorkflowEvent {
  type: 'tool_result';
  payload: {
    toolId: string;
    toolName: string;
    toolType: 'function' | 'agent' | 'workflow';
    success: boolean;
    result?: any;
    error?: string;
    tokensUsed: number;
    costUsd: number;
    duration: number;
  };
}

// Error Events
export interface ErrorEvent extends BaseWorkflowEvent {
  type: 'error';
  payload: {
    error: string;
    errorType: 'agent_error' | 'tool_error' | 'workflow_error' | 'system_error';
    source: string;
    details?: Record<string, any>;
    recoverable: boolean;
  };
}

// Union type for all workflow events
export type WorkflowEvent = 
  | AgentStartEvent
  | SubAgentStartEvent
  | AgentResponseEvent
  | WorkflowStartEvent
  | WorkflowStepEvent
  | WorkflowCompleteEvent
  | ToolCallEvent
  | ToolResultEvent
  | ErrorEvent;

// Event creation helpers with type safety
export const createAgentStartEvent = (
  executionId: string,
  sessionId: string,
  payload: AgentStartEvent['payload'],
  parentExecutionId?: string
): AgentStartEvent => ({
  type: 'agent_start',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createSubAgentStartEvent = (
  executionId: string,
  sessionId: string,
  payload: SubAgentStartEvent['payload'],
  parentExecutionId?: string
): SubAgentStartEvent => ({
  type: 'sub_agent_start',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createAgentResponseEvent = (
  executionId: string,
  sessionId: string,
  payload: AgentResponseEvent['payload'],
  parentExecutionId?: string
): AgentResponseEvent => ({
  type: 'agent_response',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createWorkflowStartEvent = (
  executionId: string,
  sessionId: string,
  payload: WorkflowStartEvent['payload'],
  parentExecutionId?: string
): WorkflowStartEvent => ({
  type: 'workflow_start',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createWorkflowStepEvent = (
  executionId: string,
  sessionId: string,
  payload: WorkflowStepEvent['payload'],
  parentExecutionId?: string
): WorkflowStepEvent => ({
  type: 'workflow_step',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createWorkflowCompleteEvent = (
  executionId: string,
  sessionId: string,
  payload: WorkflowCompleteEvent['payload'],
  parentExecutionId?: string
): WorkflowCompleteEvent => ({
  type: 'workflow_complete',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createToolCallEvent = (
  executionId: string,
  sessionId: string,
  payload: ToolCallEvent['payload'],
  parentExecutionId?: string
): ToolCallEvent => ({
  type: 'tool_call',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createToolResultEvent = (
  executionId: string,
  sessionId: string,
  payload: ToolResultEvent['payload'],
  parentExecutionId?: string
): ToolResultEvent => ({
  type: 'tool_result',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});

export const createErrorEvent = (
  executionId: string,
  sessionId: string,
  payload: ErrorEvent['payload'],
  parentExecutionId?: string
): ErrorEvent => ({
  type: 'error',
  timestamp: new Date(),
  executionId,
  parentExecutionId,
  sessionId,
  payload,
});
