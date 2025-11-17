/**
 * usePipelineExecution Hook
 * 
 * Provides a function to execute the pipeline and automatically accumulates
 * SSE events into an events array. Handles the streaming response and
 * provides state for loading, errors, and completion.
 */

'use client'

import { useState, useCallback, useRef, useEffect } from 'react'

interface PipelineEvent {
  type: string
  pipelineId: string
  timestamp: string
  [key: string]: any
}

// Enriched feedback structure with three pieces: original feedback, enrichment metadata, and AI call details
export interface EnrichedFeedback {
  id: string
  // 1. Original feedback
  originalFeedback: {
    text: string
    source: string
    feedbackId: string
  }
  // 2. Enrichment metadata (the AI analysis results)
  enrichmentData: {
    linkedProductAreas: Array<{
      id: string
      name?: string
      confidence: number
    }>
    sentiment: {
      label: 'positive' | 'negative' | 'neutral'
      score: number
      confidence: number
    }
    extractedFeatures: string[]
    urgency: 'low' | 'medium' | 'high'
    category: string[]
  }
  // 3. AI call details (input and output)
  aiCallDetails: {
    callId: string
    input: {
      messages: Array<{
        role: string
        content: string
      }>
    }
    output: {
      extractedData: any
    }
    duration?: number
  }
}

// Cluster structure containing grouped enriched feedback
export interface EnrichedCluster {
  id: string
  theme: string
  description: string
  size: number
  dominantSentiment: 'positive' | 'negative' | 'neutral'
  avgConfidence: number
  productAreas: string[]
  // List of enriched feedback IDs that belong to this cluster
  enrichedFeedbackIds: string[]
}

// Insight structure generated from clusters
export interface EnrichedInsight {
  id: string
  clusterId: string
  title: string
  summary: string
  severity: 'low' | 'medium' | 'high'
  confidence: number
  usersAffected: number
  recommendationCount: number
  evidenceCount: number
  stakeholderFormats: string[]
}

interface PipelineExecutionState {
  isExecuting: boolean
  events: PipelineEvent[]
  enrichedFeedback: EnrichedFeedback[]
  enrichedClusters: EnrichedCluster[]
  enrichedInsights: EnrichedInsight[]
  error: string | null
  pipelineId: string | null
  isComplete: boolean
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

interface ExecutePipelineParams {
  file: File
  companyId: string
  productId: string
  source: string
}

export function usePipelineExecution() {
  const [state, setState] = useState<PipelineExecutionState>({
    isExecuting: false,
    events: [],
    enrichedFeedback: [],
    enrichedClusters: [],
    enrichedInsights: [],
    error: null,
    pipelineId: null,
    isComplete: false,
    stageProgress: {
      enrichment: 0,
      clustering: 0,
      insights: 0
    },
    progressStats: {
      feedbackProcessed: 0,
      totalFeedback: 0,
      clustersCreated: 0,
      expectedClusters: 0,
      insightsCreated: 0,
      expectedInsights: 0
    }
  })

  const abortControllerRef = useRef<AbortController | null>(null)

  // Function to build enriched clusters from events
  const buildEnrichedClustersFromEvents = useCallback((events: PipelineEvent[]): EnrichedCluster[] => {
    const clusters: EnrichedCluster[] = []

    for (const event of events) {
      if (event.type === 'cluster_created') {
        clusters.push({
          id: event.clusterId,
          theme: event.theme,
          description: event.description,
          size: event.size,
          dominantSentiment: event.dominantSentiment,
          avgConfidence: event.avgConfidence,
          productAreas: event.productAreas || [],
          enrichedFeedbackIds: event.feedbackIds || []
        })
      }
    }

    return clusters
  }, [])

  // Function to build enriched insights from events
  const buildEnrichedInsightsFromEvents = useCallback((events: PipelineEvent[]): EnrichedInsight[] => {
    const insights: EnrichedInsight[] = []

    for (const event of events) {
      if (event.type === 'insight_created') {
        insights.push({
          id: event.insightId,
          clusterId: event.clusterId,
          title: event.title,
          summary: event.summary,
          severity: event.severity,
          confidence: event.confidence,
          usersAffected: event.usersAffected,
          recommendationCount: event.recommendationCount,
          evidenceCount: event.evidenceCount,
          stakeholderFormats: event.stakeholderFormats || []
        })
      }
    }

    return insights
  }, [])

  // Function to build enriched feedback from events
  const buildEnrichedFeedbackFromEvents = useCallback((events: PipelineEvent[]): EnrichedFeedback[] => {
    const enrichedFeedbackMap = new Map<string, Partial<EnrichedFeedback>>()

    for (const event of events) {
      if (!event.feedbackId) continue

      if (!enrichedFeedbackMap.has(event.feedbackId)) {
        enrichedFeedbackMap.set(event.feedbackId, { id: event.feedbackId })
      }

      const feedback = enrichedFeedbackMap.get(event.feedbackId)!

      switch (event.type) {
        case 'feedback_enrichment_started':
          feedback.originalFeedback = {
            feedbackId: event.feedbackId,
            text: event.text,
            source: event.source
          }
          break

        case 'enrichment_ai_call':
          feedback.aiCallDetails = {
            callId: event.callId,
            input: {
              messages: event.messages || []
            },
            output: { extractedData: null }
          }
          break

        case 'enrichment_ai_response':
          if (feedback.aiCallDetails && feedback.aiCallDetails.callId === event.callId) {
            feedback.aiCallDetails.output = {
              extractedData: event.extractedData
            }
          }
          break

        case 'feedback_enrichment_complete':
          if (event.success && event.enrichmentData) {
            feedback.enrichmentData = event.enrichmentData
            if (feedback.aiCallDetails) {
              feedback.aiCallDetails.duration = event.duration
            }
          }
          break
      }
    }

    // Filter and return only complete enriched feedback
    return Array.from(enrichedFeedbackMap.values())
      .filter((feedback): feedback is EnrichedFeedback => 
        !!(feedback.originalFeedback && feedback.enrichmentData && feedback.aiCallDetails)
      )
  }, [])

  // Progress tracking effect
  useEffect(() => {
    if (state.events.length === 0) return

    let feedbackStartedCount = 0
    let feedbackCompletedCount = 0
    let totalFeedbackToProcess = 0
    let clustersCreatedCount = 0
    let expectedClusterCount = 0
    let insightsCreatedCount = 0
    let expectedInsightCount = 0
    let clusteringStarted = false
    let clusteringComplete = false
    let insightGenerationStarted = false
    let insightGenerationComplete = false
    
    // Process events to count progress
    state.events.forEach(event => {
      switch (event.type) {
        case 'enrichment_started':
          // This event tells us the total number of feedback items to process
          if (event.feedbackCount) {
            totalFeedbackToProcess = event.feedbackCount
          }
          break
          
        case 'feedback_enrichment_started':
          feedbackStartedCount++
          // Estimate total feedback from started events if no enrichment_started event
          totalFeedbackToProcess = Math.max(totalFeedbackToProcess, feedbackStartedCount)
          break
          
        case 'feedback_enrichment_complete':
          if (event.success && event.enrichmentData) {
            feedbackCompletedCount++
          }
          break
          
        case 'enrichment_complete':
          // When enrichment completes, we know the exact count
          if (event.processedCount) {
            totalFeedbackToProcess = event.processedCount
          }
          break
          
        case 'clustering_started':
          clusteringStarted = true
          if (event.enrichedFeedbackCount) {
            // We know how many feedback items will be clustered
            totalFeedbackToProcess = Math.max(totalFeedbackToProcess, event.enrichedFeedbackCount)
          }
          break
          
        case 'cluster_created':
          clustersCreatedCount++
          break
          
        case 'clustering_complete':
          clusteringComplete = true
          if (event.clusterCount !== undefined) {
            expectedClusterCount = event.clusterCount
          }
          break
          
        case 'insight_generation_started':
          insightGenerationStarted = true
          if (event.clusterCount !== undefined) {
            expectedInsightCount = event.clusterCount // Usually 1 insight per cluster
          }
          break
          
        case 'insight_created':
          insightsCreatedCount++
          break
          
        case 'insight_generation_complete':
          insightGenerationComplete = true
          if (event.insightCount !== undefined) {
            expectedInsightCount = event.insightCount
          }
          break
          
        case 'pipeline_complete':
          // Ensure all stages are marked as complete when pipeline finishes
          clusteringComplete = true
          insightGenerationComplete = true
          break
      }
    })
    
    // Calculate progress percentages
    const enrichmentProgress = totalFeedbackToProcess > 0 
      ? Math.min(100, Math.round((feedbackCompletedCount / totalFeedbackToProcess) * 100))
      : 0
      
    // Simplified clustering progress: 0% when started, 100% when complete
    const clusteringProgress = clusteringStarted 
      ? clusteringComplete 
        ? 100 
        : 0
      : 0
      
    // Simplified insight progress: 0% when started, 100% when complete
    const insightProgress = insightGenerationStarted 
      ? insightGenerationComplete 
        ? 100 
        : 0
      : 0

    // Update progress state
    setState(prev => ({
      ...prev,
      stageProgress: {
        enrichment: enrichmentProgress,
        clustering: clusteringProgress,
        insights: insightProgress
      },
      progressStats: {
        feedbackProcessed: feedbackCompletedCount,
        totalFeedback: totalFeedbackToProcess,
        clustersCreated: clustersCreatedCount,
        expectedClusters: expectedClusterCount,
        insightsCreated: insightsCreatedCount,
        expectedInsights: expectedInsightCount
      }
    }))
  }, [state.events])

  const executePipeline = useCallback(async (params: ExecutePipelineParams) => {
    const { file, companyId, productId, source } = params

    // Reset state for new execution
    setState({
      isExecuting: true,
      events: [],
      enrichedFeedback: [],
      enrichedClusters: [],
      enrichedInsights: [],
      error: null,
      pipelineId: `pipeline_${Date.now()}`,
      isComplete: false,
      stageProgress: {
        enrichment: 0,
        clustering: 0,
        insights: 0
      },
      progressStats: {
        feedbackProcessed: 0,
        totalFeedback: 0,
        clustersCreated: 0,
        expectedClusters: 0,
        insightsCreated: 0,
        expectedInsights: 0
      }
    })

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController()

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('companyId', companyId)
      formData.append('productId', productId)
      formData.append('source', source)

      const response = await fetch('/api/pipeline/execute', {
        method: 'POST',
        body: formData,
        signal: abortControllerRef.current.signal,
        headers: {
          'x-user-id': 'demo-user' // TODO: Get from auth
        }
      })

      if (!response.ok) {
        throw new Error(`Pipeline execution failed: ${response.statusText}`)
      }

      if (!response.body) {
        throw new Error('No response body received')
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() || ''

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            try {
              const eventData = JSON.parse(line.slice(6))
              console.log('📨 Received SSE event:', eventData.type, eventData)
              
                    // Add new event to state and rebuild enriched feedback, clusters, and insights
                    setState(prevState => {
                      const newEvents = [...prevState.events, eventData]
                      const enrichedFeedback = buildEnrichedFeedbackFromEvents(newEvents)
                      const enrichedClusters = buildEnrichedClustersFromEvents(newEvents)
                      const enrichedInsights = buildEnrichedInsightsFromEvents(newEvents)
                      
                      return {
                        ...prevState,
                        events: newEvents,
                        enrichedFeedback,
                        enrichedClusters,
                        enrichedInsights
                      }
                    })              // Check for completion
              if (eventData.type === 'pipeline_complete') {
                setState(prev => ({
                  ...prev,
                  isExecuting: false,
                  isComplete: true
                }))
                break
              } else if (eventData.type === 'pipeline_failed') {
                setState(prev => ({
                  ...prev,
                  isExecuting: false,
                  error: eventData.error || 'Pipeline failed',
                  isComplete: false
                }))
                break
              }
            } catch (e) {
              console.warn('Failed to parse SSE event:', line, e)
            }
          }
        }
      }

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        console.log('Pipeline execution was cancelled')
        setState(prev => ({
          ...prev,
          isExecuting: false,
          error: 'Pipeline execution was cancelled'
        }))
      } else {
        console.error('Pipeline execution error:', error)
        setState(prev => ({
          ...prev,
          isExecuting: false,
          error: error instanceof Error ? error.message : 'Pipeline execution failed'
        }))
      }
    }
  }, [])

  const cancelExecution = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
  }, [])

  const resetState = useCallback(() => {
    setState({
      isExecuting: false,
      events: [],
      enrichedFeedback: [],
      enrichedClusters: [],
      enrichedInsights: [],
      error: null,
      pipelineId: null,
      isComplete: false,
      stageProgress: {
        enrichment: 0,
        clustering: 0,
        insights: 0
      },
      progressStats: {
        feedbackProcessed: 0,
        totalFeedback: 0,
        clustersCreated: 0,
        expectedClusters: 0,
        insightsCreated: 0,
        expectedInsights: 0
      }
    })
  }, [])

  return {
    // State
    isExecuting: state.isExecuting,
    events: state.events,
    enrichedFeedback: state.enrichedFeedback,
    enrichedClusters: state.enrichedClusters,
    enrichedInsights: state.enrichedInsights,
    error: state.error,
    pipelineId: state.pipelineId,
    isComplete: state.isComplete,
    
    // Progress tracking
    stageProgress: state.stageProgress,
    progressStats: state.progressStats,
    
    // Actions
    executePipeline,
    cancelExecution,
    resetState,
    
    // Computed values
    eventCount: state.events.length,
    hasEvents: state.events.length > 0,
    
    // Event type counts for quick stats
    enrichmentEvents: state.events.filter(e => e.type.includes('enrichment')).length,
    clusterEvents: state.events.filter(e => e.type === 'cluster_created').length,
    insightEvents: state.events.filter(e => e.type === 'insight_created').length,
    
    // Cluster-specific computed values
    clusterCount: state.enrichedClusters.length,
    hasClusters: state.enrichedClusters.length > 0,
    totalFeedbackInClusters: state.enrichedClusters.reduce((sum, cluster) => sum + cluster.size, 0),
    
    // Insight-specific computed values
    insightCount: state.enrichedInsights.length,
    hasInsights: state.enrichedInsights.length > 0,
    totalUsersAffected: state.enrichedInsights.reduce((sum, insight) => sum + insight.usersAffected, 0),
    highSeverityInsights: state.enrichedInsights.filter(i => i.severity === 'high').length,
    mediumSeverityInsights: state.enrichedInsights.filter(i => i.severity === 'medium').length,
    lowSeverityInsights: state.enrichedInsights.filter(i => i.severity === 'low').length
  }
}
