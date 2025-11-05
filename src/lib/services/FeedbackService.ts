import { SupabaseClient } from '@supabase/supabase-js'
import { FeedbackRepository } from '@/lib/repositories/FeedbackRepository'
import { FeedbackItem } from '@/types/database'

export class FeedbackService {
  private feedbackRepository: FeedbackRepository

  constructor(supabase: SupabaseClient) {
    this.feedbackRepository = new FeedbackRepository(supabase)
  }

  async uploadCSVFeedback(
    companyId: string,
    csvData: string,
    mapping: {
      contentColumn: string
      sentimentColumn?: string
      productAreaColumn?: string
      submittedAtColumn?: string
      userMetadataColumns?: string[]
    }
  ): Promise<FeedbackItem[]> {
    try {
      // Parse CSV data
      const lines = csvData.trim().split('\n')
      const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''))
      
      if (lines.length < 2) {
        throw new Error('CSV must contain at least one data row')
      }

      // Find column indices
      const contentIndex = headers.indexOf(mapping.contentColumn)
      if (contentIndex === -1) {
        throw new Error(`Content column '${mapping.contentColumn}' not found in CSV`)
      }

      const sentimentIndex = mapping.sentimentColumn ? headers.indexOf(mapping.sentimentColumn) : -1
      const productAreaIndex = mapping.productAreaColumn ? headers.indexOf(mapping.productAreaColumn) : -1
      const submittedAtIndex = mapping.submittedAtColumn ? headers.indexOf(mapping.submittedAtColumn) : -1

      // Parse feedback items
      const feedbackItems = []
      
      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(',').map(v => v.trim().replace(/"/g, ''))
        
        if (values.length !== headers.length) {
          console.warn(`Skipping malformed row ${i + 1}: expected ${headers.length} columns, got ${values.length}`)
          continue
        }

        const content = values[contentIndex]
        if (!content || content.trim() === '') {
          console.warn(`Skipping row ${i + 1}: empty content`)
          continue
        }

        // Build user metadata from specified columns
        const userMetadata: Record<string, any> = {}
        if (mapping.userMetadataColumns) {
          mapping.userMetadataColumns.forEach(column => {
            const index = headers.indexOf(column)
            if (index !== -1 && values[index]) {
              userMetadata[column] = values[index]
            }
          })
        }

        const feedbackItem = {
          company_id: companyId,
          source: 'csv',
          content: content,
          sentiment: sentimentIndex !== -1 ? this.normalizeSentiment(values[sentimentIndex]) : undefined,
          product_area: productAreaIndex !== -1 ? values[productAreaIndex] : undefined,
          submitted_at: submittedAtIndex !== -1 ? this.parseDate(values[submittedAtIndex]) : new Date().toISOString(),
          user_metadata: Object.keys(userMetadata).length > 0 ? userMetadata : {}
        }

        feedbackItems.push(feedbackItem)
      }

      if (feedbackItems.length === 0) {
        throw new Error('No valid feedback items found in CSV')
      }

      // Batch insert feedback items
      const createdItems = await this.feedbackRepository.createMany(feedbackItems)

      return createdItems
    } catch (error) {
      throw new Error(`Failed to upload CSV feedback: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async getFeedbackByCompany(
    companyId: string,
    filters?: {
      source?: string[]
      sentiment?: string[]
      product_area?: string[]
      date_from?: string
      date_to?: string
    },
    pagination?: {
      page: number
      limit: number
    }
  ): Promise<{
    data: FeedbackItem[]
    total: number
    page: number
    limit: number
    hasMore: boolean
  }> {
    const page = pagination?.page || 1
    const limit = pagination?.limit || 20
    const offset = (page - 1) * limit

    const [data, total] = await Promise.all([
      this.feedbackRepository.findByCompanyId(companyId, filters, limit, offset),
      this.feedbackRepository.countByCompanyId(companyId, filters)
    ])

    return {
      data,
      total,
      page,
      limit,
      hasMore: offset + data.length < total
    }
  }

  async getFeedbackFilters(companyId: string): Promise<{
    sources: string[]
    productAreas: string[]
    sentiments: string[]
  }> {
    const [sources, productAreas] = await Promise.all([
      this.feedbackRepository.getDistinctSources(companyId),
      this.feedbackRepository.getDistinctProductAreas(companyId)
    ])

    return {
      sources,
      productAreas,
      sentiments: ['positive', 'negative', 'neutral']
    }
  }

  async updateFeedbackSentiment(id: string, sentiment: string): Promise<FeedbackItem> {
    const normalizedSentiment = this.normalizeSentiment(sentiment)
    return this.feedbackRepository.update(id, { 
      sentiment: normalizedSentiment,
      processed_at: new Date().toISOString()
    })
  }

  async deleteFeedback(id: string): Promise<void> {
    return this.feedbackRepository.delete(id)
  }

  private normalizeSentiment(sentiment: string): string {
    if (!sentiment) return 'neutral'
    
    const normalized = sentiment.toLowerCase().trim()
    
    if (['positive', 'good', 'happy', 'satisfied', 'love', 'great', 'excellent'].some(word => normalized.includes(word))) {
      return 'positive'
    }
    
    if (['negative', 'bad', 'angry', 'frustrated', 'hate', 'terrible', 'awful'].some(word => normalized.includes(word))) {
      return 'negative'
    }
    
    return 'neutral'
  }

  private parseDate(dateString: string): string {
    if (!dateString) return new Date().toISOString()
    
    try {
      const date = new Date(dateString)
      if (isNaN(date.getTime())) {
        return new Date().toISOString()
      }
      return date.toISOString()
    } catch {
      return new Date().toISOString()
    }
  }
}
