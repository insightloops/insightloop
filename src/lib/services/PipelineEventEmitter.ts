/**
 * Universal Pipeline Event Emitter
 * 
 * Pub/sub pattern for emitting pipeline events with automatic field population.
 * Works with ANY pipeline type - just create an instance and emit events!
 * 
 * Usage:
 *   const emitter = new PipelineEventEmitter(pipelineId, 'feedback_insight')
 *   emitter.emitPipelineStarted({ feedbackCount: 35, model: 'gpt-4' })
 *   emitter.emitStageProgress('enrichment', 50, 'Processing batch 2 of 4')
 */

import type {
  PipelineEvent,
  EventListener,
  UnsubscribeFn,
} from '@/types/pipeline-events'

export class PipelineEventEmitter {
  private listeners: Set<EventListener> = new Set()
  private pipelineId: string
  private pipelineType: string
  private eventHistory: PipelineEvent[] = []

  constructor(pipelineId: string, pipelineType: string) {
    this.pipelineId = pipelineId
    this.pipelineType = pipelineType
  }

  // ============================================================================
  // Subscription Management
  // ============================================================================

  /**
   * Subscribe to all events from this pipeline
   */
  subscribe(listener: EventListener): UnsubscribeFn {
    this.listeners.add(listener)
    return () => {
      this.listeners.delete(listener)
    }
  }

  /**
   * Get all events emitted so far
   */
  getHistory(): PipelineEvent[] {
    return [...this.eventHistory]
  }

  /**
   * Clear event history (useful for memory management)
   */
  clearHistory(): void {
    this.eventHistory = []
  }

  // ============================================================================
  // Core Emit Method
  // ============================================================================

  /**
   * Emit a pipeline event. Automatically adds pipelineId, pipelineType, and timestamp.
   */
  emit(event: Partial<PipelineEvent>): void {
    const enrichedEvent = {
      pipelineId: this.pipelineId,
      pipelineType: this.pipelineType,
      timestamp: new Date().toISOString(),
      ...event,
    } as PipelineEvent

    // Store in history
    this.eventHistory.push(enrichedEvent)

    // Log for debugging
    if (process.env.NODE_ENV === 'development') {
      console.log(`[${this.pipelineType}] ${event.type}`, enrichedEvent)
    }

    // Notify all listeners
    this.listeners.forEach((listener) => {
      try {
        listener(enrichedEvent)
      } catch (error) {
        console.error('Event listener error:', error)
      }
    })
  }

  // ============================================================================
  // Lifecycle Event Convenience Methods
  // ============================================================================

  emitPipelineStarted(metadata: Record<string, any> = {}): void {
    this.emit({
      type: 'pipeline_started',
      metadata,
    })
  }

  emitPipelineComplete(durationMs: number, metadata: Record<string, any> = {}): void {
    this.emit({
      type: 'pipeline_complete',
      durationMs,
      metadata,
    })
  }

  emitPipelineFailed(stage: string, error: string, metadata?: Record<string, any>): void {
    this.emit({
      type: 'pipeline_failed',
      stage,
      error,
      metadata,
    })
  }

  // ============================================================================
  // Stage Event Convenience Methods
  // ============================================================================

  emitStageStarted(stage: string, metadata?: Record<string, any>): void {
    this.emit({
      type: 'stage_started',
      stage,
      metadata,
    })
  }

  emitStageProgress(
    stage: string,
    progress: number,
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.emit({
      type: 'stage_progress',
      stage,
      progress,
      message,
      metadata,
    })
  }

  emitStageComplete(stage: string, durationMs: number, metadata?: Record<string, any>): void {
    this.emit({
      type: 'stage_complete',
      stage,
      durationMs,
      metadata,
    })
  }

  // ============================================================================
  // AI/LLM Event Convenience Methods
  // ============================================================================

  emitAIRequest(
    callId: string,
    stage: string,
    prompt: string,
    metadata?: Record<string, any>
  ): void {
    this.emit({
      type: 'ai_request',
      callId,
      stage,
      prompt,
      metadata,
    })
  }

  emitAIResponse(
    callId: string,
    response: string,
    durationMs: number,
    success: boolean,
    error?: string,
    metadata?: Record<string, any>
  ): void {
    this.emit({
      type: 'ai_response',
      callId,
      response,
      durationMs,
      success,
      error,
      metadata,
    })
  }

  // ============================================================================
  // Data Event Convenience Methods
  // ============================================================================

  emitDataCreated(
    stage: string,
    dataType: string,
    dataId: string,
    metadata: Record<string, any>
  ): void {
    this.emit({
      type: 'data_created',
      stage,
      dataType,
      dataId,
      metadata,
    })
  }

  emitLog(
    stage: string,
    level: 'debug' | 'info' | 'warn' | 'error',
    message: string,
    metadata?: Record<string, any>
  ): void {
    this.emit({
      type: 'log',
      stage,
      level,
      message,
      metadata,
    })
  }

  // ============================================================================
  // Error & Warning Event Convenience Methods
  // ============================================================================

  emitWarning(stage: string, code: string, message: string, metadata?: Record<string, any>): void {
    this.emit({
      type: 'warning',
      stage,
      code,
      message,
      metadata,
    })
  }

  emitError(stage: string, error: string, errorCode?: string, metadata?: Record<string, any>): void {
    this.emit({
      type: 'error',
      stage,
      error,
      errorCode,
      metadata,
    })
  }

  // ============================================================================
  // Telemetry Event Convenience Methods
  // ============================================================================

  emitPerformanceMetric(stage: string, metadata: Record<string, any>): void {
    this.emit({
      type: 'performance_metric',
      stage,
      metadata,
    })
  }

  // ============================================================================
  // Utility Methods
  // ============================================================================

  /**
   * Get number of active listeners
   */
  getListenerCount(): number {
    return this.listeners.size
  }

  /**
   * Get pipeline ID
   */
  getPipelineId(): string {
    return this.pipelineId
  }

  /**
   * Get pipeline type
   */
  getPipelineType(): string {
    return this.pipelineType
  }
}
