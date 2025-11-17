/**
 * End-to-end test for InsightGenerationService
 * 
 * Tests the insight generation service with mock clusters containing enriched feedback
 * to verify OpenAI integration and proper insight generation.
 */

import { InsightGenerationService } from './InsightGenerationService'
import { FeedbackCluster } from './SemanticClusteringService'
import { EnrichedFeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'
import { EventEmitter } from 'events'

// Mock enriched feedback entries for testing
const mockEnrichedFeedback: EnrichedFeedbackEntry[] = [
  {
    id: 'feedback-001',
    text: 'The login process is extremely slow and takes forever to load',
    userId: 'user-1',
    timestamp: new Date('2024-01-15'),
    source: 'support',
    companyId: 'company-1', 
    productId: 'product-1',
    linkedProductAreas: [
      { id: 'auth-001', name: 'Authentication', confidence: 0.9 }
    ],
    sentiment: { label: 'negative', score: -0.8, confidence: 0.9 },
    extractedFeatures: ['login', 'authentication', 'performance'],
    urgency: 'high',
    category: ['performance', 'authentication'],
    userMetadata: {
      plan: 'pro',
      segment: 'SMB',
      teamSize: 50,
      usage: 'high'
    }
  },
  {
    id: 'feedback-002',
    text: 'Authentication keeps timing out during peak hours',
    userId: 'user-2', 
    timestamp: new Date('2024-01-19'),
    source: 'slack',
    companyId: 'company-1',
    productId: 'product-1',
    linkedProductAreas: [
      { id: 'auth-001', name: 'Authentication', confidence: 0.95 }
    ],
    sentiment: { label: 'negative', score: -0.7, confidence: 0.8 },
    extractedFeatures: ['authentication', 'timeout', 'performance'],
    urgency: 'high',
    category: ['performance', 'authentication'],
    userMetadata: {
      plan: 'enterprise',
      segment: 'Enterprise',
      teamSize: 500,
      usage: 'high' 
    }
  },
  {
    id: 'feedback-003', 
    text: 'Love the new dashboard design! The charts are so much clearer now.',
    userId: 'user-3',
    timestamp: new Date('2024-01-16'),
    source: 'survey',
    companyId: 'company-1',
    productId: 'product-1', 
    linkedProductAreas: [
      { id: 'dash-001', name: 'Dashboard', confidence: 0.95 }
    ],
    sentiment: { label: 'positive', score: 0.9, confidence: 0.95 },
    extractedFeatures: ['dashboard', 'charts', 'design'],
    urgency: 'low',
    category: ['ui', 'visualization'],
    userMetadata: {
      plan: 'enterprise',
      segment: 'Enterprise',
      teamSize: 200,
      usage: 'high'
    }
  },
  {
    id: 'feedback-004',
    text: 'Would be great to have more customization options in the dashboard',
    userId: 'user-4',
    timestamp: new Date('2024-01-18'),
    source: 'interview',
    companyId: 'company-1',
    productId: 'product-1',
    linkedProductAreas: [
      { id: 'dash-001', name: 'Dashboard', confidence: 0.85 }
    ],
    sentiment: { label: 'neutral', score: 0.1, confidence: 0.7 },
    extractedFeatures: ['dashboard', 'customization', 'options'],
    urgency: 'medium',
    category: ['feature-request', 'dashboard'],
    userMetadata: {
      plan: 'pro',
      segment: 'Enterprise', 
      teamSize: 100,
      usage: 'high'
    }
  }
]

// Mock clusters containing the enriched feedback
const mockClusters: FeedbackCluster[] = [
  {
    id: 'cluster_1',
    theme: 'Authentication Performance Issues',
    description: 'Users experiencing slow login times and timeouts during peak hours',
    entries: mockEnrichedFeedback.slice(0, 2), // Authentication issues
    entryIds: ['feedback-001', 'feedback-002'],
    size: 2,
    dominantSentiment: 'negative',
    sentimentDistribution: { positive: 0, negative: 2, neutral: 0 },
    urgencyDistribution: { low: 0, medium: 0, high: 2 },
    productAreas: ['Authentication'],
    userSegments: ['SMB', 'Enterprise'],
    keywords: ['login', 'authentication', 'performance', 'timeout'],
    confidence: 0.9,
    similarity: {
      avgInternalSimilarity: 0.85,
      coherenceScore: 0.9
    }
  },
  {
    id: 'cluster_2', 
    theme: 'Dashboard Enhancement Requests',
    description: 'Mixed feedback on dashboard improvements and customization needs',
    entries: mockEnrichedFeedback.slice(2, 4), // Dashboard feedback
    entryIds: ['feedback-003', 'feedback-004'],
    size: 2,
    dominantSentiment: 'neutral',
    sentimentDistribution: { positive: 1, negative: 0, neutral: 1 },
    urgencyDistribution: { low: 1, medium: 1, high: 0 },
    productAreas: ['Dashboard'],
    userSegments: ['Enterprise'],
    keywords: ['dashboard', 'charts', 'design', 'customization', 'options'],
    confidence: 0.8,
    similarity: {
      avgInternalSimilarity: 0.7,
      coherenceScore: 0.75
    }
  }
]

// Mock event emitter that captures events
class MockEventEmitter extends EventEmitter implements PipelineEventEmitter {
  private events: Array<{event: string, data: any}> = []

  emit(event: string, data: any): boolean {
    this.events.push({ event, data })
    console.log(`📊 Event: ${event}`, data)
    return super.emit(event, data)
  }

  getEvents() {
    return this.events
  }

  clearEvents() {
    this.events = []
  }
}

async function testInsightGeneration() {
  console.log('🧪 Testing InsightGenerationService End-to-End\n')

  const mockEventEmitter = new MockEventEmitter()
  const pipelineId = `test_pipeline_${Date.now()}`

  // Create insight generation service with OpenAI integration
  const insightService = new InsightGenerationService(
    mockEventEmitter,
    pipelineId,
    {
      analysisDepth: 'comprehensive',
      qualityThreshold: 0.6,
      maxRecommendations: 3
    }
  )

  try {
    console.log(`📝 Processing ${mockClusters.length} clusters with enriched feedback...`)
    
    const startTime = Date.now()
    const insights = await insightService.generateInsights(mockClusters, 'test-pipeline-id')
    const duration = Date.now() - startTime

    console.log(`\n✅ Insight generation completed in ${duration}ms`)
    console.log(`📊 Generated ${insights.length} insights:\n`)

    // Display results
    insights.forEach((insight, index) => {
      console.log(`💡 Insight ${index + 1}: ${insight.title}`)
      console.log(`   Cluster: "${insight.evidence.sourceCluster.theme}"`)
      console.log(`   Executive Summary: ${insight.executiveSummary}`)
      console.log(`   Pain Point: ${insight.painPoint.description} (${insight.painPoint.severity})`)
      console.log(`   Users Affected: ${insight.impact.usersAffected}`)
      console.log(`   Business Impact: Revenue: ${insight.impact.businessImpact.revenue}, Churn: ${insight.impact.businessImpact.churn}, Satisfaction: ${insight.impact.businessImpact.satisfaction}`)
      console.log(`   Recommendations: ${insight.recommendations.length}`)
      insight.recommendations.forEach((rec, idx) => {
        console.log(`     ${idx + 1}. ${rec.title} (${rec.priority} priority, ${rec.effort} effort, ${rec.timeline})`)
      })
      console.log(`   Evidence: ${insight.evidence.supportingFeedback.length} feedback entries`)
      console.log(`   Confidence: ${(insight.confidence * 100).toFixed(1)}%`)
      console.log(`   Processing Time: ${insight.processingTimeMs}ms`)
      
      // Show stakeholder formats
      console.log(`   Stakeholder Formats:`)
      console.log(`     Executive: ${insight.stakeholderFormats.executive}`)
      console.log(`     Product: ${insight.stakeholderFormats.product}`)
      console.log(`     Engineering: ${insight.stakeholderFormats.engineering}`)
      console.log(`     Customer Success: ${insight.stakeholderFormats.customerSuccess}`)
      console.log()
    })

    // Verify evidence traceability
    console.log('🔍 Evidence Traceability Check:')
    insights.forEach((insight, idx) => {
      console.log(`   Insight ${idx + 1}: ${insight.evidence.supportingFeedback.length} feedback entries linked`)
      insight.evidence.supportingFeedback.forEach(evidence => {
        console.log(`     - ${evidence.feedbackId}: "${evidence.quoteExtract}" (${evidence.userSegment})`)
      })
    })

    // Display event summary
    const events = mockEventEmitter.getEvents()
    console.log(`\n📋 Events emitted: ${events.length}`)
    
    const eventCounts = events.reduce((acc, {event}) => {
      acc[event] = (acc[event] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    Object.entries(eventCounts).forEach(([event, count]) => {
      console.log(`   ${event}: ${count}`)
    })

    console.log('\n🎉 InsightGenerationService test completed successfully!')
    
    return {
      success: true,
      insights,
      events,
      duration
    }

  } catch (error) {
    console.error('❌ Insight generation test failed:', error)
    
    const events = mockEventEmitter.getEvents()
    console.log(`\n📋 Events before failure: ${events.length}`)
    events.forEach(({event, data}) => {
      console.log(`   ${event}:`, data)
    })
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
      events
    }
  }
}

// Run the test
if (require.main === module) {
  testInsightGeneration()
    .then(result => {
      if (result.success) {
        console.log('\n✅ Test completed successfully')
        process.exit(0)
      } else {
        console.log('\n❌ Test failed')
        process.exit(1)
      }
    })
    .catch(error => {
      console.error('Test execution failed:', error)
      process.exit(1)
    })
}

export { testInsightGeneration }
