// Chat Message Types
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  status?: 'sending' | 'sent' | 'error';
  thinkingContent?: string; // Separate thinking process content
  responseContent?: string; // Separate response content
  isThinking?: boolean; // Flag to indicate if currently in thinking mode
  metadata?: {
    tokenUsage?: number;
    costUsd?: number;
    reasoning?: string;
    confidence?: number;
  };
}

// Chat Session State
export interface ChatSession {
  id: string;
  messages: ChatMessage[];
  status: 'idle' | 'responding' | 'error';
  executionTree: ExecutionTreeNode[];
  totalTokens: number;
  totalCost: number;
}

// Execution Tree Node for visualization
export interface ExecutionTreeNode {
  id: string;
  parentId?: string;
  type: 'agent' | 'workflow' | 'tool';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  level: number;
  startTime: Date;
  endTime?: Date;
  tokenUsage: number;
  costUsd: number;
  children: ExecutionTreeNode[];
  metadata: Record<string, any>;
}

// Chat UI State
export interface ChatUIState {
  currentSession: ChatSession | null;
  sessions: ChatSession[];
  isConnected: boolean;
  connectionError?: string;
}

// SSE Connection Status
export type SSEConnectionStatus = 'connecting' | 'connected' | 'disconnected' | 'error';

// Chat Actions for state management
export type ChatAction =
  | { type: 'START_SESSION'; sessionId: string }
  | { type: 'SEND_MESSAGE'; message: ChatMessage }
  | { type: 'RECEIVE_MESSAGE'; message: ChatMessage }
  | { type: 'UPDATE_EXECUTION_TREE'; node: ExecutionTreeNode }
  | { type: 'UPDATE_CONNECTION_STATUS'; status: SSEConnectionStatus; error?: string }
  | { type: 'UPDATE_USAGE'; tokens: number; cost: number }
  | { type: 'CLEAR_SESSION' };
