import { SupabaseClient } from '@supabase/supabase-js'
import { Database } from '@/types/database'

export class BaseRepository {
  protected supabase: SupabaseClient<Database>

  constructor(supabase: SupabaseClient<Database>) {
    this.supabase = supabase
  }

  // Common utility methods
  protected handleError(operation: string, tableName: string, error: any): never {
    throw new Error(`Failed to ${operation} ${tableName}: ${error.message}`)
  }

  protected async executeQuery<T>(queryFn: () => Promise<{ data: T | null; error: any }>, operation: string, tableName: string): Promise<T> {
    const { data, error } = await queryFn()
    
    if (error) {
      this.handleError(operation, tableName, error)
    }

    if (!data) {
      throw new Error(`No data returned for ${operation} on ${tableName}`)
    }

    return data
  }

  protected async executeQueryArray<T>(queryFn: () => Promise<{ data: T[] | null; error: any }>, operation: string, tableName: string): Promise<T[]> {
    const { data, error } = await queryFn()
    
    if (error) {
      this.handleError(operation, tableName, error)
    }

    return data || []
  }

  protected async executeQueryNullable<T>(queryFn: () => Promise<{ data: T | null; error: any }>, operation: string, tableName: string): Promise<T | null> {
    const { data, error } = await queryFn()
    
    if (error) {
      if (error.code === 'PGRST116') {
        return null // Record not found
      }
      this.handleError(operation, tableName, error)
    }

    return data
  }
}
