'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'

type ProductArea = Database['public']['Tables']['product_areas']['Row']

interface CreateProductAreaData {
  name: string;
  product_id: string;
  description?: string;
  parent_area_id?: string;
  keywords?: string[];
  metadata?: Record<string, any>;
}

interface UseProductAreasResult {
  productAreas: ProductArea[]
  loading: boolean
  error: string | null
  createProductArea: (data: CreateProductAreaData) => Promise<ProductArea>
  refetch: () => Promise<void>
}

interface ProductAreasResponse {
  product_areas: ProductArea[]
}

export function useProductAreas(productId?: string, hierarchical: boolean = false): UseProductAreasResult {
  const [productAreas, setProductAreas] = useState<ProductArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductAreas = async () => {
    try {
      setLoading(true)
      setError(null)
      
      let url = '/api/product-areas'
      const params = new URLSearchParams()
      
      if (productId) {
        params.append('product_id', productId)
      }
      
      if (hierarchical) {
        params.append('hierarchical', 'true')
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product areas: ${response.statusText}`)
      }
      
      const data: ProductAreasResponse = await response.json()
      setProductAreas(data.product_areas)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product areas')
    } finally {
      setLoading(false)
    }
  }

  const createProductArea = async (areaData: CreateProductAreaData): Promise<ProductArea> => {
    try {
      const response = await fetch('/api/product-areas', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(areaData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product area');
      }

      const data = await response.json();
      const newArea = data.product_area;
      
      // Update local state
      setProductAreas(prev => [newArea, ...prev]);
      
      return newArea;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product area';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchProductAreas()
  }, [productId, hierarchical])

  return {
    productAreas,
    loading,
    error,
    createProductArea,
    refetch: fetchProductAreas
  }
}

interface UseProductAreaResult {
  productArea: ProductArea | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProductArea(areaId: string): UseProductAreaResult {
  const [productArea, setProductArea] = useState<ProductArea | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProductArea = async () => {
    if (!areaId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/product-areas/${areaId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product area: ${response.statusText}`)
      }
      
      const data = await response.json()
      setProductArea(data.product_area)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product area')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProductArea()
  }, [areaId])

  return {
    productArea,
    loading,
    error,
    refetch: fetchProductArea
  }
}
