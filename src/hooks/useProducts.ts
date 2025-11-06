'use client'

import { useState, useEffect } from 'react'
import { Database } from '@/types/database'

type Product = Database['public']['Tables']['products']['Row']

interface CreateProductData {
  name: string;
  company_id: string;
  description?: string;
  metadata?: Record<string, any>;
}

interface UseProductsResult {
  products: Product[]
  loading: boolean
  error: string | null
  createProduct: (data: CreateProductData) => Promise<Product>
  refetch: () => Promise<void>
}

interface ProductsResponse {
  products: Product[]
}

export function useProducts(companyId?: string): UseProductsResult {
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProducts = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const url = companyId 
        ? `/api/products?company_id=${companyId}`
        : '/api/products'
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch products: ${response.statusText}`)
      }
      
      const data: ProductsResponse = await response.json()
      setProducts(data.products)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch products')
    } finally {
      setLoading(false)
    }
  }

  const createProduct = async (productData: CreateProductData): Promise<Product> => {
    try {
      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create product');
      }

      const data = await response.json();
      const newProduct = data.product;
      
      // Update local state
      setProducts(prev => [newProduct, ...prev]);
      
      return newProduct;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create product';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchProducts()
  }, [companyId])

  return {
    products,
    loading,
    error,
    createProduct,
    refetch: fetchProducts
  }
}

interface UseProductResult {
  product: Product | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useProduct(productId: string): UseProductResult {
  const [product, setProduct] = useState<Product | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProduct = async () => {
    if (!productId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/products/${productId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch product: ${response.statusText}`)
      }
      
      const data = await response.json()
      setProduct(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch product')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchProduct()
  }, [productId])

  return {
    product,
    loading,
    error,
    refetch: fetchProduct
  }
}
