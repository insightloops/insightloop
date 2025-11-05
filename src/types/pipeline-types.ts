// Base Feedback Entry Interface
export interface FeedbackEntry {
  id: string;
  text: string;
  userId: string;
  timestamp: Date;
  source: 'survey' | 'support' | 'interview' | 'slack' | 'other';
  tags?: string[];
  userMetadata?: {
    plan: 'free' | 'pro' | 'enterprise';
    segment: string;
    teamSize: number;
    usage: 'low' | 'medium' | 'high';
  };
}

// Enriched Feedback Entry (after AI processing)
export interface EnrichedFeedbackEntry extends FeedbackEntry {
  productArea: string;
  sentiment: {
    label: 'positive' | 'negative' | 'neutral';
    score: number; // -1 to 1
    confidence: number; // 0 to 1
  };
  extractedFeatures: string[];
  urgency: 'low' | 'medium' | 'high';
  category: string[];
}

// Feedback Cluster (grouped similar feedback)
export interface FeedbackCluster {
  id: string;
  theme: string;
  description: string;
  entries: EnrichedFeedbackEntry[];
  size: number;
  dominantSentiment: string;
  productAreas: string[];
  urgencyDistribution: Record<string, number>;
  userSegments: string[];
  keywords: string[];
}

// Generated Business Insight
export interface GeneratedInsight {
  id: string;
  clusterId: string;
  title: string;
  summary: string;
  painPoint: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  userWants: string;
  affectedUsers: number;
  userSegments: string[];
  productAreas: string[];
  evidenceEntries: string[]; // Feedback entry IDs
  recommendedActions: string[];
  confidence: number;
}

// Scored Insight (with business priority)
export interface ScoredInsight extends GeneratedInsight {
  score: number;
  scoreBreakdown: {
    volume: number;        // How many users (0-100)
    value: number;         // User value (plan, usage) (0-100)
    recency: number;       // How recent the feedback (0-100)
    strategic: number;     // Alignment with OKRs (0-100)
    urgency: number;       // Severity and urgency (0-100)
  };
  priority: 'critical' | 'high' | 'medium' | 'low';
  businessImpact: string;
}

// Pipeline Progress Tracking
export interface PipelineProgress {
  stage: 'validation' | 'enrichment' | 'clustering' | 'insight-generation' | 'scoring' | 'complete';
  currentStep: string;
  totalSteps: number;
  completedSteps: number;
  progress: number; // 0-100
  startTime: Date;
  estimatedCompletion?: Date;
  processingRate?: number; // entries per second
}

// Pipeline Error
export interface PipelineError {
  id: string;
  stage: string;
  type: 'validation' | 'ai_error' | 'processing' | 'timeout';
  message: string;
  details: any;
  timestamp: Date;
  recoverable: boolean;
  retryCount: number;
}

// Feedback Batch (input to pipeline)
export interface FeedbackBatch {
  id: string;
  entries: FeedbackEntry[];
  totalCount: number;
  dateRange: { start: Date; end: Date };
  sources: string[];
  metadata?: {
    uploadedBy: string;
    uploadedAt: Date;
    fileType: 'csv' | 'json';
    originalFilename: string;
  };
}

// Progress Update for UI
export interface ProgressUpdate {
  batchId: string;
  stage: string;
  progress: number; // 0-100
  currentStep: string;
  estimatedTimeRemaining?: string;
  processingRate?: number;
  errors?: string[];
  startTime: Date;
  currentTime: Date;
}

// Pipeline Result
export interface PipelineResult {
  batchId: string;
  success: boolean;
  insights: ScoredInsight[];
  clusters: FeedbackCluster[];
  metadata: {
    totalFeedback: number;
    processedFeedback: number;
    processingTime: number; // milliseconds
    insightsGenerated: number;
    averageScore: number;
  };
  errors?: PipelineError[];
}

// UI Event Types
export interface PipelineEvent {
  type: 'progress' | 'error' | 'complete' | 'stage_complete';
  batchId: string;
  timestamp: Date;
  data: ProgressUpdate | PipelineError | PipelineResult;
}
