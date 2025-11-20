'use client'

import { useState, useEffect, useCallback } from 'react'
import { Insight, InsightWithEvidence } from '@/types'
import { useUserIdSync } from '@/hooks/useCurrentUser'

interface InsightFilters {
  theme?: string[]
  status?: string[]
  min_score?: number
  max_score?: number
}

interface UseInsightsResult {
  insights: Insight[]
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
  generateInsights: (options?: GenerateInsightsOptions) => Promise<void>
  generating: boolean
}

interface InsightsResponse {
  data: Insight[]
  total: number
  page: number
  limit: number
  hasMore: boolean
}

interface GenerateInsightsOptions {
  minFeedbackCount?: number
  themes?: string[]
}

export function useInsights(companyId: string, filters: InsightFilters = {}, limit: number = 20): UseInsightsResult {
  const [insights, setInsights] = useState<Insight[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [pagination, setPagination] = useState({
    page: 1,
    limit,
    total: 0,
    hasMore: false
  })

  const buildQueryString = useCallback((page: number = 1) => {
    const params = new URLSearchParams()
    
    if (filters.theme?.length) {
      filters.theme.forEach(t => params.append('theme', t))
    }
    if (filters.status?.length) {
      filters.status.forEach(s => params.append('status', s))
    }
    if (filters.min_score !== undefined) params.append('min_score', filters.min_score.toString())
    if (filters.max_score !== undefined) params.append('max_score', filters.max_score.toString())
    
    params.append('page', page.toString())
    params.append('limit', limit.toString())
    
    return params.toString()
  }, [filters, limit])

  const fetchInsights = useCallback(async (page: number = 1, append: boolean = false) => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)
      
      const queryString = buildQueryString(page)
      const response = await fetch(`/api/companies/${companyId}/insights?${queryString}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insights: ${response.statusText}`)
      }
      
      const data: InsightsResponse = await response.json()
      
      if (append) {
        setInsights(prev => [...prev, ...data.data])
      } else {
        setInsights(data.data)
      }
      
      setPagination({
        page: data.page,
        limit: data.limit,
        total: data.total,
        hasMore: data.hasMore
      })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insights')
    } finally {
      setLoading(false)
    }
  }, [companyId, buildQueryString])

  const loadMore = useCallback(async () => {
    if (pagination.hasMore && !loading) {
      await fetchInsights(pagination.page + 1, true)
    }
  }, [pagination.hasMore, pagination.page, loading, fetchInsights])

  const generateInsights = useCallback(async (options: GenerateInsightsOptions = {}) => {
    if (!companyId) return

    try {
      setGenerating(true)
      setError(null)

      const response = await fetch(`/api/companies/${companyId}/insights`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ options })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Generation failed: ${response.statusText}`)
      }

      // Refresh insights list after successful generation
      await fetchInsights()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate insights')
      throw err // Re-throw so component can handle the error
    } finally {
      setGenerating(false)
    }
  }, [companyId, fetchInsights])

  useEffect(() => {
    fetchInsights()
  }, [fetchInsights])

  return {
    insights,
    loading,
    error,
    pagination,
    refetch: () => fetchInsights(),
    loadMore,
    generateInsights,
    generating
  }
}

interface UseInsightWithEvidenceResult {
  insight: InsightWithEvidence | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useInsightWithEvidence(companyId: string, insightId: string): UseInsightWithEvidenceResult {
  const [insight, setInsight] = useState<InsightWithEvidence | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchInsightWithEvidence = useCallback(async () => {
    if (!companyId || !insightId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/companies/${companyId}/insights/${insightId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch insight: ${response.statusText}`)
      }
      
      const data = await response.json()
      setInsight(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch insight with evidence')
    } finally {
      setLoading(false)
    }
  }, [companyId, insightId])

  useEffect(() => {
    fetchInsightWithEvidence()
  }, [fetchInsightWithEvidence])

  return {
    insight,
    loading,
    error,
    refetch: fetchInsightWithEvidence
  }
}
