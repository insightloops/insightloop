/**
 * End-to-End Test for FeedbackPipelineOrchestrator
 * 
 * This script tests the complete pipeline orchestration flow with:
 * - Mock repositories with known test data
 * - Real service integration (but with mocked dependencies)
 * - Event emission verification
 * - Result validation and inspection
 */

import { FeedbackPipelineOrchestrator, PipelineInput } from './FeedbackPipelineOrchestrator'
import { FeedbackEntry, EnrichedFeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'

// Mock Feedback Repository - consistent with other tests
class MockFeedbackRepository {
  private updatedFeedback: Map<string, any> = new Map()
  private processedTimestamps: Map<string, string> = new Map()

  async update(id: string, data: any): Promise<any> {
    console.log(`📝 MockFeedbackRepository.update(${id}):`, data)
    this.updatedFeedback.set(id, data)
    return { id, ...data }
  }

  async updateProcessedAt(id: string): Promise<boolean> {
    const timestamp = new Date().toISOString()
    this.processedTimestamps.set(id, timestamp)
    console.log(`⏰ MockFeedbackRepository.updateProcessedAt(${id}): ${timestamp}`)
    return true
  }

  // Helper methods for assertions
  getUpdatedFeedback(id: string) {
    return this.updatedFeedback.get(id)
  }

  getProcessedTimestamp(id: string) {
    return this.processedTimestamps.get(id)
  }

  getAllUpdates() {
    return Object.fromEntries(this.updatedFeedback)
  }
}

// Mock Product Area Repository - consistent with other tests
class MockProductAreaRepository {
  private productAreas = new Map([
    ['product-123', [
      {
        id: 'area-ui-ux',
        name: 'User Interface & Experience',
        description: 'Frontend user interface, user experience, and design-related feedback',
        keywords: ['ui', 'ux', 'interface', 'design', 'layout', 'navigation', 'visual', 'usability'],
        product_id: 'product-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user',
        parent_area_id: null,
        metadata: {}
      },
      {
        id: 'area-performance',
        name: 'Performance & Speed',
        description: 'Application performance, loading times, and speed-related issues',
        keywords: ['slow', 'fast', 'performance', 'loading', 'speed', 'lag', 'timeout', 'responsive'],
        product_id: 'product-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user',
        parent_area_id: null,
        metadata: {}
      },
      {
        id: 'area-authentication',
        name: 'Authentication & Security',
        description: 'Login, signup, password management, and security features',
        keywords: ['login', 'password', 'signup', 'auth', 'security', 'account', 'verification'],
        product_id: 'product-123',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        user_id: 'test-user',
        parent_area_id: null,
        metadata: {}
      }
    ]]
  ])

  async findByProductId(productId: string) {
    console.log(`🔍 MockProductAreaRepository.findByProductId(${productId})`)
    const areas = this.productAreas.get(productId) || []
    console.log(`✅ Found ${areas.length} product areas for ${productId}`)
    return areas
  }

  async getProductAreasForMatching(productId: string) {
    console.log(`🔍 MockProductAreaRepository.getProductAreasForMatching(${productId})`)
    const areas = this.productAreas.get(productId) || []
    console.log(`✅ Found ${areas.length} product areas for ${productId}`)
    return areas.map(area => ({
      id: area.id,
      name: area.name,
      description: area.description,
      keywords: area.keywords
    }))
  }

  async findById(id: string) {
    // Find area across all products
    for (const areas of this.productAreas.values()) {
      const area = areas.find(a => a.id === id)
      if (area) return area
    }
    return null
  }
}

// Mock Event Emitter - consistent with other tests
class MockEventEmitter implements PipelineEventEmitter {
  private events: Array<{ event: string; data: any; timestamp: number }> = []

  emit(event: any, data: any): void {
    const eventRecord = {
      event,
      data,
      timestamp: Date.now()
    }
    this.events.push(eventRecord)
    
    console.log(`📢 Event: ${event}`)
    if (data.feedbackCount) {
      console.log(`   └─ FeedbackCount: ${data.feedbackCount}`)
    }
    if (data.enrichedCount || data.enrichedFeedbackCount) {
      console.log(`   └─ EnrichedCount: ${data.enrichedCount || data.enrichedFeedbackCount}`)
    }
    if (data.clusterCount) {
      console.log(`   └─ ClusterCount: ${data.clusterCount}`)
    }
    if (data.insightCount) {
      console.log(`   └─ InsightCount: ${data.insightCount}`)
    }
    if (data.duration !== undefined) {
      console.log(`   └─ Duration: ${data.duration}ms`)
    }
    if (data.title) {
      console.log(`   └─ Title: ${data.title}`)
    }
  }

  getEvents() {
    return this.events
  }

  getEventsByType(eventType: string) {
    return this.events.filter(e => e.event === eventType)
  }

  clearEvents() {
    this.events = []
  }

  printEventSummary() {
    console.log('\n📊 Event Summary:')
    console.log('=' .repeat(50))
    
    const eventCounts = this.events.reduce((acc, event) => {
      acc[event.event] = (acc[event.event] || 0) + 1
      return acc
    }, {} as Record<string, number>)
    
    Object.entries(eventCounts).forEach(([event, count]) => {
      console.log(`  ${event}: ${count}`)
    })
    
    console.log(`  Total events: ${this.events.length}`)
  }
}

// Test Data - consistent with other tests
const testFeedbackEntries: FeedbackEntry[] = [
  {
    id: 'feedback-001',
    text: 'The login page is really confusing and hard to navigate. The buttons are too small and the layout is cluttered.',
    userId: 'user-alice',
    timestamp: new Date('2024-11-10T10:00:00Z'),
    source: 'survey',
    companyId: 'company-abc',
    productId: 'product-123',
    tags: ['ui', 'login'],
    userMetadata: {
      plan: 'pro',
      segment: 'enterprise',
      teamSize: 50,
      usage: 'high'
    }
  },
  {
    id: 'feedback-002',
    text: 'App is extremely slow when loading the dashboard. Takes over 10 seconds every time!',
    userId: 'user-bob',
    timestamp: new Date('2024-11-10T11:30:00Z'),
    source: 'support',
    companyId: 'company-abc',
    productId: 'product-123',
    tags: ['performance', 'dashboard']
  },
  {
    id: 'feedback-003',
    text: 'Authentication keeps timing out during peak hours. Very frustrating!',
    userId: 'user-charlie',
    timestamp: new Date('2024-11-10T14:15:00Z'),
    source: 'slack',
    companyId: 'company-abc',
    productId: 'product-123',
    tags: ['auth', 'performance']
  },
  {
    id: 'feedback-004',
    text: 'Would be great to have more customization options in the dashboard',
    userId: 'user-diana',
    timestamp: new Date('2024-11-10T16:45:00Z'),
    source: 'interview',
    companyId: 'company-abc',
    productId: 'product-123',
    userMetadata: {
      plan: 'enterprise',
      segment: 'enterprise',
      teamSize: 200,
      usage: 'high'
    }
  }
]

// Test Assertions - consistent with other tests
class TestAssertions {
  static assertTrue(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`)
    }
    console.log(`✅ ${message}`)
  }

  static assertEventSequence(events: any[], expectedSequence: string[]) {
    const eventTypes = events.map(e => e.event)
    const sequenceMatches = expectedSequence.every((expectedEvent) => 
      eventTypes.includes(expectedEvent)
    )
    
    this.assertTrue(sequenceMatches, `Event sequence contains expected events: ${expectedSequence.join(', ')}`)
  }

  static assertPipelineOutput(result: any, input: PipelineInput) {
    // Basic output structure assertions
    this.assertTrue(typeof result === 'object', 'Result is an object')
    this.assertTrue(Array.isArray(result.insights), 'Result has insights array')
    this.assertTrue(typeof result.summary === 'object', 'Result has summary object')
    
    // Summary validation
    this.assertTrue(result.summary.feedbackCount === input.feedbackList.length, `Correct feedback count: ${result.summary.feedbackCount}`)
    this.assertTrue(result.summary.enrichedCount > 0, `Enriched entries created: ${result.summary.enrichedCount}`)
    this.assertTrue(result.summary.clusterCount > 0, `Clusters created: ${result.summary.clusterCount}`)
    this.assertTrue(result.summary.insightCount > 0, `Insights generated: ${result.summary.insightCount}`)
    this.assertTrue(result.summary.processingTimeMs > 0, `Processing time recorded: ${result.summary.processingTimeMs}ms`)

    console.log(`   └─ Pipeline Summary:`)
    console.log(`      - Feedback: ${result.summary.feedbackCount}`)
    console.log(`      - Enriched: ${result.summary.enrichedCount}`)
    console.log(`      - Clusters: ${result.summary.clusterCount}`)
    console.log(`      - Insights: ${result.summary.insightCount}`)
    console.log(`      - Duration: ${result.summary.processingTimeMs}ms`)
  }
}

// Main Test Function
async function runEndToEndTest() {
  console.log('🧪 Starting FeedbackPipelineOrchestrator End-to-End Test')
  console.log('=' .repeat(60))

  // Check OpenAI API key
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY environment variable is not set')
    console.log('Please set your OpenAI API key:')
    console.log('export OPENAI_API_KEY="your-api-key-here"')
    process.exit(1)
  }
  console.log('✅ OpenAI API key found')

  // Initialize mocks
  const mockFeedbackRepo = new MockFeedbackRepository()
  const mockProductAreaRepo = new MockProductAreaRepository()
  const mockEventEmitter = new MockEventEmitter()

  // Create orchestrator instance
  console.log('\n🏗️  Creating FeedbackPipelineOrchestrator instance...')
  
  const pipelineId = `test-pipeline-${Date.now()}`
  const orchestrator = new FeedbackPipelineOrchestrator(
    mockFeedbackRepo as any,
    mockProductAreaRepo as any,
    mockEventEmitter,
    pipelineId
  )
  console.log('✅ Orchestrator created successfully')

  try {
    // Create test input
    const input: PipelineInput = {
      productId: 'product-123',
      feedbackList: testFeedbackEntries
    }

    // Execute pipeline
    console.log('\n🚀 Starting complete pipeline execution...')
    console.log(`Processing ${input.feedbackList.length} feedback entries for product ${input.productId}`)
    
    const startTime = Date.now()
    const result = await orchestrator.processFeedback(input)
    const totalDuration = Date.now() - startTime
    
    console.log('\n🎉 Pipeline execution completed successfully!')
    console.log(`⏱️  Total duration: ${totalDuration}ms`)

    // Validate results
    console.log('\n🔍 Validating orchestration results...')
    TestAssertions.assertPipelineOutput(result, input)

    // Validate events
    console.log('\n📢 Validating event orchestration...')
    const events = mockEventEmitter.getEvents()
    TestAssertions.assertTrue(events.length > 0, 'Events were emitted during orchestration')
    
    const expectedEventTypes = [
      'pipeline_started',
      'enrichment_started',
      'enrichment_complete', 
      'clustering_started',
      'clustering_complete',
      'insight_generation_started',
      'insight_generation_complete',
      'pipeline_complete'
    ]
    TestAssertions.assertEventSequence(events, expectedEventTypes)

    // Validate repository interactions
    console.log('\n💾 Validating repository orchestration...')
    const allUpdates = mockFeedbackRepo.getAllUpdates()
    TestAssertions.assertTrue(Object.keys(allUpdates).length === input.feedbackList.length, 'All feedback entries were processed through repositories')

    // Print detailed results
    console.log('\n📋 Orchestration Results:')
    console.log('=' .repeat(50))
    
    // Show insights generated
    console.log(`\n💡 Generated Insights (${result.insights.length}):`)
    result.insights.forEach((insight, idx) => {
      console.log(`  ${idx + 1}. "${insight.title}"`)
      console.log(`     Cluster: ${insight.clusterId}`)
      console.log(`     Users Affected: ${insight.impact?.usersAffected || 'N/A'}`)
      console.log(`     Recommendations: ${insight.recommendations.length}`)
      console.log(`     Confidence: ${(insight.confidence * 100).toFixed(1)}%`)
    })

    // Print event summary
    mockEventEmitter.printEventSummary()

    // Print orchestration performance metrics
    console.log('\n⚡ Orchestration Performance:')
    console.log('=' .repeat(50))
    console.log(`  Total pipeline time: ${totalDuration}ms`)
    console.log(`  Service coordination: ${result.summary.processingTimeMs}ms`)
    console.log(`  Average per feedback: ${Math.round(totalDuration / input.feedbackList.length)}ms`)
    console.log(`  End-to-end throughput: ${((input.feedbackList.length / totalDuration) * 1000).toFixed(2)} entries/sec`)
    
    // Service breakdown from events
    const enrichmentEvents = events.filter(e => e.event.includes('enrichment'))
    const clusteringEvents = events.filter(e => e.event.includes('clustering'))
    const insightEvents = events.filter(e => e.event.includes('insight'))
    
    console.log(`  Service events: Enrichment(${enrichmentEvents.length}), Clustering(${clusteringEvents.length}), Insights(${insightEvents.length})`)

    console.log('\n🎉 All orchestration tests passed! FeedbackPipelineOrchestrator is working correctly.')
    console.log('✅ Services coordinated properly')
    console.log('✅ Event emission orchestrated correctly') 
    console.log('✅ Repository dependencies injected successfully')
    console.log('✅ Data flow between services validated')

  } catch (error) {
    console.error('\n❌ Orchestration test failed:', error)
    
    // Print debug information
    console.log('\n🔍 Debug Information:')
    console.log('Events emitted:', mockEventEmitter.getEvents().length)
    mockEventEmitter.printEventSummary()
    
    console.log('\nRepository updates:', Object.keys(mockFeedbackRepo.getAllUpdates()).length)
    
    throw error
  }
}

// Export for use in other files
export { 
  runEndToEndTest,
  MockFeedbackRepository,
  MockProductAreaRepository,
  MockEventEmitter,
  testFeedbackEntries
}

// Run test if this file is executed directly
if (require.main === module) {
  runEndToEndTest()
    .then(() => {
      console.log('\n✅ Orchestrator end-to-end test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Orchestrator end-to-end test failed:', error)
      process.exit(1)
    })
}
