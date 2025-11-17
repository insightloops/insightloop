/**
 * EnrichedFeedbackExample Component
 * 
 * Demonstrates how to use the usePipelineExecution hook to access enriched feedback
 * which contains:
 * 1. Original feedback (text, source, feedbackId)
 * 2. Enrichment metadata (AI analysis results)
 * 3. AI call details (input messages, output, duration)
 */

'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { usePipelineExecution, EnrichedFeedback } from '@/hooks/usePipelineExecution'

export function EnrichedFeedbackExample() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  
  const {
    isExecuting,
    enrichedFeedback,
    error,
    executePipeline
  } = usePipelineExecution()

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
    }
  }

  const handleExecute = async () => {
    if (!selectedFile) return
    
    await executePipeline({
      file: selectedFile,
      companyId: '22222222-2222-2222-2222-222222222222',
      productId: '22222222-2222-2222-2222-222222222222',
      source: 'api'
    })
  }

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'bg-green-100 text-green-800'
      case 'negative': return 'bg-red-100 text-red-800'
      case 'neutral': return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getUrgencyColor = (urgency: string) => {
    switch (urgency) {
      case 'high': return 'bg-red-100 text-red-800'
      case 'medium': return 'bg-yellow-100 text-yellow-800'
      case 'low': return 'bg-green-100 text-green-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  return (
    <div className="p-6 space-y-6">
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Enriched Feedback Example</h2>
        <p className="text-muted-foreground">
          Upload a feedback file to see how the hook processes and enriches feedback with AI analysis.
        </p>
        
        <div className="flex items-center gap-4">
          <input
            type="file"
            accept=".csv,.json,.txt"
            onChange={handleFileSelect}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
          />
          <Button 
            onClick={handleExecute} 
            disabled={!selectedFile || isExecuting}
            className="min-w-[120px]"
          >
            {isExecuting ? 'Processing...' : 'Execute Pipeline'}
          </Button>
        </div>
        
        {error && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-md">
            <p className="text-red-700">{error}</p>
          </div>
        )}
      </div>

      {enrichedFeedback.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-xl font-semibold">
            Enriched Feedback ({enrichedFeedback.length} items)
          </h3>
          
          {enrichedFeedback.map((feedback: EnrichedFeedback) => (
            <Card key={feedback.id} className="w-full">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span className="text-lg">Feedback: {feedback.id}</span>
                  <div className="flex gap-2">
                    <Badge className={getSentimentColor(feedback.enrichmentData.sentiment.label)}>
                      {feedback.enrichmentData.sentiment.label}
                    </Badge>
                    <Badge className={getUrgencyColor(feedback.enrichmentData.urgency)}>
                      {feedback.enrichmentData.urgency} urgency
                    </Badge>
                  </div>
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-4">
                {/* 1. Original Feedback */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">1. Original Feedback</h4>
                  <div className="p-3 bg-gray-50 rounded-md">
                    <p className="text-sm mb-2"><strong>Text:</strong> "{feedback.originalFeedback.text}"</p>
                    <p className="text-sm mb-1"><strong>Source:</strong> {feedback.originalFeedback.source}</p>
                    <p className="text-sm"><strong>ID:</strong> {feedback.originalFeedback.feedbackId}</p>
                  </div>
                </div>

                {/* 2. Enrichment Metadata */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">2. Enrichment Metadata (AI Analysis)</h4>
                  <div className="p-3 bg-blue-50 rounded-md space-y-2">
                    <div>
                      <strong className="text-sm">Sentiment:</strong> {feedback.enrichmentData.sentiment.label} 
                      (score: {feedback.enrichmentData.sentiment.score}, confidence: {feedback.enrichmentData.sentiment.confidence})
                    </div>
                    
                    <div>
                      <strong className="text-sm">Features:</strong> 
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feedback.enrichmentData.extractedFeatures.map((feature, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {feature}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-sm">Product Areas:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feedback.enrichmentData.linkedProductAreas.map((area, idx) => (
                          <Badge key={idx} variant="secondary" className="text-xs">
                            {area.name || area.id} ({(area.confidence * 100).toFixed(0)}%)
                          </Badge>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <strong className="text-sm">Categories:</strong>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {feedback.enrichmentData.category.map((cat, idx) => (
                          <Badge key={idx} variant="outline" className="text-xs">
                            {cat}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

                {/* 3. AI Call Details */}
                <div>
                  <h4 className="font-semibold text-sm text-gray-600 mb-2">3. AI Call Details</h4>
                  <div className="p-3 bg-green-50 rounded-md space-y-2">
                    <p className="text-sm"><strong>Call ID:</strong> {feedback.aiCallDetails.callId}</p>
                    {feedback.aiCallDetails.duration && (
                      <p className="text-sm"><strong>Duration:</strong> {feedback.aiCallDetails.duration}ms</p>
                    )}
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">LLM Input Messages ({feedback.aiCallDetails.input.messages.length})</summary>
                      <div className="mt-2 max-h-32 overflow-y-auto">
                        {feedback.aiCallDetails.input.messages.map((message, idx) => (
                          <div key={idx} className="p-2 bg-white rounded border mb-1">
                            <strong>{message.role}:</strong> {message.content.substring(0, 200)}
                            {message.content.length > 200 && '...'}
                          </div>
                        ))}
                      </div>
                    </details>
                    
                    <details className="text-sm">
                      <summary className="cursor-pointer font-medium">LLM Output</summary>
                      <div className="mt-2 p-2 bg-white rounded border">
                        <pre className="text-xs overflow-x-auto">
                          {JSON.stringify(feedback.aiCallDetails.output.extractedData, null, 2)}
                        </pre>
                      </div>
                    </details>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
