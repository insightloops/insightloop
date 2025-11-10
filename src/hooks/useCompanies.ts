import { useState, useEffect } from 'react'
import { Database } from '@/types/database'
import { useUserIdSync } from '@/hooks/useCurrentUser'

type Company = Database['public']['Tables']['companies']['Row']

export function useCompanies() {
  const [companies, setCompanies] = useState<Company[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useUserIdSync()

  useEffect(() => {
    if (!userId) {
      setLoading(false)
      return
    }

    const fetchCompanies = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/companies', {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch companies')
        }

        const data = await response.json()
        setCompanies(data.companies || [])
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCompanies()
  }, [userId])

  const createCompany = async (companyData: {
    name: string
    industry?: string
    size?: string
  }) => {
    if (!userId) {
      throw new Error('User ID is required')
    }

    try {
      const response = await fetch('/api/companies', {
        method: 'POST',
        headers: {
          'x-user-id': userId,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(companyData)
      })

      if (!response.ok) {
        throw new Error('Failed to create company')
      }

      const data = await response.json()
      setCompanies(prev => [...prev, data.company])
      return data.company
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error')
      throw err
    }
  }

  return {
    companies,
    loading,
    error,
    createCompany
  }
}

export function useCompany(companyId: string | null) {
  const [company, setCompany] = useState<Company | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const userId = useUserIdSync()

  useEffect(() => {
    if (!companyId || !userId) {
      setLoading(false)
      return
    }

    const fetchCompany = async () => {
      try {
        setLoading(true)
        const response = await fetch(`/api/companies/${companyId}`, {
          headers: {
            'x-user-id': userId,
            'Content-Type': 'application/json'
          }
        })

        if (!response.ok) {
          throw new Error('Failed to fetch company')
        }

        const data = await response.json()
        setCompany(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown error')
      } finally {
        setLoading(false)
      }
    }

    fetchCompany()
  }, [companyId, userId])

  return {
    company,
    loading,
    error
  }
}
