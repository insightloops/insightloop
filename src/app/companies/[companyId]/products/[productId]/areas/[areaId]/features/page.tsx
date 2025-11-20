'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FeatureList } from '@/components/FeatureList'
import { FeatureForm } from '@/components/FeatureForm'
import { SearchBar, SearchResults } from '@/components/SearchComponents'
import { BulkOperations } from '@/components/BulkOperations'
import { Button } from '@/components/ui/button'
import { Dialog } from '@/components/ui/dialog'
import { useFeatures } from '@/hooks/useFeatures'
import { useProductAreas } from '@/hooks/useProductAreas'
import { useCompany } from '@/hooks/useCompanies'
import { useDebouncedFeatureSearch } from '@/hooks/useFeatureSearch'
import { Feature, FeatureInsert, FeatureUpdate, FeatureStatus, FeaturePriority } from '@/types'

export default function ProductAreaFeaturesPage() {
  const params = useParams()
  const router = useRouter()
  const companyId = params.companyId as string
  const productId = params.productId as string
  const areaId = params.areaId as string

  const [showCreateForm, setShowCreateForm] = useState(false)
  const [editingFeature, setEditingFeature] = useState<Feature | null>(null)
  const [showSearch, setShowSearch] = useState(false)
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([])
  const [showBulkOperations, setShowBulkOperations] = useState(false)

  // Search functionality
  const { 
    searchResults, 
    isLoading: searchLoading, 
    suggestions, 
    debouncedSearch, 
    getSuggestions,
    clearSearch 
  } = useDebouncedFeatureSearch()

  const { productAreas } = useProductAreas(productId)
  const currentArea = productAreas.find(area => area.id === areaId)
  
  // Get product info separately
  const [currentProduct, setCurrentProduct] = useState<any>(null)
  
  useEffect(() => {
    if (productId) {
      fetch(`/api/products/${productId}`)
        .then(res => res.json())
        .then(setCurrentProduct)
        .catch(console.error)
    }
  }, [productId])

  // Handle search suggestions
  useEffect(() => {
    if (companyId && showSearch) {
      getSuggestions('', companyId)
    }
  }, [companyId, showSearch, getSuggestions])
  const { company } = useCompany(companyId)
  const { 
    features, 
    loading, 
    error, 
    createFeature, 
    updateFeature, 
    updateFeatureStatus,
    updateFeaturePriority,
    deleteFeature,
    bulkUpdateStatus
  } = useFeatures(companyId, areaId)

  const handleCreateFeature = async (featureData: FeatureInsert) => {
    try {
      await createFeature(featureData)
      setShowCreateForm(false)
    } catch (error: any) {
      throw error
    }
  }

  const handleUpdateFeature = async (featureData: FeatureUpdate) => {
    if (!editingFeature) return

    try {
      await updateFeature(editingFeature.id, featureData)
      setEditingFeature(null)
    } catch (error: any) {
      throw error
    }
  }

  const handleDeleteFeature = async (featureId: string) => {
    if (!confirm('Are you sure you want to delete this feature?')) return

    try {
      await deleteFeature(featureId)
    } catch (error: any) {
      alert('Failed to delete feature: ' + error.message)
    }
  }

  const handleStatusUpdate = async (featureId: string, status: FeatureStatus) => {
    try {
      await updateFeatureStatus(featureId, status)
    } catch (error: any) {
      alert('Failed to update status: ' + error.message)
    }
  }

  const handlePriorityUpdate = async (featureId: string, priority: FeaturePriority) => {
    try {
      await updateFeaturePriority(featureId, priority)
    } catch (error: any) {
      alert('Failed to update priority: ' + error.message)
    }
  }

  // Bulk operations handlers
  const handleBulkStatusUpdate = async (featureIds: string[], status: FeatureStatus) => {
    try {
      await bulkUpdateStatus(featureIds, status)
      setSelectedFeatures([]) // Clear selection after successful update
    } catch (error: any) {
      alert('Failed to bulk update status: ' + error.message)
      throw error
    }
  }

  const handleBulkPriorityUpdate = async (featureIds: string[], priority: FeaturePriority) => {
    try {
      // For now, we'll use individual updates since bulk priority isn't implemented
      await Promise.all(featureIds.map(id => updateFeaturePriority(id, priority)))
      setSelectedFeatures([]) // Clear selection after successful update
    } catch (error: any) {
      alert('Failed to bulk update priority: ' + error.message)
      throw error
    }
  }

  const handleBulkDelete = async (featureIds: string[]) => {
    try {
      // For now, we'll use individual deletes since bulk delete isn't implemented
      await Promise.all(featureIds.map(id => deleteFeature(id)))
      setSelectedFeatures([]) // Clear selection after successful delete
    } catch (error: any) {
      alert('Failed to bulk delete features: ' + error.message)
      throw error
    }
  }

  if (!company || !currentArea || !currentProduct) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <p className="text-gray-500">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Breadcrumb */}
      <nav className="flex items-center space-x-2 text-sm text-gray-500 mb-6">
        <button
          onClick={() => router.push(`/companies/${companyId}`)}
          className="hover:text-gray-700"
        >
          {company?.name}
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/products/${productId}`)}
          className="hover:text-gray-700"
        >
          {currentProduct?.name}
        </button>
        <span>/</span>
        <button
          onClick={() => router.push(`/products/${productId}/areas`)}
          className="hover:text-gray-700"
        >
          Product Areas
        </button>
        <span>/</span>
        <span className="text-gray-900 font-medium">{currentArea.name} Features</span>
      </nav>

      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {currentArea.name} Features
          </h1>
          <p className="text-gray-600">
            Manage features for the {currentArea.name} area
          </p>
          {currentArea.description && (
            <p className="text-sm text-gray-500 mt-2">{currentArea.description}</p>
          )}
        </div>
        <div className="flex gap-2">
          <Button 
            variant="outline" 
            onClick={() => setShowSearch(!showSearch)}
          >
            {showSearch ? 'Hide Search' : 'Search Features'}
          </Button>
          <Button 
            variant="outline" 
            onClick={() => setShowBulkOperations(!showBulkOperations)}
          >
            {showBulkOperations ? 'Hide Bulk Actions' : 'Bulk Actions'}
          </Button>
          <Button onClick={() => setShowCreateForm(true)}>
            Create Feature
          </Button>
        </div>
      </div>

      {/* Search Section */}
      {showSearch && (
        <div className="mb-8">
          <SearchBar
            onSearch={(filters) => {
              // Add current product area to search filters
              debouncedSearch({
                ...filters,
                productAreaId: areaId,
                companyId: companyId
              })
            }}
            suggestions={suggestions}
            isLoading={searchLoading}
            placeholder={`Search features in ${currentArea.name}...`}
            showAdvancedFilters={true}
          />
          
          {/* Search Results */}
          {searchResults && (
            <div className="mt-6">
              <SearchResults
                features={searchResults.features}
                total={searchResults.total}
                query={searchResults.features.length > 0 ? 'search results' : ''}
                onFeatureClick={(feature) => setEditingFeature(feature)}
                isLoading={searchLoading}
              />
              {searchResults.hasMore && (
                <div className="text-center mt-4">
                  <Button 
                    variant="outline" 
                    onClick={() => {/* loadMore functionality can be added here */}}
                  >
                    Load More Results
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Bulk Operations */}
      {showBulkOperations && (
        <BulkOperations
          features={features}
          selectedFeatures={selectedFeatures}
          onSelectionChange={setSelectedFeatures}
          onBulkStatusUpdate={handleBulkStatusUpdate}
          onBulkPriorityUpdate={handleBulkPriorityUpdate}
          onBulkDelete={handleBulkDelete}
        />
      )}

      {/* Feature Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-gray-900">{features.length}</div>
          <p className="text-sm text-gray-500">Total Features</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-blue-600">
            {features.filter(f => f.status === FeatureStatus.PLANNED).length}
          </div>
          <p className="text-sm text-gray-500">Planned</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-yellow-600">
            {features.filter(f => f.status === FeatureStatus.IN_PROGRESS).length}
          </div>
          <p className="text-sm text-gray-500">In Progress</p>
        </div>
        <div className="bg-white p-6 rounded-lg border">
          <div className="text-2xl font-bold text-green-600">
            {features.filter(f => f.status === FeatureStatus.COMPLETED).length}
          </div>
          <p className="text-sm text-gray-500">Completed</p>
        </div>
      </div>

      {/* Feature List */}
      {loading ? (
        <div className="text-center py-12">
          <p className="text-gray-500">Loading features...</p>
        </div>
      ) : error ? (
        <div className="text-center py-12">
          <p className="text-red-600 mb-4">Error: {error}</p>
          <Button onClick={() => window.location.reload()}>Retry</Button>
        </div>
      ) : (
        <FeatureList
          features={features}
          onEditFeature={setEditingFeature}
          onDeleteFeature={handleDeleteFeature}
          onUpdateStatus={handleStatusUpdate}
          onUpdatePriority={handlePriorityUpdate}
          groupByStatus={true}
          selectedFeatures={selectedFeatures}
          onSelectionChange={setSelectedFeatures}
          showSelection={showBulkOperations}
        />
      )}

      {/* Create Feature Dialog */}
      <Dialog open={showCreateForm} onOpenChange={setShowCreateForm}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Create New Feature</h2>
              <FeatureForm
                companyId={companyId}
                productAreaId={areaId}
                productAreas={productAreas}
                onSubmit={handleCreateFeature}
                onCancel={() => setShowCreateForm(false)}
                submitLabel="Create Feature"
              />
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Feature Dialog */}
      <Dialog open={!!editingFeature} onOpenChange={() => setEditingFeature(null)}>
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-6">Edit Feature</h2>
              {editingFeature && (
                <FeatureForm
                  initialData={editingFeature}
                  companyId={companyId}
                  productAreas={productAreas}
                  onSubmit={handleUpdateFeature}
                  onCancel={() => setEditingFeature(null)}
                  submitLabel="Update Feature"
                />
              )}
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}
