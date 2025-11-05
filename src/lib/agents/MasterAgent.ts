import { v4 as uuidv4 } from 'uuid';
import { ChatWrapper, createOllamaChat, PromptConfig, ModelConfig } from '@/lib/chat/ChatWrapper';

import { 
  WorkflowEvent, 
  createAgentStartEvent, 
  createAgentResponseEvent, 
  createErrorEvent 
} from '@/types/workflow-events';
import { EventEmitter } from '@/types/agent-types';

export class MasterAgent {
  private chatWrapper: ChatWrapper;

  constructor(modelConfig?: Partial<ModelConfig>, promptConfig?: PromptConfig) {
    // Create default model config
    const defaultModelConfig: ModelConfig = {
      provider: 'ollama',
      model: process.env.AI_MODEL ?? 'gpt-oss:20b',
      baseUrl: process.env.OLLAMA_BASE_URL ?? 'http://localhost:11435',
      temperature: 0.7,
    };

    // Merge with provided config
    const finalModelConfig = { ...defaultModelConfig, ...modelConfig };

    // Create default prompt config for InsightLoop
    const defaultPromptConfig: PromptConfig = promptConfig ?? {
      messages: [
        {
          role: 'system',
          content: `You are InsightLoop Master Agent, a helpful AI assistant powered by ${finalModelConfig.model} running locally.

You can have natural conversations and help users with various tasks including:
- Business intelligence and data analysis
- Customer feedback analysis
- Strategic insights and recommendations
- General assistance and problem-solving

Be friendly, helpful, and intelligent in your responses. Focus on delivering value through clear, actionable insights.`
        }
      ]
    };

    // Create the chat wrapper
    this.chatWrapper = new ChatWrapper(finalModelConfig, defaultPromptConfig);
    this.initializeTools();
  }

  private initializeTools() {
    // No tools for now - keeping it simple
  }

  // Main processing method that emits events
  async *processMessage(
    message: string,
    sessionId: string,
    eventEmitter: EventEmitter,
    conversationHistory: Array<{role: string, content: string}> = []
  ): AsyncGenerator<WorkflowEvent, void, unknown> {
    const executionId = uuidv4();
    let totalTokens = 0;

    try {
      // Emit agent start event
      const startEvent = createAgentStartEvent(
        executionId,
        sessionId,
        {
          agentId: 'master-agent',
          agentType: 'master',
          name: 'InsightLoop Master Agent',
          capabilities: ['conversation', 'reasoning', 'analysis'],
          purpose: 'Chat assistant powered by local AI'
        }
      );
      eventEmitter.emit(startEvent);
      yield startEvent;

      // Clear previous history and add conversation history
      this.chatWrapper.clearHistory();
      
      // Add conversation history to the chat wrapper
      conversationHistory.forEach(msg => {
        this.chatWrapper.addMessage({
          role: msg.role as 'system' | 'user' | 'assistant',
          content: msg.content
        });
      });

      // Stream response from the chat wrapper
      let accumulatedResponse = '';
      let chunkCount = 0;

      // Process streaming response
      for await (const chunk of this.chatWrapper.sendMessageStream(message)) {
        accumulatedResponse += chunk;
        chunkCount++;
        
        // Emit streaming response event for each chunk
        const streamEvent = createAgentResponseEvent(
          executionId,
          sessionId,
          {
            agentId: 'master-agent',
            response: accumulatedResponse,
            reasoning: 'Streaming response from local AI model',
            confidence: 0.9,
            tokensUsed: chunkCount,
            costUsd: 0
          }
        );
        eventEmitter.emit(streamEvent);
        yield streamEvent;
      }

      // Emit final completion event if we have accumulated content
      if (accumulatedResponse) {
        // Estimate token usage (rough approximation)
        const estimatedTokens = Math.floor(accumulatedResponse.length / 4);
        totalTokens += estimatedTokens;

        const finalEvent = createAgentResponseEvent(
          executionId,
          sessionId,
          {
            agentId: 'master-agent',
            response: accumulatedResponse,
            reasoning: 'Final response from local AI model',
            confidence: 0.9,
            tokensUsed: totalTokens,
            costUsd: 0
          }
        );
        eventEmitter.emit(finalEvent);
        yield finalEvent;
      }

    } catch (error) {
      const errorEvent = createErrorEvent(
        executionId,
        sessionId,
        {
          error: error instanceof Error ? error.message : 'Unknown execution error',
          errorType: 'agent_error',
          source: 'master-agent',
          recoverable: false
        }
      );
      eventEmitter.emit(errorEvent);
      yield errorEvent;
    }
  }

  // Method to update the chat configuration
  updateModelConfig(modelConfig: Partial<ModelConfig>): void {
    // Create a new chat wrapper with updated config
    const currentMessages = this.chatWrapper.getMessages();
    const newModelConfig = { ...modelConfig };
    const promptConfig = { messages: currentMessages };
    
    this.chatWrapper = new ChatWrapper(newModelConfig as ModelConfig, promptConfig);
  }

  // Method to update the prompt configuration
  updatePromptConfig(promptConfig: PromptConfig): void {
    this.chatWrapper.updatePromptConfig(promptConfig);
  }

  // Method to get current conversation
  getCurrentConversation(): Array<{role: string, content: string}> {
    return this.chatWrapper.getMessages().map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }
}
