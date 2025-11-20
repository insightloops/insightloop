import { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { ClusterRepository } from '@/lib/repositories/ClusterRepository'
import { InsightRepository } from '@/lib/repositories/InsightRepository'
import { FeedbackItem } from '@/types'
import { Database } from '@/types/database-generated'

type FeedbackCluster = Database['public']['Tables']['feedback_clusters']['Row']

export class FeedbackService {
  private feedbackRepository: FeedbackRepository
  private clusterRepository: ClusterRepository
  private insightRepository: InsightRepository

  constructor(supabase: SupabaseClient<Database>) {
    this.feedbackRepository = new FeedbackRepository(supabase)
    this.clusterRepository = new ClusterRepository(supabase)
    this.insightRepository = new InsightRepository(supabase)
  }

  async uploadCSVFeedback(
    companyId: string,
    csvData: string,
    mapping: {
      contentColumn: string
      sentimentColumn?: string
      productAreaColumn?: string
      submittedAtColumn?: string
      userMetadataColumns?: string[]
    }
  ): Promise<FeedbackItem[]> {
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      if (lines.length < 2) {
        throw new Error('CSV must contain at least one data row')
      }

      // Find column indices
      const contentIndex = headers.indexOf(mapping.contentColumn)
      if (contentIndex === -1) {
        throw new Error(`Content column '${mapping.contentColumn}' not found in CSV`)
      }

      const sentimentIndex = mapping.sentimentColumn ? headers.indexOf(mapping.sentimentColumn) : -1
      const productAreaIndex = mapping.productAreaColumn ? headers.indexOf(mapping.productAreaColumn) : -1
      const submittedAtIndex = mapping.submittedAtColumn ? headers.indexOf(mapping.submittedAtColumn) : -1

      // Parse feedback items
      const feedbackItems = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}: expected ${headers.length} columns, got ${values.length}`)
          continue
        }

        const content = values[contentIndex]
        if (!content || content.trim() === '') {
          console.warn(`Skipping row ${i + 1}: empty content`)
          continue
        }

        // Build user metadata from specified columns
        const userMetadata: Record<string, any> = {}
        if (mapping.userMetadataColumns) {
          mapping.userMetadataColumns.forEach(column => {
            const index = headers.indexOf(column)
            if (index !== -1 && values[index]) {
              userMetadata[column] = values[index]
            }
          })
        }

        const feedbackItem = {
          company_id: companyId,
          source: 'csv',
          content: content,
          sentiment: sentimentIndex !== -1 ? this.normalizeSentiment(values[sentimentIndex]) : undefined,
          product_area: productAreaIndex !== -1 ? values[productAreaIndex] : undefined,
          submitted_at: submittedAtIndex !== -1 ? this.parseDate(values[submittedAtIndex]) : new Date().toISOString(),
          user_metadata: Object.keys(userMetadata).length > 0 ? userMetadata : {}
        }

        feedbackItems.push(feedbackItem)
      }

      if (feedbackItems.length === 0) {
        throw new Error('No valid feedback items found in CSV')
      }

      // Batch insert feedback items
      const createdItems = await this.feedbackRepository.createMany(feedbackItems)

      return createdItems
    } catch (error) {
      throw new Error(`Failed to upload CSV feedback: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getFeedbackByCompany(
    companyId: string,
    filters?: {
      source?: string[]
      sentiment?: string[]
      product_area?: string[]
      date_from?: string
      date_to?: string
    },
    pagination?: {
      page: number
      limit: number
    }
  ): Promise<{
    data: FeedbackItem[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.feedbackRepository.findByCompanyId(companyId, filters, limit, offset),
      this.feedbackRepository.countByCompanyId(companyId, filters)
    ])

    return {
      data,
      total,
      page,
      limit,
      hasMore: offset + data.length < total
    }
  }

  async getFeedbackFilters(companyId: string): Promise<{
    sources: string[]
    productAreas: string[]
    sentiments: string[]
  }> {
    const [sources, productAreas] = await Promise.all([
      this.feedbackRepository.getDistinctSources(companyId),
      this.feedbackRepository.getDistinctProductAreas(companyId)
    ])

    return {
      sources,
      productAreas,
      sentiments: ['positive', 'negative', 'neutral']
    }
  }

  async updateFeedbackSentiment(id: string, sentiment: string): Promise<FeedbackItem> {
    const normalizedSentiment = this.normalizeSentiment(sentiment)
    return this.feedbackRepository.update(id, { 
      sentiment: normalizedSentiment,
      processed_at: new Date().toISOString()
    })
  }

  async deleteFeedback(id: string): Promise<void> {
    return this.feedbackRepository.delete(id)
  }

  private normalizeSentiment(sentiment: string): string {
    if (!sentiment) return 'neutral'
    
    const normalized = sentiment.toLowerCase().trim()
    
    if (['positive', 'good', 'happy', 'satisfied', 'love', 'great', 'excellent'].some(word => normalized.includes(word))) {
      return 'positive'
    }
    
    if (['negative', 'bad', 'angry', 'frustrated', 'hate', 'terrible', 'awful'].some(word => normalized.includes(word))) {
      return 'negative'
    }
    
    return 'neutral'
  }

  private parseDate(dateString: string): string {
    if (!dateString) return new Date().toISOString()
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toISOString()
      }
      return date.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }

  // Pipeline methods

  // Process uploaded feedback through the enrichment pipeline
  async processFeedbackBatch(
    companyId: string,
    feedbackItems: FeedbackItem[]
  ): Promise<{
    enriched: number
    clustered: number
    insights_generated: number
    errors: string[]
  }> {
    const results = {
      enriched: 0,
      clustered: 0,
      insights_generated: 0,
      errors: [] as string[]
    }

    try {
      // Step 1: Enrich each feedback item
      for (const feedback of feedbackItems) {
        try {
          await this.enrichFeedbackItem(feedback)
          results.enriched++
        } catch (error) {
          results.errors.push(`Enrichment failed for ${feedback.id}: ${error}`)
        }
      }

      // Step 2: Cluster similar feedback
      const clusters = await this.clusterFeedback(companyId, feedbackItems)
      results.clustered = clusters.length

      // Step 3: Generate insights from clusters
      for (const cluster of clusters) {
        try {
          await this.generateInsightFromCluster(companyId, cluster)
          results.insights_generated++
        } catch (error) {
          results.errors.push(`Insight generation failed for cluster ${cluster.id}: ${error}`)
        }
      }

    } catch (error) {
      results.errors.push(`Pipeline processing failed: ${error}`)
    }

    return results
  }

  // Enrich a single feedback item with AI analysis
  private async enrichFeedbackItem(feedback: FeedbackItem): Promise<void> {
    // This would integrate with AI services for:
    // 1. Sentiment analysis
    // 2. Product area classification
    // 3. Feature detection
    // 4. Intent extraction

    // For now, mark as processed
    await this.feedbackRepository.updateProcessedAt(feedback.id)
    
    // Placeholder for AI enrichment
    console.log(`Enriching feedback ${feedback.id}: "${feedback.content}"`)
  }

  // Cluster similar feedback items
  private async clusterFeedback(
    companyId: string,
    feedbackItems: FeedbackItem[]
  ): Promise<FeedbackCluster[]> {
    // Group feedback by theme/topic using AI
    // This is a simplified version - real implementation would use embeddings
    
    const themes = new Map<string, FeedbackItem[]>()
    
    for (const feedback of feedbackItems) {
      // Extract theme from content (placeholder logic)
      const theme = this.extractTheme(feedback.content)
      
      if (!themes.has(theme)) {
        themes.set(theme, [])
      }
      themes.get(theme)?.push(feedback)
    }

    const clusters: FeedbackCluster[] = []

    for (const [theme, items] of themes) {
      if (items.length >= 2) { // Only cluster if we have multiple items
        const cluster = await this.clusterRepository.create({
          company_id: companyId,
          name: `${theme} Feedback Cluster`,
          description: `Cluster of feedback related to ${theme}`,
          theme: theme,
          metadata: {
            feedback_count: items.length,
            created_by: 'ai_pipeline'
          }
        })

        // Add feedback items to cluster
        const feedbackIds = items.map(item => item.id)
        await this.clusterRepository.addMembers(cluster.id, feedbackIds)

        clusters.push(cluster)
      }
    }

    return clusters
  }

  // Extract theme from feedback content (placeholder)
  private extractTheme(content: string): string {
    const lowerContent = content.toLowerCase()
    
    if (lowerContent.includes('bug') || lowerContent.includes('error') || lowerContent.includes('broken')) {
      return 'Bug Reports'
    }
    if (lowerContent.includes('feature') || lowerContent.includes('request') || lowerContent.includes('add')) {
      return 'Feature Requests'
    }
    if (lowerContent.includes('slow') || lowerContent.includes('performance') || lowerContent.includes('fast')) {
      return 'Performance'
    }
    if (lowerContent.includes('ui') || lowerContent.includes('design') || lowerContent.includes('interface')) {
      return 'User Interface'
    }
    if (lowerContent.includes('love') || lowerContent.includes('great') || lowerContent.includes('awesome')) {
      return 'Positive Feedback'
    }
    
    return 'General Feedback'
  }

  // Generate insight from a cluster of feedback
  private async generateInsightFromCluster(
    companyId: string,
    cluster: FeedbackCluster
  ): Promise<void> {
    // Get cluster members
    const members = await this.clusterRepository.getMembers(cluster.id)
    const feedbackIds = members.map(m => m.feedback_id)

    if (feedbackIds.length < 2) return // Skip small clusters

    // Calculate scores based on cluster characteristics
    const volumeScore = Math.min(feedbackIds.length / 10, 1.0) // Volume impact
    const urgencyScore = cluster.theme?.includes('Bug') ? 0.9 : 0.5 // Bugs are urgent
    const valueAlignmentScore = cluster.theme?.includes('Feature') ? 0.8 : 0.6 // Feature requests align with value
    const insightScore = (volumeScore + urgencyScore + valueAlignmentScore) / 3

    // Generate insight title and summary
    const title = `${cluster.theme} - ${feedbackIds.length} feedback items`
    const summary = `Analysis of ${feedbackIds.length} feedback items related to ${cluster.theme}. ` +
                   `This cluster shows ${volumeScore > 0.7 ? 'high' : 'moderate'} volume impact.`

    // Create insight
    await this.insightRepository.createFromCluster({
      company_id: companyId,
      cluster_id: cluster.id,
      title,
      summary,
      theme: cluster.theme || 'General',
      insight_score: insightScore,
      urgency_score: urgencyScore,
      volume_score: volumeScore,
      value_alignment_score: valueAlignmentScore,
      segment_context: {
        cluster_size: feedbackIds.length,
        processing_date: new Date().toISOString()
      },
      evidence_feedback_ids: feedbackIds
    })
  }

  // Get processing status for feedback batch
  async getProcessingStatus(companyId: string): Promise<{
    total_feedback: number
    processed_feedback: number
    total_clusters: number
    total_insights: number
    last_processed: string | null
  }> {
    const [
      totalFeedback,
      clusterCount
    ] = await Promise.all([
      this.feedbackRepository.countByCompanyId(companyId),
      this.clusterRepository.list(companyId).then(clusters => clusters.length)
    ])

    // Get processed count and insights count  
    const allFeedback = await this.feedbackRepository.findByCompanyId(companyId, undefined, 1000, 0)
    const processedFeedback = allFeedback.filter((f: FeedbackItem) => f.processed_at)
    const insights = await this.insightRepository.findByCompanyId(companyId, undefined, 1000, 0)

    // Get last processed timestamp
    const recentProcessed = processedFeedback.filter((f: FeedbackItem) => f.processed_at).sort((a: FeedbackItem, b: FeedbackItem) => 
      new Date(b.processed_at!).getTime() - new Date(a.processed_at!).getTime()
    )
    const lastProcessed = recentProcessed.length > 0 ? recentProcessed[0].processed_at : null

    return {
      total_feedback: totalFeedback,
      processed_feedback: processedFeedback.length,
      total_clusters: clusterCount,
      total_insights: insights.length,
      last_processed: lastProcessed
    }
  }
}
