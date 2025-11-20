'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { useAPIKeys } from '@/contexts/APIKeyContext'
import { 
  Play, 
  Copy, 
  RotateCcw, 
  Settings, 
  MessageSquare,
  Zap,
  Brain,
  Clock,
  CheckCircle2,
  ArrowLeftRight
} from 'lucide-react'

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

interface AICallData {
  callId: string
  model: string
  messages: AIMessage[]
  tools?: AITool[]
  response: {
    id: string
    object: string
    created: number
    model: string
    choices: Array<{
      index: number
      message: AIMessage
      finish_reason: string
    }>
    usage: {
      prompt_tokens: number
      completion_tokens: number
      total_tokens: number
    }
  }
  duration: number
  timestamp: string
}

interface AIPlaygroundProps {
  isOpen: boolean
  onClose: () => void
  initialCallData?: AICallData
  title?: string
  description?: string
}

const AVAILABLE_MODELS = [
  // OpenAI Models
  'gpt-4o',
  'gpt-4o-mini',
  'gpt-4-turbo-preview',
  'gpt-4',
  'gpt-3.5-turbo',
  // Anthropic Models
  'claude-3-5-sonnet-20241022',
  'claude-3-opus-20240229',
  'claude-3-sonnet-20240229',
  'claude-3-haiku-20240307'
]

const SAMPLE_TOOLS: AITool[] = [
  {
    type: 'function',
    function: {
      name: 'extract_feedback_features',
      description: 'Extract key features and metadata from user feedback',
      parameters: {
        type: 'object',
        properties: {
          sentiment: {
            type: 'object',
            properties: {
              label: { type: 'string', enum: ['positive', 'negative', 'neutral'] },
              score: { type: 'number' },
              confidence: { type: 'number' }
            }
          },
          extractedFeatures: {
            type: 'array',
            items: { type: 'string' }
          },
          urgency: {
            type: 'string',
            enum: ['low', 'medium', 'high']
          },
          category: {
            type: 'array',
            items: { type: 'string' }
          }
        },
        required: ['sentiment', 'extractedFeatures', 'urgency', 'category']
      }
    }
  }
]

export function AIPlayground({ isOpen, onClose, initialCallData, title, description }: AIPlaygroundProps) {
  const { apiKeys } = useAPIKeys()
  const [selectedModel, setSelectedModel] = useState(initialCallData?.model || 'gpt-4-turbo-preview')
  const [messages, setMessages] = useState<AIMessage[]>(initialCallData?.messages || [])
  const [tools, setTools] = useState<AITool[]>(initialCallData?.tools || SAMPLE_TOOLS)
  const [isLoading, setIsLoading] = useState(false)
  const [originalResponse, setOriginalResponse] = useState<any>(initialCallData?.response || null)
  const [currentResponse, setCurrentResponse] = useState<any>(null)
  const [executionHistory, setExecutionHistory] = useState<any[]>([])
  const [showComparison, setShowComparison] = useState(false)

  useEffect(() => {
    if (initialCallData) {
      setSelectedModel(initialCallData.model)
      setMessages(initialCallData.messages)
      setTools(initialCallData.tools || SAMPLE_TOOLS)
      setOriginalResponse(initialCallData.response)
    }
  }, [initialCallData])

  const handleAddMessage = () => {
    setMessages([...messages, { role: 'user', content: '' }])
  }

  const handleUpdateMessage = (index: number, updates: Partial<AIMessage>) => {
    const updatedMessages = [...messages]
    updatedMessages[index] = { ...updatedMessages[index], ...updates }
    setMessages(updatedMessages)
  }

  const handleRemoveMessage = (index: number) => {
    setMessages(messages.filter((_, i) => i !== index))
  }

  const handleExecute = async () => {
    if (messages.length === 0) return

    setIsLoading(true)
    try {
      const response = await fetch('/api/ai/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: messages,
          tools: tools.length > 0 ? tools : undefined,
          temperature: 0.7,
          max_tokens: 4096,
          apiKeys: apiKeys,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const aiResponse = await response.json()

      // Add to execution history if this is a re-run
      if (currentResponse) {
        setExecutionHistory([...executionHistory, currentResponse])
      }
      
      setCurrentResponse(aiResponse)
    } catch (error) {
      console.error('Error executing AI call:', error)
      
      // Show user-friendly error
      const errorResponse = {
        id: 'error-' + Math.random().toString(36).substr(2, 9),
        object: 'error',
        created: Math.floor(Date.now() / 1000),
        model: selectedModel,
        choices: [{
          index: 0,
          message: {
            role: 'assistant' as const,
            content: `Error: ${error instanceof Error ? error.message : 'Unknown error occurred'}\n\nPlease check:\n- API keys are configured correctly\n- Model name is supported\n- Messages are properly formatted`
          },
          finish_reason: 'error'
        }],
        usage: {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0
        },
        error: true
      }
      
      setCurrentResponse(errorResponse)
    } finally {
      setIsLoading(false)
    }
  }

  const handleReset = () => {
    if (initialCallData) {
      setSelectedModel(initialCallData.model)
      setMessages(initialCallData.messages)
      setTools(initialCallData.tools || SAMPLE_TOOLS)
      setOriginalResponse(initialCallData.response)
      setCurrentResponse(null)
    } else {
      setMessages([])
      setOriginalResponse(null)
      setCurrentResponse(null)
    }
    setExecutionHistory([])
    setShowComparison(false)
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const formatJSON = (obj: any) => JSON.stringify(obj, null, 2)

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden flex flex-col bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="border-b border-gray-200 dark:border-gray-700 pb-4">
          <DialogTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              {title || 'AI Playground'}
            </div>
            <div className="flex items-center gap-2">
              {executionHistory.length > 0 && (
                <Button
                  onClick={() => setShowComparison(!showComparison)}
                  variant="outline"
                  size="sm"
                  className="gap-2"
                >
                  <ArrowLeftRight className="h-4 w-4" />
                  {showComparison ? 'Hide' : 'Show'} Comparison
                </Button>
              )}
              <Button
                onClick={handleExecute}
                disabled={isLoading || messages.length === 0}
                className="gap-2"
              >
                {isLoading ? (
                  <Clock className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                {isLoading ? 'Running...' : 'Run'}
              </Button>
            </div>
          </DialogTitle>
          {description && (
            <DialogDescription className="text-gray-600 dark:text-gray-400">{description}</DialogDescription>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-hidden flex gap-4 p-4">
          {/* Left Panel - Input Configuration */}
          <div className="w-1/2 flex flex-col gap-4 overflow-auto">
            {/* Model Configuration */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Settings className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  Configuration
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {AVAILABLE_MODELS.map(model => (
                        <SelectItem key={model} value={model}>{model}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Messages Input */}
            <Card className="flex-1 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Messages
                </CardTitle>
                <Button onClick={handleAddMessage} size="sm" variant="outline">
                  Add Message
                </Button>
              </CardHeader>
              <CardContent className="space-y-4 max-h-96 overflow-auto">
                {messages.map((message, index) => (
                  <div key={index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 space-y-3 bg-gray-50 dark:bg-gray-900">
                    <div className="flex items-center justify-between">
                      <Select
                        value={message.role}
                        onValueChange={(role: any) => handleUpdateMessage(index, { role })}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="system">System</SelectItem>
                          <SelectItem value="user">User</SelectItem>
                          <SelectItem value="assistant">Assistant</SelectItem>
                          <SelectItem value="tool">Tool</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button
                        onClick={() => handleRemoveMessage(index)}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                      >
                        Remove
                      </Button>
                    </div>
                    <Textarea
                      value={message.content}
                      onChange={(e) => handleUpdateMessage(index, { content: e.target.value })}
                      placeholder="Message content..."
                      rows={3}
                      className="bg-white dark:bg-gray-800"
                    />
                  </div>
                ))}
                {messages.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No messages yet. Add a message to get started.</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Tools */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Zap className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                  Tools
                </CardTitle>
                <CardDescription className="text-gray-600 dark:text-gray-400">
                  Available tools for the AI model
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {tools.map((tool, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-600">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{tool.function.name}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{tool.function.description}</p>
                      </div>
                      <Badge variant="secondary" className="bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200">
                        Function
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Right Panel - Output/Comparison */}
          <div className="w-1/2 flex flex-col gap-4 overflow-auto">
            {showComparison && originalResponse && currentResponse ? (
              /* Comparison View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <ArrowLeftRight className="h-5 w-5" />
                    Response Comparison
                  </h3>
                  <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                    <RotateCcw className="h-4 w-4" />
                    Reset
                  </Button>
                </div>
                
                <div className="grid grid-cols-1 gap-4">
                  {/* Original Response */}
                  <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-blue-800 dark:text-blue-200">Original Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm text-blue-900 dark:text-blue-100 whitespace-pre-wrap bg-white dark:bg-blue-900 p-3 rounded border">
                        {originalResponse.choices[0]?.message?.content || 'No content'}
                      </pre>
                    </CardContent>
                  </Card>

                  {/* Current Response */}
                  <Card className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                    <CardHeader>
                      <CardTitle className="text-sm text-green-800 dark:text-green-200">New Response</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <pre className="text-sm text-green-900 dark:text-green-100 whitespace-pre-wrap bg-white dark:bg-green-900 p-3 rounded border">
                        {currentResponse.choices[0]?.message?.content || 'No content'}
                      </pre>
                    </CardContent>
                  </Card>
                </div>
              </div>
            ) : (
              /* Single Response View */
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    Response Output
                  </h3>
                  <div className="flex gap-2">
                    {originalResponse && (
                      <Button 
                        onClick={() => setCurrentResponse(originalResponse)} 
                        variant="outline" 
                        size="sm"
                        disabled={currentResponse === originalResponse}
                      >
                        Show Original
                      </Button>
                    )}
                    <Button onClick={handleReset} variant="outline" size="sm" className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Reset
                    </Button>
                  </div>
                </div>

                {(currentResponse || originalResponse) ? (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-600 dark:text-green-400" />
                          Response Details
                        </div>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => copyToClipboard(formatJSON(currentResponse || originalResponse))}
                            size="sm"
                            variant="ghost"
                            className="gap-2"
                          >
                            <Copy className="h-4 w-4" />
                            Copy JSON
                          </Button>
                        </div>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {/* Response Metadata */}
                      <div className={`grid grid-cols-2 md:grid-cols-4 gap-4 p-4 rounded-lg ${
                        (currentResponse || originalResponse)?.error 
                          ? 'bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800' 
                          : 'bg-gray-50 dark:bg-gray-900'
                      }`}>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Model</label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {(currentResponse || originalResponse)?.model}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Finish Reason</label>
                          <Badge 
                            variant="outline" 
                            className={`mt-1 ${
                              (currentResponse || originalResponse)?.choices[0]?.finish_reason === 'error'
                                ? 'border-red-500 text-red-700 dark:text-red-400'
                                : ''
                            }`}
                          >
                            {(currentResponse || originalResponse)?.choices[0]?.finish_reason}
                          </Badge>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Tokens</label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {(currentResponse || originalResponse)?.usage?.total_tokens}
                          </p>
                        </div>
                        <div>
                          <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                            {(currentResponse || originalResponse)?._playground_meta?.duration ? 'Duration' : 'Created'}
                          </label>
                          <p className="font-mono text-sm text-gray-900 dark:text-gray-100">
                            {(currentResponse || originalResponse)?._playground_meta?.duration 
                              ? `${(currentResponse || originalResponse)._playground_meta.duration}ms`
                              : new Date(((currentResponse || originalResponse)?.created || 0) * 1000).toLocaleTimeString()
                            }
                          </p>
                        </div>
                      </div>

                      {/* Message Content */}
                      {(currentResponse || originalResponse)?.choices[0]?.message?.content && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Message Content</label>
                          <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border border-gray-200 dark:border-gray-600">
                            <pre className="whitespace-pre-wrap text-sm text-gray-900 dark:text-gray-100">
                              {(currentResponse || originalResponse).choices[0].message.content}
                            </pre>
                          </div>
                        </div>
                      )}

                      {/* Tool Calls */}
                      {(currentResponse || originalResponse)?.choices[0]?.message?.tool_calls && (
                        <div>
                          <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Tool Calls</label>
                          <div className="space-y-3">
                            {(currentResponse || originalResponse).choices[0].message.tool_calls.map((toolCall: any, index: number) => (
                              <Card key={index} className="bg-purple-50 dark:bg-purple-950 border-purple-200 dark:border-purple-800">
                                <CardHeader className="pb-2">
                                  <CardTitle className="text-sm flex items-center gap-2">
                                    <Zap className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                                    {toolCall.function.name}
                                  </CardTitle>
                                </CardHeader>
                                <CardContent>
                                  <pre className="text-xs bg-white dark:bg-purple-900 p-3 rounded border overflow-auto text-purple-900 dark:text-purple-100">
                                    {JSON.stringify(JSON.parse(toolCall.function.arguments), null, 2)}
                                  </pre>
                                </CardContent>
                              </Card>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Usage Statistics */}
                      <div>
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">Token Usage</label>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
                            <p className="text-sm text-blue-600 dark:text-blue-400">Prompt</p>
                            <p className="font-mono text-lg text-blue-900 dark:text-blue-100">
                              {(currentResponse || originalResponse)?.usage?.prompt_tokens || 0}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                            <p className="text-sm text-green-600 dark:text-green-400">Completion</p>
                            <p className="font-mono text-lg text-green-900 dark:text-green-100">
                              {(currentResponse || originalResponse)?.usage?.completion_tokens || 0}
                            </p>
                          </div>
                          <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                            <p className="text-sm text-purple-600 dark:text-purple-400">Total</p>
                            <p className="font-mono text-lg text-purple-900 dark:text-purple-100">
                              {(currentResponse || originalResponse)?.usage?.total_tokens || 0}
                            </p>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ) : (
                  <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                    <CardContent className="flex flex-col items-center justify-center py-12">
                      <Brain className="h-16 w-16 text-gray-400 dark:text-gray-500 mb-4" />
                      <p className="text-gray-600 dark:text-gray-400 text-center">
                        No response yet. Configure your messages and click "Run" to get started.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
