import { FeatureRepository } from '../repositories/FeatureRepository'
import { Feature, FeatureInsert, FeatureUpdate, FeatureWithInsights, FeatureStatus, FeaturePriority } from '../../types/database'

export class FeatureService {
  private featureRepository: FeatureRepository

  constructor() {
    this.featureRepository = new FeatureRepository()
  }

  /**
   * Get all features for a company
   */
  async getFeatures(companyId: string): Promise<Feature[]> {
    return this.featureRepository.getByCompany(companyId)
  }

  /**
   * Get features by product area
   */
  async getFeaturesByProductArea(productAreaId: string): Promise<Feature[]> {
    return this.featureRepository.getByProductArea(productAreaId)
  }

  /**
   * Get a single feature by ID
   */
  async getFeature(id: string): Promise<Feature | null> {
    return this.featureRepository.getById(id)
  }

  /**
   * Get a feature with insights and relationships
   */
  async getFeatureWithInsights(id: string): Promise<FeatureWithInsights | null> {
    return this.featureRepository.getWithInsights(id)
  }

  /**
   * Create a new feature
   */
  async createFeature(featureData: FeatureInsert): Promise<Feature> {
    // Validate required fields
    if (!featureData.name?.trim()) {
      throw new Error('Feature name is required')
    }

    if (!featureData.product_area_id) {
      throw new Error('Product area is required')
    }

    if (!featureData.company_id) {
      throw new Error('Company ID is required')
    }

    // Validate status and priority if provided
    if (featureData.status && !Object.values(FeatureStatus).includes(featureData.status as FeatureStatus)) {
      throw new Error('Invalid feature status')
    }

    if (featureData.priority && !Object.values(FeaturePriority).includes(featureData.priority as FeaturePriority)) {
      throw new Error('Invalid feature priority')
    }

    // Validate effort score and business value if provided
    if (featureData.effort_score && (featureData.effort_score < 1 || featureData.effort_score > 10)) {
      throw new Error('Effort score must be between 1 and 10')
    }

    if (featureData.business_value && (featureData.business_value < 1 || featureData.business_value > 10)) {
      throw new Error('Business value must be between 1 and 10')
    }

    const cleanedData: FeatureInsert = {
      ...featureData,
      name: featureData.name.trim(),
      description: featureData.description?.trim() || null,
      status: featureData.status || FeatureStatus.PLANNED,
      priority: featureData.priority || FeaturePriority.MEDIUM,
      metadata: featureData.metadata || {}
    }

    return this.featureRepository.create(cleanedData)
  }

  /**
   * Update a feature
   */
  async updateFeature(id: string, updates: FeatureUpdate): Promise<Feature> {
    // Validate name if provided
    if (updates.name !== undefined && !updates.name?.trim()) {
      throw new Error('Feature name cannot be empty')
    }

    // Validate status if provided
    if (updates.status && !Object.values(FeatureStatus).includes(updates.status as FeatureStatus)) {
      throw new Error('Invalid feature status')
    }

    // Validate priority if provided
    if (updates.priority && !Object.values(FeaturePriority).includes(updates.priority as FeaturePriority)) {
      throw new Error('Invalid feature priority')
    }

    // Validate effort score if provided
    if (updates.effort_score !== undefined && updates.effort_score !== null) {
      if (updates.effort_score < 1 || updates.effort_score > 10) {
        throw new Error('Effort score must be between 1 and 10')
      }
    }

    // Validate business value if provided
    if (updates.business_value !== undefined && updates.business_value !== null) {
      if (updates.business_value < 1 || updates.business_value > 10) {
        throw new Error('Business value must be between 1 and 10')
      }
    }

    const cleanedUpdates: FeatureUpdate = {
      ...updates,
      name: updates.name?.trim(),
      description: updates.description?.trim(),
      updated_at: new Date().toISOString()
    }

    return this.featureRepository.update(id, cleanedUpdates)
  }

  /**
   * Delete a feature
   */
  async deleteFeature(id: string): Promise<void> {
    return this.featureRepository.delete(id)
  }

  /**
   * Get features by status
   */
  async getFeaturesByStatus(status: FeatureStatus, companyId?: string): Promise<Feature[]> {
    return this.featureRepository.getByStatus(status, companyId)
  }

  /**
   * Get features by priority
   */
  async getFeaturesByPriority(priority: FeaturePriority, companyId?: string): Promise<Feature[]> {
    return this.featureRepository.getByPriority(priority, companyId)
  }

  /**
   * Update feature status
   */
  async updateFeatureStatus(id: string, status: FeatureStatus): Promise<Feature> {
    if (!Object.values(FeatureStatus).includes(status)) {
      throw new Error('Invalid feature status')
    }
    return this.featureRepository.updateStatus(id, status)
  }

  /**
   * Update feature priority
   */
  async updateFeaturePriority(id: string, priority: FeaturePriority): Promise<Feature> {
    if (!Object.values(FeaturePriority).includes(priority)) {
      throw new Error('Invalid feature priority')
    }
    return this.featureRepository.updatePriority(id, priority)
  }

  /**
   * Bulk update feature statuses
   */
  async bulkUpdateFeatureStatus(ids: string[], status: FeatureStatus): Promise<Feature[]> {
    if (!Object.values(FeatureStatus).includes(status)) {
      throw new Error('Invalid feature status')
    }
    return this.featureRepository.bulkUpdateStatus(ids, status)
  }

  /**
   * Get feature metrics for a company
   */
  async getFeatureMetrics(companyId: string): Promise<{
    total: number
    by_status: Record<string, number>
    by_priority: Record<string, number>
    avg_effort_score: number
    avg_business_value: number
    backlog_health: 'healthy' | 'needs_attention' | 'critical'
  }> {
    const metrics = await this.featureRepository.getMetrics(companyId)
    
    // Calculate backlog health
    const plannedCount = metrics.by_status[FeatureStatus.PLANNED] || 0
    const inProgressCount = metrics.by_status[FeatureStatus.IN_PROGRESS] || 0
    const completedCount = metrics.by_status[FeatureStatus.COMPLETED] || 0
    
    let backlog_health: 'healthy' | 'needs_attention' | 'critical' = 'healthy'
    
    if (metrics.total === 0) {
      backlog_health = 'critical'
    } else {
      const inProgressRatio = inProgressCount / metrics.total
      const completedRatio = completedCount / metrics.total
      
      if (inProgressRatio > 0.5 || completedRatio < 0.2) {
        backlog_health = 'needs_attention'
      }
      
      if (inProgressRatio > 0.7 || completedRatio < 0.1) {
        backlog_health = 'critical'
      }
    }

    return {
      ...metrics,
      backlog_health
    }
  }

  /**
   * Get the roadmap view (features grouped by status and priority)
   */
  async getRoadmap(companyId: string): Promise<{
    planned: Feature[]
    in_progress: Feature[]
    completed: Feature[]
    on_hold: Feature[]
    cancelled: Feature[]
  }> {
    const features = await this.getFeatures(companyId)
    
    return {
      planned: features.filter(f => f.status === FeatureStatus.PLANNED).sort((a, b) => {
        const priorityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return (priorityOrder[b.priority as keyof typeof priorityOrder] || 0) - 
               (priorityOrder[a.priority as keyof typeof priorityOrder] || 0)
      }),
      in_progress: features.filter(f => f.status === FeatureStatus.IN_PROGRESS),
      completed: features.filter(f => f.status === FeatureStatus.COMPLETED).sort((a, b) => {
        const aDate = new Date(a.updated_at || a.created_at || 0).getTime()
        const bDate = new Date(b.updated_at || b.created_at || 0).getTime()
        return bDate - aDate
      }),
      on_hold: features.filter(f => f.status === FeatureStatus.ON_HOLD),
      cancelled: features.filter(f => f.status === FeatureStatus.CANCELLED)
    }
  }

  /**
   * Search features with advanced filtering
   */
  async searchFeatures(options: {
    query?: string
    companyId?: string
    productId?: string
    productAreaId?: string
    status?: string[]
    priority?: string[]
    effortScoreMin?: number
    effortScoreMax?: number
    businessValueMin?: number
    businessValueMax?: number
    createdAfter?: string
    createdBefore?: string
    limit?: number
    offset?: number
  }): Promise<{ features: Feature[], total: number }> {
    // Validate search parameters
    if (options.effortScoreMin !== undefined && (options.effortScoreMin < 1 || options.effortScoreMin > 10)) {
      throw new Error('Effort score min must be between 1 and 10')
    }
    
    if (options.effortScoreMax !== undefined && (options.effortScoreMax < 1 || options.effortScoreMax > 10)) {
      throw new Error('Effort score max must be between 1 and 10')
    }

    if (options.businessValueMin !== undefined && (options.businessValueMin < 1 || options.businessValueMin > 10)) {
      throw new Error('Business value min must be between 1 and 10')
    }
    
    if (options.businessValueMax !== undefined && (options.businessValueMax < 1 || options.businessValueMax > 10)) {
      throw new Error('Business value max must be between 1 and 10')
    }

    // Validate status values
    if (options.status) {
      const validStatuses = Object.values(FeatureStatus)
      const invalidStatuses = options.status.filter(status => !validStatuses.includes(status as FeatureStatus))
      if (invalidStatuses.length > 0) {
        throw new Error(`Invalid status values: ${invalidStatuses.join(', ')}`)
      }
    }

    // Validate priority values
    if (options.priority) {
      const validPriorities = Object.values(FeaturePriority)
      const invalidPriorities = options.priority.filter(priority => !validPriorities.includes(priority as FeaturePriority))
      if (invalidPriorities.length > 0) {
        throw new Error(`Invalid priority values: ${invalidPriorities.join(', ')}`)
      }
    }

    // Validate date formats
    if (options.createdAfter && isNaN(Date.parse(options.createdAfter))) {
      throw new Error('Invalid created_after date format')
    }
    
    if (options.createdBefore && isNaN(Date.parse(options.createdBefore))) {
      throw new Error('Invalid created_before date format')
    }

    // Perform the search
    return this.featureRepository.search(options)
  }

  /**
   * Get search suggestions for autocomplete
   */
  async getSearchSuggestions(query: string, companyId?: string, limit = 5): Promise<string[]> {
    if (!query || query.trim().length < 2) {
      return []
    }

    return this.featureRepository.getSearchSuggestions(query.trim(), companyId, limit)
  }
}
