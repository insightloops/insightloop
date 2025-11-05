import { ChatOllama } from '@langchain/ollama';
import { ChatOpenAI } from '@langchain/openai';
import { BaseMessage, HumanMessage, AIMessage, SystemMessage } from '@langchain/core/messages';

// Model configuration interface
export interface ModelConfig {
  provider: 'ollama' | 'openai';
  model: string;
  baseUrl?: string; // For Ollama
  apiKey?: string; // For OpenAI
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}

// Message interface for prompt configuration
export interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

// Prompt configuration interface
export interface PromptConfig {
  messages: PromptMessage[];
}

// Chat client interface
export interface ChatClient {
  invoke(messages: PromptMessage[]): Promise<string>;
  stream(messages: PromptMessage[]): AsyncIterable<string>;
}

// Factory function to create appropriate chat client
function createChatClient(config: ModelConfig): ChatClient {
  let client: ChatOllama | ChatOpenAI;

  if (config.provider === 'ollama') {
    client = new ChatOllama({
      model: config.model,
      baseUrl: config.baseUrl ?? 'http://localhost:11434',
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxTokens: config.maxTokens }),
      ...(config.topP && { topP: config.topP }),
    });
  } else if (config.provider === 'openai') {
    client = new ChatOpenAI({
      model: config.model,
      apiKey: config.apiKey ?? process.env.OPENAI_API_KEY,
      temperature: config.temperature ?? 0.7,
      ...(config.maxTokens && { maxTokens: config.maxTokens }),
      ...(config.topP && { topP: config.topP }),
      ...(config.frequencyPenalty && { frequencyPenalty: config.frequencyPenalty }),
      ...(config.presencePenalty && { presencePenalty: config.presencePenalty }),
    });
  } else {
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  return {
    async invoke(messages: PromptMessage[]): Promise<string> {
      const langchainMessages = convertToLangChainMessages(messages);
      const response = await client.invoke(langchainMessages);
      return response.content as string;
    },

    async* stream(messages: PromptMessage[]): AsyncIterable<string> {
      const langchainMessages = convertToLangChainMessages(messages);
      const stream = await client.stream(langchainMessages);
      
      for await (const chunk of stream) {
        if (chunk.content && typeof chunk.content === 'string') {
          yield chunk.content;
        }
      }
    }
  };
}

// Helper function to convert PromptMessage to LangChain messages
function convertToLangChainMessages(messages: PromptMessage[]): BaseMessage[] {
  return messages.map(msg => {
    switch (msg.role) {
      case 'system':
        return new SystemMessage(msg.content);
      case 'user':
        return new HumanMessage(msg.content);
      case 'assistant':
        return new AIMessage(msg.content);
      default:
        throw new Error(`Unknown message role: ${msg.role}`);
    }
  });
}

// Main ChatWrapper class
export class ChatWrapper {
  private client: ChatClient;
  private promptConfig: PromptConfig;

  constructor(modelConfig: ModelConfig, promptConfig: PromptConfig) {
    this.client = createChatClient(modelConfig);
    this.promptConfig = promptConfig;
  }

  // Update prompt configuration
  updatePromptConfig(promptConfig: PromptConfig): void {
    this.promptConfig = promptConfig;
  }

  // Add a message to the prompt configuration
  addMessage(message: PromptMessage): void {
    this.promptConfig.messages.push(message);
  }

  // Clear conversation history (keep only system messages)
  clearHistory(): void {
    this.promptConfig.messages = this.promptConfig.messages.filter(msg => msg.role === 'system');
  }

  // Get current messages
  getMessages(): PromptMessage[] {
    return [...this.promptConfig.messages];
  }

  // Send a message and get response
  async sendMessage(message: string): Promise<string> {
    const messages = [
      ...this.promptConfig.messages,
      { role: 'user' as const, content: message }
    ];

    const response = await this.client.invoke(messages);
    
    // Add the conversation to history
    this.addMessage({ role: 'user', content: message });
    this.addMessage({ role: 'assistant', content: response });

    return response;
  }

  // Send a message and get streaming response
  async* sendMessageStream(message: string): AsyncIterable<string> {
    const messages = [
      ...this.promptConfig.messages,
      { role: 'user' as const, content: message }
    ];

    let fullResponse = '';
    
    for await (const chunk of this.client.stream(messages)) {
      fullResponse += chunk;
      yield chunk;
    }

    // Add the conversation to history
    this.addMessage({ role: 'user', content: message });
    this.addMessage({ role: 'assistant', content: fullResponse });
  }

  // Send messages without adding to history
  async sendOneShot(messages: PromptMessage[]): Promise<string> {
    return await this.client.invoke(messages);
  }

  // Stream messages without adding to history
  async* sendOneShotStream(messages: PromptMessage[]): AsyncIterable<string> {
    for await (const chunk of this.client.stream(messages)) {
      yield chunk;
    }
  }
}

// Convenience factory functions
export function createOllamaChat(model: string, promptConfig: PromptConfig, options?: Partial<ModelConfig>): ChatWrapper {
  const modelConfig: ModelConfig = {
    provider: 'ollama',
    model,
    baseUrl: options?.baseUrl ?? 'http://localhost:11434',
    temperature: options?.temperature ?? 0.7,
    ...options
  };
  
  return new ChatWrapper(modelConfig, promptConfig);
}

export function createOpenAIChat(model: string, promptConfig: PromptConfig, options?: Partial<ModelConfig>): ChatWrapper {
  const modelConfig: ModelConfig = {
    provider: 'openai',
    model,
    apiKey: options?.apiKey ?? process.env.OPENAI_API_KEY,
    temperature: options?.temperature ?? 0.7,
    ...options
  };
  
  return new ChatWrapper(modelConfig, promptConfig);
}

// Pre-configured prompt templates
export const PromptTemplates = {
  assistant: (name = 'Assistant', capabilities: string[] = []): PromptConfig => ({
    messages: [{
      role: 'system',
      content: `You are ${name}, a helpful AI assistant.${capabilities.length > 0 ? ` Your capabilities include: ${capabilities.join(', ')}.` : ''} Be friendly, helpful, and provide accurate information.`
    }]
  }),

  coder: (language = 'any programming language'): PromptConfig => ({
    messages: [{
      role: 'system', 
      content: `You are an expert programmer specializing in ${language}. Provide clean, efficient, and well-documented code. Explain your solutions clearly and suggest best practices.`
    }]
  }),

  analyst: (): PromptConfig => ({
    messages: [{
      role: 'system',
      content: 'You are a data analyst and insights expert. Analyze information thoroughly, identify patterns and trends, and provide actionable recommendations based on data.'
    }]
  }),

  conversational: (): PromptConfig => ({
    messages: [{
      role: 'system',
      content: 'You are a friendly conversational AI. Engage in natural dialogue, be curious about the user\'s interests, and maintain an engaging and supportive tone.'
    }]
  })
};
