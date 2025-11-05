# ChatWrapper System

A flexible, configurable chat wrapper for LangChain that supports multiple AI providers and customizable prompts.

## Features

- **Multiple Providers**: Support for Ollama (local) and OpenAI
- **Flexible Configuration**: Configurable model settings and prompt templates
- **Conversation Management**: Built-in conversation history with add/clear functionality
- **Streaming Support**: Real-time streaming responses
- **Type Safety**: Full TypeScript support with comprehensive interfaces
- **One-shot Queries**: Send messages without affecting conversation history
- **Preset Templates**: Pre-configured prompt templates for common use cases

## Quick Start

### Basic Usage

```typescript
import { createOllamaChat, PromptTemplates } from '@/lib/chat/ChatWrapper';

// Create a simple conversational chat
const chat = createOllamaChat('gpt-oss:20b', PromptTemplates.conversational());

// Send a message
const response = await chat.sendMessage("Hello, how are you?");
console.log(response);

// Stream a response
for await (const chunk of chat.sendMessageStream("Tell me a story")) {
  process.stdout.write(chunk);
}
```

### Custom Configuration

```typescript
import { ChatWrapper, ModelConfig, PromptConfig } from '@/lib/chat/ChatWrapper';

// Custom model configuration
const modelConfig: ModelConfig = {
  provider: 'ollama',
  model: 'gpt-oss:20b',
  baseUrl: 'http://localhost:11435',
  temperature: 0.7,
  maxTokens: 2048
};

// Custom prompt configuration
const promptConfig: PromptConfig = {
  messages: [
    {
      role: 'system',
      content: 'You are a helpful coding assistant specialized in TypeScript.'
    }
  ]
};

const chat = new ChatWrapper(modelConfig, promptConfig);
```

## Configuration Interfaces

### ModelConfig

```typescript
interface ModelConfig {
  provider: 'ollama' | 'openai';
  model: string;
  baseUrl?: string;        // For Ollama
  apiKey?: string;         // For OpenAI
  temperature?: number;
  maxTokens?: number;
  topP?: number;
  frequencyPenalty?: number;
  presencePenalty?: number;
}
```

### PromptConfig

```typescript
interface PromptConfig {
  messages: PromptMessage[];
}

interface PromptMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## Available Methods

### Core Methods

- `sendMessage(message: string)`: Send a message and get response (adds to history)
- `sendMessageStream(message: string)`: Send a message and get streaming response
- `sendOneShot(messages: PromptMessage[])`: Send messages without affecting history
- `sendOneShotStream(messages: PromptMessage[])`: Stream one-shot query

### History Management

- `addMessage(message: PromptMessage)`: Add a message to conversation history
- `clearHistory()`: Clear conversation history (keeps system messages)
- `getMessages()`: Get current conversation messages
- `updatePromptConfig(config: PromptConfig)`: Update the prompt configuration

## Convenience Functions

### createOllamaChat
```typescript
const chat = createOllamaChat('gpt-oss:20b', promptConfig, {
  baseUrl: 'http://localhost:11435',
  temperature: 0.7
});
```

### createOpenAIChat
```typescript
const chat = createOpenAIChat('gpt-4', promptConfig, {
  apiKey: 'your-api-key',
  temperature: 0.7
});
```

## Prompt Templates

Pre-configured templates for common use cases:

```typescript
import { PromptTemplates } from '@/lib/chat/ChatWrapper';

// General assistant
const assistantPrompt = PromptTemplates.assistant('MyBot', ['analysis', 'coding']);

// Code assistant
const coderPrompt = PromptTemplates.coder('TypeScript and React');

// Data analyst
const analystPrompt = PromptTemplates.analyst();

// Conversational AI
const conversationalPrompt = PromptTemplates.conversational();
```

## Usage with MasterAgent

The MasterAgent has been updated to use the ChatWrapper system:

```typescript
import { MasterAgent } from '@/lib/agents/MasterAgent';

// Create with default configuration
const agent = new MasterAgent();

// Create with custom model config
const agent = new MasterAgent(
  { temperature: 0.8, maxTokens: 4096 },
  PromptTemplates.assistant('InsightLoop', ['analysis', 'insights'])
);

// Update configuration at runtime
agent.updateModelConfig({ temperature: 0.5 });
agent.updatePromptConfig(PromptTemplates.coder('Python'));
```

## Examples

See `src/lib/chat/examples.ts` for detailed usage examples and `src/lib/chat/test.ts` for comprehensive testing scenarios.

## Testing

Run the test suite to verify functionality:

```bash
npx tsx src/lib/chat/test.ts
```

Make sure your Ollama server is running on the configured port (default: localhost:11435) with the specified model loaded.

## Error Handling

The ChatWrapper includes built-in error handling for:
- Connection issues with local/remote models
- Invalid configuration parameters
- Streaming interruptions
- Model response parsing errors

All methods that interact with the AI model should be wrapped in try-catch blocks for robust error handling.
