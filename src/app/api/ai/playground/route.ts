import { NextRequest, NextResponse } from 'next/server'
import { feedbackClusteringTool } from '@/lib/tools/clustering-tools'

interface AIMessage {
  role: 'system' | 'user' | 'assistant' | 'tool'
  content: string
  name?: string
  tool_calls?: Array<{
    id: string
    type: 'function'
    function: {
      name: string
      arguments: string
    }
  }>
  tool_call_id?: string
}

interface AITool {
  type: 'function'
  function: {
    name: string
    description: string
    parameters: Record<string, any>
  }
}

interface PlaygroundRequest {
  model: string
  messages: AIMessage[]
  tools?: AITool[]
  temperature?: number
  max_tokens?: number
  top_p?: number
  // User-provided API keys
  apiKeys?: {
    openai?: string
    anthropic?: string
  }
}

// OpenAI API call
async function callOpenAI(request: PlaygroundRequest) {
  // Use user-provided API key if available, otherwise fall back to server key
  const openaiApiKey = request.apiKeys?.openai || process.env.OPENAI_API_KEY
  
  if (!openaiApiKey) {
    throw new Error('OpenAI API key not provided. Please configure your API key in settings or contact administrator.')
  }

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openaiApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: request.model,
      messages: request.messages,
      tools: request.tools,
      temperature: request.temperature ?? 0.7,
      max_tokens: request.max_tokens ?? 4096,
      top_p: request.top_p ?? 1.0,
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`OpenAI API error: ${error.error?.message || response.statusText}`)
  }

  return await response.json()
}

// Anthropic (Claude) API call
async function callAnthropic(request: PlaygroundRequest) {
  // Use user-provided API key if available, otherwise fall back to server key
  const anthropicApiKey = request.apiKeys?.anthropic || process.env.ANTHROPIC_API_KEY
  
  if (!anthropicApiKey) {
    throw new Error('Anthropic API key not provided. Please configure your API key in settings or contact administrator.')
  }

  // Convert OpenAI format to Anthropic format
  const systemMessage = request.messages.find(m => m.role === 'system')
  const userMessages = request.messages.filter(m => m.role !== 'system')

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'x-api-key': anthropicApiKey,
      'Content-Type': 'application/json',
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: request.model,
      max_tokens: request.max_tokens ?? 4096,
      temperature: request.temperature ?? 0.7,
      system: systemMessage?.content,
      messages: userMessages.map(msg => ({
        role: msg.role === 'assistant' ? 'assistant' : 'user',
        content: msg.content
      })),
      tools: request.tools?.map(tool => ({
        name: tool.function.name,
        description: tool.function.description,
        input_schema: tool.function.parameters
      }))
    }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(`Anthropic API error: ${error.error?.message || response.statusText}`)
  }

  const result = await response.json()
  
  // Convert Anthropic response to OpenAI format for consistency
  return {
    id: result.id,
    object: 'chat.completion',
    created: Math.floor(Date.now() / 1000),
    model: request.model,
    choices: [{
      index: 0,
      message: {
        role: 'assistant',
        content: result.content[0]?.text || '',
        tool_calls: result.content
          .filter((c: any) => c.type === 'tool_use')
          .map((c: any) => ({
            id: c.id,
            type: 'function',
            function: {
              name: c.name,
              arguments: JSON.stringify(c.input)
            }
          }))
      },
      finish_reason: result.stop_reason === 'end_turn' ? 'stop' : result.stop_reason
    }],
    usage: {
      prompt_tokens: result.usage?.input_tokens || 0,
      completion_tokens: result.usage?.output_tokens || 0,
      total_tokens: (result.usage?.input_tokens || 0) + (result.usage?.output_tokens || 0)
    }
  }
}

export async function POST(req: NextRequest) {
  try {
    const body: PlaygroundRequest = await req.json()
    
    // Validate required fields
    if (!body.model || !body.messages || body.messages.length === 0) {
      return NextResponse.json(
        { error: 'Model and messages are required' },
        { status: 400 }
      )
    }

    // Auto-inject clustering tool if the conversation involves clustering
    const messageText = body.messages.map(m => m.content).join(' ').toLowerCase()
    const isClustering = messageText.includes('cluster') || messageText.includes('semantic') || messageText.includes('group feedback')
    
    if (isClustering && !body.tools) {
      body.tools = [feedbackClusteringTool]
    } else if (isClustering && body.tools) {
      // Add clustering tool if not already present
      const hasClusteringTool = body.tools.some(tool => tool.function.name === 'cluster_feedback')
      if (!hasClusteringTool) {
        body.tools.push(feedbackClusteringTool)
      }
    }

    const startTime = Date.now()
    let result

    // Route to appropriate AI service based on model
    if (body.model.startsWith('gpt-')) {
      result = await callOpenAI(body)
    } else if (body.model.startsWith('claude-')) {
      result = await callAnthropic(body)
    } else {
      // Default to OpenAI for unknown models
      result = await callOpenAI(body)
    }

    const duration = Date.now() - startTime

    // Add timing information
    const responseWithTiming = {
      ...result,
      _playground_meta: {
        duration,
        timestamp: new Date().toISOString(),
        model_provider: body.model.startsWith('claude-') ? 'anthropic' : 'openai'
      }
    }

    return NextResponse.json(responseWithTiming)

  } catch (error) {
    console.error('AI Playground API error:', error)
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        details: error instanceof Error ? error.stack : undefined
      },
      { status: 500 }
    )
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'AI Playground API',
    supportedModels: {
      openai: [
        'gpt-4-turbo-preview',
        'gpt-4',
        'gpt-3.5-turbo',
        'gpt-4o',
        'gpt-4o-mini'
      ],
      anthropic: [
        'claude-3-opus-20240229',
        'claude-3-sonnet-20240229',
        'claude-3-haiku-20240307',
        'claude-3-5-sonnet-20241022'
      ]
    },
    requiredEnvVars: {
      openai: 'OPENAI_API_KEY',
      anthropic: 'ANTHROPIC_API_KEY'
    }
  })
}
