/**
 * Feedback Pipeline Orchestrator Service
 * 
 * Simple orchestration service that coordinates the three main services:
 * 1. FeedbackEnrichmentService - enriches raw feedback with product areas and metadata
 * 2. SemanticClusteringService - groups enriched feedback into thematic clusters
 * 3. InsightGenerationService - generates actionable insights from clusters
 * 
 * Takes repositories, product ID, feedback list, and event emitter, then orchestrates the services
 * sequentially, ensuring proper data flow between each stage.
 */

import { PipelineEventEmitter } from '@/types/pipeline-event-types'
import { FeedbackEnrichmentService, FeedbackEntry } from './FeedbackEnrichmentService'
import { SemanticClusteringService } from './SemanticClusteringService'
import { InsightGenerationService, GeneratedInsight } from './InsightGenerationService'
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository'

export interface PipelineInput {
  productId: string
  feedbackList: FeedbackEntry[]
}

export interface PipelineOutput {
  insights: GeneratedInsight[]
  summary: {
    feedbackCount: number
    enrichedCount: number
    clusterCount: number
    insightCount: number
    processingTimeMs: number
  }
}

/**
 * Orchestrates the complete feedback processing pipeline
 */
interface APIKeys {
  openai?: string
  anthropic?: string
}

export class FeedbackPipelineOrchestrator {
  private feedbackRepository: FeedbackRepository
  private productAreaRepository: ProductAreaRepository
  private eventEmitter: PipelineEventEmitter
  private pipelineId: string
  private apiKeys: APIKeys

  constructor(
    feedbackRepository: FeedbackRepository,
    productAreaRepository: ProductAreaRepository,
    eventEmitter: PipelineEventEmitter,
    pipelineId: string,
    apiKeys?: APIKeys
  ) {
    this.feedbackRepository = feedbackRepository
    this.productAreaRepository = productAreaRepository
    this.eventEmitter = eventEmitter
    this.pipelineId = pipelineId
    this.apiKeys = apiKeys || {}
  }

  /**
   * Execute the complete pipeline: Enrichment → Clustering → Insight Generation
   */
  async processFeedback(input: PipelineInput): Promise<PipelineOutput> {
    const startTime = Date.now()
    console.log(`🚀 Starting pipeline for product ${input.productId} with ${input.feedbackList.length} feedback entries`)

    try {
      // Emit pipeline started event
      this.eventEmitter.emit('pipeline_started', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        feedbackCount: input.feedbackList.length,
        companyId: input.productId, // Using productId as companyId for now
        productId: input.productId,
        source: 'api',
        stages: ['enrichment', 'clustering', 'insight_generation']
      })

      // Stage 1: Feedback Enrichment
      console.log(`🔍 Stage 1: Starting feedback enrichment...`)
      const enrichedEntries = await this.runEnrichmentStage(input.productId, input.feedbackList)
      console.log(`✅ Stage 1 complete: Enriched ${enrichedEntries.length} entries`)

      // Stage 2: Semantic Clustering
      console.log(`🎯 Stage 2: Starting semantic clustering...`)
      const clusters = await this.runClusteringStage(enrichedEntries)
      console.log(`✅ Stage 2 complete: Created ${clusters.length} clusters`)

      // Stage 3: Insight Generation
      console.log(`💡 Stage 3: Starting insight generation...`)
      const insights = await this.runInsightGenerationStage(clusters)
      console.log(`✅ Stage 3 complete: Generated ${insights.length} insights`)

      const processingTimeMs = Date.now() - startTime

      // Emit pipeline complete event
      this.eventEmitter.emit('pipeline_complete', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        duration: processingTimeMs,
        summary: {
          rawFeedbackCount: input.feedbackList.length,
          enrichedFeedbackCount: enrichedEntries.length,
          clusterCount: clusters.length,
          insightCount: insights.length,
          qualityScore: 0.85 // TODO: Calculate actual quality score
        }
      })

      console.log(`🎉 Pipeline completed successfully in ${processingTimeMs}ms`)

      return {
        insights,
        summary: {
          feedbackCount: input.feedbackList.length,
          enrichedCount: enrichedEntries.length,
          clusterCount: clusters.length,
          insightCount: insights.length,
          processingTimeMs
        }
      }

    } catch (error) {
      console.error('❌ Pipeline failed:', error)
      
      // Emit pipeline failed event
      this.eventEmitter.emit('pipeline_failed', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
        stage: 'unknown',
        failedAt: new Date().toISOString()
      })

      throw error
    }
  }

  /**
   * Stage 1: Enrich feedback with product areas and metadata
   */
  private async runEnrichmentStage(productId: string, feedbackList: FeedbackEntry[]) {
    try {
      // Fetch product areas for the product
      console.log(`📋 Fetching product areas for product ${productId}`)
      const productAreas = await this.productAreaRepository.findByProductId(productId)
      console.log(`📋 Found ${productAreas.length} product areas`)
    } catch (error) {
      console.log(`📋 Unable to fetch product areas (${error}), proceeding with enrichment anyway`)
    }

    // Initialize enrichment service with repositories and event emitter
    const enrichmentService = new FeedbackEnrichmentService(
      this.feedbackRepository,
      this.productAreaRepository,
      this.eventEmitter,
      productId,
      this.pipelineId,
      this.apiKeys
    )

    // Run enrichment
    const enrichedEntries = await enrichmentService.enrichFeedback(feedbackList)

    return enrichedEntries
  }

  /**
   * Stage 2: Cluster enriched feedback into thematic groups
   */
  private async runClusteringStage(enrichedEntries: any[]) {
    // Initialize clustering service with event emitter
    const clusteringService = new SemanticClusteringService(
      this.eventEmitter,
      this.pipelineId,
      {
        maxClusters: 8,
        minClusterSize: 2,
        similarityThreshold: 0.6,
        useEnrichmentData: true,
        qualityThreshold: 0.5
      },
      this.apiKeys
    )

    // Run clustering
    const clusters = await clusteringService.clusterFeedback(enrichedEntries)

    return clusters
  }

  /**
   * Stage 3: Generate insights from clusters
   */
  private async runInsightGenerationStage(clusters: any[]) {
    // Initialize insight generation service with event emitter
    const insightGenerationService = new InsightGenerationService(
      this.eventEmitter,
      this.pipelineId,
      undefined, // Use default config
      this.apiKeys
    )

    // Run insight generation
    const insights = await insightGenerationService.generateInsights(clusters, this.pipelineId)

    return insights
  }
}
