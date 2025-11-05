'use client';

import { useState, useEffect, useCallback } from 'react';
import { WorkflowEvent } from '@/types/workflow-events';
import { ChatSession, ExecutionTreeNode } from '@/types/chat-types';
import { v4 as uuidv4 } from 'uuid';

export function useWorkflowExecution(onUpdateSession: (updates: Partial<ChatSession>) => void) {
  const [executionTree, setExecutionTree] = useState<ExecutionTreeNode[]>([]);
  const [totalTokens, setTotalTokens] = useState(0);
  const [totalCost, setTotalCost] = useState(0);

  // Handle workflow events with proper type safety
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
        // TypeScript ensures this is never reached if all cases are handled
        const _exhaustive: never = event;
        console.warn('Unhandled event type:', _exhaustive);
    }
  }, []);

  const handleAgentStartEvent = useCallback((event: WorkflowEvent & { type: 'agent_start' }) => {
    const newNode: ExecutionTreeNode = {
      id: event.executionId,
      parentId: event.parentExecutionId,
      type: 'agent',
      name: event.payload.name,
      status: 'running',
      level: event.parentExecutionId ? 1 : 0,
      startTime: event.timestamp,
      tokenUsage: 0,
      costUsd: 0,
      children: [],
      metadata: {
        agentType: event.payload.agentType,
        capabilities: event.payload.capabilities,
        purpose: event.payload.purpose
      }
    };

    setExecutionTree(prev => {
      const updated = [...prev];
      const existingIndex = updated.findIndex(node => node.id === event.executionId);
      if (existingIndex >= 0) {
        updated[existingIndex] = { ...updated[existingIndex], ...newNode };
      } else {
        updated.push(newNode);
      }
      return updated;
    });
  }, []);

  const handleSubAgentStartEvent = useCallback((event: WorkflowEvent & { type: 'sub_agent_start' }) => {
    const newNode: ExecutionTreeNode = {
      id: event.executionId,
      parentId: event.parentExecutionId,
      type: 'agent',
      name: `Sub-Agent: ${event.payload.purpose}`,
      status: 'running',
      level: 1,
      startTime: event.timestamp,
      tokenUsage: 0,
      costUsd: 0,
      children: [],
      metadata: {
        agentType: event.payload.agentType,
        capabilities: event.payload.capabilities,
        purpose: event.payload.purpose,
        parentAgentId: event.payload.parentAgentId
      }
    };

    setExecutionTree(prev => [...prev, newNode]);
  }, []);

  const handleWorkflowStartEvent = useCallback((event: WorkflowEvent & { type: 'workflow_start' }) => {
    const newNode: ExecutionTreeNode = {
      id: event.executionId,
      parentId: event.parentExecutionId,
      type: 'workflow',
      name: event.payload.name,
      status: 'running',
      level: event.parentExecutionId ? 1 : 0,
      startTime: event.timestamp,
      tokenUsage: 0,
      costUsd: 0,
      children: [],
      metadata: {
        workflowType: event.payload.workflowType,
        description: event.payload.description,
        totalSteps: event.payload.totalSteps,
        currentStep: 0
      }
    };

    setExecutionTree(prev => [...prev, newNode]);
  }, []);

  const handleWorkflowStepEvent = useCallback((event: WorkflowEvent & { type: 'workflow_step' }) => {
    setExecutionTree(prev => 
      prev.map(node => 
        node.id === event.payload.workflowId
          ? { 
              ...node, 
              metadata: { 
                ...node.metadata, 
                currentStep: event.payload.currentStep 
              } 
            }
          : node
      )
    );
  }, []);

  const handleToolCallEvent = useCallback((event: WorkflowEvent & { type: 'tool_call' }) => {
    const newNode: ExecutionTreeNode = {
      id: event.executionId,
      parentId: event.parentExecutionId,
      type: 'tool',
      name: event.payload.toolName,
      status: 'running',
      level: event.parentExecutionId ? 1 : 0,
      startTime: event.timestamp,
      tokenUsage: 0,
      costUsd: 0,
      children: [],
      metadata: {
        toolType: event.payload.toolType,
        input: event.payload.input,
        agentId: event.payload.agentId
      }
    };

    setExecutionTree(prev => [...prev, newNode]);
  }, []);

  const handleToolResultEvent = useCallback((event: WorkflowEvent & { type: 'tool_result' }) => {
    setExecutionTree(prev => 
      prev.map(node => 
        node.id === event.executionId || (node.metadata?.toolType && node.name === event.payload.toolName)
          ? { 
              ...node, 
              status: event.payload.success ? 'completed' : 'failed',
              endTime: event.timestamp,
              tokenUsage: event.payload.tokensUsed,
              costUsd: event.payload.costUsd,
              metadata: {
                ...node.metadata,
                duration: event.payload.duration,
                result: event.payload.result,
                error: event.payload.error
              }
            }
          : node
      )
    );

    // Update totals
    setTotalTokens(prev => prev + event.payload.tokensUsed);
    setTotalCost(prev => prev + event.payload.costUsd);
  }, []);

  const handleAgentResponseEvent = useCallback((event: WorkflowEvent & { type: 'agent_response' }) => {
    setExecutionTree(prev => 
      prev.map(node => 
        node.id === event.executionId
          ? { 
              ...node, 
              status: 'completed',
              endTime: event.timestamp,
              tokenUsage: event.payload.tokensUsed,
              costUsd: event.payload.costUsd,
              metadata: {
                ...node.metadata,
                response: event.payload.response,
                reasoning: event.payload.reasoning,
                confidence: event.payload.confidence
              }
            }
          : node
      )
    );

    // Update totals
    setTotalTokens(prev => prev + event.payload.tokensUsed);
    setTotalCost(prev => prev + event.payload.costUsd);
  }, []);

  const handleWorkflowCompleteEvent = useCallback((event: WorkflowEvent & { type: 'workflow_complete' }) => {
    setExecutionTree(prev => 
      prev.map(node => 
        node.id === event.executionId
          ? { 
              ...node, 
              status: event.payload.success ? 'completed' : 'failed',
              endTime: event.timestamp,
              tokenUsage: event.payload.totalTokens,
              costUsd: event.payload.totalCostUsd,
              metadata: {
                ...node.metadata,
                result: event.payload.result,
                duration: event.payload.duration
              }
            }
          : node
      )
    );

    setTotalTokens(prev => prev + event.payload.totalTokens);
    setTotalCost(prev => prev + event.payload.totalCostUsd);
  }, []);

  const handleErrorEvent = useCallback((event: WorkflowEvent & { type: 'error' }) => {
    const errorNode: ExecutionTreeNode = {
      id: event.executionId,
      parentId: event.parentExecutionId,
      type: 'agent', // Default to agent type for errors
      name: `Error: ${event.payload.errorType}`,
      status: 'failed',
      level: event.parentExecutionId ? 1 : 0,
      startTime: event.timestamp,
      endTime: event.timestamp,
      tokenUsage: 0,
      costUsd: 0,
      children: [],
      metadata: {
        error: event.payload.error,
        errorType: event.payload.errorType,
        source: event.payload.source,
        recoverable: event.payload.recoverable,
        details: event.payload.details
      }
    };

    setExecutionTree(prev => [...prev, errorNode]);
  }, []);

  // Update the session when execution tree or totals change
  useEffect(() => {
    onUpdateSession({
      executionTree,
      totalTokens,
      totalCost
    });
  }, [executionTree, totalTokens, totalCost, onUpdateSession]);

  return {
    executionTree,
    totalTokens,
    totalCost,
    handleWorkflowEvent
  };
}
