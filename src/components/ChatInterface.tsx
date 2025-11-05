'use client';

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Loader2 } from 'lucide-react';
import { Button, Input, Card, CardContent, CardHeader, CardTitle, Badge, Separator } from '@/components/ui';
import { ChatMessage, ChatSession, ExecutionTreeNode, SSEConnectionStatus } from '@/types/chat-types';
import { WorkflowEvent } from '@/types/workflow-events';
import { useWorkflowExecution } from '@/hooks';
import { v4 as uuidv4 } from 'uuid';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// Helper function to separate thinking and response content in real-time
function separateThinkingContent(fullContent: string): { thinking: string; response: string; isThinking: boolean } {
  const thinkingMatch = fullContent.match(/<think>([\s\S]*?)(?:<\/think>|$)/);
  
  if (!thinkingMatch) {
    return { thinking: '', response: fullContent, isThinking: false };
  }
  
  const thinking = thinkingMatch[1];
  const isComplete = fullContent.includes('</think>');
  const response = isComplete ? fullContent.replace(/<think>[\s\S]*?<\/think>/g, '').trim() : '';
  
  return { 
    thinking, 
    response, 
    isThinking: !isComplete 
  };
}

interface MessageContentProps {
  message: ChatMessage;
}

function MessageContent({ message }: MessageContentProps) {
  // If message has separate thinking/response content, use that
  if (message.thinkingContent !== undefined || message.responseContent !== undefined) {
    return (
      <div className="space-y-2">
        {message.thinkingContent && (
          <details className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3" open={message.isThinking}>
            <summary className="cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
              🤔 Thinking process...
              {message.isThinking && (
                <span className="ml-2 inline-flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                </span>
              )}
            </summary>
            <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 italic">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.thinkingContent + (message.isThinking ? '\n\n*[Thinking in progress...]*' : '')}
              </ReactMarkdown>
            </div>
          </details>
        )}
        
        {message.responseContent && (
          <div className="prose text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {message.responseContent}
            </ReactMarkdown>
          </div>
        )}
      </div>
    );
  }

  // Fallback: parse content in real-time for backward compatibility
  const { thinking, response, isThinking } = separateThinkingContent(message.content);

  return (
    <div className="space-y-2">
      {thinking && (
        <details className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-md p-3" open={isThinking}>
          <summary className="cursor-pointer text-sm font-medium text-blue-700 dark:text-blue-300 hover:text-blue-800 dark:hover:text-blue-200">
            🤔 Thinking process...
            {isThinking && (
              <span className="ml-2 inline-flex items-center">
                <svg className="animate-spin -ml-1 mr-2 h-3 w-3 text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </span>
            )}
          </summary>
          <div className="mt-2 text-sm text-blue-600 dark:text-blue-400 italic">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {thinking + (isThinking ? '\n\n*[Thinking in progress...]*' : '')}
            </ReactMarkdown>
          </div>
        </details>
      )}
      
      {response && (
        <div className="prose text-sm">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {response}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}

interface ChatInterfaceProps {
  className?: string;
  onSessionUpdate?: (session: ChatSession) => void;
  currentSession?: ChatSession;
}

export function ChatInterface({ className, onSessionUpdate, currentSession }: ChatInterfaceProps) {
  // Initialize session state - only use currentSession as initial value, don't sync updates
  const [session, setSession] = useState<ChatSession>(() => 
    currentSession || {
      id: uuidv4(),
      messages: [],
      status: 'idle',
      executionTree: [],
      totalTokens: 0,
      totalCost: 0,
    }
  );
  
  const [inputValue, setInputValue] = useState('');
  const [connectionStatus, setConnectionStatus] = useState<SSEConnectionStatus>('disconnected');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const eventSourceRef = useRef<EventSource | null>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [session.messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim() || session.status === 'responding') return;

    const userMessage: ChatMessage = {
      id: uuidv4(),
      role: 'user',
      content: inputValue.trim(),
      timestamp: new Date(),
      status: 'sent',
    };

    // Add user message to session
    setSession(prev => ({
      ...prev,
      messages: [...prev.messages, userMessage],
      status: 'responding',
    }));

    setInputValue('');
    setConnectionStatus('connecting');

    try {
      // Build conversation history from existing messages (excluding the current user message)
      const conversationHistory = session.messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Send message to API and establish SSE connection
      const response = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userMessage.content,
          sessionId: session.id,
          conversationHistory,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      if (!response.body) {
        throw new Error('No response body');
      }

      setConnectionStatus('connected');

      // Read the SSE stream
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let assistantMessage: ChatMessage | null = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6));
              const event: WorkflowEvent = eventData;
              
              workflowExecution.handleWorkflowEvent(event);

              // If this is an agent response, create or update the assistant message
              if (event.type === 'agent_response') {
                const { thinking, response, isThinking } = separateThinkingContent(event.payload.response);
                
                if (!assistantMessage) {
                  assistantMessage = {
                    id: uuidv4(),
                    role: 'assistant',
                    content: event.payload.response,
                    thinkingContent: thinking,
                    responseContent: response,
                    isThinking: isThinking,
                    timestamp: new Date(),
                    status: 'sent',
                    metadata: {
                      tokenUsage: event.payload.tokensUsed,
                      costUsd: event.payload.costUsd,
                      reasoning: event.payload.reasoning,
                      confidence: event.payload.confidence,
                    },
                  };

                  setSession(prev => ({
                    ...prev,
                    messages: [...prev.messages, assistantMessage!],
                    status: 'idle',
                  }));
                } else {
                  // Update existing message with separated content
                  setSession(prev => ({
                    ...prev,
                    messages: prev.messages.map(msg =>
                      msg.id === assistantMessage!.id
                        ? { 
                            ...msg, 
                            content: event.payload.response,
                            thinkingContent: thinking,
                            responseContent: response,
                            isThinking: isThinking
                          }
                        : msg
                    ),
                  }));
                }
              }
            } catch (error) {
              console.warn('Failed to parse SSE event:', error);
            }
          }
        }
      }

      setConnectionStatus('disconnected');
    } catch (error) {
      console.error('Error sending message:', error);
      setConnectionStatus('error');
      setSession(prev => ({
        ...prev,
        status: 'idle',
      }));
    }
  };

  // Create a stable callback for session updates to prevent infinite loops
  const handleWorkflowUpdate = React.useCallback((updates: Partial<ChatSession>) => {
    setSession(prev => ({ ...prev, ...updates }));
  }, []);

  // Notify parent of session updates in a separate effect to avoid render-during-render
  React.useEffect(() => {
    if (onSessionUpdate) {
      onSessionUpdate(session);
    }
  }, [session, onSessionUpdate]);

  // Import the workflow execution hook
  const workflowExecution = useWorkflowExecution(handleWorkflowUpdate);

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b">
        <div>
          <h2 className="text-lg font-semibold">InsightLoop Agent</h2>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'secondary'}>
              {connectionStatus}
            </Badge>
            {session.totalTokens > 0 && (
              <span className="text-sm text-muted-foreground">
                {session.totalTokens} tokens • ${session.totalCost.toFixed(4)}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {session.messages.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            <p>Start a conversation with the InsightLoop Agent</p>
            <p className="text-sm mt-2">Ask about feedback analysis, insights, or product recommendations</p>
          </div>
        )}
        
        {session.messages.map(message => (
          <MessageBubble key={message.id} message={message} />
        ))}
        
        {session.status === 'responding' && <TypingIndicator />}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Ask the agent anything..."
            disabled={session.status === 'responding'}
            className="flex-1"
          />
          <Button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || session.status === 'responding'}
            size="icon"
          >
            {session.status === 'responding' ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === 'user';
  
  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[80%] rounded-lg px-4 py-2 ${
          isUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground'
        }`}
      >
        <div className="text-sm">
          <MessageContent message={message} />
        </div>
        {message.metadata && (
          <div className="mt-2 text-xs opacity-70">
            {message.metadata.tokenUsage && (
              <span className="mr-2">{message.metadata.tokenUsage} tokens</span>
            )}
            {message.metadata.costUsd && (
              <span className="mr-2">${message.metadata.costUsd.toFixed(4)}</span>
            )}
            {message.metadata.confidence && (
              <span>Confidence: {(message.metadata.confidence * 100).toFixed(0)}%</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex justify-start">
      <div className="bg-muted text-muted-foreground rounded-lg px-4 py-2">
        <div className="flex items-center gap-1">
          <div className="flex gap-1">
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.3s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce [animation-delay:-0.15s]"></div>
            <div className="w-2 h-2 bg-current rounded-full animate-bounce"></div>
          </div>
          <span className="ml-2 text-sm">Agent is thinking...</span>
        </div>
      </div>
    </div>
  );
}
