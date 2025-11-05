import { SupabaseClient } from '@supabase/supabase-js'
import { Company } from '@/types/database'

export class CompanyRepository {
  private supabase: SupabaseClient

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase
  }

  async create(data: {
    name: string
    slug: string
    industry?: string
    size?: string
  }): Promise<Company> {
    const { data: result, error } = await this.supabase
      .from('companies')
      .insert(data)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to create company: ${error.message}`)
    }

    return result as Company
  }

  async findById(id: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('id', id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Record not found
      }
      throw new Error(`Failed to find company by id: ${error.message}`)
    }

    return data as Company
  }

  async findBySlug(slug: string): Promise<Company | null> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('slug', slug)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return null // Record not found
      }
      throw new Error(`Failed to find company by slug: ${error.message}`)
    }

    return data as Company
  }

  async findMany(filters?: {
    industry?: string
    size?: string
  }, limit?: number, offset?: number): Promise<Company[]> {
    let query = this.supabase
      .from('companies')
      .select('*')

    if (filters?.industry) {
      query = query.eq('industry', filters.industry)
    }
    if (filters?.size) {
      query = query.eq('size', filters.size)
    }

    if (limit) {
      query = query.limit(limit)
    }
    if (offset) {
      query = query.range(offset, offset + (limit || 10) - 1)
    }

    query = query.order('created_at', { ascending: false })

    const { data, error } = await query

    if (error) {
      throw new Error(`Failed to find companies: ${error.message}`)
    }

    return (data || []) as Company[]
  }

  async update(id: string, data: {
    name?: string
    slug?: string
    industry?: string
    size?: string
  }): Promise<Company> {
    const { data: result, error } = await this.supabase
      .from('companies')
      .update(data)
      .eq('id', id)
      .select()
      .single()

    if (error) {
      throw new Error(`Failed to update company: ${error.message}`)
    }

    return result as Company
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('companies')
      .delete()
      .eq('id', id)

    if (error) {
      throw new Error(`Failed to delete company: ${error.message}`)
    }
  }

  async count(filters?: {
    industry?: string
    size?: string
  }): Promise<number> {
    let query = this.supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    if (filters?.industry) {
      query = query.eq('industry', filters.industry)
    }
    if (filters?.size) {
      query = query.eq('size', filters.size)
    }

    const { count, error } = await query

    if (error) {
      throw new Error(`Failed to count companies: ${error.message}`)
    }

    return count || 0
  }
}
