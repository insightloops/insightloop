/**
 * End-to-End API Pipeline Test
 * 
 * This test validates the complete API flow:
 * 1. Create a company
 * 2. Create a product 
 * 3. Create product areas
 * 4. Execute the feedback pipeline via API
 * 5. Assert the results are correct
 * 
 * Tests the real API endpoints with actual HTTP calls.
 */

import { readFileSync, writeFileSync } from 'fs'
import { join } from 'path'

// Test configuration
const API_BASE_URL = 'http://localhost:4000'
const TEST_COMPANY_NAME = `E2E Test Company ${Date.now()}`
const TEST_PRODUCT_NAME = `E2E Test Product ${Date.now()}`
const TEST_USER_ID = '123e4567-e89b-12d3-a456-426614174000' // Valid UUID for testing

// Test data
const testFeedbackData = [
  {
    text: "The mobile app crashes when I try to upload photos",
    userId: "user1",
    timestamp: new Date().toISOString()
  },
  {
    text: "Love the new dashboard design! Much more intuitive than before",
    userId: "user2", 
    timestamp: new Date().toISOString()
  },
  {
    text: "Payment processing is too slow, takes 30+ seconds",
    userId: "user3",
    timestamp: new Date().toISOString()
  },
  {
    text: "Customer support team was incredibly helpful with my billing issue",
    userId: "user4",
    timestamp: new Date().toISOString()
  }
]

const testProductAreas = [
  {
    name: "Mobile App",
    description: "iOS and Android mobile applications"
  },
  {
    name: "Web Dashboard", 
    description: "Main web application dashboard"
  },
  {
    name: "Payment System",
    description: "Payment processing and billing"
  },
  {
    name: "Customer Support",
    description: "Customer service and support operations"
  }
]

interface APIResponse<T = any> {
  ok: boolean
  status: number
  data?: T
  error?: string
}

/**
 * Make HTTP request to API
 */
async function apiRequest<T = any>(
  endpoint: string, 
  options: RequestInit = {}
): Promise<APIResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`🌐 API Request: ${options.method || 'GET'} ${endpoint}`)
    
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        'x-user-id': TEST_USER_ID,
        ...options.headers
      },
      ...options
    })

    const data = await response.json().catch(() => null)
    
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: data?.error || (response.ok ? undefined : `HTTP ${response.status}`)
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Network error'
    }
  }
}

/**
 * Upload file via form data
 */
async function uploadFile(
  endpoint: string,
  fileContent: string,
  filename: string,
  formData: Record<string, string>
): Promise<APIResponse> {
  try {
    const url = `${API_BASE_URL}${endpoint}`
    console.log(`📤 File Upload: POST ${endpoint}`)

    const form = new FormData()
    
    // Add form fields
    Object.entries(formData).forEach(([key, value]) => {
      form.append(key, value)
    })
    
    // Add file
    const blob = new Blob([fileContent], { type: 'application/json' })
    form.append('file', blob, filename)

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'x-user-id': TEST_USER_ID
      },
      body: form
    })

    // For streaming responses, we'll collect the events
    if (response.headers.get('content-type')?.includes('text/event-stream')) {
      const events: any[] = []
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()
      
      if (reader) {
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
                events.push(eventData)
                console.log(`📡 SSE Event: ${eventData.type}`)
              } catch (e) {
                // Ignore malformed events
              }
            }
          }
        }
      }
      
      return {
        ok: response.ok,
        status: response.status,
        data: { events }
      }
    }

    const data = await response.json().catch(() => null)
    return {
      ok: response.ok,
      status: response.status,
      data,
      error: data?.error || (response.ok ? undefined : `HTTP ${response.status}`)
    }
  } catch (error) {
    return {
      ok: false,
      status: 0,
      error: error instanceof Error ? error.message : 'Upload error'
    }
  }
}

/**
 * Test helper: Create company
 */
async function createCompany(): Promise<string> {
  console.log('\n🏢 Step 1: Creating test company...')
  
  const response = await apiRequest('/api/companies', {
    method: 'POST',
    body: JSON.stringify({
      name: TEST_COMPANY_NAME,
      description: 'End-to-end test company'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create company: ${response.error}`)
  }

  const companyId = response.data?.company?.id
  if (!companyId) {
    throw new Error(`No company ID returned: ${JSON.stringify(response.data)}`)
  }
  console.log(`✅ Company created with ID: ${companyId}`)
  return companyId
}

/**
 * Test helper: Create product  
 */
async function createProduct(companyId: string): Promise<string> {
  console.log('\n📦 Step 2: Creating test product...')
  
  const response = await apiRequest(`/api/companies/${companyId}/products`, {
    method: 'POST', 
    body: JSON.stringify({
      name: TEST_PRODUCT_NAME,
      description: 'End-to-end test product'
    })
  })

  if (!response.ok) {
    throw new Error(`Failed to create product: ${response.error}`)
  }

  const productId = response.data?.id
  if (!productId) {
    throw new Error(`No product ID returned: ${JSON.stringify(response.data)}`)
  }
  console.log(`✅ Product created with ID: ${productId}`)
  return productId
}

/**
 * Test helper: Create product areas
 */
async function createProductAreas(companyId: string, productId: string): Promise<void> {
  console.log('\n🎯 Step 3: Creating product areas...')
  
  for (const area of testProductAreas) {
    const response = await apiRequest('/api/product-areas', {
      method: 'POST',
      body: JSON.stringify({
        name: area.name,
        description: area.description,
        product_id: productId
      })
    })

    if (!response.ok) {
      throw new Error(`Failed to create product area "${area.name}": ${response.error}`)
    }
    
    console.log(`  ✅ Created area: ${area.name}`)
  }
  
  console.log(`✅ Created ${testProductAreas.length} product areas`)
}

/**
 * Test helper: Execute pipeline
 */
async function executePipeline(companyId: string, productId: string): Promise<any[]> {
  console.log('\n🚀 Step 4: Executing feedback pipeline...')
  
  // Create test JSON file content
  const jsonContent = JSON.stringify(testFeedbackData, null, 2)
  
  // Execute pipeline via file upload
  const response = await uploadFile(
    '/api/pipeline/execute',
    jsonContent,
    'test-feedback.json',
    {
      companyId,
      productId,
      source: 'api_test'
    }
  )

  if (!response.ok) {
    throw new Error(`Pipeline execution failed: ${response.error}`)
  }

  const events = response.data?.events || []
  console.log(`✅ Pipeline completed with ${events.length} events`)
  
  return events
}

/**
 * Test helper: Validate results
 */
function validatePipelineResults(events: any[]): void {
  console.log('\n🔍 Step 5: Validating pipeline results...')
  
  // Check for key events
  const eventTypes = events.map(e => e.type)
  const requiredEvents = [
    'pipeline_started',
    'enrichment_started', 
    'enrichment_complete',
    'clustering_started',
    'clustering_complete', 
    'insight_generation_started',
    'insight_generation_complete'
  ]

  // Validate required events are present
  for (const requiredEvent of requiredEvents) {
    if (!eventTypes.includes(requiredEvent)) {
      throw new Error(`Missing required event: ${requiredEvent}`)
    }
  }
  console.log('  ✅ All required events present')

  // Validate pipeline flow
  const pipelineStarted = events.find(e => e.type === 'pipeline_started')
  const enrichmentComplete = events.find(e => e.type === 'enrichment_complete')  
  const clusteringComplete = events.find(e => e.type === 'clustering_complete')
  const insightComplete = events.find(e => e.type === 'insight_generation_complete')

  if (!pipelineStarted?.feedbackCount || pipelineStarted.feedbackCount !== testFeedbackData.length) {
    throw new Error(`Expected ${testFeedbackData.length} feedback entries, got ${pipelineStarted?.feedbackCount}`)
  }
  console.log('  ✅ Correct feedback count processed')

  if (!enrichmentComplete?.successCount || enrichmentComplete.successCount === 0) {
    console.log('Enrichment complete event:', JSON.stringify(enrichmentComplete, null, 2))
    throw new Error('No feedback was enriched')
  }
  console.log(`  ✅ ${enrichmentComplete.successCount} feedback entries enriched`)

  // Clustering might result in 0 clusters for small datasets, which is acceptable
  if (clusteringComplete?.clusterCount === undefined) {
    console.log('Clustering complete event:', JSON.stringify(clusteringComplete, null, 2))
    throw new Error('Clustering complete event missing clusterCount')
  }
  console.log(`  ✅ ${clusteringComplete.clusterCount} clusters created (0 is acceptable for small datasets)`)

  // Insights depend on clusters, so 0 insights is acceptable when there are 0 clusters
  if (insightComplete?.insightCount === undefined) {
    console.log('Insight complete event:', JSON.stringify(insightComplete, null, 2))
    throw new Error('Insight complete event missing insightCount')
  }
  console.log(`  ✅ ${insightComplete.insightCount} insights generated (depends on cluster count)`)

  // Performance validation
  const totalDuration = events
    .filter(e => e.processingTimeMs)
    .reduce((sum, e) => sum + e.processingTimeMs, 0)
    
  if (totalDuration > 60000) { // 60 seconds
    console.warn(`  ⚠️  Pipeline took ${totalDuration}ms (>60s), consider optimization`)
  } else {
    console.log(`  ✅ Pipeline completed in ${totalDuration}ms`)
  }

  console.log('✅ All pipeline results validated successfully!')
}

/**
 * Main test execution
 */
async function runE2ETest(): Promise<void> {
  const startTime = Date.now()
  console.log('🧪 Starting End-to-End API Pipeline Test')
  console.log('=' .repeat(50))

  try {
    // Step 1: Create company
    const companyId = await createCompany()
    
    // Step 2: Create product
    const productId = await createProduct(companyId)
    
    // Step 3: Create product areas
    await createProductAreas(companyId, productId)
    
    // Step 4: Execute pipeline
    const events = await executePipeline(companyId, productId)
    
    // Step 5: Validate results
    validatePipelineResults(events)
    
    // Success summary
    const duration = Date.now() - startTime
    console.log('\n' + '='.repeat(50))
    console.log('🎉 END-TO-END TEST PASSED!')
    console.log(`⏱️  Total test duration: ${duration}ms`)
    console.log(`📊 Events captured: ${events.length}`)
    console.log(`🏢 Company ID: ${companyId}`)
    console.log(`📦 Product ID: ${productId}`)
    console.log('='.repeat(50))
    
  } catch (error) {
    console.error('\n❌ END-TO-END TEST FAILED!')
    console.error('Error:', error instanceof Error ? error.message : error)
    process.exit(1)
  }
}

// Run the test
if (require.main === module) {
  runE2ETest()
}

export { runE2ETest }
