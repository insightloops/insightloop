/**
 * API Key Management Context
 * 
 * Provides client-side storage and management of user API keys
 * for OpenAI and Anthropic services.
 */

'use client'

import React, { createContext, useContext, useState, useEffect } from 'react'

interface APIKeys {
  openai?: string
  anthropic?: string
}

interface APIKeyContextType {
  apiKeys: APIKeys
  isLoaded: boolean
  setAPIKey: (provider: keyof APIKeys, key: string) => void
  removeAPIKey: (provider: keyof APIKeys) => void
  hasAPIKey: (provider: keyof APIKeys) => boolean
  clearAllKeys: () => void
}

const APIKeyContext = createContext<APIKeyContextType | undefined>(undefined)

const STORAGE_KEY = 'insightloop_api_keys'

export function APIKeyProvider({ children }: { children: React.ReactNode }) {
  const [apiKeys, setAPIKeys] = useState<APIKeys>({})
  const [isLoaded, setIsLoaded] = useState(false)

  // Load API keys from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const parsed = JSON.parse(stored)
        setAPIKeys(parsed)
      }
    } catch (error) {
      console.warn('Failed to load API keys from storage:', error)
    } finally {
      setIsLoaded(true)
    }
  }, [])

  // Save API keys to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) { // Only save after initial load to avoid overwriting
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(apiKeys))
      } catch (error) {
        console.warn('Failed to save API keys to storage:', error)
      }
    }
  }, [apiKeys, isLoaded])

  const setAPIKey = (provider: keyof APIKeys, key: string) => {
    setAPIKeys(prev => ({
      ...prev,
      [provider]: key.trim() || undefined
    }))
  }

  const removeAPIKey = (provider: keyof APIKeys) => {
    setAPIKeys(prev => {
      const updated = { ...prev }
      delete updated[provider]
      return updated
    })
  }

  const hasAPIKey = (provider: keyof APIKeys) => {
    return Boolean(apiKeys[provider])
  }

  const clearAllKeys = () => {
    setAPIKeys({})
  }

  return (
    <APIKeyContext.Provider value={{
      apiKeys,
      isLoaded,
      setAPIKey,
      removeAPIKey,
      hasAPIKey,
      clearAllKeys
    }}>
      {children}
    </APIKeyContext.Provider>
  )
}

export function useAPIKeys() {
  const context = useContext(APIKeyContext)
  if (context === undefined) {
    throw new Error('useAPIKeys must be used within an APIKeyProvider')
  }
  return context
}
