import { NextRequest, NextResponse } from 'next/server'
import { writeFile, mkdir } from 'fs/promises'
import { join } from 'path'
import { existsSync } from 'fs'
import { v4 as uuidv4 } from 'uuid'
import { FeedbackPipelineOrchestrator } from '@/lib/services/FeedbackPipelineOrchestrator'
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository'
import { FeedbackEntry } from '@/lib/services/FeedbackEnrichmentService'
import { supabase } from '@/lib/supabase'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'

// Event emission helper
function emitEvent(controller: ReadableStreamDefaultController, event: any) {
  try {
    console.log('Emitting event:', event.type, event);
    const message = `data: ${JSON.stringify(event)}\n\n`
    controller.enqueue(new TextEncoder().encode(message))
  } catch (error) {
    console.error('Failed to emit event:', error)
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const companyId = formData.get('companyId') as string
    const productId = formData.get('productId') as string
    const source = formData.get('source') as string

    if (!file || !companyId || !productId) {
      return NextResponse.json(
        { error: 'Missing required fields: file, companyId, productId' },
        { status: 400 }
      )
    }

    // Generate pipeline ID
    const pipelineId = uuidv4()
    
    // Create repository instances with Supabase client
    const feedbackRepository = new FeedbackRepository(supabase)
    const productAreaRepository = new ProductAreaRepository(supabase)

    // Save uploaded file
    const bytes = await file.arrayBuffer()
    const buffer = Buffer.from(bytes)
    
    // Create uploads directory if it doesn't exist
    const uploadsDir = join(process.cwd(), 'uploads')
    if (!existsSync(uploadsDir)) {
      await mkdir(uploadsDir, { recursive: true })
    }
    
    const filePath = join(uploadsDir, `${pipelineId}_${file.name}`)
    await writeFile(filePath, buffer)

    // Parse feedback data from file
    const feedbackData = await parseFeedbackFile(buffer, file.name, {
      companyId,
      productId,
      source: source as any
    })

    if (feedbackData.length === 0) {
      return NextResponse.json(
        { error: 'No valid feedback data found in file' },
        { status: 400 }
      )
    }

    // Create SSE stream that executes pipeline
    const stream = new ReadableStream({
      async start(controller) {
        const startTime = Date.now()
        
        // Initialize pipeline orchestrator with event emitter
        const eventEmitter = {
          emit(event: string, data: any) {
            emitEvent(controller, { type: event, ...data })
          }
        } as PipelineEventEmitter
        
        const orchestrator = new FeedbackPipelineOrchestrator(
          feedbackRepository,
          productAreaRepository,
          eventEmitter,
          pipelineId
        )
        
        try {
          console.log(`Starting pipeline ${pipelineId} with ${feedbackData.length} feedback entries`)

          // Execute pipeline - it will emit all detailed events internally
          const result = await orchestrator.processFeedback({
            productId,
            feedbackList: feedbackData
          })
          
          console.log(`Pipeline ${pipelineId} completed successfully with ${result.insights.length} insights`)
          
          // Close the stream
          controller.close()

        } catch (error) {
          console.error(`Pipeline ${pipelineId} failed:`, error)
          
          // Emit pipeline_failed event
          eventEmitter.emit('pipeline_failed', {
            pipelineId,
            timestamp: new Date().toISOString(),
            stage: 'orchestration',
            error: error instanceof Error ? error.message : 'Unknown error',
            failedAt: new Date().toISOString(),
            partialResults: {}
          })
          
          controller.close()
        }
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
        'Access-Control-Allow-Origin': '*'
      }
    })

  } catch (error) {
    console.error('Pipeline execution failed:', error)
    return NextResponse.json(
      { error: 'Failed to start pipeline execution' },
      { status: 500 }
    )
  }
}

/**
 * Parse feedback data from uploaded file
 */
async function parseFeedbackFile(
  buffer: Buffer,
  filename: string,
  metadata: { companyId: string; productId: string; source: string }
): Promise<FeedbackEntry[]> {
  const content = buffer.toString('utf-8')
  const feedbackEntries: FeedbackEntry[] = []

  try {
    if (filename.toLowerCase().endsWith('.json')) {
      // Parse JSON format
      const jsonData = JSON.parse(content)
      const entries = Array.isArray(jsonData) ? jsonData : [jsonData]
      
      entries.forEach((entry, index) => {
        if (entry.text || entry.feedback || entry.comment) {
          feedbackEntries.push({
            id: `feedback_${Date.now()}_${index}`,
            text: entry.text || entry.feedback || entry.comment,
            userId: entry.userId || entry.user_id || `user_${index}`,
            timestamp: entry.timestamp ? new Date(entry.timestamp) : new Date(),
            source: metadata.source as any,
            companyId: metadata.companyId,
            productId: metadata.productId,
            tags: entry.tags || [],
            userMetadata: entry.userMetadata || entry.user_metadata
          })
        }
      })
      
    } else if (filename.toLowerCase().endsWith('.csv')) {
      // Parse CSV format
      const lines = content.split('\n').filter(line => line.trim())
      if (lines.length === 0) return []
      
      // Assume first line is header
      const headers = lines[0].split(',').map(h => h.trim().toLowerCase())
      
      // Look for text column - prioritize more specific matches
      const textColumn = headers.findIndex(h => 
        h === 'feedback_text' || h === 'text' || h === 'comment' || h === 'message'
      ) !== -1 
        ? headers.findIndex(h => h === 'feedback_text' || h === 'text' || h === 'comment' || h === 'message')
        : headers.findIndex(h => h.includes('text') && !h.includes('id'))
      
      if (textColumn === -1) {
        throw new Error(`No text column found in CSV. Available columns: ${headers.join(', ')}`)
      }
      
      console.log(`Using column "${headers[textColumn]}" as feedback text`)
      
      lines.slice(1).forEach((line, index) => {
        const columns = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
        const text = columns[textColumn]
        
        if (text && text.length > 0) {
          feedbackEntries.push({
            id: `feedback_${Date.now()}_${index}`,
            text,
            userId: columns[headers.findIndex(h => h.includes('user'))] || `user_${index}`,
            timestamp: new Date(),
            source: metadata.source as any,
            companyId: metadata.companyId,
            productId: metadata.productId
          })
        }
      })
      
    } else {
      // Parse plain text format (one feedback per line)
      const lines = content.split('\n').filter(line => line.trim())
      
      lines.forEach((line, index) => {
        feedbackEntries.push({
          id: `feedback_${Date.now()}_${index}`,
          text: line.trim(),
          userId: `user_${index}`,
          timestamp: new Date(),
          source: metadata.source as any,
          companyId: metadata.companyId,
          productId: metadata.productId
        })
      })
    }
    
  } catch (error) {
    console.error('Error parsing feedback file:', error)
    throw new Error(`Failed to parse feedback file: ${error}`)
  }

  return feedbackEntries
}
