import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

type Company = Database['public']['Tables']['companies']['Row']
type CompanyInsert = Database['public']['Tables']['companies']['Insert']

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
    userId: string
  }): Promise<Company> {
    const insertData = {
      name: data.name,
      slug: data.slug,
      industry: data.industry,
      size: data.size,
      user_id: data.userId
    }

    const { data: result, error } = await this.supabase
      .from('companies')
      .insert(insertData)
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

  async findAll(): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find companies: ${error.message}`)
    }

    return data as Company[]
  }

  async findAllForUser(userId: string): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find companies for user: ${error.message}`)
    }

    return data as Company[]
  }

  async findOwnedByUser(userId: string): Promise<Company[]> {
    const { data, error } = await this.supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error) {
      throw new Error(`Failed to find owned companies: ${error.message}`)
    }

    return data as Company[]
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

  async validateUserAccess(companyId: string, userId: string): Promise<boolean> {
    const company = await this.findById(companyId)
    if (!company) {
      return false
    }
    
    return company.user_id === userId
  }

  async count(filters?: {
    industry?: string
    size?: string
    userId?: string
  }): Promise<number> {
    let query = this.supabase
      .from('companies')
      .select('*', { count: 'exact', head: true })

    if (filters?.userId) {
      query = query.eq('user_id', filters.userId)
    }
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
