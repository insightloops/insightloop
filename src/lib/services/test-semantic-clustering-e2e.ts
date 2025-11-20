/**
 * End-to-end test for SemanticClusteringService
 * 
 * Tests the clustering service with mock enriched feedback entries
 * to verify OpenAI integration and proper event emission.
 */

import { SemanticClusteringService } from './SemanticClusteringService'
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
    text: 'Love the new dashboard design! The charts are so much clearer now.',
    userId: 'user-2',
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
    id: 'feedback-003',
    text: 'The mobile app crashes every time I try to export data',
    userId: 'user-3',
    timestamp: new Date('2024-01-17'),
    source: 'support',
    companyId: 'company-1',
    productId: 'product-1',
    linkedProductAreas: [
      { id: 'mobile-001', name: 'Mobile App', confidence: 0.9 },
      { id: 'export-001', name: 'Data Export', confidence: 0.8 }
    ],
    sentiment: { label: 'negative', score: -0.9, confidence: 0.9 },
    extractedFeatures: ['mobile', 'export', 'crash'],
    urgency: 'high',
    category: ['mobile', 'export', 'bug'],
    userMetadata: {
      plan: 'free', 
      segment: 'SMB',
      teamSize: 10,
      usage: 'medium'
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
  },
  {
    id: 'feedback-005',
    text: 'Authentication keeps timing out during peak hours',
    userId: 'user-5', 
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

async function testSemanticClustering() {
  console.log('🧪 Testing SemanticClusteringService End-to-End\n')

  const mockEventEmitter = new MockEventEmitter()
  const pipelineId = `test_pipeline_${Date.now()}`

  // Create clustering service with OpenAI integration
  const clusteringService = new SemanticClusteringService(
    mockEventEmitter,
    pipelineId,
    {
      maxClusters: 3,
      minClusterSize: 1,
      qualityThreshold: 0.3
    }
  )

  try {
    console.log(`📝 Processing ${mockEnrichedFeedback.length} enriched feedback entries...`)
    
    const startTime = Date.now()
    const clusters = await clusteringService.clusterFeedback(mockEnrichedFeedback)
    const duration = Date.now() - startTime

    console.log(`\n✅ Clustering completed in ${duration}ms`)
    console.log(`📊 Generated ${clusters.length} clusters:\n`)

    // Display results
    clusters.forEach((cluster, index) => {
      console.log(`🏷️  Cluster ${index + 1}: ${cluster.theme}`)
      console.log(`   Description: ${cluster.description}`)
      console.log(`   Size: ${cluster.size} entries`)
      console.log(`   Feedback IDs: ${cluster.entryIds.join(', ')}`)
      console.log(`   Dominant Sentiment: ${cluster.dominantSentiment}`)
      console.log(`   Product Areas: ${cluster.productAreas.join(', ')}`)
      console.log(`   Keywords: ${cluster.keywords.join(', ')}`)
      console.log(`   Confidence: ${cluster.confidence}`)
      console.log()
    })

    // Verify all feedback is assigned
    const allAssignedIds = new Set(clusters.flatMap(c => c.entryIds))
    const expectedIds = new Set(mockEnrichedFeedback.map(f => f.id))
    
    const missingIds = [...expectedIds].filter(id => !allAssignedIds.has(id))
    const extraIds = [...allAssignedIds].filter(id => !expectedIds.has(id))

    if (missingIds.length === 0 && extraIds.length === 0) {
      console.log('✅ All feedback entries correctly assigned to clusters')
    } else {
      console.log('❌ Assignment issues:')
      if (missingIds.length > 0) console.log(`   Missing: ${missingIds.join(', ')}`)
      if (extraIds.length > 0) console.log(`   Extra: ${extraIds.join(', ')}`)
    }

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

    console.log('\n🎉 SemanticClusteringService test completed successfully!')
    
    return {
      success: true,
      clusters,
      events,
      duration
    }

  } catch (error) {
    console.error('❌ Clustering test failed:', error)
    
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
  testSemanticClustering()
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

export { testSemanticClustering }
