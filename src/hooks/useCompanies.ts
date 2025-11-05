'use client'

import { useState, useEffect } from 'react'
import { Company } from '@/types/database'

interface UseCompaniesResult {
  companies: Company[]
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

interface CompaniesResponse {
  data: Company[]
  pagination: {
    page: number
    limit: number
    total: number
    hasMore: boolean
  }
}

export function useCompanies(): UseCompaniesResult {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompanies = async () => {
    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch('/api/companies')
      
      if (!response.ok) {
        throw new Error(`Failed to fetch companies: ${response.statusText}`)
      }
      
      const data: CompaniesResponse = await response.json()
      setCompanies(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompanies()
  }, [])

  return {
    companies,
    loading,
    error,
    refetch: fetchCompanies
  }
}

interface UseCompanyResult {
  company: Company | null
  loading: boolean
  error: string | null
  refetch: () => Promise<void>
}

export function useCompany(companyId: string): UseCompanyResult {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchCompany = async () => {
    if (!companyId) return

    try {
      setLoading(true)
      setError(null)
      
      const response = await fetch(`/api/companies/${companyId}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch company: ${response.statusText}`)
      }
      
      const data = await response.json()
      setCompany(data.data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch company')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCompany()
  }, [companyId])

  return {
    company,
    loading,
    error,
    refetch: fetchCompany
  }
}
