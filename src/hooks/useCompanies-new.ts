'use client'

import { useState, useEffect } from 'react'
import { Company } from '@/types/database'

interface CreateCompanyData {
  name: string;
  industry?: string;
  size?: string;
}

interface UseCompaniesResult {
  companies: Company[]
  loading: boolean
  error: string | null
  createCompany: (data: CreateCompanyData) => Promise<Company>
  refetch: () => Promise<void>
}

interface CompaniesResponse {
  companies: Company[]
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
      setCompanies(data.companies)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch companies')
    } finally {
      setLoading(false)
    }
  }

  const createCompany = async (companyData: CreateCompanyData): Promise<Company> => {
    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(companyData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create company');
      }

      const data = await response.json();
      const newCompany = data.company;
      
      // Update local state
      setCompanies(prev => [newCompany, ...prev]);
      
      return newCompany;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create company';
      throw new Error(errorMessage);
    }
  };

  useEffect(() => {
    fetchCompanies()
  }, [])

  return {
    companies,
    loading,
    error,
    createCompany,
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
      setCompany(data.company)
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
