import { SupabaseClient } from '@supabase/supabase-js';
import { ProductRepository } from '@/lib/repositories/ProductRepository';
import { Database } from '@/types/database';

type Product = Database['public']['Tables']['products']['Row'];

export interface CreateProductData {
  name: string;
  company_id: string;
  description?: string;
  metadata?: Record<string, any>;
}

export class ProductService {
  private productRepository: ProductRepository;

  constructor(supabase: SupabaseClient) {
    this.productRepository = new ProductRepository(supabase);
  }

  async getAllProducts(companyId?: string): Promise<Product[]> {
    try {
      const filters = companyId ? { company_id: companyId } : {};
      return await this.productRepository.findMany(filters);
    } catch (error) {
      throw new Error(`Failed to fetch products: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createProduct(data: CreateProductData): Promise<Product> {
    try {
      // Check if product with this name already exists for this company
      const existingProduct = await this.productRepository.findByNameAndCompany(
        data.name,
        data.company_id
      );
      
      if (existingProduct) {
        throw new Error('Product with this name already exists for this company');
      }

      return await this.productRepository.create({
        name: data.name,
        company_id: data.company_id,
        description: data.description || null,
        metadata: data.metadata || {}
      });
    } catch (error) {
      throw new Error(`Failed to create product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductById(id: string): Promise<Product | null> {
    try {
      return await this.productRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getProductsByCompany(companyId: string): Promise<Product[]> {
    try {
      return await this.productRepository.findByCompanyId(companyId);
    } catch (error) {
      throw new Error(`Failed to fetch products for company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async updateProduct(id: string, data: Partial<CreateProductData>): Promise<Product> {
    try {
      return await this.productRepository.update(id, data);
    } catch (error) {
      throw new Error(`Failed to update product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async deleteProduct(id: string): Promise<void> {
    try {
      await this.productRepository.delete(id);
    } catch (error) {
      throw new Error(`Failed to delete product: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}
