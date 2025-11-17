import { SupabaseClient } from '@supabase/supabase-js'
import { Insight, InsightWithEvidence, FeedbackItem } from '@/types'

export class InsightRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async create(data: {
    company_id: string
    title: string
    summary: string
    theme?: string
    segment_context?: Record<string, any>
    insight_score?: number
    urgency_score?: number
    volume_score?: number
    value_alignment_score?: number
    status?: string
  }): Promise<Insight> {
    const { data: result, error } = await this.supabase
      .from('insights')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create insight: ${error.message}`)
    }

    return result as Insight
  }

  async findById(id: string): Promise<Insight | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find insight: ${error.message}`)
    }

    return data as Insight
  }

  async findByIdWithEvidence(id: string): Promise<InsightWithEvidence | null> {
    const { data, error } = await this.supabase
      .from('insights')
      .select(`
        *,
        insight_feedback_links!inner(
          relevance_score,
          feedback_items(*)
        )
      `)
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find insight with evidence: ${error.message}`)
    }

    // Transform the data to match our expected structure
    const insight = {
      ...data,
      feedback_items: data.insight_feedback_links?.map((link: any) => link.feedback_items) || []
    } as InsightWithEvidence

    // Remove the raw join data
    delete (insight as any).insight_feedback_links

    return insight
  }

  async findByCompanyId(
    companyId: string,
    filters?: {
      theme?: string[]
      status?: string[]
      min_score?: number
      max_score?: number
    },
    limit?: number,
    offset?: number
  ): Promise<Insight[]> {
    let query = this.supabase
      .from('insights')
      .select('*')
      .eq('company_id', companyId)

    if (filters?.theme?.length) {
      query = query.in('theme', filters.theme)
    }
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters?.min_score !== undefined) {
      query = query.gte('insight_score', filters.min_score)
    }
    if (filters?.max_score !== undefined) {
      query = query.lte('insight_score', filters.max_score)
    }

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    query = query.order('insight_score', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to find insights: ${error.message}`)
    }

    return (data || []) as Insight[]
  }

  async update(id: string, data: {
    title?: string
    summary?: string
    theme?: string
    segment_context?: Record<string, any>
    insight_score?: number
    urgency_score?: number
    volume_score?: number
    value_alignment_score?: number
    status?: string
  }): Promise<Insight> {
    const { data: result, error } = await this.supabase
      .from('insights')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update insight: ${error.message}`)
    }

    return result as Insight
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('insights')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete insight: ${error.message}`)
    }
  }

  async linkToFeedback(insightId: string, feedbackId: string, relevanceScore: number = 1.0): Promise<void> {
    const { error } = await this.supabase
      .from('insight_feedback_links')
      .insert({
        insight_id: insightId,
        feedback_id: feedbackId,
        relevance_score: relevanceScore
      })

    if (error) {
      throw new Error(`Failed to link insight to feedback: ${error.message}`)
    }
  }

  async unlinkFromFeedback(insightId: string, feedbackId: string): Promise<void> {
    const { error } = await this.supabase
      .from('insight_feedback_links')
      .delete()
      .eq('insight_id', insightId)
      .eq('feedback_id', feedbackId)

    if (error) {
      throw new Error(`Failed to unlink insight from feedback: ${error.message}`)
    }
  }

  async linkToFeature(insightId: string, featureId: string, impactScore: number = 1.0): Promise<void> {
    const { error } = await this.supabase
      .from('insight_feature_links')
      .insert({
        insight_id: insightId,
        feature_id: featureId,
        impact_score: impactScore
      })

    if (error) {
      throw new Error(`Failed to link insight to feature: ${error.message}`)
    }
  }

  async linkToObjective(insightId: string, objectiveId: string, alignmentScore: number = 1.0): Promise<void> {
    const { error } = await this.supabase
      .from('insight_objective_links')
      .insert({
        insight_id: insightId,
        objective_id: objectiveId,
        alignment_score: alignmentScore
      })

    if (error) {
      throw new Error(`Failed to link insight to objective: ${error.message}`)
    }
  }

  async countByCompanyId(
    companyId: string,
    filters?: {
      theme?: string[]
      status?: string[]
      min_score?: number
      max_score?: number
    }
  ): Promise<number> {
    let query = this.supabase
      .from('insights')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if (filters?.theme?.length) {
      query = query.in('theme', filters.theme)
    }
    if (filters?.status?.length) {
      query = query.in('status', filters.status)
    }
    if (filters?.min_score !== undefined) {
      query = query.gte('insight_score', filters.min_score)
    }
    if (filters?.max_score !== undefined) {
      query = query.lte('insight_score', filters.max_score)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count insights: ${error.message}`)
    }

    return count || 0
  }

  async getDistinctThemes(companyId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('theme')
      .eq('company_id', companyId)
      .not('theme', 'is', null)

    if (error) {
      throw new Error(`Failed to get distinct themes: ${error.message}`)
    }

    const themes = [...new Set((data || []).map(item => item.theme).filter(Boolean))]
    return themes
  }

  async getTopInsights(companyId: string, limit: number = 10): Promise<Insight[]> {
    const { data, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .order('insight_score', { ascending: false })
      .limit(limit)

    if (error) {
      throw new Error(`Failed to get top insights: ${error.message}`)
    }

    return (data || []) as Insight[]
  }

  // Pipeline-specific methods

  // Create insight from cluster analysis
  async createFromCluster(data: {
    company_id: string
    cluster_id: string
    title: string
    summary: string
    theme: string
    insight_score: number
    urgency_score: number
    volume_score: number
    value_alignment_score: number
    segment_context?: Record<string, any>
    evidence_feedback_ids: string[]
  }): Promise<Insight> {
    // Start a transaction to create insight and link evidence
    const { data: insight, error: insightError } = await this.supabase
      .from('insights')
      .insert({
        company_id: data.company_id,
        title: data.title,
        summary: data.summary,
        theme: data.theme,
        insight_score: data.insight_score,
        urgency_score: data.urgency_score,
        volume_score: data.volume_score,
        value_alignment_score: data.value_alignment_score,
        segment_context: data.segment_context || {},
        status: 'active'
      })
      .select()
      .single()

    if (insightError) {
      throw new Error(`Failed to create insight from cluster: ${insightError.message}`)
    }

    // Link evidence feedback items
    if (data.evidence_feedback_ids.length > 0) {
      const evidenceLinks = data.evidence_feedback_ids.map(feedbackId => ({
        insight_id: insight.id,
        feedback_id: feedbackId
      }))

      const { error: evidenceError } = await this.supabase
        .from('insight_evidence')
        .insert(evidenceLinks)

      if (evidenceError) {
        console.error('Error linking evidence to insight:', evidenceError)
        // Don't throw here - insight was created successfully
      }
    }

    return insight as Insight
  }

  // Update insight scores (for pipeline re-processing)
  async updateScores(insightId: string, scores: {
    insight_score?: number
    urgency_score?: number
    volume_score?: number
    value_alignment_score?: number
  }): Promise<boolean> {
    const { error } = await this.supabase
      .from('insights')
      .update(scores)
      .eq('id', insightId)

    if (error) {
      console.error('Error updating insight scores:', error)
      return false
    }

    return true
  }

  // Get insights that need re-scoring (based on age or feedback volume)
  async getForReProcessing(
    companyId: string,
    daysOld: number = 30,
    minNewFeedback: number = 10
  ): Promise<Insight[]> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await this.supabase
      .from('insights')
      .select(`
        *,
        insight_evidence (
          feedback_id,
          feedback_items!inner (
            id,
            created_at
          )
        )
      `)
      .eq('company_id', companyId)
      .eq('status', 'active')
      .lt('updated_at', cutoffDate.toISOString())

    if (error) {
      throw new Error(`Failed to get insights for reprocessing: ${error.message}`)
    }

    // Filter insights with significant new feedback
    const insightsToReprocess = (data || []).filter(insight => {
      const evidenceItems = (insight as any).insight_evidence || []
      const recentFeedback = evidenceItems.filter((evidence: any) => 
        new Date(evidence.feedback_items.created_at) > cutoffDate
      )
      return recentFeedback.length >= minNewFeedback
    })

    return insightsToReprocess as Insight[]
  }

  // Archive insights that are no longer relevant
  async archiveStaleInsights(
    companyId: string,
    daysOld: number = 90,
    minScore: number = 0.3
  ): Promise<number> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - daysOld)

    const { data, error } = await this.supabase
      .from('insights')
      .update({ status: 'archived' })
      .eq('company_id', companyId)
      .eq('status', 'active')
      .lt('updated_at', cutoffDate.toISOString())
      .lt('insight_score', minScore)
      .select('id')

    if (error) {
      throw new Error(`Failed to archive stale insights: ${error.message}`)
    }

    return data?.length || 0
  }

  // Get insight performance metrics
  async getMetrics(companyId: string, days: number = 30): Promise<{
    total_insights: number
    avg_insight_score: number
    avg_urgency_score: number
    avg_volume_score: number
    avg_value_alignment_score: number
    top_themes: Array<{ theme: string; count: number; avg_score: number }>
  }> {
    const cutoffDate = new Date()
    cutoffDate.setDate(cutoffDate.getDate() - days)

    // Get basic metrics
    const { data: insights, error } = await this.supabase
      .from('insights')
      .select('*')
      .eq('company_id', companyId)
      .eq('status', 'active')
      .gte('created_at', cutoffDate.toISOString())

    if (error) {
      throw new Error(`Failed to get insight metrics: ${error.message}`)
    }

    const insightData = insights || []
    
    // Calculate averages
    const totalInsights = insightData.length
    const avgInsightScore = totalInsights > 0 
      ? insightData.reduce((sum, i) => sum + (i.insight_score || 0), 0) / totalInsights 
      : 0
    const avgUrgencyScore = totalInsights > 0 
      ? insightData.reduce((sum, i) => sum + (i.urgency_score || 0), 0) / totalInsights 
      : 0
    const avgVolumeScore = totalInsights > 0 
      ? insightData.reduce((sum, i) => sum + (i.volume_score || 0), 0) / totalInsights 
      : 0
    const avgValueAlignmentScore = totalInsights > 0 
      ? insightData.reduce((sum, i) => sum + (i.value_alignment_score || 0), 0) / totalInsights 
      : 0

    // Calculate theme statistics
    const themeStats = new Map<string, { count: number; totalScore: number }>()
    insightData.forEach(insight => {
      if (insight.theme) {
        const existing = themeStats.get(insight.theme) || { count: 0, totalScore: 0 }
        themeStats.set(insight.theme, {
          count: existing.count + 1,
          totalScore: existing.totalScore + (insight.insight_score || 0)
        })
      }
    })

    const topThemes = Array.from(themeStats.entries())
      .map(([theme, stats]) => ({
        theme,
        count: stats.count,
        avg_score: stats.count > 0 ? stats.totalScore / stats.count : 0
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)

    return {
      total_insights: totalInsights,
      avg_insight_score: avgInsightScore,
      avg_urgency_score: avgUrgencyScore,
      avg_volume_score: avgVolumeScore,
      avg_value_alignment_score: avgValueAlignmentScore,
      top_themes: topThemes
    }
  }
}
