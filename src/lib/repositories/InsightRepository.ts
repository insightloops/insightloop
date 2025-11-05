import { SupabaseClient } from '@supabase/supabase-js'
import { Insight, InsightWithEvidence, FeedbackItem } from '@/types/database'

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
}
