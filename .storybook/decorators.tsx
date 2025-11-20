import React, { useEffect } from 'react'
import type { Decorator } from '@storybook/react'
import { ThemeProvider } from '../src/components/theme-provider'
import { APIKeyProvider } from '../src/contexts/APIKeyContext'

export const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme || 'light'
  
  // Apply theme to document root for proper CSS variable inheritance
  useEffect(() => {
    const root = document.documentElement
    if (theme === 'dark') {
      root.classList.add('dark')
    } else {
      root.classList.remove('dark')
    }
  }, [theme])
  
  return (
    <APIKeyProvider>
      <ThemeProvider
        attribute="class"
        defaultTheme={theme}
        enableSystem={false}
        disableTransitionOnChange
      >
        <div className={`min-h-screen p-8 transition-colors ${theme === 'dark' ? 'dark' : ''}`}>
          <div className="bg-background text-foreground rounded-lg p-6">
            <Story />
          </div>
        </div>
      </ThemeProvider>
    </APIKeyProvider>
  )
}
