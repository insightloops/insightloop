'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { SearchBar, SearchResults } from '@/components/SearchComponents'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { useDebouncedFeatureSearch } from '@/hooks/useFeatureSearch'
import { useCompanies } from '@/hooks/useCompanies'
import { Feature, FeatureStatus, FeaturePriority } from '@/types/database'
import { Search, TrendingUp, Clock, CheckCircle } from 'lucide-react'

export default function GlobalSearchPage() {
  const router = useRouter()
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('')
  
  const { companies } = useCompanies()
  const { 
    searchResults, 
    isLoading, 
    error,
    suggestions, 
    search,
    debouncedSearch, 
    getSuggestions,
    clearSearch,
    loadMore 
  } = useDebouncedFeatureSearch()

  // Get search suggestions when company changes
  useEffect(() => {
    if (selectedCompanyId) {
      getSuggestions('', selectedCompanyId)
    }
  }, [selectedCompanyId, getSuggestions])

  const handleSearch = (filters: any) => {
    const searchFilters = {
      ...filters,
      companyId: selectedCompanyId || undefined
    }
    debouncedSearch(searchFilters)
  }

  const handleFeatureClick = (feature: Feature) => {
    // Navigate to the feature in context - we need to figure out the full path
    // For now, we can show the feature details or navigate to the product area
    if (feature.product_area_id) {
      // This would need to be enhanced to get the full navigation path
      console.log('Navigate to feature:', feature)
      // router.push(`/products/${productId}/areas/${feature.product_area_id}/features`)
    }
  }

  const getQuickStats = () => {
    if (!searchResults) return null

    const total = searchResults.total
    const completed = searchResults.features.filter(f => f.status === FeatureStatus.COMPLETED).length
    const inProgress = searchResults.features.filter(f => f.status === FeatureStatus.IN_PROGRESS).length
    const highPriority = searchResults.features.filter(f => f.priority === FeaturePriority.HIGH || f.priority === FeaturePriority.CRITICAL).length

    return { total, completed, inProgress, highPriority }
  }

  const stats = getQuickStats()

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Feature Search
        </h1>
        <p className="text-gray-600">
          Search across all your features, products, and product areas
        </p>
      </div>

      {/* Company Selection */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Search within company (optional)
        </label>
        <select
          value={selectedCompanyId}
          onChange={(e) => setSelectedCompanyId(e.target.value)}
          className="block w-full md:w-64 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="">All Companies</option>
          {companies.map((company) => (
            <option key={company.id} value={company.id}>
              {company.name}
            </option>
          ))}
        </select>
      </div>

      {/* Search Bar */}
      <div className="mb-8">
        <SearchBar
          onSearch={handleSearch}
          suggestions={suggestions}
          isLoading={isLoading}
          placeholder="Search features across all products..."
          showAdvancedFilters={true}
        />
      </div>

      {/* Quick Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center">
              <Search className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
                <p className="text-sm text-gray-500">Total Results</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <CheckCircle className="h-8 w-8 text-green-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.completed}</div>
                <p className="text-sm text-gray-500">Completed</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <Clock className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.inProgress}</div>
                <p className="text-sm text-gray-500">In Progress</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center">
              <TrendingUp className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <div className="text-2xl font-bold text-gray-900">{stats.highPriority}</div>
                <p className="text-sm text-gray-500">High Priority</p>
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="p-4 mb-6 border-red-200 bg-red-50">
          <div className="text-red-800">
            <strong>Search Error:</strong> {error}
          </div>
        </Card>
      )}

      {/* Search Results */}
      <div>
        {searchResults ? (
          <div>
            <SearchResults
              features={searchResults.features}
              total={searchResults.total}
              query="search results"
              onFeatureClick={handleFeatureClick}
              isLoading={isLoading}
            />
            
            {/* Load More Button */}
            {searchResults.hasMore && (
              <div className="text-center mt-6">
                <Button 
                  variant="outline" 
                  onClick={loadMore}
                  disabled={isLoading}
                >
                  {isLoading ? 'Loading...' : 'Load More Results'}
                </Button>
              </div>
            )}
          </div>
        ) : (
          // Empty State
          <Card className="p-12 text-center">
            <Search className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-gray-900 mb-2">
              Search Your Features
            </h3>
            <p className="text-gray-500 mb-6">
              Use the search bar above to find features across all your products and areas
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="outline">Try: "login"</Badge>
              <Badge variant="outline">Try: "dashboard"</Badge>
              <Badge variant="outline">Try: "API integration"</Badge>
              <Badge variant="outline">Try: "mobile app"</Badge>
            </div>
          </Card>
        )}
      </div>

      {/* Tips */}
      <Card className="mt-8 p-6 bg-blue-50 border-blue-200">
        <h4 className="font-medium text-blue-900 mb-2">Search Tips</h4>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Use quotes for exact phrases: "user authentication"</li>
          <li>• Filter by status, priority, or effort scores using the advanced filters</li>
          <li>• Search within specific companies using the dropdown above</li>
          <li>• Use date ranges to find recently created or updated features</li>
        </ul>
      </Card>
    </div>
  )
}
