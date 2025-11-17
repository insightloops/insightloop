import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type FeedbackItem = Database['public']['Tables']['feedback_items']['Row']
type FeedbackInsert = Database['public']['Tables']['feedback_items']['Insert']

export class FeedbackRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async create(data: FeedbackInsert): Promise<FeedbackItem> {
    const { data: result, error } = await this.supabase
      .from('feedback_items')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create feedback item: ${error.message}`)
    }

    return result as FeedbackItem
  }

  async createMany(items: FeedbackInsert[]): Promise<FeedbackItem[]> {
    const { data: result, error } = await this.supabase
      .from('feedback_items')
      .insert(items)
      .select()

    if (error) {
      throw new Error(`Failed to create feedback items: ${error.message}`)
    }

    return (result || []) as FeedbackItem[]
  }

  async findById(id: string): Promise<FeedbackItem | null> {
    const { data, error } = await this.supabase
      .from('feedback_items')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null
      }
      throw new Error(`Failed to find feedback item: ${error.message}`)
    }

    return data as FeedbackItem
  }

  async findByCompanyId(
    companyId: string,
    filters?: {
      source?: string[]
      sentiment?: string[]
      product_area?: string[]
      date_from?: string
      date_to?: string
    },
    limit?: number,
    offset?: number
  ): Promise<FeedbackItem[]> {
    let query = this.supabase
      .from('feedback_items')
      .select('*')
      .eq('company_id', companyId)

    if (filters?.source?.length) {
      query = query.in('source', filters.source)
    }
    if (filters?.sentiment?.length) {
      query = query.in('sentiment', filters.sentiment)
    }
    if (filters?.product_area?.length) {
      query = query.in('product_area', filters.product_area)
    }
    if (filters?.date_from) {
      query = query.gte('submitted_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('submitted_at', filters.date_to)
    }

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    query = query.order('submitted_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to find feedback items: ${error.message}`)
    }

    return (data || []) as FeedbackItem[]
  }

  async update(id: string, data: {
    content?: string
    sentiment?: string
    product_area?: string
    user_metadata?: Record<string, any>
    processed_at?: string
  }): Promise<FeedbackItem> {
    const { data: result, error } = await this.supabase
      .from('feedback_items')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update feedback item: ${error.message}`)
    }

    return result as FeedbackItem
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('feedback_items')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete feedback item: ${error.message}`)
    }
  }

  async countByCompanyId(
    companyId: string,
    filters?: {
      source?: string[]
      sentiment?: string[]
      product_area?: string[]
      date_from?: string
      date_to?: string
    }
  ): Promise<number> {
    let query = this.supabase
      .from('feedback_items')
      .select('id', { count: 'exact', head: true })
      .eq('company_id', companyId)

    if (filters?.source?.length) {
      query = query.in('source', filters.source)
    }
    if (filters?.sentiment?.length) {
      query = query.in('sentiment', filters.sentiment)
    }
    if (filters?.product_area?.length) {
      query = query.in('product_area', filters.product_area)
    }
    if (filters?.date_from) {
      query = query.gte('submitted_at', filters.date_from)
    }
    if (filters?.date_to) {
      query = query.lte('submitted_at', filters.date_to)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count feedback items: ${error.message}`)
    }

    return count || 0
  }

  async getDistinctSources(companyId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('feedback_items')
      .select('source')
      .eq('company_id', companyId)
      .not('source', 'is', null)

    if (error) {
      throw new Error(`Failed to get distinct sources: ${error.message}`)
    }

    const sources = [...new Set((data || []).map(item => item.source))]
    return sources
  }

  async getDistinctProductAreas(companyId: string): Promise<string[]> {
    const { data, error } = await this.supabase
      .from('feedback_items')
      .select('product_area')
      .eq('company_id', companyId)
      .not('product_area', 'is', null)

    if (error) {
      throw new Error(`Failed to get distinct product areas: ${error.message}`)
    }

    const areas = [...new Set((data || []).map(item => item.product_area).filter(Boolean))]
    return areas
  }

  // Pipeline-specific methods

  // Batch create feedback items (for CSV upload)
  async bulkCreate(feedbackArray: Array<{
    company_id: string
    source: string
    content: string
    sentiment?: string
    product_area?: string
    user_metadata?: Record<string, any>
    submitted_at?: string
  }>): Promise<FeedbackItem[]> {
    const { data, error } = await this.supabase
      .from('feedback_items')
      .insert(feedbackArray)
      .select()

    if (error) {
      throw new Error(`Failed to bulk create feedback items: ${error.message}`)
    }

    return data as FeedbackItem[]
  }

  // Get enriched feedback with all relationships
  async getEnriched(id: string): Promise<any> {
    const { data, error } = await this.supabase
      .from('feedback_enriched')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      throw new Error(`Failed to get enriched feedback: ${error.message}`)
    }

    return data
  }

  // Update processed timestamp and enrichment status
  async updateProcessedAt(feedbackId: string): Promise<boolean> {
    const { error } = await this.supabase
      .from('feedback_items')
      .update({ 
        processed_at: new Date().toISOString(),
        enriched_at: new Date().toISOString(),
        enrichment_version: 1
      })
      .eq('id', feedbackId)

    if (error) {
      console.error('Error updating processed timestamp:', error)
      return false
    }

    return true
  }

  // Link feedback to product area (many-to-many)
  async addProductArea(
    feedbackId: string, 
    productAreaId: string, 
    confidence: number = 1.0,
    taggedBy: 'ai' | 'manual' = 'ai'
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('feedback_product_areas')
      .insert({
        feedback_id: feedbackId,
        product_area_id: productAreaId,
        confidence_score: confidence,
        tagged_by: taggedBy
      })

    if (error) {
      console.error('Error linking feedback to product area:', error)
      return false
    }

    return true
  }

  // Link feedback to feature (many-to-many)
  async addFeature(
    feedbackId: string, 
    featureId: string, 
    confidence: number = 1.0,
    taggedBy: 'ai' | 'manual' = 'ai'
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('feedback_features')
      .insert({
        feedback_id: feedbackId,
        feature_id: featureId,
        confidence_score: confidence,
        tagged_by: taggedBy
      })

    if (error) {
      console.error('Error linking feedback to feature:', error)
      return false
    }

    return true
  }

  // Add feedback to cluster (many-to-many)
  async addToCluster(
    feedbackId: string,
    clusterId: string,
    similarityScore?: number
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('cluster_memberships')
      .insert({
        feedback_id: feedbackId,
        cluster_id: clusterId,
        similarity_score: similarityScore
      })

    if (error) {
      console.error('Error adding feedback to cluster:', error)
      return false
    }

    return true
  }

  // Get feedback items in a cluster
  async getByCluster(clusterId: string): Promise<FeedbackItem[]> {
    const { data, error } = await this.supabase
      .from('cluster_memberships')
      .select(`
        feedback_id,
        similarity_score,
        feedback_items (*)
      `)
      .eq('cluster_id', clusterId)
      .order('similarity_score', { ascending: false })

    if (error) {
      throw new Error(`Failed to get feedback by cluster: ${error.message}`)
    }

    // Extract feedback items from the joined data
    return data?.map(item => (item as any).feedback_items).filter(Boolean) || []
  }
}
