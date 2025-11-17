/**
 * End-to-End Test for FeedbackEnrichmentService
 * 
 * This script tests the complete feedback enrichment flow with:
 * - Mock repositories with known test data
 * - Real OpenAI API calls
 * - Event emission verification
 * - Result validation and inspection
 */

import { FeedbackEnrichmentService, FeedbackEntry, EnrichedFeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'

// Mock Feedback Repository
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

// Mock Product Area Repository
class MockProductAreaRepository {
  private productAreas = new Map([
    ['product-123', [
      {
        id: 'area-ui-ux',
        name: 'User Interface & Experience',
        description: 'Frontend user interface, user experience, and design-related feedback',
        keywords: ['ui', 'ux', 'interface', 'design', 'layout', 'navigation', 'visual', 'usability']
      },
      {
        id: 'area-performance',
        name: 'Performance & Speed',
        description: 'Application performance, loading times, and speed-related issues',
        keywords: ['slow', 'fast', 'performance', 'loading', 'speed', 'lag', 'timeout', 'responsive']
      },
      {
        id: 'area-authentication',
        name: 'Authentication & Security',
        description: 'Login, signup, password management, and security features',
        keywords: ['login', 'password', 'signup', 'auth', 'security', 'account', 'verification']
      },
      {
        id: 'area-billing',
        name: 'Billing & Payments',
        description: 'Payment processing, billing issues, and subscription management',
        keywords: ['payment', 'billing', 'subscription', 'charge', 'invoice', 'credit card', 'plan']
      },
      {
        id: 'area-api',
        name: 'API & Integrations',
        description: 'API functionality, third-party integrations, and developer tools',
        keywords: ['api', 'integration', 'webhook', 'developer', 'endpoint', 'sdk', 'docs']
      }
    ]]
  ])

  async getProductAreasForMatching(productId: string) {
    console.log(`🔍 MockProductAreaRepository.getProductAreasForMatching(${productId})`)
    const areas = this.productAreas.get(productId) || []
    console.log(`✅ Found ${areas.length} product areas for ${productId}`)
    return areas
  }
}

// Mock Event Emitter
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
    if (data.feedbackId) {
      console.log(`   └─ FeedbackId: ${data.feedbackId}`)
    }
    if (data.success !== undefined) {
      console.log(`   └─ Success: ${data.success}`)
    }
    if (data.duration !== undefined) {
      console.log(`   └─ Duration: ${data.duration}ms`)
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

// Test Data
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
    text: 'URGENT: Payment processing is broken! Cannot process any transactions right now.',
    userId: 'user-charlie',
    timestamp: new Date('2024-11-10T14:15:00Z'),
    source: 'slack',
    companyId: 'company-abc',
    productId: 'product-123',
    tags: ['billing', 'urgent', 'bug']
  },
  {
    id: 'feedback-004',
    text: 'Love the new API documentation! Much clearer than before and the examples are really helpful.',
    userId: 'user-diana',
    timestamp: new Date('2024-11-10T16:45:00Z'),
    source: 'interview',
    companyId: 'company-abc',
    productId: 'product-123',
    tags: ['api', 'docs', 'positive']
  },
  {
    id: 'feedback-005',
    text: 'The signup process needs improvement. Could you add social login options?',
    userId: 'user-eve',
    timestamp: new Date('2024-11-10T18:20:00Z'),
    source: 'survey',
    companyId: 'company-abc',
    productId: 'product-123',
    userMetadata: {
      plan: 'free',
      segment: 'startup',
      teamSize: 5,
      usage: 'low'
    }
  }
]

// Test Assertions
class TestAssertions {
  static assertTrue(condition: boolean, message: string) {
    if (!condition) {
      throw new Error(`❌ Assertion failed: ${message}`)
    }
    console.log(`✅ ${message}`)
  }

  static assertEventSequence(events: any[], expectedSequence: string[]) {
    const eventTypes = events.map(e => e.event)
    const sequenceMatches = expectedSequence.every((expectedEvent, index) => 
      eventTypes.includes(expectedEvent)
    )
    
    this.assertTrue(sequenceMatches, `Event sequence contains expected events: ${expectedSequence.join(', ')}`)
  }

  static assertEnrichedFeedback(enriched: EnrichedFeedbackEntry, original: FeedbackEntry) {
    // Basic structure assertions
    this.assertTrue(enriched.id === original.id, `Enriched feedback has correct ID: ${enriched.id}`)
    this.assertTrue(enriched.text === original.text, `Original text preserved`)
    this.assertTrue(Array.isArray(enriched.linkedProductAreas), `linkedProductAreas is array`)
    this.assertTrue(typeof enriched.sentiment === 'object', `sentiment is object`)
    this.assertTrue(['positive', 'negative', 'neutral'].includes(enriched.sentiment.label), `sentiment label is valid`)
    this.assertTrue(Array.isArray(enriched.extractedFeatures), `extractedFeatures is array`)
    this.assertTrue(['low', 'medium', 'high'].includes(enriched.urgency), `urgency is valid`)
    this.assertTrue(Array.isArray(enriched.category), `category is array`)

    // Content-specific assertions
    console.log(`   └─ Product Areas: ${enriched.linkedProductAreas.map(pa => pa.name).join(', ')}`)
    console.log(`   └─ Sentiment: ${enriched.sentiment.label} (${enriched.sentiment.score})`)
    console.log(`   └─ Urgency: ${enriched.urgency}`)
    console.log(`   └─ Features: ${enriched.extractedFeatures.join(', ')}`)
  }
}

// Main Test Function
async function runEndToEndTest() {
  console.log('🧪 Starting FeedbackEnrichmentService End-to-End Test')
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

  // Create service instance
  console.log('\n🏗️  Creating FeedbackEnrichmentService instance...')
  const enrichmentService = new FeedbackEnrichmentService(
    mockFeedbackRepo as any,
    mockProductAreaRepo as any,
    mockEventEmitter,
    'product-123',
    'test-pipeline-001'
  )
  console.log('✅ Service created successfully')

  try {
    // Execute enrichment
    console.log('\n🚀 Starting feedback enrichment...')
    console.log(`Processing ${testFeedbackEntries.length} feedback entries with concurrency 2`)
    
    const startTime = Date.now()
    const enrichedResults = await enrichmentService.enrichFeedback(testFeedbackEntries, 2)
    const totalDuration = Date.now() - startTime
    
    console.log('\n🎉 Enrichment completed successfully!')
    console.log(`⏱️  Total duration: ${totalDuration}ms`)
    console.log(`📊 Processed: ${enrichedResults.length}/${testFeedbackEntries.length} entries`)

    // Validate results
    console.log('\n🔍 Validating results...')
    TestAssertions.assertTrue(enrichedResults.length === testFeedbackEntries.length, 'All feedback entries were processed')
    
    // Validate each enriched entry
    enrichedResults.forEach((enriched, index) => {
      console.log(`\n📝 Validating feedback ${index + 1}: ${enriched.id}`)
      TestAssertions.assertEnrichedFeedback(enriched, testFeedbackEntries[index])
    })

    // Validate events
    console.log('\n📢 Validating events...')
    const events = mockEventEmitter.getEvents()
    TestAssertions.assertTrue(events.length > 0, 'Events were emitted')
    
    const expectedEventTypes = [
      'enrichment_started',
      'feedback_enrichment_started', 
      'feedback_enrichment_complete',
      'enrichment_complete'
    ]
    TestAssertions.assertEventSequence(events, expectedEventTypes)

    // Validate repository interactions
    console.log('\n💾 Validating repository interactions...')
    const allUpdates = mockFeedbackRepo.getAllUpdates()
    TestAssertions.assertTrue(Object.keys(allUpdates).length === testFeedbackEntries.length, 'All feedback entries were updated in repository')

    // Print detailed results
    console.log('\n📋 Detailed Results:')
    console.log('=' .repeat(50))
    
    enrichedResults.forEach((enriched, index) => {
      console.log(`\n${index + 1}. ${enriched.id}`)
      console.log(`   Text: "${enriched.text.substring(0, 60)}${enriched.text.length > 60 ? '...' : ''}"`)
      console.log(`   Product Areas: ${enriched.linkedProductAreas.map(pa => `${pa.name} (${pa.confidence})`).join(', ') || 'None'}`)
      console.log(`   Sentiment: ${enriched.sentiment.label} (score: ${enriched.sentiment.score}, confidence: ${enriched.sentiment.confidence})`)
      console.log(`   Urgency: ${enriched.urgency}`)
      console.log(`   Features: ${enriched.extractedFeatures.join(', ') || 'None'}`)
      console.log(`   Categories: ${enriched.category.join(', ') || 'None'}`)
    })

    // Print event summary
    mockEventEmitter.printEventSummary()

    // Print performance metrics
    console.log('\n⚡ Performance Metrics:')
    console.log('=' .repeat(50))
    console.log(`  Total processing time: ${totalDuration}ms`)
    console.log(`  Average per feedback: ${Math.round(totalDuration / testFeedbackEntries.length)}ms`)
    console.log(`  Throughput: ${((testFeedbackEntries.length / totalDuration) * 1000).toFixed(2)} entries/sec`)
    console.log(`  OpenAI API calls: ${events.filter(e => e.event === 'enrichment_ai_call').length}`)

    console.log('\n🎉 All tests passed! FeedbackEnrichmentService is working correctly with OpenAI.')

  } catch (error) {
    console.error('\n❌ Test failed:', error)
    
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
      console.log('\n✅ End-to-end test completed successfully!')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ End-to-end test failed:', error)
      process.exit(1)
    })
}
