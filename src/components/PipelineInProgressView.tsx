/**
 * Pipeline In Progress View
 * 
 * Shows the expandable sections with real-time progress, enriched feedback under enrichment,
 * clusters under clustering, and event timeline for debugging.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown,
  ChevronRight,
  Eye,
  Brain,
  BarChart3
} from 'lucide-react'
import { EnrichedFeedback, EnrichedCluster } from '@/hooks/usePipelineExecution'

interface PipelineStage {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details: string[]
}

interface PipelineInProgressViewProps {
  stages: PipelineStage[]
  enrichedFeedback: EnrichedFeedback[]
  enrichedClusters: EnrichedCluster[]
  events: any[]
  expandedSections: Set<string>
  onToggleSection: (sectionId: string) => void
  onViewFeedback: (feedback: EnrichedFeedback) => void
  onViewCluster: (cluster: EnrichedCluster) => void
  getSentimentColor: (sentiment: string) => string
  stageProgress: {
    enrichment: number
    clustering: number
    insights: number
  }
  progressStats: {
    feedbackProcessed: number
    totalFeedback: number
    clustersCreated: number
    expectedClusters: number
    insightsCreated: number
    expectedInsights: number
  }
}

// Animated Progress Counter Component
function AnimatedProgress({ value, duration = 800 }: { value: number; duration?: number }) {
  const [displayValue, setDisplayValue] = useState(0)

  useEffect(() => {
    const startTime = Date.now()
    const startValue = displayValue
    const targetValue = value

    const animate = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      
      // Easing function for smooth animation
      const easeOut = 1 - Math.pow(1 - progress, 3)
      const currentValue = Math.round(startValue + (targetValue - startValue) * easeOut)
      
      setDisplayValue(currentValue)
      
      if (progress < 1) {
        requestAnimationFrame(animate)
      }
    }
    
    requestAnimationFrame(animate)
  }, [value, duration])

  return (
    <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary font-bold text-sm animate-pulse">
      <span className="w-2 h-2 bg-primary rounded-full animate-ping" />
      {displayValue}%
    </span>
  )
}

export function PipelineInProgressView({
  stages,
  enrichedFeedback,
  enrichedClusters,
  events,
  expandedSections,
  onToggleSection,
  onViewFeedback,
  onViewCluster,
  getSentimentColor,
  stageProgress,
  progressStats
}: PipelineInProgressViewProps) {
  // Map stage IDs to actual progress values
  const getStageProgress = (stageId: string): number => {
    switch (stageId) {
      case 'enrichment':
        return stageProgress.enrichment
      case 'clustering':
        return stageProgress.clustering
      case 'insights':
        return stageProgress.insights
      default:
        return 0
    }
  }

  // Get progress description for stage
  const getProgressDescription = (stageId: string): string => {
    switch (stageId) {
      case 'enrichment':
        return `${progressStats.feedbackProcessed}/${progressStats.totalFeedback} feedback processed`
      case 'clustering':
        return `${progressStats.clustersCreated} clusters created`
      case 'insights':
        return `${progressStats.insightsCreated} insights generated`
      default:
        return ''
    }
  }

  return (
    <div className="space-y-4 animate-in fade-in-0 duration-500">
      {stages.map((stage) => {
        const actualProgress = getStageProgress(stage.id)
        const progressDesc = getProgressDescription(stage.id)
        
        return (
        <Card key={stage.id} className={`
          transition-all duration-300
          ${stage.status === 'running' ? 'ring-2 ring-primary ring-opacity-50' : ''}
          ${stage.status === 'completed' ? 'bg-green-50 dark:bg-green-950' : ''}
          ${stage.status === 'error' ? 'bg-red-50 dark:bg-red-950' : ''}
        `}>
          <CardHeader className="cursor-pointer" onClick={() => onToggleSection(stage.id)}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`
                  p-2 rounded-full transition-all duration-300
                  ${actualProgress === 100 ? 'bg-green-100 text-green-600 dark:bg-green-900' : ''}
                  ${actualProgress > 0 && actualProgress < 100 ? 'bg-primary/10 text-primary animate-pulse' : ''}
                  ${stage.status === 'error' ? 'bg-red-100 text-red-600 dark:bg-red-900' : ''}
                  ${actualProgress === 0 ? 'bg-muted text-muted-foreground' : ''}
                `}>
                  {actualProgress === 100 ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : actualProgress > 0 && actualProgress < 100 ? (
                    <Clock className="h-4 w-4 animate-spin" />
                  ) : stage.status === 'error' ? (
                    <AlertCircle className="h-4 w-4" />
                  ) : (
                    <stage.icon className="h-4 w-4" />
                  )}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <CardTitle className="text-base">{stage.name}</CardTitle>
                    {actualProgress > 0 && (
                      <AnimatedProgress value={actualProgress} />
                    )}
                  </div>
                  <CardDescription>{stage.description}</CardDescription>
                  {progressDesc && actualProgress > 0 && (
                    <div className="text-sm text-primary font-medium mt-1 animate-pulse">
                      {progressDesc}
                    </div>
                  )}
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {expandedSections.has(stage.id) ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </div>
            </div>
            
            {actualProgress > 0 && actualProgress < 100 && (
              <div className="space-y-2 animate-in fade-in-0 duration-500">
                <Progress 
                  value={actualProgress} 
                  className="mt-2 transition-all duration-1000 ease-out" 
                />
              </div>
            )}
          </CardHeader>
          
          {expandedSections.has(stage.id) && (
            <CardContent className="animate-in slide-in-from-top-2 duration-300">
              {/* Stage Details */}
              {stage.details.length > 0 && (
                <div className="space-y-2 mb-4">
                  {stage.details.map((detail, index) => (
                    <div key={index} className="text-sm text-muted-foreground flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2 flex-shrink-0" />
                      <span>{detail}</span>
                    </div>
                  ))}
                </div>
              )}

              {/* Enriched Feedback under AI Enrichment */}
              {stage.id === 'enrichment' && enrichedFeedback.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <Brain className="h-4 w-4" />
                    Enriched Feedback ({enrichedFeedback.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {enrichedFeedback.map((feedback, index) => (
                      <div key={feedback.id} className="border rounded-lg p-3 space-y-2 bg-blue-50 dark:bg-blue-950">
                        <p className="text-sm font-medium">"{feedback.originalFeedback.text}"</p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant="outline" className="text-xs">{feedback.originalFeedback.source}</Badge>
                          <Badge className={getSentimentColor(feedback.enrichmentData.sentiment.label) + ' text-xs'}>
                            {feedback.enrichmentData.sentiment.label}
                          </Badge>
                          <Badge variant="outline" className="text-xs">{feedback.enrichmentData.urgency}</Badge>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewFeedback(feedback)}
                            className="h-6 px-2 text-xs ml-auto"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                        {feedback.enrichmentData.linkedProductAreas.length > 0 && (
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Areas:</span>{' '}
                            {feedback.enrichmentData.linkedProductAreas.slice(0, 2).map(area => area.name || area.id).join(', ')}
                            {feedback.enrichmentData.linkedProductAreas.length > 2 && '...'}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Clusters under Semantic Clustering */}
              {stage.id === 'clustering' && enrichedClusters.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium text-primary">
                    <BarChart3 className="h-4 w-4" />
                    Semantic Clusters ({enrichedClusters.length})
                  </div>
                  <div className="max-h-64 overflow-y-auto space-y-3">
                    {enrichedClusters.map((cluster, index) => (
                      <div key={cluster.id} className="border rounded-lg p-3 space-y-2 bg-green-50 dark:bg-green-950">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{cluster.theme}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{cluster.description}</p>
                            <div className="flex items-center gap-2">
                              <Badge variant="outline" className="text-xs">{cluster.size} feedback</Badge>
                              <Badge className={getSentimentColor(cluster.dominantSentiment) + ' text-xs'}>
                                {cluster.dominantSentiment}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {Math.round(cluster.avgConfidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onViewCluster(cluster)}
                            className="h-6 px-2 text-xs"
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            View
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Event Timeline under any expanded section */}
              {events.length > 0 && expandedSections.has(stage.id) && (
                <div className="mt-6 pt-4 border-t">
                  <div className="text-sm font-medium text-muted-foreground mb-3">
                    Recent Events ({events.slice(-5).length})
                  </div>
                  <div className="space-y-2 max-h-32 overflow-y-auto">
                    {events.slice(-5).map((event, i) => (
                      <div key={i} className="flex items-start gap-3 text-xs p-2 rounded border bg-muted/30">
                        <div className="text-muted-foreground mt-0.5 w-16 flex-shrink-0">
                          {new Date(event.timestamp).toLocaleTimeString()}
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {event.type}
                        </Badge>
                        <span className="text-muted-foreground flex-1">
                          {JSON.stringify(event).substring(0, 100)}...
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          )}
        </Card>
        )
      })}
    </div>
  )
}
