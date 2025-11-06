import { SupabaseClient } from '@supabase/supabase-js';
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository';
import { Database } from '@/types/database';

type ProductArea = Database['public']['Tables']['product_areas']['Row'];

export interface CreateProductAreaData {
  name: string;
  product_id: string;
  description?: string;
  parent_area_id?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
}

export class ProductAreaService {
  private productAreaRepository: ProductAreaRepository;

  constructor(supabase: SupabaseClient) {
    this.productAreaRepository = new ProductAreaRepository(supabase);
  }

  async getAllProductAreas(filters: { product_id?: string } = {}): Promise<ProductArea[]> {
    try {
      return await this.productAreaRepository.findMany(filters);
    } catch (error) {
      throw new Error(`Failed to fetch product areas: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductAreasHierarchical(filters: { product_id?: string } = {}): Promise<ProductArea[]> {
    try {
      return await this.productAreaRepository.findHierarchical(filters);
    } catch (error) {
      throw new Error(`Failed to fetch product areas hierarchically: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createProductArea(data: CreateProductAreaData): Promise<ProductArea> {
    try {
      // Check if product area with this name already exists for this product
      const existingProductArea = await this.productAreaRepository.findByNameAndProduct(
        data.name,
        data.product_id
      );
      
      if (existingProductArea) {
        throw new Error('Product area with this name already exists for this product');
      }

      return await this.productAreaRepository.create({
        name: data.name,
        product_id: data.product_id,
        description: data.description || null,
        parent_area_id: data.parent_area_id || null,
        keywords: data.keywords || [],
        metadata: data.metadata || {}
      });
    } catch (error) {
      throw new Error(`Failed to create product area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductAreaById(id: string): Promise<ProductArea | null> {
    try {
      return await this.productAreaRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch product area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductAreasByProduct(productId: string): Promise<ProductArea[]> {
    try {
      return await this.productAreaRepository.findByProductId(productId);
    } catch (error) {
      throw new Error(`Failed to fetch product areas for product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProductArea(id: string, data: Partial<CreateProductAreaData>): Promise<ProductArea> {
    try {
      return await this.productAreaRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update product area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProductArea(id: string): Promise<void> {
    try {
      await this.productAreaRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete product area: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
