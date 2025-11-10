/**
 * Database types and utilities
 * 
 * This file imports the generated database types and provides convenient
 * type aliases for commonly used table types.
 */

// Import the generated database types
export type { Database, Json } from './database-generated'
import { Database } from './database-generated'

// Convenient type aliases for table types
export type Company = Database['public']['Tables']['companies']['Row']
export type CompanyInsert = Database['public']['Tables']['companies']['Insert']
export type CompanyUpdate = Database['public']['Tables']['companies']['Update']

export type Product = Database['public']['Tables']['products']['Row']
export type ProductInsert = Database['public']['Tables']['products']['Insert']
export type ProductUpdate = Database['public']['Tables']['products']['Update']

export type ProductArea = Database['public']['Tables']['product_areas']['Row']
export type ProductAreaInsert = Database['public']['Tables']['product_areas']['Insert']
export type ProductAreaUpdate = Database['public']['Tables']['product_areas']['Update']

export type Feature = Database['public']['Tables']['features']['Row']
export type FeatureInsert = Database['public']['Tables']['features']['Insert']
export type FeatureUpdate = Database['public']['Tables']['features']['Update']

export type FeedbackItem = Database['public']['Tables']['feedback_items']['Row']
export type FeedbackInsert = Database['public']['Tables']['feedback_items']['Insert']
export type FeedbackUpdate = Database['public']['Tables']['feedback_items']['Update']

export type Insight = Database['public']['Tables']['insights']['Row']
export type InsightInsert = Database['public']['Tables']['insights']['Insert']
export type InsightUpdate = Database['public']['Tables']['insights']['Update']

export type Objective = Database['public']['Tables']['objectives']['Row']
export type ObjectiveInsert = Database['public']['Tables']['objectives']['Insert']
export type ObjectiveUpdate = Database['public']['Tables']['objectives']['Update']

// Junction table types
export type InsightFeedbackLink = Database['public']['Tables']['insight_feedback_links']['Row']
export type InsightFeatureLink = Database['public']['Tables']['insight_feature_links']['Row']
export type InsightObjectiveLink = Database['public']['Tables']['insight_objective_links']['Row']

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

// Extended types for joined data
export interface InsightWithEvidence extends Insight {
  feedback_items: Array<FeedbackItem & { relevance_score: number }>
  features: Array<Feature & { impact_score: number }>
  objectives: Array<Objective & { alignment_score: number }>
}

