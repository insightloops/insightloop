/**
 * API Key Settings Component
 * 
 * Allows users to configure their OpenAI and Anthropic API keys
 * for use throughout the application.
 */

'use client'

import React, { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { useAPIKeys } from '@/contexts/APIKeyContext'
import { Settings, Key, Eye, EyeOff, Trash2, CheckCircle, AlertCircle } from 'lucide-react'

interface APIKeySettingsProps {
  trigger?: React.ReactNode
}

export function APIKeySettings({ trigger }: APIKeySettingsProps) {
  const { apiKeys, setAPIKey, removeAPIKey, hasAPIKey, clearAllKeys } = useAPIKeys()
  const [isOpen, setIsOpen] = useState(false)
  const [showKeys, setShowKeys] = useState<{ openai: boolean; anthropic: boolean }>({
    openai: false,
    anthropic: false
  })
  const [tempKeys, setTempKeys] = useState({
    openai: apiKeys.openai || '',
    anthropic: apiKeys.anthropic || ''
  })

  // Sync tempKeys with context when apiKeys change (e.g., loaded from localStorage)
  useEffect(() => {
    setTempKeys({
      openai: apiKeys.openai || '',
      anthropic: apiKeys.anthropic || ''
    })
  }, [apiKeys.openai, apiKeys.anthropic])

  const handleSave = () => {
    if (tempKeys.openai.trim()) {
      setAPIKey('openai', tempKeys.openai.trim())
    } else if (hasAPIKey('openai')) {
      removeAPIKey('openai')
    }

    if (tempKeys.anthropic.trim()) {
      setAPIKey('anthropic', tempKeys.anthropic.trim())
    } else if (hasAPIKey('anthropic')) {
      removeAPIKey('anthropic')
    }

    setIsOpen(false)
  }

  const handleCancel = () => {
    setTempKeys({
      openai: apiKeys.openai || '',
      anthropic: apiKeys.anthropic || ''
    })
    setIsOpen(false)
  }

  const maskKey = (key: string) => {
    if (!key) return ''
    return key.substring(0, 8) + '...' + key.substring(key.length - 4)
  }

  const toggleKeyVisibility = (provider: 'openai' | 'anthropic') => {
    setShowKeys(prev => ({
      ...prev,
      [provider]: !prev[provider]
    }))
  }

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Settings className="w-4 h-4 mr-2" />
      API Keys
    </Button>
  )

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Key className="w-5 h-5" />
            API Key Configuration
          </DialogTitle>
          <DialogDescription>
            Configure your OpenAI and Anthropic API keys to enable AI features. 
            Keys are stored locally in your browser and never sent to our servers.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Security Notice */}
          <Alert>
            <AlertCircle className="w-4 h-4" />
            <AlertDescription>
              <strong>Privacy:</strong> Your API keys are stored locally in your browser's localStorage. 
              They are only sent directly to OpenAI/Anthropic APIs and never to our servers.
            </AlertDescription>
          </Alert>

          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Current Configuration</CardTitle>
              <CardDescription>
                Status of your configured API keys
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">OpenAI</span>
                  {hasAPIKey('openai') ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not configured</Badge>
                  )}
                </div>
                {hasAPIKey('openai') && (
                  <span className="text-sm text-gray-500 font-mono">
                    {maskKey(apiKeys.openai!)}
                  </span>
                )}
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">Anthropic</span>
                  {hasAPIKey('anthropic') ? (
                    <Badge variant="default" className="bg-green-100 text-green-800">
                      <CheckCircle className="w-3 h-3 mr-1" />
                      Connected
                    </Badge>
                  ) : (
                    <Badge variant="secondary">Not configured</Badge>
                  )}
                </div>
                {hasAPIKey('anthropic') && (
                  <span className="text-sm text-gray-500 font-mono">
                    {maskKey(apiKeys.anthropic!)}
                  </span>
                )}
              </div>
            </CardContent>
          </Card>

          {/* API Key Configuration */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Configure API Keys</CardTitle>
              <CardDescription>
                Enter your API keys below. Leave blank to remove a key.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* OpenAI API Key */}
              <div className="space-y-2">
                <Label htmlFor="openai-key">OpenAI API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="openai-key"
                      type={showKeys.openai ? 'text' : 'password'}
                      placeholder="sk-..."
                      value={tempKeys.openai}
                      onChange={(e) => setTempKeys(prev => ({ ...prev, openai: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleKeyVisibility('openai')}
                    >
                      {showKeys.openai ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {hasAPIKey('openai') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempKeys(prev => ({ ...prev, openai: '' }))
                        removeAPIKey('openai')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    OpenAI Platform
                  </a>
                </p>
              </div>

              {/* Anthropic API Key */}
              <div className="space-y-2">
                <Label htmlFor="anthropic-key">Anthropic API Key</Label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Input
                      id="anthropic-key"
                      type={showKeys.anthropic ? 'text' : 'password'}
                      placeholder="sk-ant-..."
                      value={tempKeys.anthropic}
                      onChange={(e) => setTempKeys(prev => ({ ...prev, anthropic: e.target.value }))}
                      className="pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3"
                      onClick={() => toggleKeyVisibility('anthropic')}
                    >
                      {showKeys.anthropic ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </Button>
                  </div>
                  {hasAPIKey('anthropic') && (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setTempKeys(prev => ({ ...prev, anthropic: '' }))
                        removeAPIKey('anthropic')
                      }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
                <p className="text-xs text-gray-500">
                  Get your API key from{' '}
                  <a href="https://console.anthropic.com/" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                    Anthropic Console
                  </a>
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between">
            <Button
              variant="outline"
              onClick={clearAllKeys}
              disabled={!hasAPIKey('openai') && !hasAPIKey('anthropic')}
            >
              Clear All Keys
            </Button>
            <div className="flex gap-2">
              <Button variant="outline" onClick={handleCancel}>
                Cancel
              </Button>
              <Button onClick={handleSave}>
                Save Configuration
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
