import { useState, useEffect } from 'react'
import { Feature, FeatureInsert, FeatureUpdate, FeatureStatus, FeaturePriority } from '@/types'

export function useFeatures(companyId?: string, productAreaId?: string) {
  const [features, setFeatures] = useState<Feature[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchFeatures = async () => {
    if (!companyId && !productAreaId) return

    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams()
      if (companyId) params.append('company_id', companyId)
      if (productAreaId) params.append('product_area_id', productAreaId)

      const response = await fetch(`/api/features?${params}`)
      if (!response.ok) {
        throw new Error('Failed to fetch features')
      }

      const data = await response.json()
      setFeatures(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFeatures()
  }, [companyId, productAreaId])

  const createFeature = async (featureData: FeatureInsert): Promise<Feature> => {
    const response = await fetch('/api/features', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(featureData)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to create feature')
    }

    const newFeature = await response.json()
    setFeatures(prev => [newFeature, ...prev])
    return newFeature
  }

  const updateFeature = async (id: string, updates: FeatureUpdate): Promise<Feature> => {
    const response = await fetch(`/api/features/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update feature')
    }

    const updatedFeature = await response.json()
    setFeatures(prev => prev.map(feature => 
      feature.id === id ? updatedFeature : feature
    ))
    return updatedFeature
  }

  const updateFeatureStatus = async (id: string, status: FeatureStatus): Promise<Feature> => {
    const response = await fetch(`/api/features/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_status', value: status })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update feature status')
    }

    const updatedFeature = await response.json()
    setFeatures(prev => prev.map(feature => 
      feature.id === id ? updatedFeature : feature
    ))
    return updatedFeature
  }

  const updateFeaturePriority = async (id: string, priority: FeaturePriority): Promise<Feature> => {
    const response = await fetch(`/api/features/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_priority', value: priority })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to update feature priority')
    }

    const updatedFeature = await response.json()
    setFeatures(prev => prev.map(feature => 
      feature.id === id ? updatedFeature : feature
    ))
    return updatedFeature
  }

  const deleteFeature = async (id: string): Promise<void> => {
    const response = await fetch(`/api/features/${id}`, {
      method: 'DELETE'
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to delete feature')
    }

    setFeatures(prev => prev.filter(feature => feature.id !== id))
  }

  const bulkUpdateStatus = async (featureIds: string[], status: FeatureStatus): Promise<Feature[]> => {
    const response = await fetch('/api/features/bulk', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'bulk_update_status', 
        feature_ids: featureIds, 
        value: status 
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(errorData.error || 'Failed to bulk update features')
    }

    const updatedFeatures = await response.json()
    setFeatures(prev => prev.map(feature => {
      const updated = updatedFeatures.find((f: Feature) => f.id === feature.id)
      return updated || feature
    }))
    return updatedFeatures
  }

  return {
    features,
    loading,
    error,
    refetch: fetchFeatures,
    createFeature,
    updateFeature,
    updateFeatureStatus,
    updateFeaturePriority,
    deleteFeature,
    bulkUpdateStatus
  }
}

export function useFeatureMetrics(companyId?: string) {
  const [metrics, setMetrics] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchMetrics = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/features/metrics?company_id=${companyId}`)
      if (!response.ok) {
        throw new Error('Failed to fetch feature metrics')
      }

      const data = await response.json()
      setMetrics(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMetrics()
  }, [companyId])

  return {
    metrics,
    loading,
    error,
    refetch: fetchMetrics
  }
}

export function useFeatureRoadmap(companyId?: string) {
  const [roadmap, setRoadmap] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchRoadmap = async () => {
    if (!companyId) return

    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/features?company_id=${companyId}&format=roadmap`)
      if (!response.ok) {
        throw new Error('Failed to fetch roadmap')
      }

      const data = await response.json()
      setRoadmap(data)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRoadmap()
  }, [companyId])

  return {
    roadmap,
    loading,
    error,
    refetch: fetchRoadmap
  }
}
