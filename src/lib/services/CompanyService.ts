import { SupabaseClient } from '@supabase/supabase-js';
import { CompanyRepository } from '@/lib/repositories/CompanyRepository';
import { Database } from '@/types/database';

type Company = Database['public']['Tables']['companies']['Row'];

export interface CreateCompanyData {
  name: string;
  industry?: string;
  size?: string;
  userId: string;
  createdByUserId?: string;
}

export class CompanyService {
  private companyRepository: CompanyRepository;

  constructor(supabase: SupabaseClient) {
    this.companyRepository = new CompanyRepository(supabase);
  }

  async getAllCompanies(): Promise<Company[]> {
    try {
      return await this.companyRepository.findAll();
    } catch (error) {
      throw new Error(`Failed to fetch companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompaniesForUser(userId: string): Promise<Company[]> {
    try {
      return await this.companyRepository.findAllForUser(userId);
    } catch (error) {
      throw new Error(`Failed to fetch companies for user: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createCompany(data: CreateCompanyData): Promise<Company> {
    try {
      // Generate slug from name
      const slug = this.generateSlug(data.name);

      // Check if company with this slug already exists
      const existingCompany = await this.companyRepository.findBySlug(slug);
      if (existingCompany) {
        throw new Error('Company with this name already exists');
      }

      return await this.companyRepository.create({
        name: data.name,
        slug: slug,
        industry: data.industry,
        size: data.size,
        userId: data.userId
      });
    } catch (error) {
      throw new Error(`Failed to create company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompanyById(id: string): Promise<Company | null> {
    try {
      return await this.companyRepository.findById(id);
    } catch (error) {
      throw new Error(`Failed to fetch company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getCompanyBySlug(slug: string): Promise<Company | null> {
    try {
      return await this.companyRepository.findBySlug(slug);
    } catch (error) {
      throw new Error(`Failed to fetch company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .trim();
  }
}
