import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

export class ProductRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async create(data: ProductInsert): Promise<Product> {
    const { data: result, error } = await this.supabase
      .from('products')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product: ${error.message}`);
    }

    return result as Product;
  }

  async findById(id: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      throw new Error(`Failed to find product by id: ${error.message}`);
    }

    return data as Product;
  }

  async findByCompanyId(companyId: string): Promise<Product[]> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find products by company id: ${error.message}`);
    }

    return data as Product[];
  }

  async findByNameAndCompany(name: string, companyId: string): Promise<Product | null> {
    const { data, error } = await this.supabase
      .from('products')
      .select('*')
      .eq('name', name)
      .eq('company_id', companyId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      throw new Error(`Failed to find product by name: ${error.message}`);
    }

    return data as Product;
  }

  async findMany(filters: { company_id?: string } = {}): Promise<Product[]> {
    let query = this.supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find products: ${error.message}`);
    }

    return data as Product[];
  }

  async update(id: string, data: Partial<ProductInsert>): Promise<Product> {
    const { data: result, error } = await this.supabase
      .from('products')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product: ${error.message}`);
    }

    return result as Product;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product: ${error.message}`);
    }
  }
}
