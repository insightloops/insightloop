/**
 * Test script for FeedbackPipelineOrchestrator
 * 
 * Tests the complete pipeline orchestration with mock data
 */

import { FeedbackPipelineOrchestrator, PipelineInput } from './FeedbackPipelineOrchestrator'
import { FeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'
import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

// Mock event emitter for testing
const createMockEventEmitter = (): PipelineEventEmitter => {
  const emitter = {
    emit: (event: string, data: any) => {
      console.log(`📊 Event: ${event}`, JSON.stringify(data, null, 2))
    }
  } as any

  return emitter
}

// Mock Supabase client (since we're just testing the orchestration)
const createMockSupabase = () => {
  // For this test, we'll need actual Supabase since the services expect it
  // You can replace with actual credentials or mock if needed
  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321',
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'mock-key'
  )
}

// Create test data
const createTestFeedback = (): FeedbackEntry[] => [
  {
    id: 'feedback-001',
    text: 'The login process is extremely slow and takes forever to load',
    userId: 'user-001',
    timestamp: new Date('2024-01-15T10:00:00Z'),
    source: 'support',
    companyId: 'company-001',
    productId: 'product-001',
    userMetadata: {
      plan: 'pro',
      segment: 'SMB',
      teamSize: 25,
      usage: 'high'
    }
  },
  {
    id: 'feedback-002',
    text: 'Authentication keeps timing out during peak hours',
    userId: 'user-002',
    timestamp: new Date('2024-01-15T14:30:00Z'),
    source: 'survey',
    companyId: 'company-001',
    productId: 'product-001',
    userMetadata: {
      plan: 'enterprise',
      segment: 'Enterprise',
      teamSize: 100,
      usage: 'high'
    }
  },
  {
    id: 'feedback-003',
    text: 'Love the new dashboard design, very clean and intuitive',
    userId: 'user-003',
    timestamp: new Date('2024-01-16T09:15:00Z'),
    source: 'interview',
    companyId: 'company-001',
    productId: 'product-001',
    userMetadata: {
      plan: 'enterprise',
      segment: 'Enterprise',
      teamSize: 200,
      usage: 'medium'
    }
  },
  {
    id: 'feedback-004',
    text: 'Would be great to have more customization options in the dashboard',
    userId: 'user-004',
    timestamp: new Date('2024-01-16T16:45:00Z'),
    source: 'slack',
    companyId: 'company-001',
    productId: 'product-001',
    userMetadata: {
      plan: 'enterprise',
      segment: 'Enterprise',
      teamSize: 150,
      usage: 'high'
    }
  }
]

async function testPipelineOrchestrator() {
  console.log('🧪 Testing FeedbackPipelineOrchestrator\n')

  try {
    // Create mock services
    const supabase = createMockSupabase()
    const eventEmitter = createMockEventEmitter()
    const pipelineId = `test-pipeline-${Date.now()}`

    // Create repositories
    const { FeedbackRepository } = await import('@/lib/repositories/FeedbackRepository')
    const { ProductAreaRepository } = await import('@/lib/repositories/ProductAreaRepository')
    const feedbackRepository = new FeedbackRepository(supabase)
    const productAreaRepository = new ProductAreaRepository(supabase)

    // Create orchestrator
    const orchestrator = new FeedbackPipelineOrchestrator(
      feedbackRepository,
      productAreaRepository,
      eventEmitter,
      pipelineId
    )

    // Create test input
    const input: PipelineInput = {
      productId: 'product-001',
      feedbackList: createTestFeedback()
    }

    console.log(`📝 Processing ${input.feedbackList.length} feedback entries for product ${input.productId}...\n`)

    // Run the pipeline
    const startTime = Date.now()
    const result = await orchestrator.processFeedback(input)
    const duration = Date.now() - startTime

    console.log(`\n✅ Pipeline completed successfully in ${duration}ms`)
    console.log(`📊 Results:`)
    console.log(`   - Feedback entries: ${result.summary.feedbackCount}`)
    console.log(`   - Enriched entries: ${result.summary.enrichedCount}`)
    console.log(`   - Clusters created: ${result.summary.clusterCount}`)
    console.log(`   - Insights generated: ${result.summary.insightCount}`)
    console.log(`   - Processing time: ${result.summary.processingTimeMs}ms`)

    if (result.insights.length > 0) {
      console.log(`\n💡 Generated Insights:`)
      result.insights.forEach((insight, idx) => {
        console.log(`   ${idx + 1}. "${insight.title}"`)
        console.log(`      Cluster: ${insight.clusterId}`)
        console.log(`      Confidence: ${(insight.confidence * 100).toFixed(1)}%`)
      })
    }

    console.log(`\n🎉 FeedbackPipelineOrchestrator test completed successfully!`)

  } catch (error) {
    console.error('❌ Test failed:', error)
    if (error instanceof Error) {
      console.error('Stack trace:', error.stack)
    }
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  testPipelineOrchestrator()
    .then(() => {
      console.log('\n✅ Test completed successfully')
      process.exit(0)
    })
    .catch((error) => {
      console.error('\n❌ Test failed:', error)
      process.exit(1)
    })
}

export { testPipelineOrchestrator }
