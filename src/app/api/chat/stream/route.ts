import { NextRequest } from 'next/server';
import { v4 as uuidv4 } from 'uuid';
import { WorkflowEvent } from '@/types/workflow-events';
import { EventEmitter } from '@/types/agent-types';
import { MasterAgent } from '@/lib/agents/MasterAgent';

// Simple in-memory store for demo (in production, use Redis or similar)
const activeSessions = new Map<string, any>();
const masterAgent = new MasterAgent();

export async function POST(request: NextRequest) {
  const { message, sessionId = uuidv4(), conversationHistory = [] } = await request.json();

  if (!message) {
    return new Response(JSON.stringify({ error: 'Message is required' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Create Server-Sent Events stream
  const stream = new ReadableStream({
    start(controller) {
      // Start the agent processing in the background
      processMessageWithAgent(message, sessionId, conversationHistory, controller);
    },
    cancel() {
      // Cleanup when client disconnects
      activeSessions.delete(sessionId);
    }
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}

async function processMessageWithAgent(
  message: string,
  sessionId: string,
  conversationHistory: Array<{role: string, content: string}>,
  controller: ReadableStreamDefaultController
) {
  try {
    // Create event emitter that sends events to the client
    const eventEmitter: EventEmitter = {
      emit: (event: WorkflowEvent) => {
        sendEvent(controller, event);
      },
      generateExecutionId: () => uuidv4()
    };

    // Process the message with the real master agent
    const eventGenerator = masterAgent.processMessage(message, sessionId, eventEmitter, conversationHistory);
    
    // Stream all events to the client
    for await (const event of eventGenerator) {
      // Events are already sent via the eventEmitter.emit in the agent
      // This loop just ensures we wait for all events to complete
    }
    
  } catch (error) {    
    sendEvent(controller, {
      type: 'error' as const,
      timestamp: new Date(),
      executionId: uuidv4(),
      sessionId,
      payload: {
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        errorType: 'system_error' as const,
        source: 'api-route',
        recoverable: true
      }
    });
  }
  
  // Close the stream
  controller.close();
}

function sendEvent(controller: ReadableStreamDefaultController, event: WorkflowEvent) {
  try {
    if (controller.desiredSize !== null) { // Check if controller is still open
      const data = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(new TextEncoder().encode(data));
    }
  } catch (error) {
    console.error('Failed to send event:', error);
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
