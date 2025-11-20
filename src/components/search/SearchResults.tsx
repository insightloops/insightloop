import React from 'react'
import { Search } from 'lucide-react'
import { Feature, FeatureStatus, FeaturePriority } from '@/types'
import { Card } from '../ui/card'
import { Badge } from '../ui/badge'

interface SearchResultsProps {
  features: Feature[]
  total: number
  query: string
  onFeatureClick?: (feature: Feature) => void
  isLoading?: boolean
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

export default SearchResults
