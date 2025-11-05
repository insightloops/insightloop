'use client';

import React from 'react';
import { Clock, Loader2, CheckCircle, XCircle } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, Badge, Separator } from '@/components/ui';
import { ExecutionTreeNode } from '@/types/chat-types';

interface WorkflowExecutionMonitorProps {
  executionTree: ExecutionTreeNode[];
  totalTokens: number;
  totalCost: number;
  className?: string;
}

export function WorkflowExecutionMonitor({
  executionTree,
  totalTokens,
  totalCost,
  className
}: WorkflowExecutionMonitorProps) {
  if (executionTree.length === 0) {
    return (
      <Card className={`workflow-monitor ${className}`}>
        <CardHeader>
          <CardTitle className="text-lg">Execution Monitor</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Agent execution tree will appear here during conversations.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`workflow-monitor ${className}`}>
      <CardHeader>
        <CardTitle className="text-lg">Execution Monitor</CardTitle>
        <div className="flex items-center justify-between">
          <Badge variant="outline">
            Active Workflow
          </Badge>
          <div className="text-sm text-muted-foreground">
            {totalTokens > 0 && `${totalTokens} tokens`}
            {totalCost > 0 && ` • $${totalCost.toFixed(4)}`}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {executionTree.map((node, index) => (
            <div key={node.id}>
              <ExecutionTreeNodeComponent node={node} />
              {index < executionTree.length - 1 && (
                <Separator className="my-2" />
              )}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface ExecutionTreeNodeComponentProps {
  node: ExecutionTreeNode;
}

function ExecutionTreeNodeComponent({ node }: ExecutionTreeNodeComponentProps) {
  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-gray-400" />,
    running: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    completed: <CheckCircle className="h-4 w-4 text-green-500" />,
    failed: <XCircle className="h-4 w-4 text-red-500" />
  };

  const statusColor = {
    pending: 'bg-gray-100 text-gray-600',
    running: 'bg-blue-100 text-blue-600',
    completed: 'bg-green-100 text-green-600',
    failed: 'bg-red-100 text-red-600'
  };

  const duration = node.endTime && node.startTime 
    ? new Date(node.endTime).getTime() - new Date(node.startTime).getTime()
    : null;

  return (
    <div className={`pl-${node.level * 4} border-l-2 border-gray-200`}>
      <div className="pl-4 py-2">
        <div className="flex items-center gap-2 mb-1">
          {statusIcon[node.status]}
          <span className="font-medium text-sm">{node.name}</span>
          <Badge variant="secondary" className="text-xs px-2 py-0.5">
            {node.type}
          </Badge>
        </div>
        
        <div className="flex items-center gap-4 text-xs text-muted-foreground ml-6">
          <div className={`px-2 py-1 rounded ${statusColor[node.status]}`}>
            {node.status}
          </div>
          
          {node.tokenUsage > 0 && (
            <span>{node.tokenUsage} tokens</span>
          )}
          
          {node.costUsd > 0 && (
            <span>${node.costUsd.toFixed(4)}</span>
          )}
          
          {duration && (
            <span>{duration}ms</span>
          )}
          
          <span className="text-xs">
            {new Date(node.startTime).toLocaleTimeString()}
          </span>
        </div>

        {/* Metadata for different node types */}
        {renderNodeMetadata(node)}
        
        {/* Render children */}
        {node.children.map(child => (
          <ExecutionTreeNodeComponent key={child.id} node={child} />
        ))}
      </div>
    </div>
  );
}

function renderNodeMetadata(node: ExecutionTreeNode): React.ReactNode {
  if (!node.metadata || Object.keys(node.metadata).length === 0) {
    return null;
  }

  return (
    <div className="ml-6 mt-1 text-xs text-muted-foreground">
      {node.type === 'workflow' && (
        <div className="space-y-1">
          {node.metadata.workflowType && (
            <div>Type: {node.metadata.workflowType}</div>
          )}
          {node.metadata.currentStep && node.metadata.totalSteps && (
            <div>
              Progress: {node.metadata.currentStep}/{node.metadata.totalSteps}
            </div>
          )}
        </div>
      )}
      
      {node.type === 'agent' && (
        <div className="space-y-1">
          {node.metadata.agentType && (
            <div>Type: {node.metadata.agentType}</div>
          )}
          {node.metadata.purpose && (
            <div>Purpose: {node.metadata.purpose}</div>
          )}
          {node.metadata.capabilities && Array.isArray(node.metadata.capabilities) && (
            <div>
              Capabilities: {node.metadata.capabilities.join(', ')}
            </div>
          )}
        </div>
      )}
      
      {node.type === 'tool' && (
        <div className="space-y-1">
          {node.metadata.toolType && (
            <div>Type: {node.metadata.toolType}</div>
          )}
          {node.metadata.duration && (
            <div>Duration: {node.metadata.duration}ms</div>
          )}
          {node.metadata.input && (
            <div className="truncate">
              Input: {JSON.stringify(node.metadata.input).substring(0, 50)}...
            </div>
          )}
        </div>
      )}
    </div>
  );
}
