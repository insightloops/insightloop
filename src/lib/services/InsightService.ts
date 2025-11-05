import { SupabaseClient } from '@supabase/supabase-js'
import { InsightRepository } from '@/lib/repositories/InsightRepository'
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { Insight, InsightWithEvidence, FeedbackItem } from '@/types/database'

export class InsightService {
  private insightRepository: InsightRepository
  private feedbackRepository: FeedbackRepository

  constructor(supabase: SupabaseClient) {
    this.insightRepository = new InsightRepository(supabase)
    this.feedbackRepository = new FeedbackRepository(supabase)
  }

  async generateInsightsFromFeedback(
    companyId: string,
    options?: {
      minFeedbackCount?: number
      themes?: string[]
    }
  ): Promise<Insight[]> {
    try {
      // Get all unprocessed feedback for the company
      const feedback = await this.feedbackRepository.findByCompanyId(companyId, {}, 1000) // Process up to 1000 items

      if (feedback.length < (options?.minFeedbackCount || 5)) {
        throw new Error(`Insufficient feedback items. Need at least ${options?.minFeedbackCount || 5} items to generate insights.`)
      }

      // Group feedback by themes (simplified clustering)
      const themes = this.clusterFeedbackByThemes(feedback)
      
      // Generate insights for each theme
      const insights: Insight[] = []
      
      for (const [theme, feedbackItems] of Object.entries(themes)) {
        if (feedbackItems.length >= (options?.minFeedbackCount || 5)) {
          const insight = await this.createInsightFromTheme(companyId, theme, feedbackItems)
          insights.push(insight)
          
          // Link feedback to insight
          for (const feedbackItem of feedbackItems) {
            await this.insightRepository.linkToFeedback(insight.id, feedbackItem.id, 1.0)
          }
        }
      }

      return insights
    } catch (error) {
      throw new Error(`Failed to generate insights: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getInsightsByCompany(
    companyId: string,
    filters?: {
      theme?: string[]
      status?: string[]
      min_score?: number
      max_score?: number
    },
    pagination?: {
      page: number
      limit: number
    }
  ): Promise<{
    data: Insight[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.insightRepository.findByCompanyId(companyId, filters, limit, offset),
      this.insightRepository.countByCompanyId(companyId, filters)
    ])

    return {
      data,
      total,
      page,
      limit,
      hasMore: offset + data.length < total
    }
  }

  async getInsightWithEvidence(id: string): Promise<InsightWithEvidence | null> {
    return this.insightRepository.findByIdWithEvidence(id)
  }

  async getTopInsights(companyId: string, limit: number = 10): Promise<Insight[]> {
    return this.insightRepository.getTopInsights(companyId, limit)
  }

  async updateInsightScore(
    id: string,
    scores: {
      insight_score?: number
      urgency_score?: number
      volume_score?: number
      value_alignment_score?: number
    }
  ): Promise<Insight> {
    return this.insightRepository.update(id, scores)
  }

  async archiveInsight(id: string): Promise<Insight> {
    return this.insightRepository.update(id, { status: 'archived' })
  }

  async getInsightFilters(companyId: string): Promise<{
    themes: string[]
    statuses: string[]
  }> {
    const themes = await this.insightRepository.getDistinctThemes(companyId)
    
    return {
      themes,
      statuses: ['active', 'implemented', 'archived']
    }
  }

  private clusterFeedbackByThemes(feedback: FeedbackItem[]): Record<string, FeedbackItem[]> {
    // Simplified theme clustering based on keywords
    const themes: Record<string, FeedbackItem[]> = {}
    
    const themeKeywords = {
      onboarding: ['onboard', 'setup', 'getting started', 'first time', 'tutorial', 'welcome'],
      dashboard: ['dashboard', 'overview', 'main screen', 'home page', 'summary'],
      mobile: ['mobile', 'app', 'phone', 'ios', 'android', 'mobile app'],
      performance: ['slow', 'fast', 'performance', 'speed', 'lag', 'loading', 'response time'],
      ui_ux: ['interface', 'design', 'layout', 'ui', 'ux', 'user experience', 'confusing', 'intuitive'],
      bugs: ['bug', 'error', 'crash', 'broken', 'not working', 'issue', 'problem'],
      features: ['feature', 'functionality', 'capability', 'tool', 'option'],
      support: ['help', 'support', 'documentation', 'guide', 'customer service']
    }

    for (const item of feedback) {
      const content = item.content.toLowerCase()
      let assigned = false

      // Try to match to existing themes
      for (const [theme, keywords] of Object.entries(themeKeywords)) {
        if (keywords.some(keyword => content.includes(keyword))) {
          if (!themes[theme]) {
            themes[theme] = []
          }
          themes[theme].push(item)
          assigned = true
          break
        }
      }

      // If no theme matched, use product area or create generic theme
      if (!assigned) {
        const theme = item.product_area || 'general'
        if (!themes[theme]) {
          themes[theme] = []
        }
        themes[theme].push(item)
      }
    }

    return themes
  }

  private async createInsightFromTheme(
    companyId: string,
    theme: string,
    feedbackItems: FeedbackItem[]
  ): Promise<Insight> {
    // Calculate sentiment distribution
    const sentiments = feedbackItems.reduce((acc, item) => {
      const sentiment = item.sentiment || 'neutral'
      acc[sentiment] = (acc[sentiment] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Calculate scores
    const totalFeedback = feedbackItems.length
    const negativeRatio = (sentiments.negative || 0) / totalFeedback
    const volumeScore = Math.min(totalFeedback / 100, 1) // Normalize to 0-1
    const urgencyScore = negativeRatio // Higher negative sentiment = higher urgency
    const valueAlignmentScore = 0.7 // Default value, would be calculated based on business rules
    const insightScore = (volumeScore * 0.3 + urgencyScore * 0.4 + valueAlignmentScore * 0.3)

    // Generate summary
    const summary = this.generateInsightSummary(theme, feedbackItems, sentiments)

    // Create segment context
    const segmentContext = this.buildSegmentContext(feedbackItems)

    return this.insightRepository.create({
      company_id: companyId,
      title: this.generateInsightTitle(theme, sentiments),
      summary,
      theme,
      segment_context: segmentContext,
      insight_score: insightScore,
      urgency_score: urgencyScore,
      volume_score: volumeScore,
      value_alignment_score: valueAlignmentScore,
      status: 'active'
    })
  }

  private generateInsightTitle(theme: string, sentiments: Record<string, number>): string {
    const total = Object.values(sentiments).reduce((sum, count) => sum + count, 0)
    const negativeRatio = (sentiments.negative || 0) / total

    if (negativeRatio > 0.6) {
      return `Critical ${theme} issues reported by users`
    } else if (negativeRatio > 0.3) {
      return `Mixed feedback on ${theme} experience`
    } else {
      return `Positive ${theme} feedback with improvement opportunities`
    }
  }

  private generateInsightSummary(
    theme: string,
    feedbackItems: FeedbackItem[],
    sentiments: Record<string, number>
  ): string {
    const total = feedbackItems.length
    const negativeCount = sentiments.negative || 0
    const positiveCount = sentiments.positive || 0
    
    let summary = `Based on ${total} feedback items related to ${theme}, `
    
    if (negativeCount > positiveCount) {
      summary += `users are experiencing significant challenges. ${negativeCount} negative reports indicate urgent attention needed.`
    } else if (positiveCount > negativeCount) {
      summary += `users are generally satisfied but there are opportunities for improvement. ${positiveCount} positive mentions with ${negativeCount} concerns to address.`
    } else {
      summary += `feedback is mixed with equal positive and negative sentiment. This suggests inconsistent user experience.`
    }

    return summary
  }

  private buildSegmentContext(feedbackItems: FeedbackItem[]): Record<string, any> {
    const context: Record<string, any> = {
      total_feedback: feedbackItems.length,
      sources: {},
      user_segments: {},
      time_range: {
        earliest: null,
        latest: null
      }
    }

    for (const item of feedbackItems) {
      // Count sources
      context.sources[item.source] = (context.sources[item.source] || 0) + 1

      // Analyze user metadata for segments
      if (item.user_metadata) {
        Object.entries(item.user_metadata).forEach(([key, value]) => {
          if (!context.user_segments[key]) {
            context.user_segments[key] = {}
          }
          context.user_segments[key][value] = (context.user_segments[key][value] || 0) + 1
        })
      }

      // Track time range
      if (item.submitted_at) {
        const date = new Date(item.submitted_at)
        if (!context.time_range.earliest || date < new Date(context.time_range.earliest)) {
          context.time_range.earliest = item.submitted_at
        }
        if (!context.time_range.latest || date > new Date(context.time_range.latest)) {
          context.time_range.latest = item.submitted_at
        }
      }
    }

    return context
  }
}
