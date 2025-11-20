import React, { useState } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Copy, Play, RotateCcw, Loader2, Settings } from 'lucide-react'
import { useAPIKeys } from '@/contexts/APIKeyContext'
import { APIKeySettings } from './APIKeySettings'

interface ClusterItem {
  id: string
  text: string
  category?: string
}

interface ClusteringPlaygroundProps {
  isOpen: boolean
  onClose: () => void
  initialData?: ClusterItem[]
  title?: string
  description?: string
}

export function ClusteringPlayground({ 
  isOpen, 
  onClose, 
  initialData = [], 
  title = "Clustering Playground",
  description = "Use AI to semantically cluster your feedback data"
}: ClusteringPlaygroundProps) {
  const { apiKeys, hasAPIKey } = useAPIKeys()
  const [selectedModel, setSelectedModel] = useState('gpt-4o')
  const [prompt, setPrompt] = useState(() => `Please analyze and cluster the following feedback entries using semantic analysis. Group them into meaningful themes based on common topics, pain points, feature requests, and user journey stages.

Feedback to cluster:
${initialData.map((item, idx) => `${idx + 1}. ID: ${item.id} - "${item.text}"`).join('\n')}

Please create clusters with:
- Clear, specific theme names
- Detailed descriptions of what each cluster represents  
- Assignment of each feedback item to exactly one cluster (use the exact IDs provided)
- Focus on actionable insights and common user needs

Use the clustering tool to return structured results.`)
  
  const [isLoading, setIsLoading] = useState(false)
  const [response, setResponse] = useState<any>(null)
  const [error, setError] = useState<string | null>(null)

  const availableModels = [
    'gpt-4o',
    'gpt-4-turbo',
    'claude-3-5-sonnet-20241022',
    'claude-3-opus-20240229'
  ]

  const systemPrompt = `You are an expert at semantic clustering of customer feedback. Your job is to analyze feedback entries and group them into meaningful, actionable clusters.

Clustering Guidelines:
- Focus on core themes, pain points, feature requests, and user journey stages
- Group feedback that shares common underlying issues or requests
- Create specific, actionable theme names (not generic categories)
- Ensure every feedback entry is assigned to exactly one cluster
- Prefer fewer, well-defined clusters over many small clusters
- Consider sentiment patterns and urgency levels when grouping

Quality Requirements:
- Themes should be specific and actionable
- Descriptions should explain the common thread connecting feedback
- Each cluster should represent a distinct, addressable concern or opportunity
- Avoid overlap between clusters - each should be unique

Always use the clustering tool to return structured results with clear themes, descriptions, and entry assignments.`

  const handleExecute = async () => {
    if (!prompt.trim()) return

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch('/api/ai/playground', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: selectedModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: prompt }
          ],
          temperature: 0.1,
          max_tokens: 4096,
          apiKeys: apiKeys,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`)
      }

      const aiResponse = await response.json()
      setResponse(aiResponse)
    } catch (error) {
      console.error('Error executing clustering:', error)
      setError(error instanceof Error ? error.message : 'Clustering failed')
    } finally {
      setIsLoading(false)
    }
  }

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-7xl max-h-[95vh] overflow-hidden bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-6 h-[calc(95vh-120px)]">
          {/* Input Panel */}
          <div className="space-y-4 overflow-y-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Configuration
                  <Badge variant="secondary">{initialData.length} items</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* API Key Status */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium">API Keys</label>
                    <APIKeySettings trigger={
                      <Button variant="outline" size="sm">
                        <Settings className="w-3 h-3 mr-1" />
                        Configure
                      </Button>
                    } />
                  </div>
                  <div className="flex gap-2">
                    <Badge variant={hasAPIKey('openai') ? 'default' : 'secondary'} className="text-xs">
                      OpenAI {hasAPIKey('openai') ? '✓' : '✗'}
                    </Badge>
                    <Badge variant={hasAPIKey('anthropic') ? 'default' : 'secondary'} className="text-xs">
                      Anthropic {hasAPIKey('anthropic') ? '✓' : '✗'}
                    </Badge>
                  </div>
                  {!hasAPIKey('openai') && !hasAPIKey('anthropic') && (
                    <p className="text-xs text-orange-600 dark:text-orange-400">
                      Configure API keys to enable AI clustering
                    </p>
                  )}
                </div>

                <div>
                  <label className="text-sm font-medium">Model</label>
                  <Select value={selectedModel} onValueChange={setSelectedModel}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((model) => (
                        <SelectItem key={model} value={model}>
                          {model}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium">Clustering Prompt</label>
                  <Textarea
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    className="min-h-[300px] font-mono text-sm"
                    placeholder="Describe how you want the feedback clustered..."
                  />
                </div>

                <Button 
                  onClick={handleExecute}
                  disabled={isLoading || !prompt.trim() || (!hasAPIKey('openai') && !hasAPIKey('anthropic'))}
                  className="w-full"
                >
                  {isLoading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Clustering...
                    </>
                  ) : (
                    <>
                      <Play className="w-4 h-4 mr-2" />
                      Run Clustering
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Output Panel */}
          <div className="space-y-4 overflow-y-auto">
            {error && (
              <Card className="border-red-200 dark:border-red-800">
                <CardContent className="pt-6">
                  <div className="text-red-600 dark:text-red-400">
                    <strong>Error:</strong> {error}
                  </div>
                </CardContent>
              </Card>
            )}

            {response && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Clustering Results</CardTitle>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(JSON.stringify(response, null, 2))}
                      >
                        <Copy className="w-4 h-4 mr-1" />
                        Copy
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setResponse(null)}
                      >
                        <RotateCcw className="w-4 h-4 mr-1" />
                        Clear
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {/* Response Message */}
                    {response.choices?.[0]?.message && (
                      <div>
                        <h4 className="font-medium mb-2">AI Response:</h4>
                        <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                          <pre className="text-sm whitespace-pre-wrap">
                            {response.choices[0].message.content}
                          </pre>
                        </div>
                      </div>
                    )}

                    {/* Tool Calls */}
                    {response.choices?.[0]?.message?.tool_calls && (
                      <div>
                        <h4 className="font-medium mb-2">Clustering Tool Results:</h4>
                        {response.choices[0].message.tool_calls.map((tool: any, idx: number) => (
                          <div key={idx} className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                            <h5 className="font-medium text-blue-800 dark:text-blue-200 mb-2">
                              {tool.function.name}
                            </h5>
                            <pre className="text-sm text-blue-700 dark:text-blue-300 whitespace-pre-wrap">
                              {JSON.stringify(JSON.parse(tool.function.arguments), null, 2)}
                            </pre>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Usage Stats */}
                    {response.usage && (
                      <div className="grid grid-cols-3 gap-4 pt-4 border-t">
                        <div className="text-center">
                          <div className="text-lg font-bold">{response.usage.prompt_tokens}</div>
                          <div className="text-sm text-gray-500">Input Tokens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{response.usage.completion_tokens}</div>
                          <div className="text-sm text-gray-500">Output Tokens</div>
                        </div>
                        <div className="text-center">
                          <div className="text-lg font-bold">{response.usage.total_tokens}</div>
                          <div className="text-sm text-gray-500">Total Tokens</div>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {!response && !error && !isLoading && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-gray-500">
                    <p className="mb-2">Ready to cluster your feedback!</p>
                    <p className="text-sm">Click "Run Clustering" to see AI-powered semantic groupings.</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}