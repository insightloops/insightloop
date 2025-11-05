'use client'

import { useState, useEffect, useCallback } from 'react'
import { FeedbackItem } from '@/types/database'

interface FeedbackFilters {
  source?: string[]
  sentiment?: string[]
  product_area?: string[]
  date_from?: string
  date_to?: string
}

interface UseFeedbackResult {
  feedback: FeedbackItem[]
  loading: boolean
  error: string | null
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
  refetch: () => Promise<void>
  loadMore: () => Promise<void>
  uploadCSV: (file: File, mapping: CSVMapping) => Promise<void>
  uploading: boolean
}

interface FeedbackResponse {
  data: FeedbackItem[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface CSVMapping {
  contentColumn: string
  sentimentColumn?: string
  productAreaColumn?: string
  submittedAtColumn?: string
  userMetadataColumns?: string[]
}

export function useFeedback(companyId: string, filters: FeedbackFilters = {}, limit: number = 20): UseFeedbackResult {
  const [feedback, setFeedback] = useState<FeedbackItem[]>([])
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    hasMore: false
  })

  const buildQueryString = useCallback((page: number = 1) => {
    const params = new URLSearchParams()
    
    if (filters.source?.length) {
      filters.source.forEach(s => params.append('source', s))
    }
    if (filters.sentiment?.length) {
      filters.sentiment.forEach(s => params.append('sentiment', s))
    }
    if (filters.product_area?.length) {
      filters.product_area.forEach(s => params.append('product_area', s))
    }
    if (filters.date_from) params.append('date_from', filters.date_from)
    if (filters.date_to) params.append('date_to', filters.date_to)
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    return params.toString()
  }, [filters, limit])

  const fetchFeedback = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)
      
      const queryString = buildQueryString(page)
      const response = await fetch(`/api/companies/${companyId}/feedback?${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch feedback: ${response.statusText}`)
      }
      
      const data: FeedbackResponse = await response.json()
      
      if (append) {
        setFeedback(prev => [...prev, ...data.data])
      } else {
        setFeedback(data.data)
      }
      
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        hasMore: data.hasMore
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch feedback')
    } finally {
      setLoading(false)
    }
  }, [companyId, buildQueryString])

  const loadMore = useCallback(async () => {
    if (pagination.hasMore && !loading) {
      await fetchFeedback(pagination.page + 1, true)
    }
  }, [pagination.hasMore, pagination.page, loading, fetchFeedback])

  const uploadCSV = useCallback(async (file: File, mapping: CSVMapping) => {
    if (!companyId) return

    try {
      setUploading(true)
      setError(null)

      const formData = new FormData()
      formData.append('file', file)
      formData.append('contentColumn', mapping.contentColumn)
      if (mapping.sentimentColumn) formData.append('sentimentColumn', mapping.sentimentColumn)
      if (mapping.productAreaColumn) formData.append('productAreaColumn', mapping.productAreaColumn)
      if (mapping.submittedAtColumn) formData.append('submittedAtColumn', mapping.submittedAtColumn)
      if (mapping.userMetadataColumns?.length) {
        mapping.userMetadataColumns.forEach(col => formData.append('userMetadataColumns', col))
      }

      const response = await fetch(`/api/companies/${companyId}/feedback`, {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Upload failed: ${response.statusText}`)
      }

      // Refresh feedback list after successful upload
      await fetchFeedback()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload CSV')
      throw err // Re-throw so component can handle the error
    } finally {
      setUploading(false)
    }
  }, [companyId, fetchFeedback])

  useEffect(() => {
    fetchFeedback()
  }, [fetchFeedback])

  return {
    feedback,
    loading,
    error,
    pagination,
    refetch: () => fetchFeedback(),
    loadMore,
    uploadCSV,
    uploading
  }
}
