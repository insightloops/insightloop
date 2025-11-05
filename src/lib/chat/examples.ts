import { ChatWrapper, createOllamaChat, PromptTemplates, ModelConfig, PromptConfig } from '../chat/ChatWrapper';

/**
 * Example usage of the ChatWrapper
 */

// Example 1: Simple conversational AI using Ollama
export function createSimpleChat() {
  const promptConfig = PromptTemplates.conversational();
  return createOllamaChat('gpt-oss:20b', promptConfig);
}

// Example 2: Code assistant
export function createCodeAssistant() {
  const promptConfig = PromptTemplates.coder('TypeScript and React');
  return createOllamaChat('gpt-oss:20b', promptConfig, {
    temperature: 0.3, // Lower temperature for more focused code generation
    maxTokens: 2048
  });
}

// Example 3: Custom prompt configuration
export function createInsightLoopAgent() {
  const promptConfig: PromptConfig = {
    messages: [
      {
        role: 'system',
        content: `You are InsightLoop Master Agent, an AI assistant specialized in business intelligence and customer feedback analysis.

Your capabilities include:
- Analyzing customer feedback and identifying trends
- Generating actionable business insights
- Helping with data interpretation
- Providing strategic recommendations

Be professional, analytical, and focus on delivering value through data-driven insights.`
      }
    ]
  };

  return createOllamaChat('gpt-oss:20b', promptConfig, {
    temperature: 0.7,
    baseUrl: 'http://localhost:11435' // Custom port if needed
  });
}

// Example 4: Advanced configuration with custom model settings
export function createAdvancedChat() {
  const modelConfig: ModelConfig = {
    provider: 'ollama',
    model: 'gpt-oss:20b',
    baseUrl: 'http://localhost:11435',
    temperature: 0.8,
    maxTokens: 4096,
    topP: 0.9
  };

  const promptConfig: PromptConfig = {
    messages: [
      {
        role: 'system',
        content: 'You are a creative writing assistant. Help users craft compelling stories, improve their writing, and develop characters and plots.'
      }
    ]
  };

  return new ChatWrapper(modelConfig, promptConfig);
}

// Example usage patterns:
export async function exampleUsagePatterns() {
  const chat = createSimpleChat();

  // Send a single message
  const response = await chat.sendMessage("Hello! How are you today?");
  console.log('Response:', response);

  // Send a streaming message
  console.log('Streaming response:');
  for await (const chunk of chat.sendMessageStream("Tell me a short story")) {
    process.stdout.write(chunk);
  }

  // One-shot query without history
  const oneShot = await chat.sendOneShot([
    { role: 'user', content: 'What is 2+2?' }
  ]);
  console.log('One-shot response:', oneShot);

  // Clear conversation history
  chat.clearHistory();

  // Add custom message to history
  chat.addMessage({
    role: 'assistant',
    content: 'I remember our previous conversation about TypeScript.'
  });
}
