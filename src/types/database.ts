// Database types generated from Supabase schema
export interface Database {
  public: {
    Tables: {
      companies: {
        Row: Company
        Insert: Omit<Company, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at'>>
      }
      products: {
        Row: Product
        Insert: Omit<Product, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Product, 'id' | 'created_at' | 'updated_at'>>
      }
      objectives: {
        Row: Objective
        Insert: Omit<Objective, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Objective, 'id' | 'created_at' | 'updated_at'>>
      }
      features: {
        Row: Feature
        Insert: Omit<Feature, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Feature, 'id' | 'created_at' | 'updated_at'>>
      }
      feedback_items: {
        Row: FeedbackItem
        Insert: Omit<FeedbackItem, 'id' | 'created_at'>
        Update: Partial<Omit<FeedbackItem, 'id' | 'created_at'>>
      }
      insights: {
        Row: Insight
        Insert: Omit<Insight, 'id' | 'created_at' | 'updated_at'>
        Update: Partial<Omit<Insight, 'id' | 'created_at' | 'updated_at'>>
      }
      insight_feedback_links: {
        Row: InsightFeedbackLink
        Insert: Omit<InsightFeedbackLink, 'created_at'>
        Update: Partial<Omit<InsightFeedbackLink, 'created_at'>>
      }
      insight_feature_links: {
        Row: InsightFeatureLink
        Insert: Omit<InsightFeatureLink, 'created_at'>
        Update: Partial<Omit<InsightFeatureLink, 'created_at'>>
      }
      insight_objective_links: {
        Row: InsightObjectiveLink
        Insert: Omit<InsightObjectiveLink, 'created_at'>
        Update: Partial<Omit<InsightObjectiveLink, 'created_at'>>
      }
    }
  }
}

// Core entity types
export interface Company {
  id: string
  name: string
  slug: string
  industry: string | null
  size: string | null
  created_at: string
  updated_at: string
}

export interface Product {
  id: string
  company_id: string
  name: string
  description: string | null
  product_area: string | null
  created_at: string
  updated_at: string
}

export interface Objective {
  id: string
  company_id: string
  title: string
  description: string | null
  target_value: number | null
  current_value: number
  quarter: string | null
  year: number | null
  status: string
  created_at: string
  updated_at: string
}

export interface Feature {
  id: string
  product_id: string
  company_id: string
  title: string
  description: string | null
  status: string
  priority: string
  effort_score: number | null
  business_value: number | null
  created_at: string
  updated_at: string
}

export interface FeedbackItem {
  id: string
  company_id: string
  source: string
  content: string
  sentiment: string | null
  product_area: string | null
  user_metadata: Record<string, any>
  submitted_at: string | null
  processed_at: string | null
  created_at: string
}

export interface Insight {
  id: string
  company_id: string
  title: string
  summary: string
  theme: string | null
  segment_context: Record<string, any>
  insight_score: number
  urgency_score: number
  volume_score: number
  value_alignment_score: number
  status: string
  created_at: string
  updated_at: string
}

// Junction table types
export interface InsightFeedbackLink {
  insight_id: string
  feedback_id: string
  relevance_score: number
  created_at: string
}

export interface InsightFeatureLink {
  insight_id: string
  feature_id: string
  impact_score: number
  created_at: string
}

export interface InsightObjectiveLink {
  insight_id: string
  objective_id: string
  alignment_score: number
  created_at: string
}

// Extended types with relationships
export interface InsightWithEvidence extends Insight {
  feedback_items?: FeedbackItem[]
  features?: Feature[]
  objectives?: Objective[]
}

export interface FeatureWithInsights extends Feature {
  insights?: Insight[]
  product?: Product
}

export interface FeedbackWithInsights extends FeedbackItem {
  insights?: Insight[]
}

// API response types
export interface ApiResponse<T> {
  data: T | null
  error: string | null
  status: number
}

export interface PaginatedResponse<T> {
  data: T[]
  count: number
  page: number
  limit: number
  hasMore: boolean
}

// Filter and query types
export interface FeedbackFilters {
  source?: string[]
  sentiment?: string[]
  product_area?: string[]
  date_from?: string
  date_to?: string
}

export interface InsightFilters {
  theme?: string[]
  status?: string[]
  min_score?: number
  max_score?: number
}

export interface FeatureFilters {
  status?: string[]
  priority?: string[]
  product_id?: string
}

// Re-export all types for convenience
export * from './workflow-events';
export * from './agent-types';
export * from './chat-types';
