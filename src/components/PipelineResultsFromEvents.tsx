/**
 * Pipeline Results From Events Component
 * 
 * Takes a list of SSE events and automatically builds the enriched feedback,
 * clusters, and insights from them, then renders the complete results UI.
 * 
 * This component understands the event structure and can:
 * - Parse enriched_feedback_created events into enriched feedback list
 * - Parse cluster_created events into clusters with linked feedback
 * - Parse insight_created events into insights with cluster relationships
 * - Render the complete results UI with all sections
 */

'use client'

import React, { useMemo } from 'react'
import { EnrichmentResults, ClusterVisualization, InsightsDashboard } from './PipelineResultsComponents'

// Types for pipeline events
interface PipelineEvent {
  type: string
  pipelineId: string
  timestamp: string
  [key: string]: any
}

interface EnrichedFeedback {
  id: string
  text: string
  productArea: string
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
  customerSegment: string
  enrichedData?: any
  llmPrompt?: string
  llmResponse?: string
}

interface FeedbackCluster {
  id: string
  name: string
  theme: string
  description: string
  feedback: EnrichedFeedback[]
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  urgency: {
    low: number
    medium: number
    high: number
  }
  size?: number
  dominantSentiment?: string
  avgConfidence?: number
  productAreas?: string[]
  feedbackIds?: string[]
}

interface GeneratedInsight {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  clusters: string[]
  evidence: string[]
  recommendation: string
  impact: string
  stakeholders: string[]
}

interface PipelineResultsFromEventsProps {
  events: PipelineEvent[]
}

export function PipelineResultsFromEvents({ events }: PipelineResultsFromEventsProps) {
  // Parse events into structured data
  const { enrichedFeedback, clusters, insights } = useMemo(() => {
    console.log('🔍 Processing', events.length, 'events to build results')

    // 1. Build enriched feedback from enriched_feedback_created events
    const enrichedFeedbackMap = new Map<string, EnrichedFeedback>()
    
    events
      .filter(event => event.type === 'enriched_feedback_created')
      .forEach(event => {
        const feedback: EnrichedFeedback = {
          id: event.feedbackId,
          text: event.originalText,
          productArea: event.productArea || 'General',
          sentiment: event.sentiment || 'neutral',
          urgency: event.urgency || 'low', 
          customerSegment: event.customerSegment || 'Unknown',
          llmPrompt: event.llmPrompt,
          llmResponse: event.llmResponse,
          enrichedData: {
            productArea: event.productArea,
            sentiment: event.sentiment,
            urgency: event.urgency,
            customerSegment: event.customerSegment
          }
        }
        enrichedFeedbackMap.set(feedback.id, feedback)
      })

    const enrichedFeedbackList = Array.from(enrichedFeedbackMap.values())
    console.log('✅ Built', enrichedFeedbackList.length, 'enriched feedback items')

    // 2. Build clusters from cluster_created events
    const clustersMap = new Map<string, FeedbackCluster>()
    
    events
      .filter(event => event.type === 'cluster_created')
      .forEach(event => {
        const cluster: FeedbackCluster = {
          id: event.clusterId,
          name: event.theme, // Map theme to name for UI compatibility
          theme: event.theme,
          description: event.description,
          feedback: [], // Will be populated below
          sentiment: {
            positive: 0,
            negative: 0, 
            neutral: 0
          },
          urgency: {
            low: 0,
            medium: 0,
            high: 0
          },
          size: event.size,
          dominantSentiment: event.dominantSentiment,
          avgConfidence: event.avgConfidence,
          productAreas: event.productAreas,
          feedbackIds: event.feedbackIds
        }
        clustersMap.set(cluster.id, cluster)
      })

    // Link feedback to clusters based on feedbackIds
    const clustersList = Array.from(clustersMap.values()).map(cluster => {
      const clusterFeedback = enrichedFeedbackList.filter(feedback => 
        cluster.feedbackIds?.includes(feedback.id) || false
      )
      
      // Calculate sentiment and urgency distributions
      const sentimentCounts = {
        positive: clusterFeedback.filter(f => f.sentiment === 'positive').length,
        negative: clusterFeedback.filter(f => f.sentiment === 'negative').length,
        neutral: clusterFeedback.filter(f => f.sentiment === 'neutral').length
      }
      
      const urgencyCounts = {
        low: clusterFeedback.filter(f => f.urgency === 'low').length,
        medium: clusterFeedback.filter(f => f.urgency === 'medium').length,
        high: clusterFeedback.filter(f => f.urgency === 'high').length
      }

      return {
        ...cluster,
        feedback: clusterFeedback,
        sentiment: sentimentCounts,
        urgency: urgencyCounts
      }
    })

    console.log('✅ Built', clustersList.length, 'clusters with linked feedback')

    // 3. Build insights from insight_created events
    const insightsMap = new Map<string, GeneratedInsight>()
    
    events
      .filter(event => event.type === 'insight_created')
      .forEach(event => {
        const insight: GeneratedInsight = {
          id: event.insightId,
          title: event.title,
          description: event.summary,
          severity: event.severity || 'medium',
          confidence: event.confidence,
          clusters: [event.clusterId],
          evidence: [],
          recommendation: '',
          impact: '',
          stakeholders: []
        }
        insightsMap.set(insight.id, insight)
      })

    const insightsList = Array.from(insightsMap.values())
    console.log('✅ Built', insightsList.length, 'insights')

    return {
      enrichedFeedback: enrichedFeedbackList,
      clusters: clustersList,
      insights: insightsList
    }
  }, [events])

  return (
    <div className="space-y-6">
      {/* Enrichment Results */}
      <EnrichmentResults enrichedFeedback={enrichedFeedback} events={events} />
      
      {/* Cluster Visualization */}
      <ClusterVisualization clusters={clusters} />
      
      {/* Insights Dashboard */}
      <InsightsDashboard insights={insights} clusters={clusters} />
    </div>
  )
}
