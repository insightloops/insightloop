/**
 * Enhanced Enriched Feedback Dialog
 * 
 * A sophisticated, enterprise-grade dialog for displaying detailed enriched feedback
 * with proper visual hierarchy, interactive elements, and comprehensive data presentation.
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { 
  MessageCircle, 
  Brain, 
  Clock, 
  Target, 
  TrendingUp, 
  AlertTriangle,
  Tag,
  MapPin,
  Zap
} from 'lucide-react'
import { EnrichedFeedback } from '@/hooks/usePipelineExecution'

interface EnrichedFeedbackDialogProps {
  feedback: EnrichedFeedback | null
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function EnrichedFeedbackDialog({ feedback, open, onOpenChange }: EnrichedFeedbackDialogProps) {
  if (!feedback) return null

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'high': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      case 'medium': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
      case 'low': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Brain className="h-6 w-6 text-purple-600" />
            Enriched Feedback Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Original Feedback Section */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
                <MessageCircle className="h-5 w-5" />
                Original Feedback
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  "{feedback.originalFeedback.text}"
                </p>
                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <Badge variant="outline" className="text-xs">
                    Source: {feedback.originalFeedback.source}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    ID: {feedback.originalFeedback.feedbackId}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* AI Enrichment Section */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                <Brain className="h-5 w-5" />
                AI Enrichment Analysis
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Sentiment & Urgency */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <TrendingUp className="h-4 w-4" />
                    Sentiment Analysis
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={getSentimentColor(feedback.enrichmentData.sentiment.label)}>
                      {feedback.enrichmentData.sentiment.label}
                    </Badge>
                    <span className="text-sm text-gray-500">
                      {Math.round(feedback.enrichmentData.sentiment.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${feedback.enrichmentData.sentiment.confidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <AlertTriangle className="h-4 w-4" />
                    Urgency Level
                  </div>
                  <Badge className={getUrgencyColor(feedback.enrichmentData.urgency)}>
                    {feedback.enrichmentData.urgency} Priority
                  </Badge>
                </div>
              </div>

              <Separator />

              {/* Features */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Tag className="h-4 w-4" />
                  Extracted Features
                </div>
                <div className="flex flex-wrap gap-2">
                  {feedback.enrichmentData.extractedFeatures.map((feature, index) => (
                    <Badge key={index} variant="secondary" className="text-xs px-2 py-1">
                      {feature}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Categories */}
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                  <Target className="h-4 w-4" />
                  Categories
                </div>
                <div className="flex flex-wrap gap-2">
                  {feedback.enrichmentData.category.map((cat, index) => (
                    <Badge key={index} variant="outline" className="text-xs px-2 py-1">
                      {cat}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Product Areas */}
              {feedback.enrichmentData.linkedProductAreas.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-gray-600 dark:text-gray-400">
                    <MapPin className="h-4 w-4" />
                    Linked Product Areas
                  </div>
                  <div className="grid gap-2">
                    {feedback.enrichmentData.linkedProductAreas.map((area, index) => (
                      <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <span className="font-medium text-sm">{area.name || area.id}</span>
                        <div className="flex items-center gap-2">
                          <div className="w-16 bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full"
                              style={{ width: `${(area.confidence || 0) * 100}%` }}
                            />
                          </div>
                          <span className="text-xs text-gray-500 w-10 text-right">
                            {Math.round((area.confidence || 0) * 100)}%
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI Call Details Section */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
                <Zap className="h-5 w-5" />
                AI Processing Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Clock className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {feedback.aiCallDetails.duration}ms
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Processing Time</div>
                </div>
                
                <div className="text-center p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <MessageCircle className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {feedback.aiCallDetails.input.messages.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Messages</div>
                </div>
                
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-xl font-bold text-purple-600 font-mono">
                    {feedback.aiCallDetails.callId.slice(-8)}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Call ID</div>
                </div>
              </div>

              <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
                <div className="font-medium mb-1">Full Call ID:</div>
                <code className="font-mono">{feedback.aiCallDetails.callId}</code>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  )
}
