'use client'

import React, { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  CheckCircle, 
  Clock, 
  AlertCircle, 
  ChevronDown,
  ChevronRight,
  Eye,
  Brain,
  BarChart3,
  Network
} from 'lucide-react'
import { EnrichedFeedback, EnrichedCluster } from '@/hooks/usePipelineExecution'
import { AIEnrichmentView } from './AIEnrichmentView'
import { ClusteringPlayground } from './ClusteringPlayground'

interface PipelineStage {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details: string[]
}

interface UpdatedPipelineViewProps {
  stages: PipelineStage[]
  enrichedFeedback: EnrichedFeedback[]
  enrichedClusters: EnrichedCluster[]
  events: any[]
  expandedSections: Set<string>
  onToggleSection: (sectionId: string) => void
  onViewFeedback: (feedback: EnrichedFeedback) => void
  onViewCluster: (cluster: EnrichedCluster) => void
  getSentimentColor: (sentiment: string) => string
  stageProgress: {
    enrichment: number
    clustering: number
    insights: number
  }
  progressStats: {
    feedbackProcessed: number
    totalFeedback: number
    clustersCreated: number
    expectedClusters: number
    insightsCreated: number
    expectedInsights: number
  }
}

export function UpdatedPipelineView({
  stages,
  enrichedFeedback,
  enrichedClusters,
  events,
  expandedSections,
  onToggleSection,
  onViewFeedback,
  onViewCluster,
  getSentimentColor,
  stageProgress,
  progressStats
}: UpdatedPipelineViewProps) {
  const [selectedView, setSelectedView] = useState<'enrichment' | 'clustering' | 'insights'>('enrichment')
  const [clusteringPlaygroundOpen, setClusteringPlaygroundOpen] = useState(false)

  const getStageByType = (type: string) => {
    return stages.find(stage => stage.id === type) || stages[0]
  }

  const isStageActive = (stageId: string) => {
    const stage = getStageByType(stageId)
    return stage?.status === 'running' || stage?.status === 'completed'
  }

  const renderEnrichmentStage = () => {
    const enrichmentStage = getStageByType('enrichment')
    const isRunning = enrichmentStage?.status === 'running'
    
    return (
      <AIEnrichmentView
        isRunning={isRunning}
        progress={stageProgress.enrichment}
        enrichedFeedback={enrichedFeedback}
        totalFeedback={progressStats.totalFeedback}
        processedCount={progressStats.feedbackProcessed}
      />
    )
  }

  const renderClusteringStage = () => {
    const clusteringStage = getStageByType('clustering')
    const isRunning = clusteringStage?.status === 'running'
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                <Network className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Clustering</CardTitle>
                <CardDescription>
                  Grouping similar feedback into meaningful clusters
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {progressStats.clustersCreated} clusters created
              </div>
              {isRunning && (
                <Badge variant="outline" className="mt-1">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(stageProgress.clustering)}%</span>
              </div>
              <Progress value={stageProgress.clustering} className="h-2" />
            </div>

            <div className="flex justify-between items-center">
              <h4 className="font-medium">Clustering Analysis</h4>
              <Button
                onClick={() => setClusteringPlaygroundOpen(true)}
                size="sm"
                variant="outline"
                className="gap-2"
              >
                <Brain className="h-4 w-4" />
                Clustering Playground
              </Button>
            </div>

            {enrichedClusters.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Discovered Clusters</h4>
                {enrichedClusters.map((cluster, index) => (
                  <Card key={cluster.id} className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h5 className="font-medium">{cluster.theme}</h5>
                          <Badge variant="outline">{cluster.size} items</Badge>
                          <Badge className={getSentimentColor(cluster.dominantSentiment)}>
                            {cluster.dominantSentiment}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">{cluster.description}</p>
                        {cluster.productAreas.length > 0 && (
                          <div className="flex gap-1 flex-wrap">
                            {cluster.productAreas.map((area, i) => (
                              <Badge key={i} variant="secondary" className="text-xs">
                                {area}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                      <Button
                        onClick={() => onViewCluster(cluster)}
                        size="sm"
                        variant="outline"
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const renderInsightsStage = () => {
    const insightsStage = getStageByType('insights')
    const isRunning = insightsStage?.status === 'running'
    
    return (
      <Card className="mb-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                <BarChart3 className="h-5 w-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <CardTitle className="text-lg">Insight Generation</CardTitle>
                <CardDescription>
                  Generating actionable insights from clustered feedback
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                {progressStats.insightsCreated} insights generated
              </div>
              {isRunning && (
                <Badge variant="outline" className="mt-1">
                  <Clock className="h-3 w-3 mr-1 animate-spin" />
                  Processing...
                </Badge>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Progress</span>
                <span>{Math.round(stageProgress.insights)}%</span>
              </div>
              <Progress value={stageProgress.insights} className="h-2" />
            </div>

            {/* This would integrate with the existing InsightsList component */}
            <div className="text-center py-8 text-gray-600 dark:text-gray-400">
              <BarChart3 className="h-12 w-12 mx-auto mb-4 text-gray-400 dark:text-gray-500" />
              <p>Insights will appear here as they are generated...</p>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stage Navigation */}
      <Card>
        <CardHeader>
          <CardTitle>Pipeline Progress</CardTitle>
          <CardDescription>
            Track the progress of feedback processing through each stage
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2 mb-4">
            <Button
              variant={selectedView === 'enrichment' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('enrichment')}
              disabled={!isStageActive('enrichment')}
              className="flex items-center gap-2"
            >
              <Brain className="h-4 w-4" />
              Enrichment
              {stageProgress.enrichment > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Math.round(stageProgress.enrichment)}%
                </Badge>
              )}
            </Button>
            <Button
              variant={selectedView === 'clustering' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('clustering')}
              disabled={!isStageActive('clustering')}
              className="flex items-center gap-2"
            >
              <Network className="h-4 w-4" />
              Clustering
              {stageProgress.clustering > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Math.round(stageProgress.clustering)}%
                </Badge>
              )}
            </Button>
            <Button
              variant={selectedView === 'insights' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedView('insights')}
              disabled={!isStageActive('insights')}
              className="flex items-center gap-2"
            >
              <BarChart3 className="h-4 w-4" />
              Insights
              {stageProgress.insights > 0 && (
                <Badge variant="secondary" className="ml-1">
                  {Math.round(stageProgress.insights)}%
                </Badge>
              )}
            </Button>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>
                {Math.round((stageProgress.enrichment + stageProgress.clustering + stageProgress.insights) / 3)}%
              </span>
            </div>
            <Progress 
              value={(stageProgress.enrichment + stageProgress.clustering + stageProgress.insights) / 3} 
              className="h-2"
            />
          </div>
        </CardContent>
      </Card>

      {/* Stage Content */}
      {selectedView === 'enrichment' && renderEnrichmentStage()}
      {selectedView === 'clustering' && renderClusteringStage()}
      {selectedView === 'insights' && renderInsightsStage()}

      {/* Clustering Playground */}
      <ClusteringPlayground
        isOpen={clusteringPlaygroundOpen}
        onClose={() => setClusteringPlaygroundOpen(false)}
        initialData={enrichedFeedback.map(item => ({
          id: item.id,
          text: item.originalFeedback.text
        }))}
        title="Clustering Playground"
        description="Experiment with different clustering algorithms and parameters to group your feedback"
      />
    </div>
  )
}
