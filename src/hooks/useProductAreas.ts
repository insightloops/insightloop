'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { useUserIdSync } from '@/hooks/useCurrentUser'

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

export function useProductAreas(productId?: string, hierarchical: boolean = false, companyId?: string): UseProductAreasResult {
  const [productAreas, setProductAreas] = useState<ProductArea[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useUserIdSync()

  const fetchProductAreas = async () => {
    if (!productId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)
      
      // Use company-nested route if companyId is provided, otherwise fallback to direct route
      let url = companyId 
        ? `/api/companies/${companyId}/products/${productId}/areas`
        : '/api/product-areas'
      
      const params = new URLSearchParams()
      
      // Only add productId param if using the direct route
      if (!companyId && productId) {
        params.append('product_id', productId)
      }
      
      if (hierarchical) {
        params.append('hierarchical', 'true')
      }
      
      if (params.toString()) {
        url += `?${params.toString()}`
      }
      
      const response = await fetch(url, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        }
      })
      
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
      // Use company-nested route if companyId is provided, otherwise fallback to direct route
      const url = (companyId && productId) 
        ? `/api/companies/${companyId}/products/${productId}/areas`
        : '/api/product-areas'
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-user-id': userId,
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

export function useProductArea(areaId: string, companyId?: string, productId?: string): UseProductAreaResult {
  const [productArea, setProductArea] = useState<ProductArea | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useUserIdSync()

  const fetchProductArea = async () => {
    if (!areaId) return

    try {
      setLoading(true)
      setError(null)
      
      // Use company-nested route if companyId and productId are provided, otherwise fallback to direct route
      const url = (companyId && productId) 
        ? `/api/companies/${companyId}/products/${productId}/areas/${areaId}`
        : `/api/product-areas/${areaId}`
      
      const response = await fetch(url, {
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        }
      })
      
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
