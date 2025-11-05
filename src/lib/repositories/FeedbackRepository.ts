import { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackItem } from '@/types/database'

export class FeedbackRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async create(data: {
    company_id: string
    source: string
    content: string
    sentiment?: string
    product_area?: string
    user_metadata?: Record<string, any>
    submitted_at?: string
  }): Promise<FeedbackItem> {
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

  async createMany(items: Array<{
    company_id: string
    source: string
    content: string
    sentiment?: string
    product_area?: string
    user_metadata?: Record<string, any>
    submitted_at?: string
  }>): Promise<FeedbackItem[]> {
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
}
