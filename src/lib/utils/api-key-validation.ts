/**
 * API Key Validation Utilities
 * 
 * Provides functions to validate OpenAI and Anthropic API keys
 * by making simple test calls to their respective APIs.
 */

interface APIKeyValidationResult {
  valid: boolean
  error?: string
  model?: string
}

export async function validateOpenAIKey(apiKey: string): Promise<APIKeyValidationResult> {
  if (!apiKey || !apiKey.startsWith('sk-')) {
    return { valid: false, error: 'Invalid OpenAI API key format' }
  }

  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
    })

    if (response.ok) {
      return { valid: true }
    } else {
      const error = await response.json()
      return { 
        valid: false, 
        error: error.error?.message || `HTTP ${response.status}: ${response.statusText}` 
      }
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

export async function validateAnthropicKey(apiKey: string): Promise<APIKeyValidationResult> {
  if (!apiKey || !apiKey.startsWith('sk-ant-')) {
    return { valid: false, error: 'Invalid Anthropic API key format' }
  }

  try {
    // Make a minimal test call to validate the key
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Hi' }]
      }),
    })

    if (response.ok) {
      return { valid: true }
    } else {
      const error = await response.json()
      return { 
        valid: false, 
        error: error.error?.message || `HTTP ${response.status}: ${response.statusText}` 
      }
    }
  } catch (error) {
    return { 
      valid: false, 
      error: error instanceof Error ? error.message : 'Network error' 
    }
  }
}

export function formatAPIKey(key: string): string {
  if (!key) return ''
  return key.substring(0, 8) + '...' + key.substring(key.length - 4)
}
