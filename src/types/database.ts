// Import auto-generated database types from Supabase
import { Database as GeneratedDatabase } from './database-generated';

// Re-export the generated Database type
export type Database = GeneratedDatabase;

// Core entity types (derived from generated database types)
export type Company = Database['public']['Tables']['companies']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductArea = Database['public']['Tables']['product_areas']['Row'];
export type Objective = Database['public']['Tables']['objectives']['Row'];
export type Feature = Database['public']['Tables']['features']['Row'];
export type FeedbackItem = Database['public']['Tables']['feedback_items']['Row'];
export type Insight = Database['public']['Tables']['insights']['Row'];

// Junction table types
export type InsightFeedbackLink = Database['public']['Tables']['insight_feedback_links']['Row'];
export type InsightFeatureLink = Database['public']['Tables']['insight_feature_links']['Row'];
export type InsightObjectiveLink = Database['public']['Tables']['insight_objective_links']['Row'];

// Insert and Update types
export type CompanyInsert = Database['public']['Tables']['companies']['Insert'];
export type ProductInsert = Database['public']['Tables']['products']['Insert'];
export type ProductAreaInsert = Database['public']['Tables']['product_areas']['Insert'];
export type FeatureInsert = Database['public']['Tables']['features']['Insert'];
export type FeedbackItemInsert = Database['public']['Tables']['feedback_items']['Insert'];

export type CompanyUpdate = Database['public']['Tables']['companies']['Update'];
export type ProductUpdate = Database['public']['Tables']['products']['Update'];
export type ProductAreaUpdate = Database['public']['Tables']['product_areas']['Update'];
export type FeatureUpdate = Database['public']['Tables']['features']['Update'];

// Enums for feature status and priority
export enum FeatureStatus {
  PLANNED = 'planned',
  IN_PROGRESS = 'in_progress', 
  COMPLETED = 'completed',
  ON_HOLD = 'on_hold',
  CANCELLED = 'cancelled'
}

export enum FeaturePriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

// Extended types with relationships
export interface InsightWithEvidence extends Insight {
  feedback_items?: FeedbackItem[]
  features?: Feature[]
  objectives?: Objective[]
}

export interface FeatureWithInsights extends Feature {
  insights?: Insight[]
  product_area?: ProductArea
}

export interface FeedbackWithInsights extends FeedbackItem {
  insights?: Insight[]
}

export interface ProductWithAreas extends Product {
  product_areas?: ProductArea[]
  area_count?: number
  feature_count?: number
}

export interface ProductAreaWithFeatures extends ProductArea {
  features?: Feature[]
  feature_count?: number
  parent_area?: ProductArea
  child_areas?: ProductArea[]
}

export interface ProductAreaHierarchy extends ProductArea {
  children?: ProductAreaHierarchy[]
  features?: Feature[]
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
  status?: FeatureStatus[]
  priority?: FeaturePriority[]
  product_area_id?: string
  company_id?: string
}

export interface ProductAreaFilters {
  product_id?: string
  parent_area_id?: string | null
  top_level?: boolean
  company_id?: string
}

export interface ProductFilters {
  company_id?: string
  include_areas?: boolean
  include_features?: boolean
}

// Re-export all types for convenience
export * from './workflow-events';
export * from './agent-types';
export * from './chat-types';
