/**
 * Insights Display Component
 * 
 * Displays generated insights with evidence, recommendations,
 * and stakeholder-specific formats in an organized, actionable view.
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Lightbulb } from 'lucide-react'
import { GeneratedInsight } from '@/lib/services/InsightGenerationService'
import { InsightCard, InsightCardData } from '@/components/ui/insight-card'

interface InsightsListProps {
  insights: GeneratedInsight[]
}

// Utility function to convert GeneratedInsight to InsightCardData
const convertToInsightCardData = (insight: GeneratedInsight): InsightCardData => ({
  id: insight.id,
  title: insight.title,
  executiveSummary: insight.executiveSummary,
  confidence: insight.confidence,
  painPoint: insight.painPoint,
  impact: insight.impact,
  recommendations: insight.recommendations,
  stakeholderFormats: insight.stakeholderFormats,
  evidence: insight.evidence,
  detailedAnalysis: insight.detailedAnalysis
})

export function InsightsList({ insights }: InsightsListProps) {
  const [sortBy, setSortBy] = useState<'confidence' | 'severity' | 'impact'>('confidence')
  const [filterSeverity, setFilterSeverity] = useState<string>('all')
  
  // Sort insights
  const sortedInsights = [...insights].sort((a, b) => {
    switch (sortBy) {
      case 'confidence':
        return b.confidence - a.confidence
      case 'severity':
        const severityOrder = { critical: 4, high: 3, medium: 2, low: 1 }
        return (severityOrder[b.painPoint?.severity as keyof typeof severityOrder] || 0) - 
               (severityOrder[a.painPoint?.severity as keyof typeof severityOrder] || 0)
      case 'impact':
        return (b.impact?.usersAffected || 0) - (a.impact?.usersAffected || 0)
      default:
        return 0
    }
  })
  
  // Filter insights
  const filteredInsights = sortedInsights.filter(insight => 
    filterSeverity === 'all' || insight.painPoint?.severity === filterSeverity
  )

  if (insights.length === 0) {
    return (
      <Card className="mx-auto max-w-2xl text-center py-12">
        <CardContent>
          <Lightbulb className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Insights Generated</h3>
          <p className="text-gray-600">
            Upload feedback data and run the pipeline to generate insights.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header and Controls */}
      <Card className="mx-auto max-w-6xl">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-6 w-6 text-yellow-600" />
                Generated Insights ({insights.length})
              </CardTitle>
              <CardDescription>
                AI-powered insights with evidence tracking and actionable recommendations
              </CardDescription>
            </div>
            
            {/* Controls */}
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Sort by:</label>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="confidence">Confidence</option>
                  <option value="severity">Severity</option>
                  <option value="impact">User Impact</option>
                </select>
              </div>
              
              <div className="flex items-center gap-2">
                <label className="text-sm font-medium">Filter:</label>
                <select
                  value={filterSeverity}
                  onChange={(e) => setFilterSeverity(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm"
                >
                  <option value="all">All Severities</option>
                  <option value="critical">Critical</option>
                  <option value="high">High</option>
                  <option value="medium">Medium</option>
                  <option value="low">Low</option>
                </select>
              </div>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Insights List */}
      <div className="mx-auto max-w-6xl space-y-6">
        {filteredInsights.map((insight, index) => (
          <InsightCard
            key={insight.id}
            insight={convertToInsightCardData(insight)}
            variant="detailed"
            showActions={true}
            showMetrics={true}
            showStakeholders={true}
            expandable={true}
            index={index}
          />
        ))}
      </div>

      {filteredInsights.length === 0 && (
        <Card className="mx-auto max-w-2xl text-center py-8">
          <CardContent>
            <p className="text-gray-600">
              No insights match the current filter criteria.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
