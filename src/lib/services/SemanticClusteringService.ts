/**
 * Semantic Clustering Service
 * 
 * Groups enriched feedback entries into meaningful thematic clusters using
 * AI-powered semantic analysis and hybrid clustering approaches.
 */

import { ChatWrapper } from '@/lib/chat/ChatWrapper'
import { EnrichedFeedbackEntry } from './FeedbackEnrichmentService'
import { PipelineEventEmitter, ClusteringStartedEvent, ClusteringCompleteEvent } from '@/types/pipeline-event-types'
import { extractJson } from '@/lib/utils/json-extractor'
import { feedbackClusteringTool } from '@/lib/tools/clustering-tools'

// Core clustering types
export interface FeedbackCluster {
  id: string
  theme: string
  description: string
  entries: EnrichedFeedbackEntry[]
  entryIds: string[]
  size: number
  dominantSentiment: 'positive' | 'negative' | 'neutral'
  sentimentDistribution: {
    positive: number
    negative: number
    neutral: number
  }
  urgencyDistribution: {
    low: number
    medium: number
    high: number
  }
  productAreas: string[]
  userSegments: string[]
  keywords: string[]
  confidence: number
  similarity: {
    avgInternalSimilarity: number
    coherenceScore: number
  }
}

export interface ClusteringConfig {
  maxClusters: number
  minClusterSize: number
  similarityThreshold: number
  useEnrichmentData: boolean
  qualityThreshold: number
}

/**
 * Advanced semantic clustering service that uses multiple approaches
 * to group feedback entries into meaningful, actionable clusters
 */
interface APIKeys {
  openai?: string
  anthropic?: string
}

export class SemanticClusteringService {
  private clusteringAgent!: ChatWrapper
  private config: ClusteringConfig
  private eventEmitter: PipelineEventEmitter
  private pipelineId: string
  private apiKeys: APIKeys

  constructor(
    eventEmitter: PipelineEventEmitter,
    pipelineId: string,
    config?: Partial<ClusteringConfig>,
    apiKeys?: APIKeys
  ) {
    this.eventEmitter = eventEmitter
    this.pipelineId = pipelineId
    this.apiKeys = apiKeys || {}
    this.config = {
      maxClusters: 8,
      minClusterSize: 2,
      similarityThreshold: 0.6,
      useEnrichmentData: true,
      qualityThreshold: 0.5,
      ...config
    }
    this.initializeClusteringAgent()
  }

  private initializeClusteringAgent() {
    this.clusteringAgent = new ChatWrapper(
      {
        provider: 'openai',
        model: 'gpt-4-turbo-preview',
        apiKey: this.apiKeys.openai, // Use user's API key if provided
        temperature: 0.1  // Low temperature for consistent clustering
      },
      {
        messages: [{
          role: 'system',
          content: `You are an expert at semantic clustering of customer feedback. Your job is to analyze enriched feedback entries and group them into meaningful, actionable clusters.

          Clustering Guidelines:
          - Focus on core themes, pain points, feature requests, and user journey stages
          - Group feedback that shares common underlying issues or requests
          - Create specific, actionable theme names (not generic categories)
          - Ensure every feedback entry is assigned to exactly one cluster
          - Prefer fewer, well-defined clusters over many small clusters
          - Consider product areas, sentiment patterns, and urgency levels when grouping

          Quality Requirements:
          - Themes should be specific and actionable
          - Descriptions should explain the common thread connecting feedback
          - Each cluster should represent a distinct, addressable concern or opportunity
          - Avoid overlap between clusters - each should be unique

          Always use the clustering tool to return structured results.`
        }],
        tools: [feedbackClusteringTool]
      }
    )
  }

  /**
   * Main clustering method - groups feedback into semantic clusters
   */
  async clusterFeedback(
    entries: EnrichedFeedbackEntry[]
  ): Promise<FeedbackCluster[]> {
    console.log(`Starting semantic clustering of ${entries.length} entries`)

    // Emit clustering started event
    this.eventEmitter.emit('clustering_started', {
      pipelineId: this.pipelineId,
      timestamp: new Date().toISOString(),
      enrichedFeedbackCount: entries.length
    })

    const startTime = Date.now()

    if (entries.length === 0) {
      this.eventEmitter.emit('clustering_complete', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        clusterCount: 0,
        duration: Date.now() - startTime
      })
      return []
    }

    if (entries.length === 1) {
      const singleCluster = this.createSingleCluster(entries)
      this.eventEmitter.emit('clustering_complete', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        clusterCount: 1,
        duration: Date.now() - startTime
      })
      return singleCluster
    }

    try {
      // Stage 1: Pre-clustering analysis
      const analysis = await this.analyzeEntries(entries)
      const optimalClusterCount = this.calculateOptimalClusterCount(entries, analysis)

      // Stage 2: Generate clusters using AI
      const rawClusters = await this.performAIClusteringAnalysis(entries, optimalClusterCount)

      // Stage 3: Generate themes and enrich clusters
      const enrichedClusters = await this.enrichClusters(rawClusters, entries)

      // Emit cluster_created for each cluster
      enrichedClusters.forEach(cluster => {
        this.eventEmitter.emit('cluster_created', {
          pipelineId: this.pipelineId,
          timestamp: new Date().toISOString(),
          clusterId: cluster.id,
          theme: cluster.theme,
          description: cluster.description,
          size: cluster.size,
          dominantSentiment: cluster.dominantSentiment,
          avgConfidence: cluster.confidence,
          productAreas: cluster.productAreas,
          feedbackIds: cluster.entryIds
        })
      })

      console.log(`✅ Enriched ${enrichedClusters.length} clusters`)

      // Stage 4: Validate and refine clusters
      const validatedClusters = await this.validateAndRefineClusters(enrichedClusters)

      console.log(`Clustering complete: ${validatedClusters.length} clusters generated`)
      
      // Emit clustering complete event
      this.eventEmitter.emit('clustering_complete', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        clusterCount: validatedClusters.length,
        duration: Date.now() - startTime
      })
      
      return validatedClusters

    } catch (error) {
      console.error('Clustering failed:', error)
      
      this.eventEmitter.emit('error', {
        pipelineId: this.pipelineId,
        timestamp: new Date().toISOString(),
        stage: 'clustering',
        errorType: 'clustering_failure',
        message: error instanceof Error ? error.message : 'Unknown clustering error',
        recoverable: false,
        context: { feedbackCount: entries.length },
        stack: error instanceof Error ? error.stack : undefined
      })
      
      throw error
    }
  }

  /**
   * Analyze the distribution and characteristics of feedback entries
   */
  private async analyzeEntries(entries: EnrichedFeedbackEntry[]) {
    const productAreaDistribution = new Map<string, number>()
    const sentimentDistribution = { positive: 0, negative: 0, neutral: 0 }
    const urgencyDistribution = { low: 0, medium: 0, high: 0 }
    const userSegments = new Set<string>()

    entries.forEach(entry => {
      // Product areas
      entry.linkedProductAreas.forEach(area => {
        productAreaDistribution.set(area.name, (productAreaDistribution.get(area.name) || 0) + 1)
      })

      // Sentiment
      sentimentDistribution[entry.sentiment.label]++

      // Urgency
      urgencyDistribution[entry.urgency]++

      // User segments
      if (entry.userMetadata?.segment) {
        userSegments.add(entry.userMetadata.segment)
      }
    })

    return {
      productAreaDistribution,
      sentimentDistribution,
      urgencyDistribution,
      userSegments: Array.from(userSegments),
      diversity: this.calculateDiversityScore(entries)
    }
  }

  /**
   * Calculate optimal number of clusters based on data characteristics
   */
  private calculateOptimalClusterCount(entries: EnrichedFeedbackEntry[], analysis: any): number {
    const entryCount = entries.length

    // Base cluster count on entry size
    let baseCount = Math.min(
      Math.max(2, Math.floor(Math.sqrt(entryCount))),
      this.config.maxClusters
    )

    // Adjust based on diversity
    if (analysis.diversity > 0.8) {
      baseCount = Math.min(baseCount + 2, this.config.maxClusters)
    } else if (analysis.diversity < 0.3) {
      baseCount = Math.max(baseCount - 1, 2)
    }

    // Adjust based on product area distribution
    const dominantAreas = analysis.productAreaDistribution.size
    if (dominantAreas > baseCount) {
      baseCount = Math.min(dominantAreas, this.config.maxClusters)
    }

    console.log(`Optimal cluster count: ${baseCount} (entries: ${entryCount}, diversity: ${analysis.diversity.toFixed(2)})`)
    return baseCount
  }

  /**
   * Use AI to perform semantic clustering analysis
   */
  private async performAIClusteringAnalysis(
    entries: EnrichedFeedbackEntry[], 
    targetClusters: number
  ): Promise<Array<{id: string, theme: string, description: string, entryIds: string[]}>> {
    
    const clusteringPrompt = this.buildClusteringPrompt(entries, targetClusters)
    
    try {
      const response = await this.clusteringAgent.sendMessage(clusteringPrompt)
      
      // Parse clusters from OpenAI function calling response
      const clusters = this.parseClusteringResponse(response, entries)
      
      // Deduplicate clusters with same theme and merge their entries
      const deduplicatedClusters = this.deduplicateClusters(clusters)
      
      // Validate that all entries are assigned
      const assignedIds = new Set(deduplicatedClusters.flatMap(c => c.entryIds))
      const unassignedEntries = entries.filter(e => !assignedIds.has(e.id))
      
      if (unassignedEntries.length > 0) {
        console.log(`Assigning ${unassignedEntries.length} unassigned entries to best clusters`)
        this.assignOrphanEntries(unassignedEntries, deduplicatedClusters)
      }

      console.log(`✅ Generated ${deduplicatedClusters.length} clusters`)

      return deduplicatedClusters

    } catch (error) {
      console.error('AI clustering failed:', error)
      throw error
    }
  }

  /**
   * Build comprehensive clustering prompt with enrichment context
   */
  private buildClusteringPrompt(entries: EnrichedFeedbackEntry[], targetClusters: number): string {
    const contextualEntries = entries.map((entry, idx) => {
      const productAreas = entry.linkedProductAreas.map(area => `${area.name} (${(area.confidence * 100).toFixed(0)}%)`).join(', ')
      const features = entry.extractedFeatures.join(', ')
      const userContext = entry.userMetadata ? `${entry.userMetadata.plan} plan, ${entry.userMetadata.teamSize} users, ${entry.userMetadata.usage} usage` : 'Unknown user'

      return `
${idx + 1}. ID: ${entry.id}
   Text: "${entry.text}"
   Product Areas: ${productAreas || 'None'}
   Features: ${features || 'None'}
   Sentiment: ${entry.sentiment.label} (${entry.sentiment.score.toFixed(2)})
   Urgency: ${entry.urgency}
   Categories: ${entry.category.join(', ')}
   User: ${userContext}
   Source: ${entry.source}`
    }).join('\n')

    return `Analyze these ${entries.length} feedback entries and group them into ${targetClusters} meaningful semantic clusters.

Group feedback based on:
1. **Core themes and topics** - What are users talking about?
2. **Pain points and problems** - What issues are being reported?
3. **Feature requests and suggestions** - What do users want?
4. **User journey stages** - Where in the product experience do these occur?
5. **Product areas and context** - Which parts of the product are affected?

Feedback entries to cluster:
${contextualEntries}

Create exactly ${targetClusters} clusters. Each cluster should have:
- A clear, specific theme that captures the essence of the grouped feedback
- A detailed description explaining what this cluster represents
- All entry IDs that belong to this cluster

CRITICAL REQUIREMENTS:
- Every feedback entry ID must appear in exactly one cluster
- Themes should be specific and actionable, not generic
- Descriptions should explain the common thread connecting the feedback
- Use the cluster_feedback tool to return structured results`
  }

  /**
   * Parse clustering response from OpenAI function calling
   */
  private parseClusteringResponse(
    response: string, 
    entries: EnrichedFeedbackEntry[]
  ): Array<{id: string, theme: string, description: string, entryIds: string[]}> {
    
    // Try to extract JSON from the response (handles both tool calls and text responses)
    const result = extractJson<{clusters: Array<{id: string, theme: string, description: string, entryIds: string[]}>}>(response)
    
    if (result.success && result.data?.clusters && Array.isArray(result.data.clusters)) {
      return result.data.clusters
    }
    
    // Fallback: try to extract as direct array
    const fallbackResult = extractJson<Array<{id: string, theme: string, description: string, entryIds: string[]}>>(response)
    if (fallbackResult.success && fallbackResult.data && Array.isArray(fallbackResult.data)) {
      return fallbackResult.data
    }
    
    // Extraction failed
    console.error('Failed to parse clustering response:', result.error || fallbackResult.error)
    throw new Error(`Failed to parse clustering response: ${result.error || fallbackResult.error || 'Unknown error'}`)
  }

  /**
   * Deduplicate clusters with same theme and merge their entries
   */
  private deduplicateClusters(
    clusters: Array<{id: string, theme: string, description: string, entryIds: string[]}>
  ): Array<{id: string, theme: string, description: string, entryIds: string[]}> {
    const deduplicatedMap = new Map<string, {id: string, theme: string, description: string, entryIds: string[]}>()
    
    clusters.forEach(cluster => {
      const existing = deduplicatedMap.get(cluster.theme)
      if (existing) {
        // Merge entry IDs and avoid duplicates
        const mergedEntryIds = [...new Set([...existing.entryIds, ...cluster.entryIds])]
        existing.entryIds = mergedEntryIds
        console.log(`Merged duplicate cluster theme '${cluster.theme}' (${cluster.entryIds.length} entries merged)`)
      } else {
        deduplicatedMap.set(cluster.theme, { ...cluster })
      }
    })
    
    return Array.from(deduplicatedMap.values())
  }

  /**
   * Assign unassigned entries to the most appropriate existing clusters
   */
  private assignOrphanEntries(
    orphanEntries: EnrichedFeedbackEntry[],
    clusters: Array<{id: string, theme: string, description: string, entryIds: string[]}>
  ) {
    orphanEntries.forEach(entry => {
      // Simple assignment based on product area or create miscellaneous cluster
      const bestCluster = clusters[0] // Assign to first cluster for now
      bestCluster.entryIds.push(entry.id)
    })
  }

  /**
   * Enrich clusters with metadata and analysis
   */
  private async enrichClusters(
    rawClusters: Array<{id: string, theme: string, description: string, entryIds: string[]}>,
    allEntries: EnrichedFeedbackEntry[]
  ): Promise<FeedbackCluster[]> {
    
    const enrichedClusters: FeedbackCluster[] = []

    for (const rawCluster of rawClusters) {
      const clusterEntries = allEntries.filter(entry => rawCluster.entryIds.includes(entry.id))
      
      if (clusterEntries.length < this.config.minClusterSize) {
        console.log(`Skipping cluster '${rawCluster.theme}' - too small (${clusterEntries.length} entries)`)
        continue
      }

      const enrichedCluster: FeedbackCluster = {
        id: rawCluster.id,
        theme: rawCluster.theme,
        description: rawCluster.description,
        entries: clusterEntries,
        entryIds: rawCluster.entryIds,
        size: clusterEntries.length,
        dominantSentiment: this.calculateDominantSentiment(clusterEntries),
        sentimentDistribution: this.calculateSentimentDistribution(clusterEntries),
        urgencyDistribution: this.calculateUrgencyDistribution(clusterEntries),
        productAreas: this.extractProductAreas(clusterEntries),
        userSegments: this.extractUserSegments(clusterEntries),
        keywords: this.extractKeywords(clusterEntries),
        confidence: 0.8, // Base confidence
        similarity: {
          avgInternalSimilarity: 0.7, // Placeholder
          coherenceScore: 0.8 // Placeholder
        }
      }

      enrichedClusters.push(enrichedCluster)
    }

    return enrichedClusters
  }

  /**
   * Validate and refine cluster quality
   */
  private async validateAndRefineClusters(clusters: FeedbackCluster[]): Promise<FeedbackCluster[]> {
    // Filter out low-quality clusters
    const validClusters = clusters.filter(cluster => {
      const hasValidTheme = cluster.theme && cluster.theme.length > 5
      const hasEnoughEntries = cluster.size >= this.config.minClusterSize
      const hasGoodConfidence = cluster.confidence >= this.config.qualityThreshold
      
      return hasValidTheme && hasEnoughEntries && hasGoodConfidence
    })

    // Sort by cluster size (larger clusters first)
    validClusters.sort((a, b) => b.size - a.size)

    console.log(`Validated ${validClusters.length}/${clusters.length} clusters`)
    return validClusters
  }

  // Helper methods for cluster analysis
  private calculateDominantSentiment(entries: EnrichedFeedbackEntry[]): 'positive' | 'negative' | 'neutral' {
    const counts = { positive: 0, negative: 0, neutral: 0 }
    entries.forEach(entry => counts[entry.sentiment.label]++)
    
    return Object.entries(counts).reduce((a, b) => counts[a[0] as keyof typeof counts] > counts[b[0] as keyof typeof counts] ? a : b)[0] as 'positive' | 'negative' | 'neutral'
  }

  private calculateSentimentDistribution(entries: EnrichedFeedbackEntry[]) {
    const distribution = { positive: 0, negative: 0, neutral: 0 }
    entries.forEach(entry => distribution[entry.sentiment.label]++)
    return distribution
  }

  private calculateUrgencyDistribution(entries: EnrichedFeedbackEntry[]) {
    const distribution = { low: 0, medium: 0, high: 0 }
    entries.forEach(entry => distribution[entry.urgency]++)
    return distribution
  }

  private extractProductAreas(entries: EnrichedFeedbackEntry[]): string[] {
    const areas = new Set<string>()
    entries.forEach(entry => {
      entry.linkedProductAreas.forEach(area => areas.add(area.name))
    })
    return Array.from(areas)
  }

  private extractUserSegments(entries: EnrichedFeedbackEntry[]): string[] {
    const segments = new Set<string>()
    entries.forEach(entry => {
      if (entry.userMetadata?.segment) {
        segments.add(entry.userMetadata.segment)
      }
    })
    return Array.from(segments)
  }

  private extractKeywords(entries: EnrichedFeedbackEntry[]): string[] {
    const keywords = new Set<string>()
    entries.forEach(entry => {
      entry.category.forEach(cat => keywords.add(cat))
      entry.extractedFeatures.forEach(feature => keywords.add(feature))
    })
    return Array.from(keywords).slice(0, 10) // Top 10 keywords
  }

  private calculateDiversityScore(entries: EnrichedFeedbackEntry[]): number {
    // Simple diversity calculation based on unique product areas and sentiments
    const uniqueAreas = new Set(entries.flatMap(e => e.linkedProductAreas.map(a => a.name)))
    const uniqueSentiments = new Set(entries.map(e => e.sentiment.label))
    const uniqueCategories = new Set(entries.flatMap(e => e.category))
    
    return (uniqueAreas.size + uniqueSentiments.size + uniqueCategories.size) / (entries.length + 3)
  }

  // Fallback methods
  private createSingleCluster(entries: EnrichedFeedbackEntry[]): FeedbackCluster[] {
    return [{
      id: 'cluster_single',
      theme: 'General Feedback',
      description: 'Mixed feedback topics',
      entries,
      entryIds: entries.map(e => e.id),
      size: entries.length,
      dominantSentiment: this.calculateDominantSentiment(entries),
      sentimentDistribution: this.calculateSentimentDistribution(entries),
      urgencyDistribution: this.calculateUrgencyDistribution(entries),
      productAreas: this.extractProductAreas(entries),
      userSegments: this.extractUserSegments(entries),
      keywords: this.extractKeywords(entries),
      confidence: 0.6,
      similarity: {
        avgInternalSimilarity: 0.5,
        coherenceScore: 0.6
      }
    }]
  }
}
