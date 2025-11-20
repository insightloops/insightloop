/**
 * Universal Pipeline Event Type Definitions
 * 
 * This file defines a flexible event system for ANY pipeline type:
 * - Feedback insight pipelines
 * - ETL data pipelines
 * - AI agent workflows
 * - Custom processing pipelines
 * 
 * Design principle: Simple core fields + flexible metadata
 */

// ============================================================================
// Base Types
// ============================================================================

export interface BaseEvent {
  type: string
  pipelineId: string
  pipelineType: string
  timestamp: string
}

// ============================================================================
// Pipeline Type Definitions
// ============================================================================

// Example pipeline types (extend as needed)
export type FeedbackPipelineType = 'feedback_insight'
export type ETLPipelineType = 'etl'
export type AIWorkflowType = 'ai_workflow'

export type PipelineType = 
  | FeedbackPipelineType 
  | ETLPipelineType 
  | AIWorkflowType 
  | string  // Allow custom pipeline types

// Example stage types (each pipeline defines its own)
export type FeedbackStage = 'enrichment' | 'clustering' | 'insights' | 'validation'
export type ETLStage = 'extract' | 'transform' | 'load' | 'validate'
export type AIWorkflowStage = 'planning' | 'execution' | 'reflection' | 'iteration'

// ============================================================================
// Lifecycle Events
// ============================================================================

export interface PipelineStartedEvent extends BaseEvent {
  type: 'pipeline_started'
  metadata: Record<string, any>
}

export interface PipelineCompleteEvent extends BaseEvent {
  type: 'pipeline_complete'
  durationMs: number
  metadata: Record<string, any>
}

export interface PipelineFailedEvent extends BaseEvent {
  type: 'pipeline_failed'
  stage: string
  error: string
  metadata?: Record<string, any>
}

// ============================================================================
// Stage Events
// ============================================================================

export interface StageStartedEvent extends BaseEvent {
  type: 'stage_started'
  stage: string
  metadata?: Record<string, any>
}

export interface StageProgressEvent extends BaseEvent {
  type: 'stage_progress'
  stage: string
  progress: number  // 0-100
  message: string
  metadata?: Record<string, any>
}

export interface StageCompleteEvent extends BaseEvent {
  type: 'stage_complete'
  stage: string
  durationMs: number
  metadata?: Record<string, any>
}

// ============================================================================
// AI/LLM Events
// ============================================================================

export interface AIRequestEvent extends BaseEvent {
  type: 'ai_request'
  callId: string
  stage: string
  prompt: string
  metadata?: Record<string, any>
}

export interface AIResponseEvent extends BaseEvent {
  type: 'ai_response'
  callId: string
  response: string
  durationMs: number
  success: boolean
  error?: string
  metadata?: Record<string, any>
}

// ============================================================================
// Data Events
// ============================================================================

export interface DataCreatedEvent extends BaseEvent {
  type: 'data_created'
  stage: string
  dataType: string  // 'cluster', 'insight', 'report', etc.
  dataId: string
  metadata: Record<string, any>
}

export interface LogEvent extends BaseEvent {
  type: 'log'
  stage: string
  level: 'debug' | 'info' | 'warn' | 'error'
  message: string
  metadata?: Record<string, any>
}

// ============================================================================
// Error & Warning Events
// ============================================================================

export interface WarningEvent extends BaseEvent {
  type: 'warning'
  stage: string
  code: string
  message: string
  metadata?: Record<string, any>
}

export interface ErrorEvent extends BaseEvent {
  type: 'error'
  stage: string
  error: string
  errorCode?: string
  metadata?: Record<string, any>
}

// ============================================================================
// Telemetry Events
// ============================================================================

export interface PerformanceMetricEvent extends BaseEvent {
  type: 'performance_metric'
  stage: string
  metadata: Record<string, any>
}

// ============================================================================
// Union Type for All Events
// ============================================================================

export type PipelineEvent =
  // Lifecycle
  | PipelineStartedEvent
  | PipelineCompleteEvent
  | PipelineFailedEvent
  // Stages
  | StageStartedEvent
  | StageProgressEvent
  | StageCompleteEvent
  // AI/LLM
  | AIRequestEvent
  | AIResponseEvent
  // Data
  | DataCreatedEvent
  | LogEvent
  // Errors
  | WarningEvent
  | ErrorEvent
  // Telemetry
  | PerformanceMetricEvent

// ============================================================================
// Event Listener Types
// ============================================================================

export type EventListener = (event: PipelineEvent) => void
export type UnsubscribeFn = () => void

// ============================================================================
// Helper Types for Event Metadata
// ============================================================================

/**
 * Example metadata structures for different pipeline types.
 * These are NOT enforced - pipelines can use any structure they want.
 */

export interface FeedbackPipelineMetadata {
  feedbackCount?: number
  clustersGenerated?: number
  insightsGenerated?: number
  avgConfidence?: number
  model?: string
  stages?: string[]
}

export interface ETLPipelineMetadata {
  recordCount?: number
  source?: string
  destination?: string
  bytesProcessed?: number
  throughput?: number
  successRate?: number
}

export interface AIWorkflowMetadata {
  taskType?: string
  steps?: number
  qualityScore?: number
  iterations?: number
  model?: string
  tokenCount?: number
}
