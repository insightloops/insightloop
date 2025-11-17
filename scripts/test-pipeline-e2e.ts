/**
 * End-to-End Pipeline Test Script
 * 
 * Tests the complete feedback pipeline using API endpoints:
 * 1. Setup: Create company, product, product areas, features
 * 2. Execute: Upload feedback file and run pipeline  
 * 3. Assert: Verify pipeline executed correctly
 * 
 * Usage: tsx scripts/test-pipeline-e2e.ts
 */

import { readFileSync } from 'fs'
import { join } from 'path'

// Configuration
const CONFIG = {
  baseUrl: 'http://localhost:3001',
  companyName: 'Samba Test Corp',
  industry: 'SaaS',
  companySize: 'medium',
  productName: 'Samba Platform',
  productDescription: 'Cloud-native collaboration platform',
  feedbackFile: 'samba-feedback.csv',
  expectedMinInsights: 3,
}

// Colors
const c = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
}

const log = (msg: string, color = c.reset) => console.log(`${color}${msg}${c.reset}`)
const success = (msg: string) => log(`✓ ${msg}`, c.green)
const error = (msg: string) => log(`✗ ${msg}`, c.red)
const info = (msg: string) => log(`ℹ ${msg}`, c.blue)
const warn = (msg: string) => log(`⚠ ${msg}`, c.yellow)
const section = (title: string) => {
  log(`\n${'='.repeat(70)}`, c.cyan + c.bright)
  log(title, c.cyan + c.bright)
  log('='.repeat(70), c.cyan + c.bright)
}

// Test state
const state = {
  companyId: '',
  productId: '',
  pipelineId: '',
  startTime: 0,
  endTime: 0,
  errors: [] as string[],
}

// Mock auth (replace with real auth if needed)
const headers = {
  'Content-Type': 'application/json',
}

/** Step 1: Create company */
async function createCompany() {
  section('Step 1: Creating Company')
  
  info(`Creating: ${CONFIG.companyName}`)
  
  const res = await fetch(`${CONFIG.baseUrl}/api/companies`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: CONFIG.companyName,
      industry: CONFIG.industry,
      size: CONFIG.companySize,
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)

  const { company } = await res.json()
  state.companyId = company.id
  
  success(`Created: ${company.name}`)
  info(`  ID: ${company.id}`)
}

/** Step 2: Create product */
async function createProduct() {
  section('Step 2: Creating Product')
  
  info(`Creating: ${CONFIG.productName}`)
  
  const res = await fetch(`${CONFIG.baseUrl}/api/companies/${state.companyId}/products`, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      name: CONFIG.productName,
      description: CONFIG.productDescription,
    }),
  })

  if (!res.ok) throw new Error(`API error ${res.status}: ${await res.text()}`)

  const product = await res.json()
  state.productId = product.id
  
  success(`Created: ${product.name}`)
  info(`  ID: ${product.id}`)
}

/** Step 3: Execute pipeline */
async function executePipeline() {
  section('Step 3: Executing Pipeline')
  
  // Read feedback file
  const feedbackPath = join(process.cwd(), CONFIG.feedbackFile)
  info(`Reading: ${CONFIG.feedbackFile}`)
  
  const feedbackContent = readFileSync(feedbackPath, 'utf-8')
  const lines = feedbackContent.split('\n').filter(l => l.trim())
  const count = lines.length - 1
  
  info(`Found ${count} feedback entries`)

  // Create form data
  const formData = new FormData()
  const blob = new Blob([feedbackContent], { type: 'text/csv' })
  formData.append('file', blob, CONFIG.feedbackFile)
  formData.append('companyId', state.companyId)
  formData.append('productId', state.productId)
  formData.append('source', 'csv')

  // Execute pipeline
  const apiUrl = `${CONFIG.baseUrl}/api/pipeline/execute`
  info(`Calling: ${apiUrl}`)
  
  state.startTime = Date.now()
  
  const res = await fetch(apiUrl, {
    method: 'POST',
    body: formData,
  })

  if (!res.ok) throw new Error(`Pipeline error ${res.status}: ${await res.text()}`)

  // Process SSE stream
  const reader = res.body?.getReader()
  if (!reader) throw new Error('No response body')

  const decoder = new TextDecoder()
  let buffer = ''
  let currentStage = ''
  const stages = new Set<string>()
  let insightCount = 0
  let completed = false

  success('Pipeline started!\n')

  while (true) {
    const { done, value } = await reader.read()
    if (done) break

    buffer += decoder.decode(value, { stream: true })
    const lines = buffer.split('\n')
    buffer = lines.pop() || ''

    for (const line of lines) {
      if (!line.startsWith('data: ')) continue

      const event = JSON.parse(line.slice(6))
      
      switch (event.type) {
        case 'pipeline_started':
          state.pipelineId = event.pipelineId
          log(`\n► Pipeline: ${event.pipelineId}`, c.cyan)
          info(`  Processing ${event.feedbackCount} items`)
          break

        case 'stage_progress':
          if (event.stage !== currentStage) {
            stages.add(event.stage)
            log(`\n► Stage: ${event.stage}`, c.magenta + c.bright)
            currentStage = event.stage
          }
          const pct = Math.round(event.progress * 100)
          process.stdout.write(`\r  ${pct}% - ${event.details}${' '.repeat(20)}`)
          
          if (event.errors?.length) {
            warn(`\n  Errors: ${event.errors.join(', ')}`)
          }
          break

        case 'stage_complete':
          stages.add(event.stage)
          success(`\n  ✓ ${event.details}`)
          break

        case 'pipeline_complete':
          state.endTime = Date.now()
          completed = true
          const r = event.result
          
          log('\n', c.reset)
          success('Pipeline completed!')
          log('\n📊 Results:', c.cyan + c.bright)
          log(`  Raw feedback:      ${r.rawFeedbackCount}`)
          log(`  Enriched:          ${r.enrichedFeedbackCount}`)
          log(`  Clusters:          ${r.clusterCount}`)
          log(`  Insights:          ${r.insightCount}`, c.green + c.bright)
          log(`  Time:              ${r.processingTimeMs}ms`)
          
          insightCount = r.insightCount
          break

        case 'pipeline_error':
          state.endTime = Date.now()
          throw new Error(`Pipeline failed: ${event.error}`)
      }
    }
  }

  if (!completed) throw new Error('Pipeline incomplete')

  return { stages: Array.from(stages), insightCount }
}

/** Step 4: Verify results */
async function verify(results: { stages: string[], insightCount: number }) {
  section('Step 4: Verifying Results')
  
  let passed = 0
  let failed = 0
  
  // Check stages
  info('Checking stages...')
  const expected = ['validation', 'enrichment', 'clustering', 'insight_generation']
  
  for (const stage of expected) {
    if (results.stages.some(s => s.toLowerCase().includes(stage))) {
      success(`  ${stage}`)
      passed++
    } else {
      error(`  Missing: ${stage}`)
      state.errors.push(`Missing stage: ${stage}`)
      failed++
    }
  }
  
  // Check insights
  info('\nChecking insights...')
  if (results.insightCount >= CONFIG.expectedMinInsights) {
    success(`  Generated ${results.insightCount} (min: ${CONFIG.expectedMinInsights})`)
    passed++
  } else {
    error(`  Only ${results.insightCount}, expected >= ${CONFIG.expectedMinInsights}`)
    state.errors.push(`Insufficient insights`)
    failed++
  }
  
  // Check timing
  info('\nChecking completion...')
  if (state.endTime > state.startTime) {
    const dur = ((state.endTime - state.startTime) / 1000).toFixed(2)
    success(`  Completed in ${dur}s`)
    passed++
  } else {
    error(`  Timing issue`)
    failed++
  }
  
  return { passed, failed }
}

/** Main */
async function main() {
  const start = Date.now()
  
  log('\n╔══════════════════════════════════════════════════════════╗', c.bright + c.cyan)
  log('║   End-to-End Pipeline Test                               ║', c.bright + c.cyan)
  log('╚══════════════════════════════════════════════════════════╝', c.bright + c.cyan)

  try {
    await createCompany()
    await createProduct()
    const results = await executePipeline()
    const { passed, failed } = await verify(results)

    // Summary
    section('Summary')
    const duration = ((Date.now() - start) / 1000).toFixed(2)
    const pipelineDur = ((state.endTime - state.startTime) / 1000).toFixed(2)
    
    info(`Total: ${duration}s`)
    info(`Pipeline: ${pipelineDur}s`)
    log(`\n📝 Results:`, c.cyan + c.bright)
    log(`  Passed: ${passed}`, c.green)
    log(`  Failed: ${failed}`, c.red)
    
    if (state.errors.length > 0) {
      warn(`\n⚠️  Issues (${state.errors.length}):`)
      state.errors.forEach(e => warn(`  - ${e}`))
    }
    
    log('\n📋 IDs:', c.cyan)
    log(`  Company:  ${state.companyId}`)
    log(`  Product:  ${state.productId}`)
    log(`  Pipeline: ${state.pipelineId}`)
    
    if (failed === 0 && state.errors.length === 0) {
      success('\n🎉 ALL TESTS PASSED! 🎉')
      process.exit(0)
    } else {
      error('\n❌ SOME TESTS FAILED')
      process.exit(1)
    }
  } catch (err) {
    error(`\n💥 TEST FAILED: ${err}`)
    console.error(err)
    process.exit(1)
  }
}

main()
