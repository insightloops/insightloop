import { PipelineEventRepository, PipelineRunConfig, StorableEvent } from '@/lib/repositories/PipelineEventRepository'
import { PipelineEventEmitter } from '@/types/pipeline-event-types'

/**
 * Pipeline Event Storage Service
 * 
 * High-level service that wraps the repository and provides
 * event storage functionality for pipeline execution tracking
 */
export class PipelineEventStorageService {
  private repository: PipelineEventRepository
  private currentRunId?: string

  constructor(repository: PipelineEventRepository) {
    this.repository = repository
  }

  /**
   * Start a new pipeline run and return its ID
   */
  async createPipelineRun(config: PipelineRunConfig): Promise<string> {
    const runId = await this.repository.createPipelineRun(config)
    this.currentRunId = runId
    
    // Emit the pipeline_started event
    await this.storeEvent({
      eventType: 'pipeline_started',
      timestamp: new Date().toISOString(),
      payload: {
        source: config.source,
        inputFeedbackCount: config.inputFeedbackCount,
        stages: config.stages,
        companyId: config.companyId,
        productId: config.productId
      }
    })
    
    return runId
  }

  /**
   * Complete the current pipeline run successfully
   */
  async completePipelineRun(summary: { outputCount: number, resultsSummary?: Record<string, any> }): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to complete')
    }

    await this.repository.completePipelineRun(this.currentRunId, summary)
    
    // Emit the pipeline_complete event
    await this.storeEvent({
      eventType: 'pipeline_complete',
      timestamp: new Date().toISOString(),
      payload: {
        outputCount: summary.outputCount,
        resultsSummary: summary.resultsSummary
      }
    })
    
    this.currentRunId = undefined
  }

  /**
   * Fail the current pipeline run with error details
   */
  async failPipelineRun(error: { message: string, stage?: string }): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to fail')
    }

    await this.repository.failPipelineRun(this.currentRunId, error)
    
    // Emit the pipeline_failed event
    await this.storeEvent({
      eventType: 'pipeline_failed',
      timestamp: new Date().toISOString(),
      payload: {
        stage: error.stage || 'unknown',
        error: error.message,
        recoverable: false
      }
    })
    
    this.currentRunId = undefined
  }

  /**
   * Store a single event for the current pipeline run
   */
  async storeEvent(event: StorableEvent): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to store events for')
    }

    await this.repository.storeEvent(this.currentRunId, event)
  }

  /**
   * Store multiple events in a batch for the current pipeline run
   */
  async storeBatchEvents(events: StorableEvent[]): Promise<void> {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to store events for')
    }

    await this.repository.storeBatchEvents(this.currentRunId, events)
  }

  /**
   * Get the current pipeline run ID
   */
  getCurrentRunId(): string | undefined {
    return this.currentRunId
  }

  /**
   * Set the current pipeline run ID (useful for resuming or connecting to existing runs)
   */
  setCurrentRunId(runId: string): void {
    this.currentRunId = runId
  }

  /**
   * Create an event emitter that automatically stores events
   */
  createEventEmitter(): PipelineEventEmitter {
    const storage = this
    
    return {
      emit(eventType: any, data: any) {
        // Store the event asynchronously
        storage.storeEvent({
          eventType,
          timestamp: data.timestamp || new Date().toISOString(),
          payload: data
        }).catch(error => {
          console.error(`Failed to store event ${eventType}:`, error)
        })
      }
    } as PipelineEventEmitter
  }

  /**
   * Get events for the current pipeline run
   */
  async getEvents(filters?: { eventTypes?: string[], limit?: number }) {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to get events for')
    }

    return await this.repository.getEvents(this.currentRunId, filters)
  }

  /**
   * Get the current pipeline run details
   */
  async getCurrentRun() {
    if (!this.currentRunId) {
      return null
    }

    return await this.repository.getPipelineRun(this.currentRunId)
  }

  /**
   * Get pipeline runs for a company/product
   */
  async getPipelineRuns(companyId: string, productId?: string, limit: number = 50) {
    return await this.repository.getPipelineRuns(companyId, productId, limit)
  }

  /**
   * Get event counts for the current pipeline run
   */
  async getEventCounts() {
    if (!this.currentRunId) {
      throw new Error('No active pipeline run to get event counts for')
    }

    return await this.repository.getEventCounts(this.currentRunId)
  }
}
