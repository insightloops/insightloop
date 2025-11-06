import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/types/database';

type ProductArea = Database['public']['Tables']['product_areas']['Row'];
type ProductAreaInsert = Database['public']['Tables']['product_areas']['Insert'];

export class ProductAreaRepository {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async create(data: ProductAreaInsert): Promise<ProductArea> {
    const { data: result, error } = await this.supabase
      .from('product_areas')
      .insert(data)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create product area: ${error.message}`);
    }

    return result as ProductArea;
  }

  async findById(id: string): Promise<ProductArea | null> {
    const { data, error } = await this.supabase
      .from('product_areas')
      .select('*')
      .eq('id', id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      throw new Error(`Failed to find product area by id: ${error.message}`);
    }

    return data as ProductArea;
  }

  async findByProductId(productId: string): Promise<ProductArea[]> {
    const { data, error } = await this.supabase
      .from('product_areas')
      .select('*')
      .eq('product_id', productId)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to find product areas by product id: ${error.message}`);
    }

    return data as ProductArea[];
  }

  async findByNameAndProduct(name: string, productId: string): Promise<ProductArea | null> {
    const { data, error } = await this.supabase
      .from('product_areas')
      .select('*')
      .eq('name', name)
      .eq('product_id', productId)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Record not found
      }
      throw new Error(`Failed to find product area by name: ${error.message}`);
    }

    return data as ProductArea;
  }

  async findMany(filters: { product_id?: string } = {}): Promise<ProductArea[]> {
    let query = this.supabase
      .from('product_areas')
      .select('*')
      .order('created_at', { ascending: false });

    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find product areas: ${error.message}`);
    }

    return data as ProductArea[];
  }

  async findHierarchical(filters: { product_id?: string } = {}): Promise<ProductArea[]> {
    let query = this.supabase
      .from('product_areas')
      .select('*')
      .order('parent_area_id', { ascending: true, nullsFirst: true })
      .order('name', { ascending: true });

    if (filters.product_id) {
      query = query.eq('product_id', filters.product_id);
    }

    const { data, error } = await query;

    if (error) {
      throw new Error(`Failed to find product areas hierarchically: ${error.message}`);
    }

    return data as ProductArea[];
  }

  async update(id: string, data: Partial<ProductAreaInsert>): Promise<ProductArea> {
    const { data: result, error } = await this.supabase
      .from('product_areas')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update product area: ${error.message}`);
    }

    return result as ProductArea;
  }

  async delete(id: string): Promise<void> {
    const { error } = await this.supabase
      .from('product_areas')
      .delete()
      .eq('id', id);

    if (error) {
      throw new Error(`Failed to delete product area: ${error.message}`);
    }
  }
}
