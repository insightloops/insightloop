/**
 * Pipeline Event Emitter Interface
 * 
 * Defines all events that can be emitted during pipeline execution.
 * Used by InsightPipelineOrexport interface EnrichmentAIResponseEvent extends BaseEvent {
  callId: string
  batchSize: number
  messages: AIMessage[]
  extractedData?: EnrichedFeedbackData[]
  extractionError?: string
  tokensUsed?: number
  duration?: number
}tor to provide detailed real-time updates.
 */

export interface PipelineEventEmitter {
  // Lifecycle events
  emit(event: 'pipeline_started', data: PipelineStartedEvent): void
  emit(event: 'pipeline_complete', data: PipelineCompleteEvent): void
  emit(event: 'pipeline_failed', data: PipelineFailedEvent): void
  
  // Stage events
  emit(event: 'stage_started', data: StageStartedEvent): void
  emit(event: 'stage_progress', data: StageProgressEvent): void
  emit(event: 'stage_complete', data: StageCompleteEvent): void
  
  // Enrichment events
  emit(event: 'enrichment_started', data: EnrichmentStartedEvent): void
  emit(event: 'enrichment_complete', data: EnrichmentCompleteEvent): void
  emit(event: 'feedback_enrichment_started', data: FeedbackEnrichmentStartedEvent): void
  emit(event: 'feedback_enrichment_complete', data: FeedbackEnrichmentCompleteEvent): void
  emit(event: 'enrichment_batch_started', data: EnrichmentBatchStartedEvent): void
  emit(event: 'enrichment_ai_call', data: EnrichmentAICallEvent): void
  emit(event: 'enrichment_ai_response', data: EnrichmentAIResponseEvent): void
  emit(event: 'enrichment_batch_complete', data: EnrichmentBatchCompleteEvent): void
  emit(event: 'enrichment_db_write', data: EnrichmentDBWriteEvent): void
  
  // Clustering events
  emit(event: 'clustering_started', data: ClusteringStartedEvent): void
  emit(event: 'clustering_complete', data: ClusteringCompleteEvent): void
  emit(event: 'clustering_analysis_started', data: ClusteringAnalysisStartedEvent): void
  emit(event: 'clustering_similarity_calculated', data: ClusteringSimilarityCalculatedEvent): void
  emit(event: 'clustering_ai_call', data: ClusteringAICallEvent): void
  emit(event: 'clustering_ai_response', data: ClusteringAIResponseEvent): void
  emit(event: 'cluster_created', data: ClusterCreatedEvent): void
  
  // Insight generation events
  emit(event: 'insight_generation_started', data: InsightGenerationStartedEvent): void
  emit(event: 'insight_generation_complete', data: InsightGenerationCompleteEvent): void
  emit(event: 'insight_cluster_processing', data: InsightClusterProcessingEvent): void
  emit(event: 'insight_ai_call', data: InsightAICallEvent): void
  emit(event: 'insight_ai_response', data: InsightAIResponseEvent): void
  emit(event: 'insight_created', data: InsightCreatedEvent): void
  emit(event: 'insight_validation_result', data: InsightValidationResultEvent): void
  
  // Validation events
  emit(event: 'validation_started', data: ValidationStartedEvent): void
  emit(event: 'quality_metrics_calculated', data: QualityMetricsCalculatedEvent): void
  emit(event: 'quality_gate_check', data: QualityGateCheckEvent): void
  
  // Data events
  emit(event: 'data_created', data: DataCreatedEvent): void
  emit(event: 'data_updated', data: DataUpdatedEvent): void
  
  // Warning/Error events
  emit(event: 'warning', data: WarningEvent): void
  emit(event: 'error', data: ErrorEvent): void
}

// Message type for AI calls
export interface AIMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

// Structured types for AI tool bindings
export interface EnrichedFeedbackData {
  id: string
  linkedProductAreas: Array<{
    id: string
    name?: string
    confidence: number
  }>
  sentiment: {
    label: 'positive' | 'negative' | 'neutral'
    score: number
    confidence: number
  }
  extractedFeatures: string[]
  urgency: 'low' | 'medium' | 'high'
  category: string[]
}

// Base event interface
interface BaseEvent {
  pipelineId: string
  timestamp: string
}

// Event type definitions
export interface PipelineStartedEvent extends BaseEvent {
  feedbackCount: number
  companyId: string
  productId: string
  source: string
  stages: string[]
}

export interface PipelineCompleteEvent extends BaseEvent {
  duration: number
  summary: {
    rawFeedbackCount: number
    enrichedFeedbackCount: number
    clusterCount: number
    insightCount: number
    qualityScore: number
  }
}

export interface PipelineFailedEvent extends BaseEvent {
  stage: string
  error: string
  failedAt: string
  partialResults?: Record<string, any>
}

export interface StageStartedEvent extends BaseEvent {
  stage: string
  inputCount: number
  estimatedDuration?: number
}

export interface StageProgressEvent extends BaseEvent {
  stage: string
  progress: number
  currentStep: string
  processedItems: number
  totalItems: number
  errors?: string[]
}

export interface StageCompleteEvent extends BaseEvent {
  stage: string
  duration: number
  outputCount: number
  successRate: number
  metadata: Record<string, any>
}

// Stage-level event interfaces
export interface EnrichmentStartedEvent extends BaseEvent {
  feedbackCount: number
}

export interface EnrichmentCompleteEvent extends BaseEvent {
  processedCount: number
  successCount: number
  duration: number
}

export interface ClusteringStartedEvent extends BaseEvent {
  enrichedFeedbackCount: number
}

export interface ClusteringCompleteEvent extends BaseEvent {
  clusterCount: number
  duration: number
}

export interface InsightGenerationStartedEvent extends BaseEvent {
  clusterCount: number
}

export interface InsightGenerationCompleteEvent extends BaseEvent {
  insightCount: number
  duration: number
}

// Individual feedback processing event interfaces
export interface FeedbackEnrichmentStartedEvent extends BaseEvent {
  feedbackId: string
  text: string
  source: string
}

export interface FeedbackEnrichmentCompleteEvent extends BaseEvent {
  feedbackId: string
  success: boolean
  duration: number
  enrichmentData?: EnrichedFeedbackData
  error?: string
}

export interface EnrichmentBatchStartedEvent extends BaseEvent {
  batchNumber: number
  totalBatches: number
  batchSize: number
  feedbackIds: string[]
}

export interface EnrichmentAICallEvent extends BaseEvent {
  callId: string
  feedbackId?: string // For individual feedback processing
  batchSize?: number // For batch processing
  messages: AIMessage[]
  tokensUsed?: number
  duration?: number
}

export interface EnrichmentAIResponseEvent extends BaseEvent {
  callId: string
  feedbackId?: string // For individual feedback processing
  batchSize?: number // For batch processing
  messages: AIMessage[]
  extractedData?: any
  extractionError?: string
  tokensUsed?: number
  duration?: number
}

export interface EnrichmentBatchCompleteEvent extends BaseEvent {
  batchNumber: number
  processedCount: number
  errorCount: number
  duration: number
  errors?: Array<{ feedbackId: string, error: string }>
}

export interface EnrichmentDBWriteEvent extends BaseEvent {
  operation: 'insert' | 'update'
  recordCount: number
  table: string
  duration: number
  success: boolean
}

export interface ClusteringAnalysisStartedEvent extends BaseEvent {
  entryCount: number
  config: {
    maxClusters: number
    minClusterSize: number
    similarityThreshold: number
  }
}

export interface ClusteringSimilarityCalculatedEvent extends BaseEvent {
  comparisons: number
  avgSimilarity: number
  duration: number
}

export interface ClusteringAICallEvent extends BaseEvent {
  callId: string
  feedbackCount: number
  targetClusters: number
  messages: AIMessage[]
  tokensUsed?: number
  duration?: number
}

export interface ClusteringAIResponseEvent extends BaseEvent {
  clustersIdentified: number
  themes: Array<{
    clusterId: string
    theme: string
    confidence: number
    size: number
  }>
}

export interface ClusterCreatedEvent extends BaseEvent {
  clusterId: string
  theme: string
  description: string
  size: number
  dominantSentiment: string
  avgConfidence: number
  productAreas: string[]
  feedbackIds: string[]
}

export interface InsightGenerationStartedEvent extends BaseEvent {
  clusterCount: number
  mode: 'sequential' | 'parallel'
}

export interface InsightClusterProcessingEvent extends BaseEvent {
  clusterId: string
  clusterTheme: string
  clusterSize: number
  processingStep: 'analyzing' | 'generating' | 'validating'
}

export interface InsightAICallEvent extends BaseEvent {
  clusterId: string
  purpose: 'pain_point_analysis' | 'impact_assessment' | 'recommendation_generation' | 'stakeholder_formatting'
  model: string
  messages: AIMessage[]
  contextSize: number
  tokensUsed?: number
  duration: number
}

export interface InsightAIResponseEvent extends BaseEvent {
  clusterId: string
  success: boolean
  generated: {
    title: string
    severity: string
    usersAffected: number
    recommendationCount: number
    confidence: number
  }
}

export interface InsightCreatedEvent extends BaseEvent {
  insightId: string
  clusterId: string
  title: string
  summary: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  usersAffected: number
  recommendationCount: number
  evidenceCount: number
  stakeholderFormats: string[]
}

export interface InsightValidationResultEvent extends BaseEvent {
  insightId: string
  passed: boolean
  scores: {
    confidence: number
    evidence: number
    actionability: number
    overall: number
  }
  issues?: string[]
}

export interface ValidationStartedEvent extends BaseEvent {
  insightCount: number
  clusterCount: number
  feedbackCount: number
}

export interface QualityMetricsCalculatedEvent extends BaseEvent {
  metrics: {
    overallScore: number
    validationRate: number
    avgConfidence: number
    avgEvidenceQuality: number
    actionabilityRate: number
    coverageRate: number
  }
  thresholds: {
    confidence: { threshold: number, passed: boolean }
    validation: { threshold: number, passed: boolean }
    evidence: { threshold: number, passed: boolean }
    actionability: { threshold: number, passed: boolean }
  }
}

export interface QualityGateCheckEvent extends BaseEvent {
  gate: 'confidence' | 'validation' | 'evidence' | 'actionability'
  threshold: number
  actualValue: number
  passed: boolean
  impact: 'blocking' | 'warning' | 'info'
}

export interface DataCreatedEvent extends BaseEvent {
  dataType: string
  count: number
  ids: string[]
  metadata: Record<string, any>
}

export interface DataUpdatedEvent extends BaseEvent {
  dataType: string
  count: number
  ids: string[]
}

export interface WarningEvent extends BaseEvent {
  stage: string
  warningType: string
  message: string
  context?: Record<string, any>
}

export interface ErrorEvent extends BaseEvent {
  stage: string
  errorType: string
  message: string
  recoverable: boolean
  context?: Record<string, any>
  stack?: string
}
