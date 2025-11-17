import { renderHook, act, waitFor } from '@testing-library/react'
import { usePipelineExecution } from '../usePipelineExecution'

// Mock fetch with streaming response
global.fetch = jest.fn()

// Mock ReadableStream for SSE simulation
const createMockStreamResponse = (events: any[]) => {
  const encoder = new TextEncoder()
  let index = 0
  
  return {
    ok: true,
    body: {
      getReader: () => ({
        read: () => {
          if (index >= events.length) {
            return Promise.resolve({ done: true, value: undefined })
          }
          
          const event = events[index++]
          const eventLine = `data: ${JSON.stringify(event)}\n\n`
          const value = encoder.encode(eventLine)
          
          return Promise.resolve({ done: false, value })
        }
      })
    },
    headers: new Headers(),
    status: 200,
    statusText: 'OK'
  }
}

describe('usePipelineExecution', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  it('should initialize with correct default values', () => {
    const { result } = renderHook(() => usePipelineExecution())

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.events).toEqual([])
    expect(result.current.enrichedFeedback).toEqual([])
    expect(result.current.enrichedClusters).toEqual([])
    expect(result.current.enrichedInsights).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.pipelineId).toBeNull()
    expect(result.current.isComplete).toBe(false)
    expect(result.current.eventCount).toBe(0)
    expect(result.current.hasEvents).toBe(false)
    expect(result.current.clusterCount).toBe(0)
    expect(result.current.hasClusters).toBe(false)
    expect(result.current.insightCount).toBe(0)
    expect(result.current.hasInsights).toBe(false)
  })

  it('should execute pipeline and handle complete event sequence', async () => {
    const { result } = renderHook(() => usePipelineExecution())

    // Simulate complete event sequence for enriched feedback
    const completeEvents = [
      {
        type: 'feedback_enrichment_started',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:01Z',
        feedbackId: 'feedback_123',
        text: 'Great product, but needs improvement',
        source: 'survey'
      },
      {
        type: 'enrichment_ai_call',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:02Z',
        feedbackId: 'feedback_123',
        callId: 'call_456',
        messages: [
          { role: 'system', content: 'Analyze this feedback...' },
          { role: 'user', content: 'Great product, but needs improvement' }
        ]
      },
      {
        type: 'enrichment_ai_response',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:03Z',
        feedbackId: 'feedback_123',
        callId: 'call_456',
        extractedData: {
          sentiment: 'mixed',
          features: ['product quality'],
          urgency: 'medium'
        }
      },
      {
        type: 'feedback_enrichment_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:04Z',
        feedbackId: 'feedback_123',
        success: true,
        duration: 3000,
        enrichmentData: {
          id: 'feedback_123',
          sentiment: {
            label: 'mixed',
            score: 0.1,
            confidence: 0.85
          },
          linkedProductAreas: ['user-experience'],
          extractedFeatures: ['product quality'],
          urgency: 'medium',
          category: ['feature request']
        }
      },
      {
        type: 'clustering_started',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:05Z',
        enrichedFeedbackCount: 1
      },
      {
        type: 'cluster_created',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:06Z',
        clusterId: 'cluster_1',
        theme: 'Mobile App Issues',
        description: 'Issues with mobile app functionality',
        size: 1,
        dominantSentiment: 'negative',
        avgConfidence: 0.85,
        productAreas: ['Mobile App'],
        feedbackIds: ['feedback_123']
      },
      {
        type: 'clustering_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:07Z',
        clusterCount: 1,
        duration: 2000
      },
      {
        type: 'insight_generation_started',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:08Z',
        clusterCount: 1,
        mode: 'parallel'
      },
      {
        type: 'insight_created',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:09Z',
        insightId: 'insight_cluster_1_001',
        clusterId: 'cluster_1',
        title: 'Mobile App Critical Issues',
        summary: 'Critical bugs affecting mobile app stability need immediate attention',
        severity: 'high',
        confidence: 0.95,
        usersAffected: 150,
        recommendationCount: 3,
        evidenceCount: 5,
        stakeholderFormats: ['executive', 'product', 'engineering']
      },
      {
        type: 'insight_generation_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:10Z',
        insightCount: 1,
        duration: 2000
      },
      {
        type: 'pipeline_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:11Z'
      }
    ]

    // Mock fetch with streaming response
    ;(global.fetch as jest.Mock).mockResolvedValue(createMockStreamResponse(completeEvents))

    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const params = {
      file: mockFile,
      companyId: 'company-123',
      productId: 'product-456',
      source: 'test'
    }

    // Start pipeline execution
    await act(async () => {
      await result.current.executePipeline(params)
    })

    expect(result.current.isExecuting).toBe(false) // Should be false after completion
    expect(result.current.isComplete).toBe(true)
    expect(global.fetch).toHaveBeenCalledWith('/api/pipeline/execute', expect.objectContaining({
      method: 'POST',
      body: expect.any(FormData)
    }))

    // Wait for enriched feedback to be built
    await waitFor(() => {
      expect(result.current.enrichedFeedback).toHaveLength(1)
    })

    const enrichedFeedback = result.current.enrichedFeedback[0]
    expect(enrichedFeedback.id).toBe('feedback_123')
    expect(enrichedFeedback.originalFeedback.text).toBe('Great product, but needs improvement')
    expect(enrichedFeedback.aiCallDetails.callId).toBe('call_456')
    expect(enrichedFeedback.enrichmentData.sentiment.label).toBe('mixed')
    expect(result.current.events).toHaveLength(11) // Including clustering, insights, and pipeline_complete events

    // Verify cluster creation
    await waitFor(() => {
      expect(result.current.enrichedClusters).toHaveLength(1)
    })

    const cluster = result.current.enrichedClusters[0]
    expect(cluster.id).toBe('cluster_1')
    expect(cluster.theme).toBe('Mobile App Issues')
    expect(cluster.enrichedFeedbackIds).toEqual(['feedback_123'])
    expect(cluster.size).toBe(1)
    expect(cluster.dominantSentiment).toBe('negative')
    expect(result.current.clusterCount).toBe(1)
    expect(result.current.hasClusters).toBe(true)

    // Verify insight creation
    await waitFor(() => {
      expect(result.current.enrichedInsights).toHaveLength(1)
    })

    const insight = result.current.enrichedInsights[0]
    expect(insight.id).toBe('insight_cluster_1_001')
    expect(insight.clusterId).toBe('cluster_1')
    expect(insight.title).toBe('Mobile App Critical Issues')
    expect(insight.severity).toBe('high')
    expect(insight.confidence).toBe(0.95)
    expect(insight.usersAffected).toBe(150)
    expect(result.current.insightCount).toBe(1)
    expect(result.current.hasInsights).toBe(true)
    expect(result.current.highSeverityInsights).toBe(1)
    expect(result.current.totalUsersAffected).toBe(150)
  })

  it('should not return incomplete enriched feedback', async () => {
    const { result } = renderHook(() => usePipelineExecution())

    // Send only partial events (missing enrichment_complete)
    const incompleteEvents = [
      {
        type: 'feedback_enrichment_started',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:01Z',
        feedbackId: 'feedback_incomplete',
        text: 'Incomplete feedback',
        source: 'survey'
      },
      {
        type: 'enrichment_ai_call',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:02Z',
        feedbackId: 'feedback_incomplete',
        callId: 'call_incomplete',
        messages: [{ role: 'system', content: 'Test' }]
      },
      {
        type: 'pipeline_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:03Z'
      }
      // Missing: enrichment_ai_response and feedback_enrichment_complete
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue(createMockStreamResponse(incompleteEvents))

    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const params = {
      file: mockFile,
      companyId: 'company-123',
      productId: 'product-456',
      source: 'test'
    }

    await act(async () => {
      await result.current.executePipeline(params)
    })

    // Should not have any enriched feedback since it's incomplete
    expect(result.current.enrichedFeedback).toHaveLength(0)
    expect(result.current.events).toHaveLength(3)
  })

  it('should handle errors correctly', async () => {
    const { result } = renderHook(() => usePipelineExecution())

    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const params = {
      file: mockFile,
      companyId: 'company-123',
      productId: 'product-456',
      source: 'test'
    }

    // Mock fetch to reject
    ;(global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'))

    await act(async () => {
      await result.current.executePipeline(params)
    })

    expect(result.current.error).toBe('Network error')
    expect(result.current.isExecuting).toBe(false)
  })

  it('should extract clusters with enriched feedback IDs correctly', async () => {
    const { result } = renderHook(() => usePipelineExecution())

    // Simulate multiple clusters with different feedback IDs
    const clusteringEvents = [
      {
        type: 'clustering_started',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:01Z',
        enrichedFeedbackCount: 3
      },
      {
        type: 'cluster_created',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:02Z',
        clusterId: 'cluster_ui_issues',
        theme: 'UI/UX Problems',
        description: 'Issues related to user interface and experience',
        size: 2,
        dominantSentiment: 'negative',
        avgConfidence: 0.92,
        productAreas: ['Mobile App', 'Web Interface'],
        feedbackIds: ['feedback_001', 'feedback_003']
      },
      {
        type: 'cluster_created',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:03Z',
        clusterId: 'cluster_performance',
        theme: 'Performance Issues',
        description: 'Feedback about slow performance and loading times',
        size: 1,
        dominantSentiment: 'negative',
        avgConfidence: 0.88,
        productAreas: ['Backend', 'Database'],
        feedbackIds: ['feedback_002']
      },
      {
        type: 'clustering_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:04Z',
        clusterCount: 2,
        duration: 3000
      },
      {
        type: 'pipeline_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:05Z'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue(createMockStreamResponse(clusteringEvents))

    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const params = {
      file: mockFile,
      companyId: 'company-123',
      productId: 'product-456',
      source: 'test'
    }

    await act(async () => {
      await result.current.executePipeline(params)
    })

    // Verify clusters were extracted correctly
    expect(result.current.enrichedClusters).toHaveLength(2)
    expect(result.current.clusterCount).toBe(2)
    expect(result.current.hasClusters).toBe(true)
    expect(result.current.totalFeedbackInClusters).toBe(3) // 2 + 1

    // Verify first cluster
    const uiCluster = result.current.enrichedClusters.find(c => c.id === 'cluster_ui_issues')
    expect(uiCluster).toBeDefined()
    expect(uiCluster!.theme).toBe('UI/UX Problems')
    expect(uiCluster!.enrichedFeedbackIds).toEqual(['feedback_001', 'feedback_003'])
    expect(uiCluster!.size).toBe(2)
    expect(uiCluster!.dominantSentiment).toBe('negative')
    expect(uiCluster!.avgConfidence).toBe(0.92)
    expect(uiCluster!.productAreas).toEqual(['Mobile App', 'Web Interface'])

    // Verify second cluster
    const perfCluster = result.current.enrichedClusters.find(c => c.id === 'cluster_performance')
    expect(perfCluster).toBeDefined()
    expect(perfCluster!.theme).toBe('Performance Issues')
    expect(perfCluster!.enrichedFeedbackIds).toEqual(['feedback_002'])
    expect(perfCluster!.size).toBe(1)
    expect(perfCluster!.dominantSentiment).toBe('negative')
    expect(perfCluster!.avgConfidence).toBe(0.88)
    expect(perfCluster!.productAreas).toEqual(['Backend', 'Database'])

    // Verify cluster events were tracked
    expect(result.current.clusterEvents).toBe(2)
    expect(result.current.events.filter(e => e.type === 'cluster_created')).toHaveLength(2)
  })

  it('should reset state correctly', async () => {
    const { result } = renderHook(() => usePipelineExecution())

    // Execute pipeline first to have some state
    const mockEvents = [
      {
        type: 'feedback_enrichment_started',
        feedbackId: 'test',
        text: 'test',
        source: 'test'
      },
      {
        type: 'pipeline_complete',
        pipelineId: 'test-pipeline-id',
        timestamp: '2025-11-15T15:00:01Z'
      }
    ]

    ;(global.fetch as jest.Mock).mockResolvedValue(createMockStreamResponse(mockEvents))

    const mockFile = new File(['test content'], 'test.csv', { type: 'text/csv' })
    const params = {
      file: mockFile,
      companyId: 'company-123',
      productId: 'product-456',
      source: 'test'
    }

    await act(async () => {
      await result.current.executePipeline(params)
    })

    expect(result.current.events).toHaveLength(2)

    // Reset state
    act(() => {
      result.current.resetState()
    })

    expect(result.current.isExecuting).toBe(false)
    expect(result.current.events).toEqual([])
    expect(result.current.enrichedFeedback).toEqual([])
    expect(result.current.enrichedClusters).toEqual([])
    expect(result.current.error).toBeNull()
    expect(result.current.pipelineId).toBeNull()
    expect(result.current.isComplete).toBe(false)
  })

  it('should initialize progress tracking with default values', () => {
    const { result } = renderHook(() => usePipelineExecution())

    // Check initial progress state
    expect(result.current.stageProgress).toEqual({
      enrichment: 0,
      clustering: 0,
      insights: 0
    })

    expect(result.current.progressStats).toEqual({
      feedbackProcessed: 0,
      totalFeedback: 0,
      clustersCreated: 0,
      expectedClusters: 0,
      insightsCreated: 0,
      expectedInsights: 0
    })
  })
})
