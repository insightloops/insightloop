// Pipeline-specific types for the feedback upload and processing pipeline
// Uses auto-generated database types as the foundation

import { Database } from './database-generated';

// Extract database table types for convenience
export type FeedbackItem = Database['public']['Tables']['feedback_items']['Row'];
export type FeedbackItemInsert = Database['public']['Tables']['feedback_items']['Insert'];
export type FeedbackItemUpdate = Database['public']['Tables']['feedback_items']['Update'];

export type FeedbackProductArea = Database['public']['Tables']['feedback_product_areas']['Row'];
export type FeedbackProductAreaInsert = Database['public']['Tables']['feedback_product_areas']['Insert'];

export type FeedbackFeature = Database['public']['Tables']['feedback_features']['Row'];
export type FeedbackFeatureInsert = Database['public']['Tables']['feedback_features']['Insert'];

export type FeedbackCluster = Database['public']['Tables']['feedback_clusters']['Row'];
export type FeedbackClusterInsert = Database['public']['Tables']['feedback_clusters']['Insert'];

export type ClusterMembership = Database['public']['Tables']['cluster_memberships']['Row'];
export type ClusterMembershipInsert = Database['public']['Tables']['cluster_memberships']['Insert'];

export type Insight = Database['public']['Tables']['insights']['Row'];
export type InsightInsert = Database['public']['Tables']['insights']['Insert'];

// View types
export type FeedbackEnriched = Database['public']['Views']['feedback_enriched']['Row'];

// Other existing table types for reference
export type Company = Database['public']['Tables']['companies']['Row'];
export type Product = Database['public']['Tables']['products']['Row'];
export type ProductArea = Database['public']['Tables']['product_areas']['Row'];
export type Feature = Database['public']['Tables']['features']['Row'];

// Pipeline-specific enhanced types
export interface ScoredInsight extends Insight {
  total_score: number; // Calculated from individual score fields
  feedback_count: number; // Number of linked feedback items
  affected_segments: string[]; // Extracted from segment_context
}

// Pipeline state management
export enum PipelineStage {
  UPLOADED = 'uploaded',
  VALIDATING = 'validating',
  ENRICHING = 'enriching',
  CLUSTERING = 'clustering',
  GENERATING_INSIGHTS = 'generating_insights',
  SCORING_INSIGHTS = 'scoring_insights',
  COMPLETE = 'complete',
  FAILED = 'failed'
}

export interface PipelineError {
  stage: PipelineStage;
  message: string;
  details?: any;
  timestamp: string;
}

export interface FeedbackPipelineState {
  // Input
  company_id: string;
  uploaded_file_path: string;
  total_feedback_count: number;
  
  // Progress tracking
  current_stage: PipelineStage;
  progress_percentage: number;
  status_message: string;
  
  // Data at each stage
  raw_feedback: FeedbackItem[];
  enriched_feedback: FeedbackEnriched[];
  clusters: FeedbackCluster[];
  insights: Insight[];
  scored_insights: ScoredInsight[];
  
  // Error handling
  errors: PipelineError[];
  is_complete: boolean;
  started_at: string;
  completed_at?: string;
}

// Progress update events for SSE streaming
export interface ProgressUpdate {
  stage: PipelineStage;
  percentage: number;
  message: string;
  timestamp: string;
  details?: {
    processed_count?: number;
    total_count?: number;
    current_item?: string;
  };
}

// CSV parsing types
export interface RawFeedbackCSV {
  text?: string; // Will map to 'content'
  content?: string; // Direct mapping
  user_id?: string;
  timestamp?: string; 
  source?: string;
  tags?: string; // Comma-separated
  // Allow any additional columns
  [key: string]: string | undefined;
}

export interface ParsedFeedbackItem {
  content: string;
  source: string;
  user_metadata: Record<string, any>;
  submitted_at?: string;
  // Will be set during processing
  company_id?: string;
  sentiment?: 'positive' | 'negative' | 'neutral';
  product_area?: string;
}

// AI enrichment types
export interface ProductAreaTag {
  area_id: string;
  area_name: string;
  confidence: number;
  keywords_matched: string[];
}

export interface FeatureLink {
  feature_id: string;
  feature_name: string;
  confidence: number;
  reasoning: string;
}

export interface SentimentAnalysis {
  primary_sentiment: 'positive' | 'negative' | 'neutral';
  confidence: number;
  aspects?: Array<{
    aspect: string;
    sentiment: string;
    intensity: number;
  }>;
}

// Clustering types
export interface ClusterCandidate {
  id: string;
  feedback_ids: string[];
  centroid_text: string;
  similarity_threshold: number;
  theme?: string;
}

export interface ClusterMembershipScore {
  feedback_id: string;
  cluster_id: string;
  similarity_score: number;
}

// Insight generation types
export interface InsightCandidate {
  title: string;
  summary: string;
  theme: string;
  evidence_feedback_ids: string[];
  affected_segments: Record<string, any>;
  related_product_areas: string[];
  related_features: string[];
}

// Scoring types
export interface InsightScoreComponents {
  volume_score: number; // 0-1, based on feedback count
  urgency_score: number; // 0-1, based on sentiment intensity and recency
  value_alignment_score: number; // 0-1, based on business objectives alignment
  insight_score: number; // 0-1, overall weighted score
}

// File upload types
export interface UploadRequest {
  file: File;
  company_id: string;
  conversation_id?: string;
}

export interface UploadResponse {
  upload_id: string;
  pipeline_id: string;
  total_items: number;
  estimated_completion_minutes: number;
}

// SSE event types
export type SSEEventType = 
  | 'progress' 
  | 'stage_complete' 
  | 'cluster_found' 
  | 'insight_generated' 
  | 'error' 
  | 'complete';

export interface SSEEvent {
  type: SSEEventType;
  data: any;
  timestamp: string;
}

export interface ProgressEvent extends SSEEvent {
  type: 'progress';
  data: ProgressUpdate;
}

export interface InsightGeneratedEvent extends SSEEvent {
  type: 'insight_generated';
  data: {
    insight: ScoredInsight;
    cluster: FeedbackCluster;
    evidence_count: number;
  };
}

export interface PipelineCompleteEvent extends SSEEvent {
  type: 'complete';
  data: {
    insights: ScoredInsight[];
    clusters: FeedbackCluster[];
    total_processed: number;
    processing_time_seconds: number;
    summary: {
      total_insights: number;
      avg_score: number;
      top_themes: string[];
    };
  };
}

// Legacy types for backward compatibility (deprecated - use database types instead)
/** @deprecated Use FeedbackItem from database types */
export interface FeedbackEntry extends FeedbackItem {}

/** @deprecated Use FeedbackEnriched from database types */
export interface EnrichedFeedbackEntry extends FeedbackEnriched {}

/** @deprecated Use ScoredInsight */
export interface GeneratedInsight extends ScoredInsight {}
