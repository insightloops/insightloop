import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, X } from 'lucide-react'
import { FeatureStatus, FeaturePriority } from '@/types'
import { Button } from '../ui/button'
import { Input } from '../ui/input'
import { Badge } from '../ui/badge'

export interface SearchFilters {
  query: string
  status: string[]
  priority: string[]
  effortScoreMin?: number
  effortScoreMax?: number
  businessValueMin?: number
  businessValueMax?: number
  createdAfter?: string
  createdBefore?: string
}

interface SearchBarProps {
  onSearch: (filters: SearchFilters) => void
  suggestions?: string[]
  isLoading?: boolean
  placeholder?: string
  showAdvancedFilters?: boolean
  onShowFilters?: (show: boolean) => void
  onClearFilters?: () => void
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  suggestions = [],
  isLoading = false,
  placeholder = "Search features...",
  showAdvancedFilters = true,
  onShowFilters,
  onClearFilters
}) => {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: [],
  })

  // Handle search input with debouncing
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (query !== filters.query) {
        const newFilters = { ...filters, query }
        setFilters(newFilters)
        onSearch(newFilters)
      }
    }, 300)

    return () => clearTimeout(debounceTimer)
  }, [query, filters, onSearch])

  const handleSuggestionClick = (suggestion: string) => {
    setQuery(suggestion)
    setShowSuggestions(false)
  }

  const clearFilters = () => {
    const clearedFilters: SearchFilters = {
      query: '',
      status: [],
      priority: [],
    }
    setFilters(clearedFilters)
    setQuery('')
    onSearch(clearedFilters)
    onClearFilters?.()
  }

  const activeFilterCount = useMemo(() => {
    let count = 0
    if (filters.status.length > 0) count++
    if (filters.priority.length > 0) count++
    if (filters.effortScoreMin !== undefined || filters.effortScoreMax !== undefined) count++
    if (filters.businessValueMin !== undefined || filters.businessValueMax !== undefined) count++
    if (filters.createdAfter || filters.createdBefore) count++
    return count
  }, [filters])

  return (
    <div className="relative">
      <div className="flex gap-2">
        {/* Search Input */}
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder={placeholder}
            className="pl-10 pr-4"
            disabled={isLoading}
          />
          
          {/* Search Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-200 rounded-md shadow-lg z-10">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-50 first:rounded-t-md last:rounded-b-md"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Advanced Filters Button */}
        {showAdvancedFilters && (
          <Button
            variant="outline"
            onClick={() => onShowFilters?.(true)}
            className="flex items-center gap-2"
          >
            <Filter className="h-4 w-4" />
            Filters
            {activeFilterCount > 0 && (
              <Badge variant="secondary" className="ml-1">
                {activeFilterCount}
              </Badge>
            )}
          </Button>
        )}

        {/* Clear Filters */}
        {(query || activeFilterCount > 0) && (
          <Button
            variant="ghost"
            onClick={clearFilters}
            className="flex items-center gap-1"
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        )}
      </div>
    </div>
  )
}

export default SearchBar
