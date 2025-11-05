# Chat UI with ### Frontend (Next.js + React)
- **Chat Interface**: Message list, input field, typing indicators
- **Workflow Execution Monitor**: Shows agent hierarchy, sub-workflows, DAG progress
- **Multi-level Event Stream**: Handles events from main agent, sub-agents, workflows
- **Redux Store**: Manages chat state, workflow execution tree, metrics

### Backend (TypeScript + Next.js API Routes)
- **Master Agent**: Top-level agent that orchestrates everything
- **Sub-Agent Registry**: Agents that can be invoked as tools
- **Workflow Engine**: DAG execution with event reporting
- **Hierarchical SSE**: Streams events from all execution levels
- **Execution Tree Tracking**: Token usage and metrics across workflow hierarchynd Design Document

## Overview
Design for a real-time chat interface that communicates with LangGraph agents, providing token usage monitoring, tool execution tracking, and streaming responses.

## Architecture Goals
- **Hierarchical Agent System**: Main agent orchestrates sub-agents and workflows
- **Workflow Execution**: Tools can be DAGs/workflows that report their own events
- **Real-time streaming**: Show agent progress and sub-workflow execution 
- **Multi-level monitoring**: Track main agent, sub-agents, and workflow steps
- **Token consumption tracking**: Monitor costs across all execution levels
- **Extensible workflow system**: Easy to compose agents and workflows as tools

## Core Components

### Frontend (Next.js + React)
- **Chat Interface**: Message list, input field, typing indicators
- **Agent Monitor**: Shows current tool usage, token consumption, progress
- **SSE Client**: Handles real-time streaming from backend
- **Redux Store**: Manages chat state, agent status, metrics

### Backend (Python + FastAPI)
- **LangGraph Engine**: Agent orchestration and tool routing
- **SSE Streaming**: Real-time event streaming to frontend
- **Tool Registry**: Available tools for agents (SQL queries, document search, etc.)
- **Usage Tracking**: Token counting, execution metrics, cost tracking

## Technology Stack

### Full TypeScript Stack
- **Next.js 14** - React framework with App Router + API Routes
- **TypeScript** - Type safety throughout frontend and backend
- **Tailwind CSS** - Styling (already in project)
- **Radix UI** - Components (already integrated)
- **Redux Toolkit** - State management for chat and agent status
- **EventSource API** - Server-sent events for real-time streaming

### Backend (Next.js API Routes)
- **LangGraph.js** - Agent orchestration framework (TypeScript)
- **OpenAI/Anthropic SDKs** - LLM providers
- **Zod** - TypeScript schema validation
- **Server-Sent Events** - Real-time streaming (NO WebSockets)
- **Edge Runtime** - Fast, lightweight execution

## Real-Time Communication

### Hierarchical Event Streaming (SSE) with Union Types
```typescript
// Base event interface
interface BaseWorkflowEvent {
  executionId: string;     // Unique ID for this execution
  parentId?: string;       // Parent agent/workflow ID
  level: number;          // Hierarchy depth (0 = main agent, 1 = sub-agent, etc.)
  timestamp: string;
}

// Union type for all possible workflow events
type WorkflowEvent = 
  | AgentStartEvent
  | SubAgentStartEvent
  | WorkflowStartEvent
  | WorkflowStepEvent
  | ToolCallEvent
  | ToolResultEvent
  | AgentResponseEvent
  | WorkflowCompleteEvent
  | ErrorEvent;

// Individual event type definitions
interface AgentStartEvent extends BaseWorkflowEvent {
  type: 'agent_start';
  payload: {
    agentName: string;
    agentType: 'master' | 'sub';
    capabilities: string[];
  };
}

interface SubAgentStartEvent extends BaseWorkflowEvent {
  type: 'sub_agent_start';
  payload: {
    agentName: string;
    purpose: string;
    parentAgent: string;
  };
}

interface WorkflowStartEvent extends BaseWorkflowEvent {
  type: 'workflow_start';
  payload: {
    workflowName: string;
    workflowType: 'dag' | 'sequential' | 'parallel';
    totalSteps: number;
    estimatedDuration?: number;
  };
}

interface WorkflowStepEvent extends BaseWorkflowEvent {
  type: 'workflow_step';
  payload: {
    workflowName: string;
    stepName: string;
    stepIndex: number;
    totalSteps: number;
    stepStatus: 'started' | 'completed' | 'failed';
    stepResult?: any;
  };
}

interface ToolCallEvent extends BaseWorkflowEvent {
  type: 'tool_call';
  payload: {
    toolName: string;
    toolType: 'simple' | 'sub_agent' | 'workflow';
    toolInput: Record<string, any>;
    description: string;
  };
}

interface ToolResultEvent extends BaseWorkflowEvent {
  type: 'tool_result';
  payload: {
    toolName: string;
    toolType: 'simple' | 'sub_agent' | 'workflow';
    toolOutput: any;
    success: boolean;
    tokensUsed: number;
    costUsd: number;
    duration: number;
  };
}

interface AgentResponseEvent extends BaseWorkflowEvent {
  type: 'agent_response';
  payload: {
    agentName: string;
    content: string;
    isStreaming: boolean;
    isComplete: boolean;
    tokensUsed: number;
  };
}

interface WorkflowCompleteEvent extends BaseWorkflowEvent {
  type: 'workflow_complete';
  payload: {
    workflowName: string;
    status: 'completed' | 'failed' | 'cancelled';
    result: any;
    totalDuration: number;
    totalTokensUsed: number;
    totalCost: number;
  };
}

interface ErrorEvent extends BaseWorkflowEvent {
  type: 'error';
  payload: {
    errorCode: string;
    errorMessage: string;
    errorSource: string; // agent, workflow, or tool name
    stackTrace?: string;
  };
}
```

### Hierarchical Execution Flow
1. **User sends message** to main agent
2. **Main Agent** starts and analyzes the request
3. **Tool/Sub-Agent Selection**: Main agent decides to:
   - Call a simple tool (function)
   - Invoke a sub-agent (another LangGraph agent)
   - Execute a workflow (DAG of connected steps)
4. **Multi-level Streaming**: Events flow from all levels:
   - `agent_start` - Main agent begins
   - `sub_agent_start` - Sub-agent invoked as tool
   - `workflow_start` - Workflow DAG begins execution
   - `workflow_step` - Each step in the DAG reports progress
   - `tool_call` - Individual tool calls within any level
   - `workflow_complete` - DAG execution finished
   - `agent_response` - Response bubbles up the hierarchy
5. **Frontend Visualization**: Shows execution tree in real-time

## Agent Architecture

### Hierarchical Agent System
```typescript
// Master Agent that orchestrates sub-agents and workflows
import { StateGraph, START, END } from "@langchain/langgraph";
import { ToolNode } from "@langchain/langgraph/prebuilt";

interface MasterAgentState {
  messages: BaseMessage[];
  executionTree: ExecutionNode[];
  currentLevel: number;
  threadId: string;
  globalMetrics: GlobalMetrics;
}

interface ExecutionNode {
  id: string;
  parentId?: string;
  type: 'agent' | 'workflow' | 'tool';
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  tokenUsage: number;
  children: ExecutionNode[];
}

export function createMasterAgent() {
  const graph = new StateGraph<MasterAgentState>({
    channels: {
      messages: { value: (x, y) => x.concat(y), default: () => [] },
      executionTree: { value: (x, y) => [...x, ...y], default: () => [] },
      currentLevel: { value: (x, y) => y ?? x, default: () => 0 },
      threadId: { value: (x, y) => y ?? x, default: () => "" },
      globalMetrics: { value: (x, y) => ({ ...x, ...y }), default: () => ({}) }
    }
  });
  
  // Master orchestrator - analyzes and delegates
  graph.addNode("orchestrator", orchestratorNode);
  
  // Tool registry includes simple tools, sub-agents, and workflows
  const tools = [
    // Simple tools
    sqlQueryTool,
    documentSearchTool,
    
    // Sub-agents as tools
    dataAnalysisAgentTool,
    insightGenerationAgentTool,
    
    // Workflows as tools
    comprehensiveAnalysisWorkflowTool,
    reportGenerationWorkflowTool
  ];
  
  graph.addNode("execution", new ToolNode(tools));
  graph.addNode("aggregation", aggregationNode);
  
  // Flow
  graph.addEdge(START, "orchestrator");
  graph.addConditionalEdges("orchestrator", routeExecution);
  graph.addEdge("execution", "aggregation");
  graph.addEdge("aggregation", END);
  
  return graph.compile();
}
```

### Multi-Type Tool Integration
```typescript
import { tool } from "@langchain/core/tools";
import { z } from "zod";

// 1. SIMPLE TOOLS - Basic functions
export const queryStructuredDataTool = tool(
  async ({ sqlQuery, dataSourceId }: { sqlQuery: string; dataSourceId: string }) => {
    const result = await executeSQL(sqlQuery, dataSourceId);
    return JSON.stringify(result);
  },
  {
    name: "query_structured_data",
    description: "Execute SQL query on structured data source",
    schema: z.object({
      sqlQuery: z.string().describe("SQL query to execute"),
      dataSourceId: z.string().describe("ID of the data source")
    })
  }
);

// 2. SUB-AGENT TOOLS - Agents as tools
export const dataAnalysisAgentTool = tool(
  async ({ dataset, analysisType }: { dataset: string; analysisType: string }) => {
    // Create and execute a specialized data analysis agent
    const analysisAgent = createDataAnalysisAgent();
    const result = await executeSubAgent(analysisAgent, { dataset, analysisType });
    return result;
  },
  {
    name: "data_analysis_agent",
    description: "Specialized agent for complex data analysis tasks",
    schema: z.object({
      dataset: z.string().describe("Dataset to analyze"),
      analysisType: z.string().describe("Type of analysis to perform")
    })
  }
);

// 3. WORKFLOW TOOLS - DAGs as tools
export const comprehensiveAnalysisWorkflowTool = tool(
  async ({ question, dataSources }: { question: string; dataSources: string[] }) => {
    // Execute a multi-step workflow (DAG)
    const workflow = createComprehensiveAnalysisWorkflow();
    const result = await executeWorkflow(workflow, { question, dataSources });
    return result;
  },
  {
    name: "comprehensive_analysis_workflow",
    description: "Multi-step workflow for comprehensive data analysis with insights generation",
    schema: z.object({
      question: z.string().describe("Analysis question"),
      dataSources: z.array(z.string()).describe("Data source IDs to analyze")
    })
  }
);

// Workflow Definition Example
function createComprehensiveAnalysisWorkflow() {
  const workflow = new StateGraph<WorkflowState>({
    channels: {
      question: { value: (x, y) => y ?? x },
      dataSources: { value: (x, y) => y ?? x },
      structuredResults: { value: (x, y) => [...x, ...y], default: () => [] },
      unstructuredResults: { value: (x, y) => [...x, ...y], default: () => [] },
      insights: { value: (x, y) => y ?? x },
      report: { value: (x, y) => y ?? x }
    }
  });

  // Parallel data gathering
  workflow.addNode("gather_structured", gatherStructuredDataNode);
  workflow.addNode("gather_unstructured", gatherUnstructuredDataNode);
  
  // Analysis steps
  workflow.addNode("analyze_patterns", analyzeDataPatternsNode);
  workflow.addNode("generate_insights", generateInsightsNode);
  workflow.addNode("create_report", createReportNode);

  // Define DAG flow
  workflow.addEdge(START, "gather_structured");
  workflow.addEdge(START, "gather_unstructured");
  workflow.addEdge(["gather_structured", "gather_unstructured"], "analyze_patterns");
  workflow.addEdge("analyze_patterns", "generate_insights");
  workflow.addEdge("generate_insights", "create_report");
  workflow.addEdge("create_report", END);

  return workflow.compile();
}
```

## UI Components

### Chat Interface
```typescript
// Main chat component
interface ChatMessage {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  tool_calls?: ToolCall[]
  token_usage?: TokenUsage
}

export function ChatInterface() {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isStreaming, setIsStreaming] = useState(false)
  
  // SSE connection for real-time updates
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream')
    eventSource.onmessage = handleAgentEvent
    return () => eventSource.close()
  }, [])
  
  return (
    <div className="chat-container">
      <MessageList messages={messages} />
      <AgentMonitor />
      <ChatInput onSend={sendMessage} disabled={isStreaming} />
    </div>
  )
}
```

### Type-Safe Workflow Execution Monitor
```typescript
// Shows hierarchical execution tree with type-safe event handling
interface ExecutionTreeNode {
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

export function WorkflowExecutionMonitor() {
  const { executionTree, totalTokens, totalCost } = useWorkflowExecution();
  
  return (
    <Card className="workflow-monitor">
      <div className="space-y-4">
        {/* Overall Status */}
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Executing Workflow
          </Badge>
          <div className="text-sm text-muted-foreground">
            Tokens: {totalTokens} | Cost: ${totalCost.toFixed(4)}
          </div>
        </div>
        
        {/* Execution Tree */}
        <div className="execution-tree">
          {executionTree.map(node => (
            <ExecutionTreeNode key={node.id} node={node} />
          ))}
        </div>
      </div>
    </Card>
  );
}

function ExecutionTreeNode({ node }: { node: ExecutionTreeNode }) {
  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-gray-400" />,
    running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />
  };

  return (
    <div className={`ml-${node.level * 4} border-l border-gray-200 pl-4 py-2`}>
      <div className="flex items-center gap-2">
        {statusIcon[node.status]}
        <span className="font-medium">{node.name}</span>
        <Badge variant="secondary" size="sm">
          {node.type}
        </Badge>
        {node.tokenUsage > 0 && (
          <span className="text-xs text-muted-foreground">
            {node.tokenUsage} tokens
          </span>
        )}
        {node.costUsd > 0 && (
          <span className="text-xs text-muted-foreground">
            ${node.costUsd.toFixed(4)}
          </span>
        )}
      </div>
      
      {/* Additional metadata for different node types */}
      {node.metadata && (
        <div className="ml-6 mt-1 text-xs text-muted-foreground">
          {renderNodeMetadata(node)}
        </div>
      )}
      
      {/* Render children */}
      {node.children.map(child => (
        <ExecutionTreeNode key={child.id} node={child} />
      ))}
    </div>
  );
}

function renderNodeMetadata(node: ExecutionTreeNode): React.ReactNode {
  switch (node.type) {
    case 'workflow':
      return (
        <div>
          {node.metadata.workflowType && (
            <span className="inline-block mr-2">
              Type: {node.metadata.workflowType}
            </span>
          )}
          {node.metadata.currentStep && node.metadata.totalSteps && (
            <span>
              Step: {node.metadata.currentStep}/{node.metadata.totalSteps}
            </span>
          )}
        </div>
      );
    case 'agent':
      return (
        <div>
          {node.metadata.agentType && (
            <span className="inline-block mr-2">
              Type: {node.metadata.agentType}
            </span>
          )}
          {node.metadata.purpose && (
            <span>Purpose: {node.metadata.purpose}</span>
          )}
        </div>
      );
    case 'tool':
      return (
        <div>
          {node.metadata.toolType && (
            <span className="inline-block mr-2">
              Type: {node.metadata.toolType}
            </span>
          )}
          {node.metadata.duration && (
            <span>Duration: {node.metadata.duration}ms</span>
          )}
        </div>
      );
    default:
      return null;
  }
}

// Hook for type-safe event handling
export function useWorkflowExecution() {
  const [executionTree, setExecutionTree] = useState<ExecutionTreeNode[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);
  
  useEffect(() => {
    const eventSource = new EventSource('/api/chat/stream');
    
    eventSource.onmessage = (event) => {
      const workflowEvent: WorkflowEvent = JSON.parse(event.data);
      handleWorkflowEvent(workflowEvent);
    };
    
    return () => eventSource.close();
  }, []);
  
  const handleWorkflowEvent = useCallback((event: WorkflowEvent) => {
    switch (event.type) {
      case 'agent_start':
        handleAgentStartEvent(event);
        break;
      case 'sub_agent_start':
        handleSubAgentStartEvent(event);
        break;
      case 'workflow_start':
        handleWorkflowStartEvent(event);
        break;
      case 'workflow_step':
        handleWorkflowStepEvent(event);
        break;
      case 'tool_call':
        handleToolCallEvent(event);
        break;
      case 'tool_result':
        handleToolResultEvent(event);
        break;
      case 'agent_response':
        handleAgentResponseEvent(event);
        break;
      case 'workflow_complete':
        handleWorkflowCompleteEvent(event);
        break;
      case 'error':
        handleErrorEvent(event);
        break;
      default:
        // TypeScript will ensure this is never reached if all cases are handled
        const _exhaustive: never = event;
        console.warn('Unhandled event type:', _exhaustive);
    }
  }, []);
  
  // Type-safe event handlers
  const handleAgentStartEvent = (event: AgentStartEvent) => {
    // Implementation for agent start
    updateExecutionTree(event.executionId, {
      type: 'agent',
      status: 'running',
      metadata: {
        agentType: event.payload.agentType,
        capabilities: event.payload.capabilities
      }
    });
  };
  
  const handleToolResultEvent = (event: ToolResultEvent) => {
    // Implementation for tool result
    updateExecutionTree(event.executionId, {
      status: event.payload.success ? 'completed' : 'failed',
      tokenUsage: event.payload.tokensUsed,
      costUsd: event.payload.costUsd,
      metadata: {
        duration: event.payload.duration,
        toolType: event.payload.toolType
      }
    });
    
    setTotalTokens(prev => prev + event.payload.tokensUsed);
    setTotalCost(prev => prev + event.payload.costUsd);
  };
  
  // ... other event handlers
  
  return { executionTree, totalTokens, totalCost };
}
```

## API Design

### Chat Endpoints (Next.js API Routes)
```typescript
// app/api/chat/stream/route.ts
export async function POST(request: Request) {
  const { message, threadId } = await request.json();
  
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const agent = createChatAgent();
      
      try {
        for await (const event of agent.streamEvents(
          { messages: [{ role: "user", content: message }], threadId },
          { version: "v2" }
        )) {
          const sseData = `data: ${JSON.stringify(event)}\n\n`;
          controller.enqueue(encoder.encode(sseData));
        }
      } catch (error) {
        const errorData = `data: ${JSON.stringify({ type: 'error', error: error.message })}\n\n`;
        controller.enqueue(encoder.encode(errorData));
      } finally {
        controller.close();
      }
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

// app/api/chat/history/[threadId]/route.ts
export async function GET(request: Request, { params }: { params: { threadId: string } }) {
  const messages = await getConversation(params.threadId);
  return Response.json({ messages });
}

// app/api/chat/usage/[threadId]/route.ts  
export async function GET(request: Request, { params }: { params: { threadId: string } }) {
  const stats = await getUsageStats(params.threadId);
  return Response.json(stats);
}
```

### Type-Safe Hierarchical Workflow Streaming
```typescript
// Multi-level workflow execution with strongly typed events
async function* workflowStreamGenerator(message: string, threadId: string): AsyncGenerator<WorkflowEvent> {
  const masterAgent = createMasterAgent();
  const executionContext = new ExecutionContext(threadId);
  
  const config = { configurable: { threadId, executionContext } };
  const state = { 
    messages: [{ role: "user", content: message }],
    threadId,
    executionTree: [],
    currentLevel: 0
  };
  
  for await (const event of masterAgent.streamEvents(state, config, { version: "v2" })) {
    
    // Main agent events
    if (event.event === "on_chain_start" && event.name === "MasterAgent") {
      yield createAgentStartEvent({
        executionId: event.run_id,
        level: 0,
        timestamp: new Date().toISOString(),
        agentName: 'MasterAgent',
        agentType: 'master',
        capabilities: ['orchestration', 'tool_routing', 'workflow_execution']
      });
    }
    
    // Tool execution (could be simple tool, sub-agent, or workflow)
    else if (event.event === "on_tool_start") {
      const toolType = detectToolType(event.name);
      
      if (toolType === 'workflow') {
        yield createWorkflowStartEvent({
          executionId: event.run_id,
          parentId: event.parent_ids?.[0],
          level: getExecutionLevel(event),
          timestamp: new Date().toISOString(),
          workflowName: event.name,
          workflowType: 'dag',
          totalSteps: await getTotalStepsForWorkflow(event.name),
          estimatedDuration: await getEstimatedDuration(event.name)
        });
        
      } else if (toolType === 'sub_agent') {
        yield createSubAgentStartEvent({
          executionId: event.run_id,
          parentId: event.parent_ids?.[0],
          level: getExecutionLevel(event),
          timestamp: new Date().toISOString(),
          agentName: event.name,
          purpose: getAgentPurpose(event.name),
          parentAgent: 'MasterAgent'
        });
        
      } else {
        yield createToolCallEvent({
          executionId: event.run_id,
          parentId: event.parent_ids?.[0],
          level: getExecutionLevel(event),
          timestamp: new Date().toISOString(),
          toolName: event.name,
          toolType: 'simple',
          toolInput: event.data.input,
          description: getToolDescription(event.name)
        });
      }
    }
    
    // Workflow step completion
    else if (event.event === "on_chain_end" && isWorkflowStep(event)) {
      yield createWorkflowStepEvent({
        executionId: event.run_id,
        parentId: event.parent_ids?.[0],
        level: getExecutionLevel(event),
        timestamp: new Date().toISOString(),
        workflowName: getWorkflowName(event),
        stepName: event.name,
        stepIndex: getStepIndex(event),
        totalSteps: getTotalSteps(event),
        stepStatus: event.data.success ? 'completed' : 'failed',
        stepResult: event.data.output
      });
    }
    
    // Tool/Agent completion
    else if (event.event === "on_tool_end") {
      yield createToolResultEvent({
        executionId: event.run_id,
        parentId: event.parent_ids?.[0],
        level: getExecutionLevel(event),
        timestamp: new Date().toISOString(),
        toolName: event.name,
        toolType: detectToolType(event.name),
        toolOutput: event.data.output,
        success: !event.data.error,
        tokensUsed: event.usage?.totalTokens || 0,
        costUsd: calculateCost(event.usage?.totalTokens || 0),
        duration: event.data.duration || 0
      });
    }
    
    // Final response streaming
    else if (event.event === "on_chat_model_stream") {
      yield createAgentResponseEvent({
        executionId: event.run_id,
        parentId: event.parent_ids?.[0],
        level: getExecutionLevel(event),
        timestamp: new Date().toISOString(),
        agentName: getAgentName(event),
        content: event.data.chunk.content,
        isStreaming: true,
        isComplete: event.data.chunk.finish_reason !== null,
        tokensUsed: event.usage?.totalTokens || 0
      });
    }
    
    // Error handling
    else if (event.event === "on_chain_error" || event.event === "on_tool_error") {
      yield createErrorEvent({
        executionId: event.run_id,
        parentId: event.parent_ids?.[0],
        level: getExecutionLevel(event),
        timestamp: new Date().toISOString(),
        errorCode: event.data.error?.code || 'UNKNOWN_ERROR',
        errorMessage: event.data.error?.message || 'An unknown error occurred',
        errorSource: event.name,
        stackTrace: event.data.error?.stack
      });
    }
  }
}

// Type-safe event creation functions
function createAgentStartEvent(params: Omit<AgentStartEvent, 'type'>): AgentStartEvent {
  return {
    type: 'agent_start',
    ...params
  };
}

function createSubAgentStartEvent(params: Omit<SubAgentStartEvent, 'type'>): SubAgentStartEvent {
  return {
    type: 'sub_agent_start',
    ...params
  };
}

function createWorkflowStartEvent(params: Omit<WorkflowStartEvent, 'type'>): WorkflowStartEvent {
  return {
    type: 'workflow_start',
    ...params
  };
}

function createWorkflowStepEvent(params: Omit<WorkflowStepEvent, 'type'>): WorkflowStepEvent {
  return {
    type: 'workflow_step',
    ...params
  };
}

function createToolCallEvent(params: Omit<ToolCallEvent, 'type'>): ToolCallEvent {
  return {
    type: 'tool_call',
    ...params
  };
}

function createToolResultEvent(params: Omit<ToolResultEvent, 'type'>): ToolResultEvent {
  return {
    type: 'tool_result',
    ...params
  };
}

function createAgentResponseEvent(params: Omit<AgentResponseEvent, 'type'>): AgentResponseEvent {
  return {
    type: 'agent_response',
    ...params
  };
}

function createWorkflowCompleteEvent(params: Omit<WorkflowCompleteEvent, 'type'>): WorkflowCompleteEvent {
  return {
    type: 'workflow_complete',
    ...params
  };
}

function createErrorEvent(params: Omit<ErrorEvent, 'type'>): ErrorEvent {
  return {
    type: 'error',
    ...params
  };
}

// Helper functions with better type safety
function detectToolType(toolName: string): 'simple' | 'sub_agent' | 'workflow' {
  if (toolName.endsWith('_workflow_tool')) return 'workflow';
  if (toolName.endsWith('_agent_tool')) return 'sub_agent';
  return 'simple';
}
```

## Token & Cost Tracking

### Usage Monitoring
```typescript
class TokenTracker {
  private usage = new Map<string, number>();
  private costs = new Map<string, number>();
  
  trackLLMCall(model: string, tokens: number) {
    const currentUsage = this.usage.get(model) || 0;
    const currentCost = this.costs.get(model) || 0;
    
    this.usage.set(model, currentUsage + tokens);
    this.costs.set(model, currentCost + this.calculateCost(model, tokens));
  }
  
  getConversationStats(threadId: string): UsageStats {
    const totalTokens = Array.from(this.usage.values()).reduce((a, b) => a + b, 0);
    const totalCost = Array.from(this.costs.values()).reduce((a, b) => a + b, 0);
    
    return {
      totalTokens,
      totalCost,
      breakdown: Object.fromEntries(this.usage)
    };
  }
  
  private calculateCost(model: string, tokens: number): number {
    const prices = {
      'gpt-4': 0.03 / 1000,
      'gpt-3.5-turbo': 0.002 / 1000,
      'claude-3-opus': 0.015 / 1000
    };
    return (prices[model] || 0.01 / 1000) * tokens;
  }
}
```

### Frontend Usage Display
```typescript
interface UsageStats {
  totalTokens: number
  totalCost: number
  breakdown: Record<string, number>
}

export function UsageDisplay({ stats }: { stats: UsageStats }) {
  return (
    <div className="usage-stats">
      <div>Total Tokens: {stats.totalTokens.toLocaleString()}</div>
      <div>Cost: ${stats.totalCost.toFixed(4)}</div>
      <Progress value={(stats.totalTokens / 10000) * 100} className="mt-2" />
    </div>
  )
}
```

## Implementation Plan

### Phase 1: Basic Chat UI
- Set up Next.js chat interface with Radix UI components
- Implement basic message sending/receiving
- Add Redux store for chat state management
- Create simple FastAPI backend with chat endpoint

### Phase 2: LangGraph Integration  
- Integrate LangGraph agent system
- Add tool registry (SQL query, document search)
- Implement SSE streaming for real-time updates
- Add basic token usage tracking

### Phase 3: Advanced Features
- Enhanced agent monitoring UI
- Tool execution visualization
- Cost tracking and usage analytics
- Conversation history and persistence
- Error handling and retry logic

### Phase 4: Polish
- Loading states and animations
- Mobile responsiveness  
- Performance optimization
- Testing and documentation

## File Structure
```
src/
├── app/
│   ├── chat/
│   │   ├── page.tsx              # Main chat page
│   │   └── api/
│   │       ├── send/route.ts     # Chat message endpoint
│   │       └── stream/route.ts   # SSE streaming endpoint
├── components/
│   ├── chat/
│   │   ├── ChatInterface.tsx     # Main chat component
│   │   ├── MessageList.tsx       # Message display
│   │   ├── ChatInput.tsx         # Message input
│   │   ├── AgentMonitor.tsx      # Tool/token display
│   │   └── UsageDisplay.tsx      # Cost tracking
├── hooks/
│   ├── useChat.ts               # Chat state management
│   ├── useSSE.ts               # Server-sent events
│   └── useAgentStatus.ts       # Agent monitoring
├── lib/
│   ├── agent-client.ts         # Backend API client
│   └── types.ts               # TypeScript definitions
└── lib/
    ├── agents/
    │   ├── chat-agent.ts       # LangGraph.js agent
    │   └── tools.ts           # Available tools
    ├── tracking/
    │   └── usage.ts           # Token/cost tracking
    └── utils/
        └── stream.ts          # SSE utilities
```

## Key Benefits

1. **Hierarchical Execution**: Master agent orchestrates sub-agents and workflows as tools
2. **Workflow-as-Tools**: Complex DAGs can be invoked as single tools with internal event streaming
3. **Multi-level Monitoring**: Real-time visibility into execution at all hierarchy levels
4. **Composable Architecture**: Easily combine simple tools, agents, and workflows
5. **Event-driven UI**: Frontend shows detailed execution tree with progress indicators
6. **Cost Transparency**: Token usage tracked across entire execution hierarchy
7. **Extensible Workflows**: New DAGs can be registered as tools dynamically

## Workflow Execution Model

This design treats execution as a **workbook model** where:

- **Master Agent** = Workbook coordinator
- **Sub-Agents** = Specialized worksheets that can be invoked
- **Workflows/DAGs** = Multi-step procedures with dependencies
- **Tools** = Individual functions/operations
- **Execution Tree** = Real-time view of all running processes
- **Event Stream** = Live updates from every level of execution

The system supports **recursive composition**: workflows can invoke other workflows, sub-agents can use workflows as tools, and any level can report its own execution events back to the UI for complete transparency.

This creates a powerful execution abstraction where complex multi-step processes are as easy to invoke as simple tools, while maintaining full visibility into what's happening at every level.
