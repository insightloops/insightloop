// Application-specific types that extend the auto-generated database types
import { Database } from './database'

// Base table types derived from database schema
export type Feature = Database['public']['Tables']['features']['Row']
export type Company = Database['public']['Tables']['companies']['Row']
export type ProductArea = Database['public']['Tables']['product_areas']['Row']
export type FeedbackItem = Database['public']['Tables']['feedback_items']['Row']
export type Insight = Database['public']['Tables']['insights']['Row']
export type Product = Database['public']['Tables']['products']['Row']

// Insert and Update types
export type FeatureInsert = Database['public']['Tables']['features']['Insert']
export type FeatureUpdate = Database['public']['Tables']['features']['Update']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']
export type ProductAreaInsert = Database['public']['Tables']['product_areas']['Insert']
export type ProductAreaUpdate = Database['public']['Tables']['product_areas']['Update']

// Enum types based on database constraints
export type FeatureStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled'
export type FeaturePriority = 'low' | 'medium' | 'high' | 'critical'
export type FeedbackSentiment = 'positive' | 'neutral' | 'negative'

// Enum constants for runtime usage
export const FeatureStatus = {
  PLANNED: 'planned' as const,
  IN_PROGRESS: 'in_progress' as const,
  COMPLETED: 'completed' as const,
  CANCELLED: 'cancelled' as const,
} as const

export const FeaturePriority = {
  LOW: 'low' as const,
  MEDIUM: 'medium' as const,
  HIGH: 'high' as const,
  CRITICAL: 'critical' as const,
} as const

export const FeedbackSentiment = {
  POSITIVE: 'positive' as const,
  NEUTRAL: 'neutral' as const,
  NEGATIVE: 'negative' as const,
} as const

// Extended types with computed properties or relationships
export interface FeatureWithRelations extends Feature {
  product_area?: ProductArea
  company?: Company
}

export interface FeatureWithInsights extends Feature {
  insights?: Insight[]
  product_area?: ProductArea
  company?: Company
}

export interface ProductAreaWithRelations extends ProductArea {
  features?: Feature[]
  product?: Product
}

export interface CompanyWithRelations extends Company {
  products?: Product[]
  product_areas?: ProductArea[]
  features?: Feature[]
}

export interface InsightWithEvidence extends Insight {
  evidence?: any[] // Type this based on your specific evidence structure
  feedbackItems?: FeedbackItem[]
}

// Search and filtering types
export interface FeatureSearchFilters {
  status?: FeatureStatus[]
  priority?: FeaturePriority[]
  companyId?: string
  productAreaId?: string
}

export interface SearchResult {
  id: string
  title: string
  description?: string
  type: 'feature' | 'product_area' | 'company' | 'insight'
  relevanceScore?: number
  metadata?: Record<string, unknown>
}

// Re-export database types for convenience
export type { Database } from './database'
