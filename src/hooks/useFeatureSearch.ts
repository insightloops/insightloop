import { useState, useEffect, useCallback } from 'react'
import { Feature } from '../types'

interface SearchFilters {
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
}

interface SearchResult {
  features: Feature[]
  total: number
  limit: number
  offset: number
  hasMore: boolean
}

interface UseFeatureSearchReturn {
  searchResults: SearchResult | null
  isLoading: boolean
  error: string | null
  suggestions: string[]
  search: (filters: SearchFilters, limit?: number, offset?: number) => Promise<void>
  getSuggestions: (query: string, companyId?: string) => Promise<void>
  clearSearch: () => void
  loadMore: () => Promise<void>
}

export const useFeatureSearch = (): UseFeatureSearchReturn => {
  const [searchResults, setSearchResults] = useState<SearchResult | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [lastSearchFilters, setLastSearchFilters] = useState<SearchFilters | null>(null)

  const search = useCallback(async (
    filters: SearchFilters, 
    limit = 20, 
    offset = 0
  ): Promise<void> => {
    setIsLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      
      if (filters.query) params.append('q', filters.query)
      if (filters.companyId) params.append('company_id', filters.companyId)
      if (filters.productId) params.append('product_id', filters.productId)
      if (filters.productAreaId) params.append('product_area_id', filters.productAreaId)
      if (filters.status && filters.status.length > 0) {
        params.append('status', filters.status.join(','))
      }
      if (filters.priority && filters.priority.length > 0) {
        params.append('priority', filters.priority.join(','))
      }
      if (filters.effortScoreMin !== undefined) {
        params.append('effort_score_min', filters.effortScoreMin.toString())
      }
      if (filters.effortScoreMax !== undefined) {
        params.append('effort_score_max', filters.effortScoreMax.toString())
      }
      if (filters.businessValueMin !== undefined) {
        params.append('business_value_min', filters.businessValueMin.toString())
      }
      if (filters.businessValueMax !== undefined) {
        params.append('business_value_max', filters.businessValueMax.toString())
      }
      if (filters.createdAfter) {
        params.append('created_after', filters.createdAfter)
      }
      if (filters.createdBefore) {
        params.append('created_before', filters.createdBefore)
      }
      
      params.append('limit', limit.toString())
      params.append('offset', offset.toString())

      const response = await fetch(`/api/features/search?${params}`)
      
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Search failed')
      }

      const result: SearchResult = await response.json()
      
      // If this is a load more operation, append to existing results
      if (offset > 0 && searchResults) {
        setSearchResults({
          ...result,
          features: [...searchResults.features, ...result.features]
        })
      } else {
        setSearchResults(result)
        setLastSearchFilters(filters)
      }

    } catch (err: any) {
      setError(err.message || 'An error occurred while searching')
      console.error('Search error:', err)
    } finally {
      setIsLoading(false)
    }
  }, [searchResults])

  const getSuggestions = useCallback(async (
    query: string, 
    companyId?: string
  ): Promise<void> => {
    if (!query || query.trim().length < 2) {
      setSuggestions([])
      return
    }

    try {
      const params = new URLSearchParams({ q: query })
      if (companyId) params.append('company_id', companyId)

      const response = await fetch(`/api/features/suggestions?${params}`)
      
      if (response.ok) {
        const data = await response.json()
        setSuggestions(data.suggestions || [])
      }
    } catch (err) {
      console.error('Failed to get suggestions:', err)
      setSuggestions([])
    }
  }, [])

  const clearSearch = useCallback(() => {
    setSearchResults(null)
    setError(null)
    setSuggestions([])
    setLastSearchFilters(null)
  }, [])

  const loadMore = useCallback(async (): Promise<void> => {
    if (!searchResults || !lastSearchFilters || !searchResults.hasMore || isLoading) {
      return
    }

    const nextOffset = searchResults.features.length
    await search(lastSearchFilters, searchResults.limit, nextOffset)
  }, [searchResults, lastSearchFilters, isLoading, search])

  return {
    searchResults,
    isLoading,
    error,
    suggestions,
    search,
    getSuggestions,
    clearSearch,
    loadMore
  }
}

// Debounced search hook for real-time search
export const useDebouncedFeatureSearch = (
  delay = 300
): UseFeatureSearchReturn & { 
  debouncedSearch: (filters: SearchFilters) => void 
} => {
  const searchHook = useFeatureSearch()
  const [debounceTimer, setDebounceTimer] = useState<NodeJS.Timeout | null>(null)

  const debouncedSearch = useCallback((filters: SearchFilters) => {
    if (debounceTimer) {
      clearTimeout(debounceTimer)
    }

    const timer = setTimeout(() => {
      searchHook.search(filters)
    }, delay)

    setDebounceTimer(timer)
  }, [debounceTimer, delay, searchHook.search])

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
    }
  }, [debounceTimer])

  return {
    ...searchHook,
    debouncedSearch
  }
}
