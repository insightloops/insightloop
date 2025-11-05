import { ChatWrapper, createOllamaChat, PromptTemplates, ModelConfig, PromptConfig } from '@/lib/chat/ChatWrapper';

/**
 * Test script to demonstrate the ChatWrapper functionality
 * Run this with: npx tsx src/lib/chat/test.ts
 */

async function testChatWrapper() {
  console.log('🤖 Testing ChatWrapper...\n');

  // Test 1: Simple conversational chat
  console.log('=== Test 1: Simple Conversational Chat ===');
  const simpleChat = createOllamaChat('gpt-oss:20b', PromptTemplates.conversational(), {
    baseUrl: 'http://localhost:11435',
    temperature: 0.7
  });

  try {
    const response1 = await simpleChat.sendMessage("Hello! What's your name?");
    console.log('User: Hello! What\'s your name?');
    console.log('AI:', response1);
    console.log('');

    // Test conversation history
    const response2 = await simpleChat.sendMessage("What did I just ask you?");
    console.log('User: What did I just ask you?');
    console.log('AI:', response2);
    console.log('');

  } catch (error) {
    console.error('Error in simple chat test:', error);
  }

  // Test 2: Code assistant
  console.log('=== Test 2: Code Assistant ===');
  const codeChat = createOllamaChat('gpt-oss:20b', PromptTemplates.coder('TypeScript'), {
    baseUrl: 'http://localhost:11435',
    temperature: 0.3
  });

  try {
    const codeResponse = await codeChat.sendMessage("Write a TypeScript function to calculate fibonacci numbers");
    console.log('User: Write a TypeScript function to calculate fibonacci numbers');
    console.log('AI:', codeResponse);
    console.log('');
  } catch (error) {
    console.error('Error in code assistant test:', error);
  }

  // Test 3: Custom prompt configuration
  console.log('=== Test 3: Custom Prompt Configuration ===');
  const customPrompt: PromptConfig = {
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that always responds with enthusiasm and uses lots of emojis! 🎉'
      }
    ]
  };

  const customChat = createOllamaChat('gpt-oss:20b', customPrompt, {
    baseUrl: 'http://localhost:11435'
  });

  try {
    const customResponse = await customChat.sendMessage("How are you today?");
    console.log('User: How are you today?');
    console.log('AI:', customResponse);
    console.log('');
  } catch (error) {
    console.error('Error in custom prompt test:', error);
  }

  // Test 4: Streaming response
  console.log('=== Test 4: Streaming Response ===');
  const streamChat = createOllamaChat('gpt-oss:20b', PromptTemplates.conversational(), {
    baseUrl: 'http://localhost:11435'
  });

  try {
    console.log('User: Tell me a short story about a robot');
    console.log('AI (streaming): ');
    
    for await (const chunk of streamChat.sendMessageStream("Tell me a short story about a robot")) {
      process.stdout.write(chunk);
    }
    
    console.log('\n');
  } catch (error) {
    console.error('Error in streaming test:', error);
  }

  // Test 5: One-shot query (no history)
  console.log('=== Test 5: One-shot Query ===');
  try {
    const oneShotResponse = await simpleChat.sendOneShot([
      { role: 'user', content: 'What is 2 + 2? Just give me the number.' }
    ]);
    console.log('User: What is 2 + 2? Just give me the number.');
    console.log('AI (one-shot):', oneShotResponse);
    console.log('');
  } catch (error) {
    console.error('Error in one-shot test:', error);
  }

  // Test 6: Managing conversation history
  console.log('=== Test 6: Managing Conversation History ===');
  console.log('Current conversation history:', simpleChat.getMessages().length, 'messages');
  
  // Clear history
  simpleChat.clearHistory();
  console.log('After clearing history:', simpleChat.getMessages().length, 'messages');
  
  // Add custom message
  simpleChat.addMessage({
    role: 'assistant',
    content: 'I remember we were talking about something interesting before!'
  });
  
  try {
    const historyResponse = await simpleChat.sendMessage("What were we talking about?");
    console.log('User: What were we talking about?');
    console.log('AI:', historyResponse);
  } catch (error) {
    console.error('Error in history management test:', error);
  }

  console.log('\n✅ ChatWrapper tests completed!');
}

// Run the tests if this file is executed directly
if (require.main === module) {
  testChatWrapper().catch(console.error);
}

export { testChatWrapper };
