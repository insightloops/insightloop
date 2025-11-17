import { BaseRepository } from './BaseRepository'

// Types for pipeline runs and events
export interface PipelineRunConfig {
  pipelineId: string
  companyId: string
  productId: string
  source: 'manual' | 'scheduled' | 'api' | 'webhook'
  stages: string[]
  inputFeedbackCount: number
}

export interface PipelineRunUpdate {
  status?: 'running' | 'completed' | 'failed' | 'cancelled'
  outputCount?: number
  completedAt?: string
  durationMs?: number
  resultsSummary?: Record<string, any>
  errorMessage?: string
  errorStage?: string
}

export interface StorableEvent {
  eventType: string
  timestamp: string
  payload: Record<string, any>
}

export interface StoredPipelineRun {
  id: string
  pipelineId: string
  companyId: string
  productId: string
  source: string
  stages: string[]
  inputFeedbackCount: number
  outputCount: number | null
  status: string
  startedAt: string
  completedAt: string | null
  durationMs: number | null
  resultsSummary: Record<string, any> | null
  errorMessage: string | null
  errorStage: string | null
  createdAt: string
  updatedAt: string
}

export interface StoredPipelineEvent {
  id: string
  pipelineRunId: string
  eventType: string
  timestamp: string
  payload: Record<string, any>
  createdAt: string
}

export interface EventFilters {
  eventTypes?: string[]
  startTime?: string
  endTime?: string
  limit?: number
  offset?: number
}

/**
 * Repository for managing pipeline runs and their events
 */
export class PipelineEventRepository extends BaseRepository {
  
  /**
   * Create a new pipeline run
   */
  async createPipelineRun(config: PipelineRunConfig): Promise<string> {
    const { data, error } = await this.supabase
      .from('pipeline_runs')
      .insert({
        pipeline_id: config.pipelineId,
        company_id: config.companyId,
        product_id: config.productId,
        source: config.source,
        stages: config.stages,
        input_feedback_count: config.inputFeedbackCount,
        status: 'running'
      })
      .select('id')
      .single()
    
    if (error) {
      throw new Error(`Failed to create pipeline run: ${error.message}`)
    }
    
    return data.id
  }

  /**
   * Update an existing pipeline run
   */
  async updatePipelineRun(runId: string, updates: PipelineRunUpdate): Promise<void> {
    const updateData: Record<string, any> = {}
    
    if (updates.status) updateData.status = updates.status
    if (updates.outputCount !== undefined) updateData.output_count = updates.outputCount
    if (updates.completedAt) updateData.completed_at = updates.completedAt
    if (updates.durationMs !== undefined) updateData.duration_ms = updates.durationMs
    if (updates.resultsSummary) updateData.results_summary = updates.resultsSummary
    if (updates.errorMessage) updateData.error_message = updates.errorMessage
    if (updates.errorStage) updateData.error_stage = updates.errorStage

    const { error } = await this.supabase
      .from('pipeline_runs')
      .update(updateData)
      .eq('id', runId)
    
    if (error) {
      throw new Error(`Failed to update pipeline run: ${error.message}`)
    }
  }

  /**
   * Complete a pipeline run with success
   */
  async completePipelineRun(runId: string, summary: { outputCount: number, resultsSummary?: Record<string, any> }): Promise<void> {
    const now = new Date().toISOString()
    
    // Get the run to calculate duration
    const { data: run, error: fetchError } = await this.supabase
      .from('pipeline_runs')
      .select('started_at')
      .eq('id', runId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch pipeline run for completion: ${fetchError.message}`)
    }
    
    const duration = Date.now() - new Date(run.started_at).getTime()
    
    await this.updatePipelineRun(runId, {
      status: 'completed',
      outputCount: summary.outputCount,
      completedAt: now,
      durationMs: duration,
      resultsSummary: summary.resultsSummary
    })
  }

  /**
   * Fail a pipeline run with error details
   */
  async failPipelineRun(runId: string, error: { message: string, stage?: string }): Promise<void> {
    const now = new Date().toISOString()
    
    // Get the run to calculate duration
    const { data: run, error: fetchError } = await this.supabase
      .from('pipeline_runs')
      .select('started_at')
      .eq('id', runId)
      .single()
    
    if (fetchError) {
      throw new Error(`Failed to fetch pipeline run for failure: ${fetchError.message}`)
    }
    
    const duration = Date.now() - new Date(run.started_at).getTime()
    
    await this.updatePipelineRun(runId, {
      status: 'failed',
      completedAt: now,
      durationMs: duration,
      errorMessage: error.message,
      errorStage: error.stage
    })
  }

  /**
   * Store a single event
   */
  async storeEvent(runId: string, event: StorableEvent): Promise<void> {
    const { error } = await this.supabase
      .from('pipeline_events')
      .insert({
        pipeline_run_id: runId,
        event_type: event.eventType,
        timestamp: event.timestamp,
        payload: event.payload
      })
    
    if (error) {
      throw new Error(`Failed to store event: ${error.message}`)
    }
  }

  /**
   * Store multiple events in a batch
   */
  async storeBatchEvents(runId: string, events: StorableEvent[]): Promise<void> {
    if (events.length === 0) return
    
    const insertData = events.map(event => ({
      pipeline_run_id: runId,
      event_type: event.eventType,
      timestamp: event.timestamp,
      payload: event.payload
    }))
    
    const { error } = await this.supabase
      .from('pipeline_events')
      .insert(insertData)
    
    if (error) {
      throw new Error(`Failed to store batch events: ${error.message}`)
    }
  }

  /**
   * Get a pipeline run by ID
   */
  async getPipelineRun(runId: string): Promise<StoredPipelineRun | null> {
    const { data, error } = await this.supabase
      .from('pipeline_runs')
      .select('*')
      .eq('id', runId)
      .single()
    
    if (error) {
      if (error.code === 'PGRST116') return null // Not found
      throw new Error(`Failed to get pipeline run: ${error.message}`)
    }
    
    return {
      id: data.id,
      pipelineId: data.pipeline_id,
      companyId: data.company_id,
      productId: data.product_id,
      source: data.source,
      stages: data.stages,
      inputFeedbackCount: data.input_feedback_count,
      outputCount: data.output_count,
      status: data.status,
      startedAt: data.started_at,
      completedAt: data.completed_at,
      durationMs: data.duration_ms,
      resultsSummary: data.results_summary as Record<string, any> | null,
      errorMessage: data.error_message,
      errorStage: data.error_stage,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    }
  }

  /**
   * Get events for a pipeline run
   */
  async getEvents(runId: string, filters?: EventFilters): Promise<StoredPipelineEvent[]> {
    let query = this.supabase
      .from('pipeline_events')
      .select('*')
      .eq('pipeline_run_id', runId)
      .order('timestamp', { ascending: true })
    
    if (filters?.eventTypes && filters.eventTypes.length > 0) {
      query = query.in('event_type', filters.eventTypes)
    }
    
    if (filters?.startTime) {
      query = query.gte('timestamp', filters.startTime)
    }
    
    if (filters?.endTime) {
      query = query.lte('timestamp', filters.endTime)
    }
    
    if (filters?.limit) {
      query = query.limit(filters.limit)
    }
    
    if (filters?.offset) {
      query = query.range(filters.offset, filters.offset + (filters.limit || 100) - 1)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to get events: ${error.message}`)
    }
    
    return data.map(event => ({
      id: event.id,
      pipelineRunId: event.pipeline_run_id,
      eventType: event.event_type,
      timestamp: event.timestamp,
      payload: event.payload as Record<string, any>,
      createdAt: event.created_at
    }))
  }

  /**
   * Get pipeline runs for a company/product
   */
  async getPipelineRuns(companyId: string, productId?: string, limit: number = 50): Promise<StoredPipelineRun[]> {
    let query = this.supabase
      .from('pipeline_runs')
      .select('*')
      .eq('company_id', companyId)
      .order('started_at', { ascending: false })
      .limit(limit)
    
    if (productId) {
      query = query.eq('product_id', productId)
    }
    
    const { data, error } = await query
    
    if (error) {
      throw new Error(`Failed to get pipeline runs: ${error.message}`)
    }
    
    return data.map(run => ({
      id: run.id,
      pipelineId: run.pipeline_id,
      companyId: run.company_id,
      productId: run.product_id,
      source: run.source,
      stages: run.stages,
      inputFeedbackCount: run.input_feedback_count,
      outputCount: run.output_count,
      status: run.status,
      startedAt: run.started_at,
      completedAt: run.completed_at,
      durationMs: run.duration_ms,
      resultsSummary: run.results_summary as Record<string, any> | null,
      errorMessage: run.error_message,
      errorStage: run.error_stage,
      createdAt: run.created_at,
      updatedAt: run.updated_at
    }))
  }

  /**
   * Get event count by type for a pipeline run
   */
  async getEventCounts(runId: string): Promise<Record<string, number>> {
    const { data, error } = await this.supabase
      .from('pipeline_events')
      .select('event_type')
      .eq('pipeline_run_id', runId)
    
    if (error) {
      throw new Error(`Failed to get event counts: ${error.message}`)
    }
    
    const counts: Record<string, number> = {}
    data.forEach(event => {
      counts[event.event_type] = (counts[event.event_type] || 0) + 1
    })
    
    return counts
  }
}
