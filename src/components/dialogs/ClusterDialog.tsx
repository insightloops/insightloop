/**
 * Enhanced Cluster Dialog
 * 
 * A comprehensive, enterprise-grade dialog for displaying cluster analysis
 * with visual elements, feedback relationships, and actionable insights.
 */

'use client'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { 
  BarChart3, 
  Users, 
  TrendingUp, 
  MapPin, 
  Hash,
  Target,
  Layers,
  Activity,
  Eye
} from 'lucide-react'
import { EnrichedCluster, EnrichedFeedback } from '@/hooks/usePipelineExecution'

interface ClusterDialogProps {
  cluster: EnrichedCluster | null
  enrichedFeedback: EnrichedFeedback[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onViewFeedback?: (feedbackId: string) => void
}

export function ClusterDialog({ cluster, enrichedFeedback, open, onOpenChange, onViewFeedback }: ClusterDialogProps) {
  if (!cluster) return null

  // Get the actual feedback entries that belong to this cluster
  const clusterFeedback = enrichedFeedback.filter(feedback => 
    cluster.enrichedFeedbackIds.includes(feedback.id)
  )

  const getSentimentColor = (sentiment: string) => {
    switch (sentiment.toLowerCase()) {
      case 'positive': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
      case 'negative': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200'
    }
  }

  const getSizeCategory = (size: number) => {
    if (size >= 20) return { label: 'Large Cluster', color: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200' }
    if (size >= 10) return { label: 'Medium Cluster', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200' }
    return { label: 'Small Cluster', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' }
  }

  const sizeCategory = getSizeCategory(cluster.size)

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700">
        <DialogHeader className="pb-6">
          <DialogTitle className="flex items-center gap-3 text-xl">
            <BarChart3 className="h-6 w-6 text-blue-600" />
            Semantic Cluster Analysis
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Cluster Overview */}
          <Card className="border-blue-200 dark:border-blue-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-blue-700 dark:text-blue-300">
                <Layers className="h-5 w-5" />
                Cluster Overview
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Theme */}
              <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <h3 className="text-lg font-semibold text-blue-900 dark:text-blue-100 mb-2">
                  {cluster.theme}
                </h3>
                <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                  {cluster.description}
                </p>
              </div>

              {/* Key Metrics */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-3 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {cluster.size}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Feedback Items</div>
                  <Badge className={sizeCategory.color + ' mt-1 text-xs'}>
                    {sizeCategory.label}
                  </Badge>
                </div>

                <div className="text-center p-3 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <TrendingUp className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-lg font-bold text-green-600">
                    {Math.round(cluster.avgConfidence * 100)}%
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Avg Confidence</div>
                  <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-2">
                    <div 
                      className="bg-green-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${cluster.avgConfidence * 100}%` }}
                    />
                  </div>
                </div>

                <div className="text-center p-3 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Activity className="h-5 w-5 text-orange-600" />
                  </div>
                  <Badge className={getSentimentColor(cluster.dominantSentiment)}>
                    {cluster.dominantSentiment}
                  </Badge>
                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">Sentiment</div>
                </div>

                <div className="text-center p-3 bg-indigo-50 dark:bg-indigo-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Target className="h-5 w-5 text-indigo-600" />
                  </div>
                  <div className="text-lg font-bold text-indigo-600">
                    {cluster.productAreas.length}
                  </div>
                  <div className="text-sm text-gray-600 dark:text-gray-400">Product Areas</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Areas */}
          {cluster.productAreas.length > 0 && (
            <Card className="border-green-200 dark:border-green-800">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg text-green-700 dark:text-green-300">
                  <MapPin className="h-5 w-5" />
                  Affected Product Areas
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid gap-2">
                  {cluster.productAreas.map((area, index) => (
                    <div key={index} className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-950 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-green-600" />
                        <span className="font-medium">{area}</span>
                      </div>
                      <Badge variant="outline" className="text-xs">
                        Area #{index + 1}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Feedback Collection */}
          <Card className="border-purple-200 dark:border-purple-800">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg text-purple-700 dark:text-purple-300">
                <Hash className="h-5 w-5" />
                Clustered Feedback ({cluster.enrichedFeedbackIds.length} items)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  This cluster contains {clusterFeedback.length} feedback entries with the following content:
                </div>
                
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {clusterFeedback.map((feedback, index) => (
                    <div key={feedback.id} className="p-4 bg-purple-50 dark:bg-purple-950 rounded-lg border border-purple-200 dark:border-purple-800">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 bg-purple-100 dark:bg-purple-800 rounded-full flex items-center justify-center text-sm font-semibold text-purple-700 dark:text-purple-300 flex-shrink-0">
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
                                Details
                              </Button>
                            )}
                          </div>
                          
                          {feedback.enrichmentData.extractedFeatures.length > 0 && (
                            <div className="text-xs text-gray-600 dark:text-gray-400">
                              <span className="font-medium">Features:</span> {feedback.enrichmentData.extractedFeatures.slice(0, 3).join(', ')}
                              {feedback.enrichmentData.extractedFeatures.length > 3 && (
                                <span className="opacity-70"> +{feedback.enrichmentData.extractedFeatures.length - 3} more</span>
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
                
                {clusterFeedback.length === 0 && (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Hash className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>No feedback content available for this cluster</p>
                    <p className="text-xs mt-1">
                      {cluster.enrichedFeedbackIds.length} feedback IDs referenced but not found in current dataset
                    </p>
                  </div>
                )}
                
                {clusterFeedback.length > 0 && (
                  <div className="text-center pt-3 border-t border-purple-200 dark:border-purple-700">
                    <Badge variant="outline" className="text-xs">
                      Showing {clusterFeedback.length} of {cluster.enrichedFeedbackIds.length} total feedback entries
                    </Badge>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Cluster ID */}
          <div className="text-xs text-gray-500 bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="font-medium mb-1">Cluster Identifier:</div>
            <code className="font-mono">{cluster.id}</code>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
