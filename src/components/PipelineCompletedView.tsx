/**
 * Pipeline Completed View
 * 
 * Shows the generated insights in a clean, organized layout once the pipeline is complete.
 * Focuses on actionable business insights with visual hierarchy and engagement.
 */

'use client'

import React from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Users, 
  Target, 
  FileSearch, 
  Star,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Eye,
  BarChart3,
  Award
} from 'lucide-react'
import { EnrichedInsight } from '@/hooks/usePipelineExecution'

interface PipelineCompletedViewProps {
  enrichedInsights: EnrichedInsight[]
  totalUsersAffected: number
  highSeverityInsights: number
  mediumSeverityInsights: number
  lowSeverityInsights: number
  onViewInsight: (insight: EnrichedInsight) => void
  onComplete?: (results: any) => void
}

export function PipelineCompletedView({
  enrichedInsights,
  totalUsersAffected,
  highSeverityInsights,
  mediumSeverityInsights,
  lowSeverityInsights,
  onViewInsight,
  onComplete
}: PipelineCompletedViewProps) {
  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-red-200 dark:border-red-800'
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200 border-orange-200 dark:border-orange-800'
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 border-yellow-200 dark:border-yellow-800'
      default:
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 border-green-200 dark:border-green-800'
    }
  }

  React.useEffect(() => {
    if (onComplete && enrichedInsights.length > 0) {
      onComplete({
        insights: enrichedInsights,
        totalUsersAffected,
        severityBreakdown: {
          high: highSeverityInsights,
          medium: mediumSeverityInsights,
          low: lowSeverityInsights
        }
      })
    }
  }, [enrichedInsights, onComplete, totalUsersAffected, highSeverityInsights, mediumSeverityInsights, lowSeverityInsights])

  return (
    <div className="space-y-6 animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
      {/* Completion Header */}
      <Card className="border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-950">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-full bg-green-100 text-green-600 dark:bg-green-900">
              <CheckCircle className="h-6 w-6" />
            </div>
            <div>
              <CardTitle className="text-xl text-green-800 dark:text-green-200">
                Pipeline Completed Successfully
              </CardTitle>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Generated {enrichedInsights.length} actionable insights from your feedback data
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Summary Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg border border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-center mb-2">
            <Lightbulb className="h-6 w-6 text-blue-600" />
          </div>
          <div className="text-3xl font-bold text-blue-600">
            {enrichedInsights.length}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Total Insights</div>
        </div>

        <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg border border-orange-200 dark:border-orange-800">
          <div className="flex items-center justify-center mb-2">
            <Users className="h-6 w-6 text-orange-600" />
          </div>
          <div className="text-3xl font-bold text-orange-600">
            {totalUsersAffected.toLocaleString()}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Users Affected</div>
        </div>

        <div className="text-center p-4 bg-red-50 dark:bg-red-950 rounded-lg border border-red-200 dark:border-red-800">
          <div className="flex items-center justify-center mb-2">
            <AlertTriangle className="h-6 w-6 text-red-600" />
          </div>
          <div className="text-3xl font-bold text-red-600">
            {highSeverityInsights}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">High Priority</div>
        </div>

        <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
          <div className="flex items-center justify-center mb-2">
            <Award className="h-6 w-6 text-purple-600" />
          </div>
          <div className="text-3xl font-bold text-purple-600">
            {enrichedInsights.reduce((sum, insight) => sum + insight.recommendationCount, 0)}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">Recommendations</div>
        </div>
      </div>

      {/* Insights List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5" />
            Generated Business Insights
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {enrichedInsights.map((insight, index) => (
              <div key={insight.id} className={`
                border rounded-lg p-4 space-y-3 transition-all duration-200 hover:shadow-md
                ${getSeverityColor(insight.severity)}
              `}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center text-sm font-semibold">
                        {index + 1}
                      </div>
                      <h4 className="font-semibold text-sm">{insight.title}</h4>
                      <Badge className="text-xs capitalize">
                        {insight.severity} Priority
                      </Badge>
                    </div>
                    
                    <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 leading-relaxed">
                      {insight.summary}
                    </p>
                    
                    <div className="flex items-center gap-4 text-xs">
                      <div className="flex items-center gap-1">
                        <Users className="w-3 h-3" />
                        <span>{insight.usersAffected.toLocaleString()} users</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Target className="w-3 h-3" />
                        <span>{Math.round(insight.confidence * 100)}% confidence</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <FileSearch className="w-3 h-3" />
                        <span>{insight.evidenceCount} evidence</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        <span>{insight.recommendationCount} recommendations</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onViewInsight(insight)}
                    className="ml-4"
                  >
                    <Eye className="w-3 h-3 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            ))}
            
            {enrichedInsights.length === 0 && (
              <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg font-medium mb-2">No insights generated yet</p>
                <p className="text-sm">Insights will appear here as the pipeline processes your feedback.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
