import { supabase } from '../supabase'
import { BaseRepository } from './BaseRepository'
import { Feature, FeatureInsert, FeatureUpdate, FeatureWithInsights } from '../../types'

export class FeatureRepository extends BaseRepository {
  private readonly tableName = 'features'

  constructor() {
    super(supabase)
  }

  /**
   * Get features by product area
   */
  async getByProductArea(productAreaId: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('product_area_id', productAreaId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get features by product area: ${error.message}`)
    }
  }

  /**
   * Get features by company
   */
  async getByCompany(companyId: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(id, name)
          )
        `)
        .eq('company_id', companyId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get features by company: ${error.message}`)
    }
  }

  /**
   * Get features with insights and product area info
   */
  async getWithInsights(id: string): Promise<FeatureWithInsights | null> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            description,
            keywords,
            product:products(
              id,
              name,
              company:companies(id, name, slug)
            )
          ),
          insights:insight_feature_links(
            impact_score,
            insight:insights(
              id,
              theme,
              description,
              insight_score,
              evidence_strength,
              created_at
            )
          )
        `)
        .eq('id', id)
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to get feature with insights: ${error.message}`)
    }
  }

  /**
   * Get features by status
   */
  async getByStatus(status: string, companyId?: string): Promise<Feature[]> {
    try {
      let query = supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(id, name)
          )
        `)
        .eq('status', status)

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get features by status: ${error.message}`)
    }
  }

  /**
   * Get features by priority
   */
  async getByPriority(priority: string, companyId?: string): Promise<Feature[]> {
    try {
      let query = supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(id, name)
          )
        `)
        .eq('priority', priority)

      if (companyId) {
        query = query.eq('company_id', companyId)
      }

      const { data, error } = await query
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get features by priority: ${error.message}`)
    }
  }

  /**
   * Update feature status
   */
  async updateStatus(id: string, status: string): Promise<Feature> {
    try {
      const { data, error } = await supabase
        .from('features')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to update feature status: ${error.message}`)
    }
  }

  /**
   * Update feature priority
   */
  async updatePriority(id: string, priority: string): Promise<Feature> {
    try {
      const { data, error } = await supabase
        .from('features')
        .update({ 
          priority,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to update feature priority: ${error.message}`)
    }
  }

  /**
   * Bulk update feature statuses
   */
  async bulkUpdateStatus(ids: string[], status: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .update({ 
          status,
          updated_at: new Date().toISOString()
        })
        .in('id', ids)
        .select()

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to bulk update feature status: ${error.message}`)
    }
  }

  /**
   * Get a feature by ID
   */
  async getById(id: string): Promise<Feature | null> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        if (error.code === 'PGRST116') return null
        throw error
      }
      return data
    } catch (error: any) {
      throw new Error(`Failed to get feature by ID: ${error.message}`)
    }
  }

  /**
   * Create a new feature
   */
  async create(featureData: FeatureInsert & {
    userId: string
    createdByUserId?: string
    assignedToUserId?: string
  }): Promise<Feature> {
    try {
      const insertData: FeatureInsert = {
        ...featureData,
        user_id: featureData.createdByUserId || featureData.userId
      }

      const { data, error } = await supabase
        .from('features')
        .insert(insertData)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to create feature: ${error.message}`)
    }
  }

  /**
   * Get features assigned to a user
   */
  async getAssignedToUser(userId: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(
              id,
              name,
              company:companies(id, name)
            )
          )
        `)
        .eq('assigned_to_user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get assigned features: ${error.message}`)
    }
  }

  /**
   * Get features created by a user
   */
  async getCreatedByUser(userId: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(
              id,
              name,
              company:companies(id, name)
            )
          )
        `)
        .eq('created_by_user_id', userId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get created features: ${error.message}`)
    }
  }

  /**
   * Get features owned by a user
   */
  async getOwnedByUser(userId: string): Promise<Feature[]> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(
              id,
              name,
              company:companies(id, name)
            )
          )
        `)
        .eq('user_id', userId)
        .order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      if (error) throw error
      return data || []
    } catch (error: any) {
      throw new Error(`Failed to get owned features: ${error.message}`)
    }
  }

  /**
   * Assign feature to user
   */
  async assignToUser(featureId: string, assignedUserId: string, currentUserId: string): Promise<Feature> {
    try {
      // First verify user has permission to assign
      const feature = await this.getById(featureId)
      if (!feature) {
        throw new Error('Feature not found')
      }

      if (feature.user_id !== currentUserId) {
        throw new Error('Insufficient permissions to assign feature')
      }

      const { data, error } = await supabase
        .from('features')
        .update({ assigned_to_user_id: assignedUserId })
        .eq('id', featureId)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to assign feature: ${error.message}`)
    }
  }

  /**
   * Update a feature
   */
  async update(id: string, updates: FeatureUpdate, userId: string): Promise<Feature> {
    try {
      // First verify user has permission to update
      const feature = await this.getById(id)
      if (!feature) {
        throw new Error('Feature not found')
      }

      if (feature.user_id !== userId) {
        throw new Error('Insufficient permissions to update feature')
      }

      const { data, error } = await supabase
        .from('features')
        .update(updates)
        .eq('id', id)
        .select()
        .single()

      if (error) throw error
      return data
    } catch (error: any) {
      throw new Error(`Failed to update feature: ${error.message}`)
    }
  }

  /**
   * Delete a feature
   */
  async delete(id: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', id)

      if (error) throw error
    } catch (error: any) {
      throw new Error(`Failed to delete feature: ${error.message}`)
    }
  }

  /**
   * Get feature metrics for a company
   */
  async getMetrics(companyId: string): Promise<{
    total: number
    by_status: Record<string, number>
    by_priority: Record<string, number>
    avg_effort_score: number
    avg_business_value: number
  }> {
    try {
      const { data, error } = await supabase
        .from('features')
        .select('status, priority, effort_score, business_value')
        .eq('company_id', companyId)

      if (error) throw error

      const features = data || []
      const total = features.length

      const by_status = features.reduce((acc, feature) => {
        acc[feature.status] = (acc[feature.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const by_priority = features.reduce((acc, feature) => {
        acc[feature.priority] = (acc[feature.priority] || 0) + 1
        return acc
      }, {} as Record<string, number>)

      const avg_effort_score = features.reduce((sum, f) => sum + (f.effort_score || 0), 0) / total || 0
      const avg_business_value = features.reduce((sum, f) => sum + (f.business_value || 0), 0) / total || 0

      return {
        total,
        by_status,
        by_priority,
        avg_effort_score: Math.round(avg_effort_score * 100) / 100,
        avg_business_value: Math.round(avg_business_value * 100) / 100
      }
    } catch (error: any) {
      throw new Error(`Failed to get feature metrics: ${error.message}`)
    }
  }

  /**
   * Search features with advanced filtering
   */
  async search(options: {
    query?: string
    companyId?: string
    productId?: string
    productAreaId?: string
    status?: string[]
    priority?: string[]
    effortScoreMin?: number
    effortScoreMax?: number
    businessValueMin?: number
    businessValueMax?: number
    createdAfter?: string
    createdBefore?: string
    limit?: number
    offset?: number
  }): Promise<{ features: Feature[], total: number }> {
    try {
      let query = supabase
        .from('features')
        .select(`
          *,
          product_area:product_areas(
            id,
            name,
            product:products(id, name, company:companies(id, name))
          )
        `, { count: 'exact' })

      // Text search across name and description with proper sanitization
      if (options.query) {
        const sanitizedQuery = options.query.replace(/[^\w\s-]/g, '').trim()
        if (sanitizedQuery) {
          // Use Supabase's safe text search instead of direct interpolation
          query = query.or(`name.ilike.%${sanitizedQuery}%,description.ilike.%${sanitizedQuery}%`)
        }
      }

      // Filter by company
      if (options.companyId) {
        query = query.eq('company_id', options.companyId)
      }

      // Filter by product (via product area)
      if (options.productId) {
        query = query.eq('product_areas.product_id', options.productId)
      }

      // Filter by product area
      if (options.productAreaId) {
        query = query.eq('product_area_id', options.productAreaId)
      }

      // Filter by status
      if (options.status && options.status.length > 0) {
        query = query.in('status', options.status)
      }

      // Filter by priority
      if (options.priority && options.priority.length > 0) {
        query = query.in('priority', options.priority)
      }

      // Filter by effort score range
      if (options.effortScoreMin !== undefined) {
        query = query.gte('effort_score', options.effortScoreMin)
      }
      if (options.effortScoreMax !== undefined) {
        query = query.lte('effort_score', options.effortScoreMax)
      }

      // Filter by business value range
      if (options.businessValueMin !== undefined) {
        query = query.gte('business_value', options.businessValueMin)
      }
      if (options.businessValueMax !== undefined) {
        query = query.lte('business_value', options.businessValueMax)
      }

      // Filter by date range
      if (options.createdAfter) {
        query = query.gte('created_at', options.createdAfter)
      }
      if (options.createdBefore) {
        query = query.lte('created_at', options.createdBefore)
      }

      // Apply pagination
      if (options.limit) {
        query = query.limit(options.limit)
      }
      if (options.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 50)) - 1)
      }

      // Order results by relevance (priority first, then created date)
      query = query.order('priority', { ascending: false })
        .order('created_at', { ascending: false })

      const { data, error, count } = await query

      if (error) throw error

      return {
        features: data || [],
        total: count || 0
      }
    } catch (error: any) {
      throw new Error(`Failed to search features: ${error.message}`)
    }
  }

  /**
   * Get global search suggestions (for autocomplete)
   */
  async getSearchSuggestions(query: string, companyId?: string, limit = 5): Promise<string[]> {
    try {
      let supabaseQuery = supabase
        .from('features')
        .select('name')
        .ilike('name', `%${query}%`)

      if (companyId) {
        supabaseQuery = supabaseQuery.eq('company_id', companyId)
      }

      const { data, error } = await supabaseQuery
        .limit(limit)
        .order('created_at', { ascending: false })

      if (error) throw error

      return (data || []).map(item => item.name)
    } catch (error: any) {
      throw new Error(`Failed to get search suggestions: ${error.message}`)
    }
  }
}
