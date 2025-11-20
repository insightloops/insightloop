import { ChatWrapper } from "@/lib/chat/ChatWrapper"
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository'
import { PipelineEventEmitter, FeedbackEnrichmentStartedEvent, FeedbackEnrichmentCompleteEvent } from '@/types/pipeline-event-types'
import { extractJson } from '@/lib/utils/json-extractor'
import { feedbackEnrichmentTool } from '@/lib/tools/enrichment-tools'
import { processInParallel, createProgressLogger } from '@/lib/utils/parallel-processor'

// Types for enrichment
export interface FeedbackEntry {
  id: string
  text: string
  userId: string
  timestamp: Date
  source: 'survey' | 'support' | 'interview' | 'slack' | 'other'
  companyId: string
  productId: string
  tags?: string[]
  userMetadata?: {
    plan: 'free' | 'pro' | 'enterprise'
    segment: string
    teamSize: number
    usage: 'low' | 'medium' | 'high'
  }
}

export interface EnrichedFeedbackEntry extends FeedbackEntry {
  linkedProductAreas: Array<{
    id: string
    name: string
    confidence: number
  }>
  sentiment: {
    label: 'positive' | 'negative' | 'neutral'
    score: number
    confidence: number
  }
  extractedFeatures: string[]
  urgency: 'low' | 'medium' | 'high'
  category: string[]
}

/**
 * FeedbackEnrichmentService
 * 
 * Handles AI-powered enrichment of feedback entries including:
 * - Product area classification
 * - Sentiment analysis with confidence scores
 * - Feature extraction
 * - Urgency assessment
 * - Category tagging
 */
interface APIKeys {
  openai?: string
  anthropic?: string
}

export class FeedbackEnrichmentService {
  private enrichmentAgent!: ChatWrapper
  private feedbackRepository: FeedbackRepository
  private productAreaRepository: ProductAreaRepository
  private eventEmitter: PipelineEventEmitter
  private productId: string
  private pipelineId?: string
  private apiKeys: APIKeys

  constructor(
    feedbackRepository: FeedbackRepository, 
    productAreaRepository: ProductAreaRepository,
    eventEmitter: PipelineEventEmitter,
    productId: string,
    pipelineId?: string,
    apiKeys?: APIKeys
  ) {
    this.feedbackRepository = feedbackRepository
    this.productAreaRepository = productAreaRepository
    this.eventEmitter = eventEmitter
    this.productId = productId
    this.pipelineId = pipelineId
    this.apiKeys = apiKeys || {}
    this.initializeEnrichmentAgent()
  }

  private initializeEnrichmentAgent() {
    this.enrichmentAgent = new ChatWrapper(
      {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: this.apiKeys.openai, // Use user's API key if provided
        temperature: 0  // Low temperature for faster, more deterministic responses
      },
      {
        messages: [{
          role: 'system',
          content: `You are a feedback enrichment specialist. Analyze customer feedback and link it to existing product areas.
          
          Analyze these aspects:
          - Product area linking: Match feedback to existing product areas using their exact IDs
          - Sentiment analysis: Determine positive/negative/neutral with confidence scores
          - Feature extraction: Identify specific features mentioned in the feedback
          - Urgency assessment: Classify as low/medium/high based on language indicators
          - Category tagging: Add relevant classification tags
          
          Language patterns to recognize:
          - Urgency indicators: "urgent", "immediately", "ASAP", "critical", "broken", "emergency"  
          - Positive sentiment: "love", "great", "awesome", "perfect", "works well", "excellent"
          - Negative sentiment: "hate", "terrible", "broken", "frustrated", "annoying", "awful"
          
          Always return a valid JSON array with structured analysis. Be precise and consistent.`
        }],
        tools: [feedbackEnrichmentTool],
        tool_choice: feedbackEnrichmentTool.function.name
      }
    )
  }

  /**
   * Enrich feedback entries with AI analysis - processing in parallel with controlled concurrency
   */
  async enrichFeedback(entries: FeedbackEntry[], concurrency: number = 3): Promise<EnrichedFeedbackEntry[]> {
    if (entries.length === 0) {
      return []
    }

    // Emit stage started event
    this.eventEmitter?.emit('enrichment_started', {
      pipelineId: this.pipelineId!,
      timestamp: new Date().toISOString(),
      feedbackCount: entries.length
    })

    console.log(`🚀 Starting parallel enrichment of ${entries.length} entries with concurrency ${concurrency}`)

    // Fetch product areas once upfront for all feedback entries
    console.log(`📋 Fetching product areas for product: ${this.productId}`)
    const availableProductAreas = await this.productAreaRepository.getProductAreasForMatching(this.productId)
    console.log(`✅ Found ${availableProductAreas.length} product areas`)

    // Create progress logger
    const progressLogger = createProgressLogger('Feedback Enrichment')

    // Process feedback entries using the parallel processor utility
    const { results, stats } = await processInParallel(
      entries,
      async (entry: FeedbackEntry, index: number) => {
        return await this.processSingleFeedbackWithEvents(entry, index + 1, entries.length, availableProductAreas)
      },
      {
        concurrency,
        continueOnError: true,
        onBatchComplete: progressLogger.onBatchComplete,
        onItemComplete: (itemIndex, totalItems, result) => {
          // Custom progress logging for feedback enrichment
          const status = result.success ? '✅' : '❌'
          const progress = Math.round(((itemIndex + 1) / totalItems) * 100)
          const feedbackResult = result.result as any
          const feedbackId = feedbackResult?.feedbackId || 'unknown'
          console.log(`${status} Feedback ${itemIndex + 1}/${totalItems} (${progress}%) - ${feedbackId} - ${result.duration}ms`)
        }
      }
    )
    
    // Extract successful enriched entries
    const enrichedEntries: EnrichedFeedbackEntry[] = results
      .filter(result => result.success && result.result?.enrichedEntry)
      .map(result => result.result!.enrichedEntry!)

    // Emit stage completion event
    this.eventEmitter.emit('enrichment_complete', {
      pipelineId: this.pipelineId!,
      timestamp: new Date().toISOString(),
      processedCount: stats.totalItems,
      successCount: stats.successCount,
      duration: stats.totalDuration
    })

    // Log comprehensive completion statistics
    console.log(`📊 Enrichment Complete:`)
    console.log(`   • Total processed: ${stats.totalItems}`)
    console.log(`   • Successful: ${stats.successCount} (${Math.round((stats.successCount / stats.totalItems) * 100)}%)`)
    console.log(`   • Failed: ${stats.failureCount}`)
    console.log(`   • Total duration: ${stats.totalDuration}ms`)
    console.log(`   • Average per item: ${Math.round(stats.averageDuration)}ms`)
    console.log(`   • Throughput: ${stats.throughput.toFixed(2)} items/sec`)

    return enrichedEntries
  }

  /**
   * Process a single feedback entry with all events
   */
  private async processSingleFeedbackWithEvents(
    entry: FeedbackEntry, 
    feedbackNumber: number, 
    totalFeedback: number,
    availableProductAreas: Array<{ id: string; name: string; description: string | null; keywords: string[] }>
  ): Promise<{ success: boolean; enrichedEntry?: EnrichedFeedbackEntry; error?: string; feedbackId: string }> {
    const feedbackStartTime = Date.now()

    // Emit feedback enrichment started event  
    const startedEvent: FeedbackEnrichmentStartedEvent = {
      pipelineId: this.pipelineId!,
      timestamp: new Date().toISOString(),
      feedbackId: entry.id,
      text: entry.text.substring(0, 100) + (entry.text.length > 100 ? '...' : ''),
      source: entry.source
    }
    
    // Use type assertion to bypass the TypeScript issue
    this.eventEmitter.emit('feedback_enrichment_started', startedEvent)

    try {
      console.log(`Processing feedback ${feedbackNumber}/${totalFeedback}: ${entry.id}`)
      
      const enrichedEntry = await this.enrichSingleFeedback(entry, availableProductAreas)
      
      // Store enriched feedback in database
      // await this.storeEnrichedFeedback([enrichedEntry])
      
      // Emit feedback enrichment complete event
      const completeEvent: FeedbackEnrichmentCompleteEvent = {
        pipelineId: this.pipelineId!,
        timestamp: new Date().toISOString(),
        feedbackId: entry.id,
        success: true,
        duration: Date.now() - feedbackStartTime,
        enrichmentData: {
          id: entry.id,
          linkedProductAreas: enrichedEntry.linkedProductAreas,
          sentiment: enrichedEntry.sentiment,
          extractedFeatures: enrichedEntry.extractedFeatures,
          urgency: enrichedEntry.urgency,
          category: enrichedEntry.category
        }
      }
      this.eventEmitter.emit('feedback_enrichment_complete', completeEvent)

      console.log(`✅ Completed feedback ${feedbackNumber}/${totalFeedback}: ${entry.id}`)
      
      return {
        success: true,
        enrichedEntry,
        feedbackId: entry.id
      }

    } catch (error) {
      const errorMsg = `Error enriching feedback ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
      console.error(errorMsg)
      
      // Emit feedback enrichment complete with error
      const errorEvent: FeedbackEnrichmentCompleteEvent = {
        pipelineId: this.pipelineId!,
        timestamp: new Date().toISOString(),
        feedbackId: entry.id,
        success: false,
        duration: Date.now() - feedbackStartTime,
        error: errorMsg
      }
        
      // Use type assertion to bypass the TypeScript issue
      this.eventEmitter.emit('feedback_enrichment_complete', errorEvent)
      
      console.error(`❌ Failed to process feedback ${feedbackNumber}/${totalFeedback}: ${entry.id}`)
      
      return {
        success: false,
        error: errorMsg,
        feedbackId: entry.id
      }
    }
  }

  /**
   * Enrich a single feedback entry with AI analysis
   */
  private async enrichSingleFeedback(
    entry: FeedbackEntry,
    availableProductAreas: Array<{ id: string; name: string; description: string | null; keywords: string[] }>
  ): Promise<EnrichedFeedbackEntry> {
    const enrichmentPrompt = this.buildSingleFeedbackPrompt(entry, availableProductAreas)
    
    // Get system message
    const systemMessage = this.enrichmentAgent.getMessages().find(m => m.role === 'system')
    
    // Emit AI call started event
    const aiCallId = `enrichment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const messagesBeforeCall = [
      ...(systemMessage ? [systemMessage] : []),
      {
        role: 'user' as const,
        content: enrichmentPrompt
      }
    ]
    
    this.eventEmitter.emit('enrichment_ai_call', {
      pipelineId: this.pipelineId!,
      timestamp: new Date().toISOString(),
      feedbackId: entry.id,
      callId: aiCallId,
      messages: messagesBeforeCall
    })
    
    const response = await this.enrichmentAgent.sendMessage(enrichmentPrompt)
    
    // Extract JSON from response - handles both JSON objects and strings with embedded JSON
    const extractionResult = extractJson(response)

    // Emit AI response event
    this.eventEmitter.emit('enrichment_ai_response', {
      pipelineId: this.pipelineId!,
      timestamp: new Date().toISOString(),
      feedbackId: entry.id,
      callId: aiCallId,
      messages: [
        ...messagesBeforeCall,
        {
          role: 'assistant' as const,
          content: response
        }
      ],
      extractedData: extractionResult.success ? extractionResult.data : undefined,
      extractionError: extractionResult.success ? undefined : extractionResult.error
    })

    if (!extractionResult.success || !extractionResult.data) {
      throw new Error(`Failed to extract JSON from AI response: ${extractionResult.error}`)
    }
    
    // The model is constrained by the tool to return the exact structure we expect
    const enrichmentData = extractionResult.data

    // Validate and clean enrichment data
    const validatedEnrichment = this.validateEnrichment(enrichmentData, availableProductAreas)
    
    const enrichedEntry: EnrichedFeedbackEntry = {
      ...entry,
      linkedProductAreas: validatedEnrichment.linkedProductAreas,
      sentiment: validatedEnrichment.sentiment,
      extractedFeatures: validatedEnrichment.extractedFeatures,
      urgency: validatedEnrichment.urgency,
      category: validatedEnrichment.category
    }

    return enrichedEntry
  }

  /**
   * Build the enrichment prompt for a single feedback entry
   */
  private buildSingleFeedbackPrompt(
    entry: FeedbackEntry, 
    availableProductAreas: Array<{ id: string; name: string; description: string | null; keywords: string[] }>
  ): string {
    return `Analyze the following customer feedback and enrich it with structured insights.

Available Product Areas (use these exact IDs):
${availableProductAreas.map(area => `
- ID: ${area.id}
  Name: "${area.name}"
  Description: ${area.description || 'No description'}
  Keywords: ${area.keywords.join(', ') || 'None'}
`).join('\n')}

Feedback to analyze:
ID: ${entry.id}
Text: "${entry.text}"
Source: ${entry.source}
User: ${entry.userId}
User Metadata: ${entry.userMetadata ? JSON.stringify(entry.userMetadata) : 'None'}

Provide analysis for this feedback entry:
- linkedProductAreas: Link to 1-3 most relevant product areas using ONLY the IDs listed above, with confidence scores (0.0-1.0)
- sentiment: Classify as positive/negative/neutral with score (-1.0 to 1.0) and confidence (0.0-1.0)
- extractedFeatures: List specific features or topics mentioned
- urgency: Classify as low/medium/high based on language urgency indicators
- category: Add relevant classification tags

Guidelines:
- High urgency: Contains words like "urgent", "critical", "broken", "immediately", "ASAP", "emergency"
- Medium urgency: Requests improvements or mentions issues without urgency indicators  
- Low urgency: General feedback, suggestions, or positive comments
- Only link to product areas from the provided list using exact IDs
- If no product areas match well, return empty array for linkedProductAreas

Return a JSON array with ONE object for this feedback entry.
CRITICAL: Your response must be ONLY the JSON array. Start with [ and end with ]. 
DO NOT include any explanatory text, analysis, or comments before or after the JSON.
NO PREAMBLE. NO EXPLANATION. JUST THE JSON ARRAY.`
  }

  /**
   * Validate and clean enrichment data
   */
  private validateEnrichment(
    enrichment: any, 
    availableProductAreas: Array<{ id: string; name: string; description: string | null; keywords: string[] }>
  ): {
    linkedProductAreas: Array<{ id: string; name: string; confidence: number }>
    sentiment: { label: 'positive' | 'negative' | 'neutral', score: number, confidence: number }
    extractedFeatures: string[]
    urgency: 'low' | 'medium' | 'high'
    category: string[]
  } {
    const validSentiments = ['positive', 'negative', 'neutral']
    const validUrgencies = ['low', 'medium', 'high']
    
    // Validate product area links - TEMP: Allow any product areas for testing
    const linkedProductAreas = Array.isArray(enrichment.linkedProductAreas)
      ? enrichment.linkedProductAreas
          .filter((link: any) => 
            link && 
            typeof link.id === 'string' && 
            // TEMP: Comment out validation to allow clustering - validAreaIds.has(link.id) &&
            typeof link.confidence === 'number' &&
            link.confidence >= 0 && 
            link.confidence <= 1
          )
          .map((link: any) => {
            const area = availableProductAreas.find(a => a.id === link.id)
            return {
              id: link.id,
              name: area?.name || link.id, // Use ID as name if no area found
              confidence: Math.max(0, Math.min(1, link.confidence))
            }
          })
      : []

    return {
      linkedProductAreas,
      
      sentiment: {
        label: validSentiments.includes(enrichment.sentiment?.label) 
          ? enrichment.sentiment.label 
          : 'neutral',
        score: typeof enrichment.sentiment?.score === 'number' 
          ? Math.max(-1, Math.min(1, enrichment.sentiment.score))
          : 0,
        confidence: typeof enrichment.sentiment?.confidence === 'number'
          ? Math.max(0, Math.min(1, enrichment.sentiment.confidence))
          : 0.5
      },
      
      extractedFeatures: Array.isArray(enrichment.extractedFeatures)
        ? enrichment.extractedFeatures.filter((f: any) => typeof f === 'string')
        : [],
      
      urgency: validUrgencies.includes(enrichment.urgency)
        ? enrichment.urgency
        : 'medium',
      
      category: Array.isArray(enrichment.category)
        ? enrichment.category.filter((c: any) => typeof c === 'string')
        : ['uncategorized']
    }
  }

  /**
   * Store enriched feedback in database
   */
  private async storeEnrichedFeedback(enrichedEntries: EnrichedFeedbackEntry[]): Promise<void> {
    console.log(`Storing ${enrichedEntries.length} enriched feedback entries in database`)
    
    for (const entry of enrichedEntries) {
      try {
        // Update feedback record with enrichment data
        await this.feedbackRepository.update(entry.id, {
          sentiment: entry.sentiment.label,
          processed_at: new Date().toISOString()
        })

        // Update processed timestamp
        await this.feedbackRepository.updateProcessedAt(entry.id)

        // TODO: Store product area relationships when schema is ready
        // await this.feedbackRepository.linkProductAreas(entry.id, entry.linkedProductAreas)
        
        // TODO: Store extracted features when schema is ready
        // await this.feedbackRepository.storeFeatures(entry.id, entry.extractedFeatures)

      } catch (error) {
        const errorMsg = `Error storing enriched feedback ${entry.id}: ${error instanceof Error ? error.message : 'Unknown error'}`
        console.error(errorMsg)
        throw error
      }
    }

    console.log(`Successfully stored ${enrichedEntries.length} enriched feedback entries`)
  }

  /**
   * Get enrichment statistics
   */
  getEnrichmentStats(enrichedEntries: EnrichedFeedbackEntry[]) {
    const stats = {
      total: enrichedEntries.length,
      byProductArea: {} as Record<string, number>,
      bySentiment: { positive: 0, negative: 0, neutral: 0 },
      byUrgency: { low: 0, medium: 0, high: 0 },
      averageConfidence: 0,
      totalFeatures: 0
    }

    enrichedEntries.forEach(entry => {
      // Product area distribution
      entry.linkedProductAreas.forEach(area => {
        stats.byProductArea[area.name] = (stats.byProductArea[area.name] || 0) + 1
      })
      
      // Sentiment distribution
      stats.bySentiment[entry.sentiment.label]++
      
      // Urgency distribution
      stats.byUrgency[entry.urgency]++
      
      // Average confidence
      stats.averageConfidence += entry.sentiment.confidence
      
      // Feature count
      stats.totalFeatures += entry.extractedFeatures.length
    })

    stats.averageConfidence = stats.averageConfidence / stats.total

    return stats
  }
}
