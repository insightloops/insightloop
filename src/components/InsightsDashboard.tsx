'use client'

import { useState, useMemo } from 'react'
import { useInsights } from '@/hooks'
import { Insight } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface InsightCardProps {
  insight: Insight
  onClick: (insight: Insight) => void
}

function InsightCard({ insight, onClick }: InsightCardProps) {
  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
    if (score >= 0.6) return 'text-yellow-600 bg-yellow-100 dark:text-yellow-400 dark:bg-yellow-900/20'
    return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
  }

  const getUrgencyColor = (score: number) => {
    if (score >= 0.8) return 'text-destructive'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-green-600 dark:text-green-400'
  }

  return (
    <Card 
      className="hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(insight)}
    >
      <CardHeader className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg mb-2">
              {insight.title}
            </CardTitle>
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
              {insight.theme}
            </span>
          </div>
          <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(insight.insight_score)}`}>
            <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
            {Math.round(insight.insight_score * 100)}%
          </div>
        </div>
      </CardHeader>

      <CardContent>
        {/* Summary */}
        <CardDescription className="line-clamp-3">
          {insight.summary}
        </CardDescription>

        {/* Scores */}
        <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
          <div className="text-center">
            <div className={`text-lg font-semibold ${getUrgencyColor(insight.urgency_score)}`}>
              {Math.round(insight.urgency_score * 100)}%
            </div>
            <div className="text-xs text-gray-500">Urgency</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-blue-600">
              {Math.round(insight.volume_score * 100)}%
            </div>
            <div className="text-xs text-gray-500">Volume</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-purple-600">
              {Math.round(insight.value_alignment_score * 100)}%
            </div>
            <div className="text-xs text-gray-500">Alignment</div>
          </div>
        </div>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
          <span>
            {insight.status === 'active' && (
              <span className="text-green-600 dark:text-green-400">● Active</span>
            )}
            {insight.status === 'archived' && (
              <span className="text-muted-foreground">● Archived</span>
            )}
            {insight.status === 'implemented' && (
              <span className="text-primary">● Implemented</span>
            )}
          </span>
          <span>
            {new Date(insight.created_at).toLocaleDateString()}
          </span>
        </div>
      </CardContent>
    </Card>
  )
}

interface InsightsDashboardProps {
  companyId: string
  onInsightClick: (insight: Insight) => void
}

export function InsightsDashboard({ companyId, onInsightClick }: InsightsDashboardProps) {
  const [filters, setFilters] = useState({
    theme: [] as string[],
    status: [] as string[],
    min_score: undefined as number | undefined,
    max_score: undefined as number | undefined
  })
  const [sortBy, setSortBy] = useState<'insight_score' | 'urgency_score' | 'created_at'>('insight_score')
  const [sortOrder, setSortOrder] = useState<'desc' | 'asc'>('desc')

  const { insights, loading, error, pagination, refetch, generateInsights, generating } = useInsights(companyId, filters)

  // Sort insights locally
  const sortedInsights = useMemo(() => {
    return [...insights].sort((a, b) => {
      const aValue = a[sortBy] || 0
      const bValue = b[sortBy] || 0
      
      if (sortOrder === 'desc') {
        return bValue > aValue ? 1 : -1
      } else {
        return aValue > bValue ? 1 : -1
      }
    })
  }, [insights, sortBy, sortOrder])

  // Get unique themes for filter
  const availableThemes = useMemo(() => {
    return [...new Set(insights.map(i => i.theme).filter(Boolean))] as string[]
  }, [insights])

  const handleGenerateInsights = async () => {
    try {
      await generateInsights()
    } catch (error) {
      // Error is handled by the hook
    }
  }

  const handleFilterChange = (key: keyof typeof filters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  if (loading && insights.length === 0) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="space-y-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="h-5 bg-muted rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-muted rounded w-1/4"></div>
                  </div>
                  <div className="h-6 w-12 bg-muted rounded-full"></div>
                </div>
                <div className="h-4 bg-muted rounded w-full"></div>
                <div className="h-4 bg-muted rounded w-2/3"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Insights Dashboard</h2>
          <p className="text-sm text-muted-foreground">
            {pagination.total} insights found
          </p>
        </div>
        <Button
          onClick={handleGenerateInsights}
          disabled={generating}
        >
          {generating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current mr-2"></div>
              Generating...
            </>
          ) : (
            'Generate New Insights'
          )}
        </Button>
      </div>

      {/* Filters and Sorting */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Theme Filter */}
            <div className="space-y-2">
              <Label htmlFor="theme-filter">Theme</Label>
              <Select
                value={filters.theme[0] || 'all'}
                onValueChange={(value) => handleFilterChange('theme', value === 'all' ? [] : [value])}
              >
                <SelectTrigger id="theme-filter">
                  <SelectValue placeholder="All themes" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All themes</SelectItem>
                  {availableThemes.map(theme => (
                    <SelectItem key={theme} value={theme}>{theme}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Status Filter */}
            <div className="space-y-2">
              <Label htmlFor="status-filter">Status</Label>
              <Select
                value={filters.status[0] || 'all'}
                onValueChange={(value) => handleFilterChange('status', value === 'all' ? [] : [value])}
              >
                <SelectTrigger id="status-filter">
                  <SelectValue placeholder="All statuses" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                  <SelectItem value="implemented">Implemented</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort By */}
            <div className="space-y-2">
              <Label htmlFor="sort-by">Sort By</Label>
              <Select
                value={sortBy}
                onValueChange={(value) => setSortBy(value as any)}
              >
                <SelectTrigger id="sort-by">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="insight_score">Insight Score</SelectItem>
                  <SelectItem value="urgency_score">Urgency</SelectItem>
                  <SelectItem value="created_at">Date Created</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Sort Order */}
            <div className="space-y-2">
              <Label htmlFor="sort-order">Order</Label>
              <Select
                value={sortOrder}
                onValueChange={(value) => setSortOrder(value as any)}
              >
                <SelectTrigger id="sort-order">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="desc">High to Low</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Error State */}
      {error && (
        <Card className="border-destructive bg-destructive/5">
          <CardContent className="p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-destructive" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-destructive">{error}</p>
              </div>
              <div className="ml-auto pl-3">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={refetch}
                  className="text-destructive hover:text-destructive/90"
                >
                  Retry
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Insights Grid */}
      {sortedInsights.length === 0 && !loading ? (
        <Card>
          <CardContent className="text-center py-12">
            <div className="mx-auto w-12 h-12 text-muted-foreground mb-4">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <CardTitle className="mb-2">No insights found</CardTitle>
            <CardDescription className="mb-4">
              Generate insights from your feedback data to get started.
            </CardDescription>
            <Button
              onClick={handleGenerateInsights}
              disabled={generating}
            >
              Generate Insights
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sortedInsights.map(insight => (
            <InsightCard
              key={insight.id}
              insight={insight}
              onClick={onInsightClick}
            />
          ))}
        </div>
      )}
    </div>
  )
}
