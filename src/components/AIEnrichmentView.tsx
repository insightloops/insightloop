'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import { 
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Eye,
  Brain,
  Zap,
  MessageSquare,
  ChevronRight,
  Play
} from 'lucide-react'
import { EnrichedFeedback } from '@/hooks/usePipelineExecution'
import { AIPlayground } from './AIPlayground'

interface AIEnrichmentViewProps {
  isRunning: boolean
  progress: number
  enrichedFeedback: EnrichedFeedback[]
  totalFeedback: number
  processedCount: number
}

export function AIEnrichmentView({ 
  isRunning, 
  progress, 
  enrichedFeedback, 
  totalFeedback, 
  processedCount 
}: AIEnrichmentViewProps) {
  const [selectedFeedback, setSelectedFeedback] = useState<EnrichedFeedback | null>(null)
  const [playgroundOpen, setPlaygroundOpen] = useState(false)

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700'
      case 'negative': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      case 'neutral': return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
      case 'medium': return 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 border-yellow-200 dark:border-yellow-700'
      case 'low': return 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 border-blue-200 dark:border-blue-700'
      default: return 'bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 border-gray-200 dark:border-gray-600'
    }
  }

  const openPlayground = (feedback: EnrichedFeedback) => {
    setSelectedFeedback(feedback)
    setPlaygroundOpen(true)
  }

  const getPlaygroundData = (feedback: EnrichedFeedback) => {
    if (!feedback.aiCallDetails) return undefined

    return {
      callId: feedback.aiCallDetails.callId,
      model: 'gpt-4-turbo-preview', // Default - would come from actual call data
      messages: feedback.aiCallDetails.input.messages.map(msg => ({
        ...msg,
        role: msg.role as 'system' | 'user' | 'assistant' | 'tool'
      })),
      tools: [
        {
          type: 'function' as const,
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
      ],
      response: {
        id: 'chatcmpl-' + feedback.aiCallDetails.callId,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'gpt-4-turbo-preview',
        choices: [{
          index: 0,
          message: {
            role: 'assistant' as const,
            content: '',
            tool_calls: [{
              id: 'call_' + feedback.aiCallDetails.callId,
              type: 'function' as const,
              function: {
                name: 'extract_feedback_features',
                arguments: JSON.stringify(feedback.enrichmentData)
              }
            }]
          },
          finish_reason: 'tool_calls'
        }],
        usage: {
          prompt_tokens: 150,
          completion_tokens: 45,
          total_tokens: 195
        }
      },
      duration: feedback.aiCallDetails.duration || 0,
      timestamp: new Date().toISOString()
    }
  }

  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                <Brain className="h-5 w-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <CardTitle className="text-lg">AI Enrichment</CardTitle>
                <CardDescription>
                  Processing feedback with AI to extract insights and metadata
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {processedCount} / {totalFeedback} processed
              </div>
              {isRunning && (
                <Badge variant="outline" className="mt-1">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {/* Progress Bar */}
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>

            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-green-600">{enrichedFeedback.length}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Enriched</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-blue-600">
                  {enrichedFeedback.filter(f => f.enrichmentData.sentiment.label === 'positive').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Positive</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-red-600">
                  {enrichedFeedback.filter(f => f.enrichmentData.sentiment.label === 'negative').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">Negative</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-orange-600">
                  {enrichedFeedback.filter(f => f.enrichmentData.urgency === 'high').length}
                </div>
                <div className="text-xs text-gray-600 dark:text-gray-400">High Priority</div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Enriched Feedback List */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">Enriched Feedback</h3>
          <Badge variant="outline">
            {enrichedFeedback.length} items
          </Badge>
        </div>

        {enrichedFeedback.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <MessageSquare className="h-12 w-12 text-gray-400 dark:text-gray-500 mb-4" />
              <p className="text-gray-600 dark:text-gray-400 text-center">
                {isRunning 
                  ? "Processing feedback... Enriched items will appear here as they're completed."
                  : "No enriched feedback yet. Start the pipeline to see results."
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {enrichedFeedback.map((feedback, index) => (
              <Card key={feedback.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 pt-1">
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      {/* Original Feedback */}
                      <div className="mb-3">
                        <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Original Feedback:</div>
                        <div className="text-sm bg-gray-50 dark:bg-gray-900 p-2 rounded border-l-4 border-gray-300 dark:border-gray-600">
                          {feedback.originalFeedback.text}
                        </div>
                      </div>

                      {/* Enrichment Results */}
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge className={getSentimentColor(feedback.enrichmentData.sentiment.label)}>
                            {feedback.enrichmentData.sentiment.label} 
                            ({Math.round(feedback.enrichmentData.sentiment.confidence * 100)}%)
                          </Badge>
                          <Badge className={getUrgencyColor(feedback.enrichmentData.urgency)}>
                            {feedback.enrichmentData.urgency} urgency
                          </Badge>
                          {feedback.enrichmentData.category.map((cat, i) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {cat}
                            </Badge>
                          ))}
                        </div>

                        {feedback.enrichmentData.extractedFeatures.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Features:</div>
                            <div className="flex gap-1 flex-wrap">
                              {feedback.enrichmentData.extractedFeatures.map((feature, i) => (
                                <Badge key={i} variant="secondary" className="text-xs">
                                  {feature}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}

                        {feedback.enrichmentData.linkedProductAreas.length > 0 && (
                          <div>
                            <div className="text-xs text-gray-600 dark:text-gray-400 mb-1">Product Areas:</div>
                            <div className="flex gap-1 flex-wrap">
                              {feedback.enrichmentData.linkedProductAreas.map((area, i) => (
                                <Badge key={i} variant="outline" className="text-xs">
                                  {area.name || area.id} ({Math.round(area.confidence * 100)}%)
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0 flex items-center gap-2">
                      {feedback.aiCallDetails && (
                        <Button
                          onClick={() => openPlayground(feedback)}
                          size="sm"
                          variant="outline"
                          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-950"
                        >
                          <Play className="h-4 w-4 mr-1" />
                          Playground
                        </Button>
                      )}
                      <Button
                        onClick={() => {
                          setSelectedFeedback(feedback)
                          // Could open a detail view here
                        }}
                        size="sm"
                        variant="ghost"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* AI Call Metadata */}
                  {feedback.aiCallDetails && (
                    <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800">
                      <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                        <div className="flex items-center gap-1">
                          <Zap className="h-3 w-3" />
                          Call ID: {feedback.aiCallDetails.callId}
                        </div>
                        {feedback.aiCallDetails.duration && (
                          <div className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {feedback.aiCallDetails.duration}ms
                          </div>
                        )}
                        <div className="flex items-center gap-1">
                          <MessageSquare className="h-3 w-3" />
                          {feedback.aiCallDetails.input.messages.length} messages
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* AI Playground Dialog */}
      <AIPlayground
        isOpen={playgroundOpen}
        onClose={() => {
          setPlaygroundOpen(false)
          setSelectedFeedback(null)
        }}
        initialCallData={selectedFeedback ? getPlaygroundData(selectedFeedback) : undefined}
        title={`AI Playground - Feedback ${selectedFeedback?.id}`}
        description="Explore and experiment with the AI enrichment process"
      />
    </>
  )
}
