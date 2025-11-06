import React, { useState, useEffect, useMemo } from 'react'
import { Search, Filter, X, Calendar, BarChart3 } from 'lucide-react'
import { Feature, FeatureStatus, FeaturePriority } from '../types/database'
import { Button } from './ui/button'
import { Input } from './ui/input'
import { Select } from './ui/select'
import { Dialog } from './ui/dialog'
import { Card } from './ui/card'
import { Badge } from './ui/badge'

interface SearchFilters {
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
  companyId?: string
  showAdvancedFilters?: boolean
}

interface SearchResultsProps {
  features: Feature[]
  total: number
  query: string
  onFeatureClick?: (feature: Feature) => void
  isLoading?: boolean
}

export const SearchBar: React.FC<SearchBarProps> = ({
  onSearch,
  suggestions = [],
  isLoading = false,
  placeholder = "Search features...",
  showAdvancedFilters = true
}) => {
  const [query, setQuery] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [showFilters, setShowFilters] = useState(false)
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    status: [],
    priority: [],
  })

  // Handle search input
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

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    const newFilters = { ...filters, [key]: value }
    setFilters(newFilters)
    onSearch(newFilters)
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
            onClick={() => setShowFilters(true)}
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

      {/* Advanced Filters Modal */}
      <Dialog open={showFilters} onOpenChange={setShowFilters}>
        <div className="p-6 max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-semibold">Advanced Search Filters</h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowFilters(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="space-y-6">
            {/* Status Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(FeatureStatus).map((status) => (
                  <label key={status} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.status.includes(status)}
                      onChange={(e) => {
                        const newStatus = e.target.checked
                          ? [...filters.status, status]
                          : filters.status.filter(s => s !== status)
                        handleFilterChange('status', newStatus)
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">
                      {status.replace('_', ' ')}
                    </span>
                  </label>
                ))}
              </div>
            </div>

            {/* Priority Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">Priority</label>
              <div className="flex flex-wrap gap-2">
                {Object.values(FeaturePriority).map((priority) => (
                  <label key={priority} className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      checked={filters.priority.includes(priority)}
                      onChange={(e) => {
                        const newPriority = e.target.checked
                          ? [...filters.priority, priority]
                          : filters.priority.filter(p => p !== priority)
                        handleFilterChange('priority', newPriority)
                      }}
                      className="rounded"
                    />
                    <span className="text-sm capitalize">{priority}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Effort Score Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <BarChart3 className="inline h-4 w-4 mr-1" />
                Effort Score Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Min"
                  value={filters.effortScoreMin || ''}
                  onChange={(e) => handleFilterChange('effortScoreMin', 
                    e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Max"
                  value={filters.effortScoreMax || ''}
                  onChange={(e) => handleFilterChange('effortScoreMax', 
                    e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Business Value Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <BarChart3 className="inline h-4 w-4 mr-1" />
                Business Value Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Min"
                  value={filters.businessValueMin || ''}
                  onChange={(e) => handleFilterChange('businessValueMin', 
                    e.target.value ? parseInt(e.target.value) : undefined)}
                />
                <span className="self-center">to</span>
                <Input
                  type="number"
                  min="1"
                  max="10"
                  placeholder="Max"
                  value={filters.businessValueMax || ''}
                  onChange={(e) => handleFilterChange('businessValueMax', 
                    e.target.value ? parseInt(e.target.value) : undefined)}
                />
              </div>
            </div>

            {/* Date Range */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Calendar className="inline h-4 w-4 mr-1" />
                Created Date Range
              </label>
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={filters.createdAfter || ''}
                  onChange={(e) => handleFilterChange('createdAfter', e.target.value || undefined)}
                />
                <span className="self-center">to</span>
                <Input
                  type="date"
                  value={filters.createdBefore || ''}
                  onChange={(e) => handleFilterChange('createdBefore', e.target.value || undefined)}
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 mt-6 pt-4 border-t">
            <Button
              variant="outline"
              onClick={clearFilters}
            >
              Clear All
            </Button>
            <Button
              onClick={() => setShowFilters(false)}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export const SearchResults: React.FC<SearchResultsProps> = ({
  features,
  total,
  query,
  onFeatureClick,
  isLoading
}) => {
  const highlightText = (text: string, query: string) => {
    if (!query) return text
    
    const regex = new RegExp(`(${query})`, 'gi')
    const parts = text.split(regex)
    
    return parts.map((part, index) => 
      regex.test(part) ? 
        <mark key={index} className="bg-yellow-200 px-1 rounded">{part}</mark> : 
        part
    )
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case FeatureStatus.PLANNED: return 'bg-blue-100 text-blue-800'
      case FeatureStatus.IN_PROGRESS: return 'bg-yellow-100 text-yellow-800'
      case FeatureStatus.COMPLETED: return 'bg-green-100 text-green-800'
      case FeatureStatus.ON_HOLD: return 'bg-gray-100 text-gray-800'
      case FeatureStatus.CANCELLED: return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case FeaturePriority.CRITICAL: return 'bg-red-100 text-red-800'
      case FeaturePriority.HIGH: return 'bg-orange-100 text-orange-800'
      case FeaturePriority.MEDIUM: return 'bg-blue-100 text-blue-800'
      case FeaturePriority.LOW: return 'bg-gray-100 text-gray-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="p-4">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            </div>
          </Card>
        ))}
      </div>
    )
  }

  if (features.length === 0 && query) {
    return (
      <Card className="p-8 text-center">
        <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No features found</h3>
        <p className="text-gray-500">
          Try adjusting your search terms or filters
        </p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {total > 0 && (
        <div className="text-sm text-gray-600 mb-4">
          Found {total} feature{total !== 1 ? 's' : ''} 
          {query && ` for "${query}"`}
        </div>
      )}
      
      {features.map((feature) => (
        <Card 
          key={feature.id} 
          className="p-4 hover:shadow-md transition-shadow cursor-pointer"
          onClick={() => onFeatureClick?.(feature)}
        >
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-medium text-lg">
              {highlightText(feature.name, query)}
            </h3>
            <div className="flex gap-2">
              <Badge className={getStatusColor(feature.status || '')}>
                {feature.status?.replace('_', ' ') || 'Unknown'}
              </Badge>
              <Badge className={getPriorityColor(feature.priority || '')}>
                {feature.priority || 'Unknown'}
              </Badge>
            </div>
          </div>
          
          {feature.description && (
            <p className="text-gray-600 mb-3">
              {highlightText(
                feature.description.length > 150 
                  ? feature.description.substring(0, 150) + '...' 
                  : feature.description, 
                query
              )}
            </p>
          )}

          <div className="flex justify-between items-center text-sm text-gray-500">
            <div className="flex gap-4">
              {feature.effort_score && (
                <span>Effort: {feature.effort_score}/10</span>
              )}
              {feature.business_value && (
                <span>Value: {feature.business_value}/10</span>
              )}
            </div>
            <span>
              {feature.created_at ? new Date(feature.created_at).toLocaleDateString() : 'Unknown'}
            </span>
          </div>
        </Card>
      ))}
    </div>
  )
}
