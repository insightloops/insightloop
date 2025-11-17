/**
 * Enhanced Insight Dialog
 * 
 * A sophisticated, enterprise-grade dialog for displaying business insights
 * with actionable recommendations, metrics, and stakeholder-focused information.
 */

'use client'

import React from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Users, 
  Target, 
  FileSearch, 
  Star,
  TrendingUp,
  AlertTriangle,
  BarChart3,
  Shield,
  Zap,
  Award,
  Eye
} from 'lucide-react'
import { EnrichedInsight, EnrichedFeedback, EnrichedCluster } from '@/hooks/usePipelineExecution'

interface InsightDialogProps {
  insight: EnrichedInsight | null
  enrichedFeedback: EnrichedFeedback[]
  enrichedClusters: EnrichedCluster[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewFeedback?: (feedbackId: string) => void
}

export function InsightDialog({ insight, enrichedFeedback, enrichedClusters, open, onOpenChange, onViewFeedback }: InsightDialogProps) {
  if (!insight) return null

  // Find the cluster that this insight belongs to
  const relatedCluster = enrichedClusters.find(cluster => cluster.id === insight.clusterId)
  
  // Get the feedback that contributed to this insight
  const insightFeedback = relatedCluster 
    ? enrichedFeedback.filter(feedback => 
        relatedCluster.enrichedFeedbackIds.includes(feedback.id)
      )
    : []

  const getSeverityConfig = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical':
        return {
          color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          bgColor: 'bg-red-50 dark:bg-red-950',
          borderColor: 'border-red-200 dark:border-red-800',
          icon: <AlertTriangle className="h-5 w-5 text-red-600" />,
          label: 'Critical Priority'
        }
      case 'high':
        return {
          color: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          bgColor: 'bg-orange-50 dark:bg-orange-950',
          borderColor: 'border-orange-200 dark:border-orange-800',
          icon: <TrendingUp className="h-5 w-5 text-orange-600" />,
          label: 'High Priority'
        }
      case 'medium':
        return {
          color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          bgColor: 'bg-yellow-50 dark:bg-yellow-950',
          borderColor: 'border-yellow-200 dark:border-yellow-800',
          icon: <Target className="h-5 w-5 text-yellow-600" />,
          label: 'Medium Priority'
        }
      default:
        return {
          color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          bgColor: 'bg-green-50 dark:bg-green-950',
          borderColor: 'border-green-200 dark:border-green-800',
          icon: <Shield className="h-5 w-5 text-green-600" />,
          label: 'Low Priority'
        }
    }
  }

  const severityConfig = getSeverityConfig(insight.severity)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <Lightbulb className="h-6 w-6 text-yellow-600" />
            Business Insight Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Insight Header */}
          <Card className={`${severityConfig.borderColor}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-xl mb-2 flex items-center gap-2">
                    {severityConfig.icon}
                    {insight.title}
                  </CardTitle>
                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={severityConfig.color}>
                      {severityConfig.label}
                    </Badge>
                    <Badge variant="outline" className="text-xs">
                      Cluster: {insight.clusterId}
                    </Badge>
                  </div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {Math.round(insight.confidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Confidence</div>
                  <Progress value={insight.confidence * 100} className="w-20 h-2 mt-1" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className={`${severityConfig.bgColor} p-4 rounded-lg ${severityConfig.borderColor} border`}>
                <p className="text-gray-800 dark:text-gray-200 leading-relaxed">
                  {insight.summary}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
                <BarChart3 className="h-5 w-5" />
                Impact & Reach Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-3xl font-bold text-blue-600">
                    {insight.usersAffected.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Users Affected</div>
                  <div className="mt-2">
                    {insight.usersAffected > 1000 && (
                      <Badge className="bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 text-xs">
                        High Impact
                      </Badge>
                    )}
                    {insight.usersAffected <= 1000 && insight.usersAffected > 100 && (
                      <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200 text-xs">
                        Medium Impact
                      </Badge>
                    )}
                    {insight.usersAffected <= 100 && (
                      <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200 text-xs">
                        Focused Impact
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Star className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-3xl font-bold text-purple-600">
                    {insight.recommendationCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Recommendations</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-purple-600 h-2 rounded-full"
                      style={{ width: `${Math.min(100, (insight.recommendationCount / 10) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <FileSearch className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-3xl font-bold text-green-600">
                    {insight.evidenceCount}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Evidence Points</div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {insight.evidenceCount > 5 ? 'Strong' : insight.evidenceCount > 2 ? 'Moderate' : 'Limited'} Evidence
                    </Badge>
                  </div>
                </div>

                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Award className="h-6 w-6 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {insight.stakeholderFormats.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Report Formats</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Stakeholder Communication */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                <Zap className="h-5 w-5" />
                Stakeholder Communication Formats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3">
                {insight.stakeholderFormats.map((format, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center">
                        <span className="text-sm font-medium text-purple-700 dark:text-purple-300">
                          {index + 1}
                        </span>
                      </div>
                      <span className="font-medium capitalize">{format}</span>
                    </div>
                    <Badge variant="outline" className="text-xs">
                      Ready for {format} delivery
                    </Badge>
                  </div>
                ))}
              </div>
              
              {insight.stakeholderFormats.length === 0 && (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>No specific stakeholder formats configured</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Action Items Summary */}
          <Card className="border-green-200 dark:border-green-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
                <Target className="h-5 w-5" />
                Recommended Actions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4">
                <div className="p-4 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-2 h-2 bg-green-600 rounded-full"></div>
                    <span className="font-medium text-green-800 dark:text-green-200">Immediate Action Required</span>
                  </div>
                  <p className="text-sm text-gray-700 dark:text-gray-300">
                    Based on the {insight.severity} severity level and {insight.usersAffected.toLocaleString()} affected users, 
                    this insight requires stakeholder attention and resource allocation.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                    <div className="font-medium text-blue-800 dark:text-blue-200 mb-1">Data Collection</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.evidenceCount} evidence points collected and analyzed
                    </div>
                  </div>
                  
                  <div className="p-3 bg-purple-50 dark:bg-purple-950 rounded border border-purple-200 dark:border-purple-800">
                    <div className="font-medium text-purple-800 dark:text-purple-200 mb-1">Recommendation Review</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {insight.recommendationCount} actionable recommendations available
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Related Feedback */}
          {insightFeedback.length > 0 && (
            <Card className="border-indigo-200 dark:border-indigo-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-indigo-700 dark:text-indigo-300">
                  <FileSearch className="h-5 w-5" />
                  Contributing Feedback ({insightFeedback.length} entries)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    This insight was generated from analysis of the following customer feedback:
                  </div>
                  
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {insightFeedback.slice(0, 5).map((feedback, index) => (
                      <div key={feedback.id} className="p-4 bg-indigo-50 dark:bg-indigo-950 rounded-lg border border-indigo-200 dark:border-indigo-800">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-indigo-100 dark:bg-indigo-800 rounded-full flex items-center justify-center text-sm font-semibold text-indigo-700 dark:text-indigo-300 flex-shrink-0">
                            {index + 1}
                          </div>
                          <div className="flex-1 space-y-2">
                            <p className="text-sm text-gray-800 dark:text-gray-200 leading-relaxed bg-white dark:bg-gray-900 p-3 rounded border">
                              "{feedback.originalFeedback.text}"
                            </p>
                            
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs">
                                {feedback.originalFeedback.source}
                              </Badge>
                              <Badge className={
                                feedback.enrichmentData.sentiment.label === 'positive' 
                                  ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
                                  : feedback.enrichmentData.sentiment.label === 'negative'
                                  ? 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
                                  : 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
                              }>
                                {feedback.enrichmentData.sentiment.label}
                              </Badge>
                              <Badge variant="secondary" className="text-xs">
                                {feedback.enrichmentData.urgency} priority
                              </Badge>
                              {onViewFeedback && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => onViewFeedback(feedback.id)}
                                  className="h-6 px-2 text-xs ml-auto"
                                >
                                  <Eye className="h-3 w-3 mr-1" />
                                  View Details
                                </Button>
                              )}
                            </div>
                            
                            {feedback.enrichmentData.linkedProductAreas.length > 0 && (
                              <div className="text-xs text-gray-600 dark:text-gray-400">
                                <span className="font-medium">Product Areas:</span>{' '}
                                {feedback.enrichmentData.linkedProductAreas.slice(0, 2).map(area => area.name || area.id).join(', ')}
                                {feedback.enrichmentData.linkedProductAreas.length > 2 && (
                                  <span className="opacity-70"> +{feedback.enrichmentData.linkedProductAreas.length - 2} more</span>
                                )}
                              </div>
                            )}
                            
                            <div className="text-xs text-gray-500 font-mono opacity-60">
                              ID: {feedback.id}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  
                  {insightFeedback.length > 5 && (
                    <div className="text-center pt-3 border-t border-indigo-200 dark:border-indigo-700">
                      <Badge variant="outline" className="text-xs">
                        Showing 5 of {insightFeedback.length} contributing feedback entries
                      </Badge>
                    </div>
                  )}
                  
                  {relatedCluster && (
                    <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded border border-blue-200 dark:border-blue-800">
                      <div className="text-sm">
                        <span className="font-medium text-blue-800 dark:text-blue-200">Source Cluster:</span>{' '}
                        <span className="text-gray-700 dark:text-gray-300">"{relatedCluster.theme}"</span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {relatedCluster.description}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {insightFeedback.length === 0 && (
            <Card className="border-gray-200 dark:border-gray-700">
              <CardContent className="text-center py-8">
                <FileSearch className="h-12 w-12 mx-auto mb-3 opacity-50 text-gray-400" />
                <p className="text-gray-500 dark:text-gray-400">No contributing feedback found</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {relatedCluster 
                    ? `Cluster "${relatedCluster.theme}" exists but no matching feedback in current dataset`
                    : `No cluster found with ID: ${insight.clusterId}`
                  }
                </p>
              </CardContent>
            </Card>
          )}

          {/* Insight Metadata */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="font-medium mb-1">Insight ID:</div>
                <code className="font-mono">{insight.id}</code>
              </div>
              <div>
                <div className="font-medium mb-1">Source Cluster:</div>
                <code className="font-mono">{insight.clusterId}</code>
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
