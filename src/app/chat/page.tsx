'use client';

import React, { useState, useRef, useCallback } from 'react';
import { ChatInterface } from '@/components/ChatInterface';
import { WorkflowExecutionMonitor } from '@/components/WorkflowExecutionMonitor';
import { Card, Button } from '@/components/ui';
import { ChatSession, ExecutionTreeNode } from '@/types/chat-types';
import { ChevronLeft, ChevronRight, Monitor, X } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

export default function ChatPage() {
  const [session, setSession] = useState<ChatSession>({
    id: uuidv4(),
    messages: [],
    status: 'idle',
    executionTree: [],
    totalTokens: 0,
    totalCost: 0,
  });

  // Panel state
  const [showExecutionMonitor, setShowExecutionMonitor] = useState(true);
  const [panelWidth, setPanelWidth] = useState(400); // Default width in pixels
  const [isResizing, setIsResizing] = useState(false);
  const panelWidthRef = useRef<number>(panelWidth);

  // Resize handler
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsResizing(true);
    const startX = e.clientX;
    const startWidth = panelWidthRef.current;

    const handleMouseMove = (e: MouseEvent) => {
      const deltaX = startX - e.clientX; // Reverse delta since panel is on the right
      const newWidth = Math.max(250, Math.min(800, startWidth + deltaX)); // Min 250px, Max 800px
      setPanelWidth(newWidth);
      panelWidthRef.current = newWidth;
    };

    const handleMouseUp = () => {
      setIsResizing(false);
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, []);

  // Update ref when width changes
  React.useEffect(() => {
    panelWidthRef.current = panelWidth;
  }, [panelWidth]);

  return (
    <div className="container mx-auto p-4 h-screen">
      <div className="flex gap-4 h-full relative">
        {/* Chat Interface */}
        <div 
          className="flex-1 transition-all duration-200"
          style={{ 
            marginRight: showExecutionMonitor ? `${panelWidth + 16}px` : '0px' 
          }}
        >
          <Card className="h-full relative">
            {/* Toggle Button */}
            <Button
              variant="outline"
              size="sm"
              className="absolute top-4 right-4 z-10"
              onClick={() => setShowExecutionMonitor(!showExecutionMonitor)}
            >
              {showExecutionMonitor ? (
                <>
                  <ChevronRight className="h-4 w-4 mr-1" />
                  Hide Monitor
                </>
              ) : (
                <>
                  <Monitor className="h-4 w-4 mr-1" />
                  Show Monitor
                </>
              )}
            </Button>

            <ChatInterface 
              onSessionUpdate={setSession}
              currentSession={session}
            />
          </Card>
        </div>
        
        {/* Execution Monitor Panel */}
        {showExecutionMonitor && (
          <div 
            className="fixed top-4 right-4 bottom-4 flex bg-background border-l shadow-lg transition-all duration-200"
            style={{ width: `${panelWidth}px` }}
          >
            {/* Resize Handle */}
            <div
              className={`w-1 bg-border hover:bg-primary cursor-col-resize flex-shrink-0 ${
                isResizing ? 'bg-primary' : ''
              }`}
              onMouseDown={handleMouseDown}
            />
            
            {/* Panel Content */}
            <div className="flex-1 flex flex-col">
              {/* Panel Header */}
              <div className="flex items-center justify-between p-3 border-b bg-muted/30">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4" />
                  <span className="font-medium text-sm">Execution Monitor</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowExecutionMonitor(false)}
                  className="h-6 w-6 p-0"
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>

              {/* Monitor Content */}
              <div className="flex-1 overflow-hidden">
                <WorkflowExecutionMonitor
                  executionTree={session.executionTree}
                  totalTokens={session.totalTokens}
                  totalCost={session.totalCost}
                  className="h-full"
                />
              </div>
            </div>
          </div>
        )}
        
        {/* Resize overlay */}
        {isResizing && (
          <div className="fixed inset-0 cursor-col-resize z-50" />
        )}
      </div>
    </div>
  );
}
