/**
 * Enhanced Pipeline Executor Component
 * 
 * A comprehensive UInt that uses the usePipelineExecution hook to:
 * - Upload feedback files and execute the pipeline
 * - Display real-time progress with enriched feedback, clusters, and insights
 * - Provide interactive drill-down capabilities for detailed analysis
 * - Show comprehensive pipeline results with rich visualizations
 */

'use client'

import React, { useState, useCallback, useRef, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { InsightLoopButton } from '@/components/ui/insightloop-button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Upload, 
  FileText, 
  Brain, 
  Lightbulb, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  ChevronDown,
  ChevronRight,
  Eye,
  Users,
  Target,
  TrendingUp,
  FileSearch,
  Zap,
  BarChart3,
  MessageSquare,
  Star,
  Layers,
  Activity
} from 'lucide-react'
import { usePipelineExecution } from '@/hooks/usePipelineExecution'
import { useAPIKeys } from '@/contexts/APIKeyContext'
import { EnrichedFeedbackDialog, ClusterDialog, InsightDialog } from '@/components/dialogs'
import { UpdatedPipelineView } from '@/components/UpdatedPipelineView'
import { PipelineCompletedView } from '@/components/PipelineCompletedView'

interface EnhancedPipelineExecutorProps {
  companyId: string
  productId: string
  onComplete?: (results: any) => void
}

interface PipelineStage {
  id: string
  name: string
  description: string
  icon: React.ComponentType<{ className?: string }>
  status: 'pending' | 'running' | 'completed' | 'error'
  progress: number
  details: string[]
}

export function EnhancedPipelineExecutor({ 
  companyId, 
  productId, 
  onComplete 
}: EnhancedPipelineExecutorProps) {
  // API Keys from context
  const { apiKeys } = useAPIKeys()
  
  // Debug API keys in component
  useEffect(() => {
    console.log('EnhancedPipelineExecutor - API keys:', { 
      hasOpenAI: !!apiKeys.openai, 
      hasAnthropic: !!apiKeys.anthropic,
      openaiLength: apiKeys.openai?.length 
    })
  }, [apiKeys])
  
  // File upload state
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [source, setSource] = useState<string>('survey')
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  // Use the enhanced pipeline execution hook
  const {
    isExecuting,
    events,
    enrichedFeedback,
    enrichedClusters,
    enrichedInsights,
    error,
    pipelineId,
    isComplete,
    executePipeline,
    cancelExecution,
    resetState,
    // Computed values
    eventCount,
    hasEvents,
    enrichmentEvents,
    clusterEvents,
    insightEvents,
    clusterCount,
    hasClusters,
    totalFeedbackInClusters,
    insightCount,
    hasInsights,
    totalUsersAffected,
    highSeverityInsights,
    mediumSeverityInsights,
    lowSeverityInsights,
    stageProgress,
    progressStats
  } = usePipelineExecution()

  // Pipeline stages for UI display
  const [stages, setStages] = useState<PipelineStage[]>([
    {
      id: 'upload',
      name: 'Data Upload',
      description: 'Processing uploaded feedback data',
      icon: Upload,
      status: 'pending',
      progress: 0,
      details: []
    },
    {
      id: 'enrichment',
      name: 'AI Enrichment', 
      description: 'Analyzing feedback with AI',
      icon: Brain,
      status: 'pending',
      progress: 0,
      details: []
    },
    {
      id: 'clustering',
      name: 'Semantic Clustering',
      description: 'Grouping related feedback',
      icon: BarChart3,
      status: 'pending',
      progress: 0,
      details: []
    },
    {
      id: 'insights',
      name: 'Insight Generation',
      description: 'Generating actionable business insights',
      icon: Lightbulb,
      status: 'pending',
      progress: 0,
      details: []
    }
  ])
  
  // UI state
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set())
  const [selectedModal, setSelectedModal] = useState<{
    type: 'enriched-feedback' | 'cluster' | 'insight'
    data: any
  } | null>(null)

  // Manage pipeline-progress section expansion state
  useEffect(() => {
    if (isExecuting) {
      // Expand pipeline-progress during execution
      setExpandedSections(prev => new Set([...prev, 'pipeline-progress']))
    } else if (isComplete) {
      // Collapse pipeline-progress when completed
      setExpandedSections(prev => {
        const newSet = new Set(prev)
        newSet.delete('pipeline-progress')
        return newSet
      })
    }
  }, [isExecuting, isComplete])

  // File handling
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setSelectedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0])
    }
  }, [])

  // Pipeline execution
  const startPipeline = useCallback(async () => {
    if (!selectedFile) return

    // Reset stages
    setStages(stages.map(stage => ({
      ...stage,
      status: 'pending',
      progress: 0,
      details: []
    })))

    // Execute pipeline using the hook
    await executePipeline({
      file: selectedFile,
      companyId,
      productId,
      source
    })
  }, [selectedFile, companyId, productId, source, executePipeline, stages])

  // Event handling for stage updates
  useEffect(() => {
    if (events.length === 0) return

    const latestEvent = events[events.length - 1]
    
    setStages(prevStages => {
      const newStages = [...prevStages]
      
      switch (latestEvent.type) {
        case 'feedback_enrichment_started':
          return newStages.map(stage => {
            if (stage.id === 'enrichment') {
              return { 
                ...stage, 
                status: 'running',
                details: [`Starting AI enrichment for feedback: "${latestEvent.text?.substring(0, 50)}..."`]
              }
            }
            return stage
          })
          
        case 'feedback_enrichment_complete':
          const enrichmentStage = newStages.find(s => s.id === 'enrichment')
          if (enrichmentStage && latestEvent.success) {
            enrichmentStage.details = [...enrichmentStage.details, 
              `✅ Enriched feedback ${latestEvent.feedbackId} with ${enrichmentStage.details.length + 1} AI insights`
            ]
            // Update progress based on enriched feedback count
            enrichmentStage.progress = Math.min(100, (enrichedFeedback.length / 10) * 100)
          }
          return newStages
          
        case 'clustering_started':
          return newStages.map(stage => {
            if (stage.id === 'enrichment') {
              return { ...stage, status: 'completed', progress: 100 }
            } else if (stage.id === 'clustering') {
              return { 
                ...stage, 
                status: 'running',
                details: [`Starting clustering of ${latestEvent.enrichedFeedbackCount} enriched feedback entries`]
              }
            }
            return stage
          })
          
        case 'cluster_created':
          const clusteringStage = newStages.find(s => s.id === 'clustering')
          if (clusteringStage) {
            clusteringStage.details = [...clusteringStage.details,
              `📊 Created cluster: "${latestEvent.theme}" (${latestEvent.size} feedback entries)`
            ]
          }
          return newStages
          
        case 'clustering_complete':
          return newStages.map(stage => {
            if (stage.id === 'clustering') {
              return { 
                ...stage, 
                status: 'completed', 
                details: [...stage.details, `✅ Created ${latestEvent.clusterCount} thematic clusters`]
              }
            } else if (stage.id === 'insights') {
              return { 
                ...stage, 
                status: 'running',
                details: [`Starting insight generation from ${latestEvent.clusterCount} clusters`]
              }
            }
            return stage
          })
          
        case 'insight_generation_started':
          const insightStage = newStages.find(s => s.id === 'insights')
          if (insightStage) {
            insightStage.details = [...insightStage.details,
              `🧠 Generating insights in ${latestEvent.mode} mode from ${latestEvent.clusterCount} clusters`
            ]
          }
          return newStages
          
        case 'insight_created':
          const insightGenerationStage = newStages.find(s => s.id === 'insights')
          if (insightGenerationStage) {
            insightGenerationStage.details = [...insightGenerationStage.details,
              `💡 Generated insight: "${latestEvent.title}" (${latestEvent.severity} severity, affects ${latestEvent.usersAffected} users)`
            ]
          }
          return newStages
          
        case 'insight_generation_complete':
          return newStages.map(stage => {
            if (stage.id === 'insights') {
              return { 
                ...stage, 
                status: 'completed', 
                details: [...stage.details, `✅ Generated ${latestEvent.insightCount} actionable insights`]
              }
            }
            return stage
          })
          
        case 'pipeline_complete':
          // Mark all stages as completed when pipeline finishes
          return newStages.map(stage => {
            if (stage.status !== 'completed') {
              return { ...stage, status: 'completed' }
            }
            return stage
          })
      }
      
      return newStages
    })
  }, [events, enrichedFeedback.length, enrichedClusters.length, enrichedInsights.length])

  // Reset pipeline
  const handleReset = useCallback(() => {
    resetState()
    setSelectedFile(null)
    setStages(stages.map(stage => ({
      ...stage,
      status: 'pending',
      progress: 0,
      details: []
    })))
  }, [resetState, stages])

  // Toggle expanded sections
  const toggleSection = useCallback((sectionId: string) => {
    setExpandedSections(prev => {
      const newSet = new Set(prev)
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId)
      } else {
        newSet.add(sectionId)
      }
      return newSet
    })
  }, [])

  // Get severity color
  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600 bg-red-50 dark:bg-red-950'
      case 'medium': return 'text-yellow-600 bg-yellow-50 dark:bg-yellow-950'
      case 'low': return 'text-green-600 bg-green-50 dark:bg-green-950'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  // Get sentiment color
  const getSentimentColor = (sentiment: string) => {
    switch (sentiment) {
      case 'positive': return 'text-green-600 bg-green-50 dark:bg-green-950'
      case 'negative': return 'text-red-600 bg-red-50 dark:bg-red-950'
      case 'neutral': return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
      default: return 'text-gray-600 bg-gray-50 dark:bg-gray-950'
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold">Enhanced AI Pipeline</h1>
        <p className="text-muted-foreground">
          Upload feedback data and watch as AI transforms it into enriched feedback, semantic clusters, and actionable business insights
        </p>
      </div>

      {/* File Upload Section */}
      {!isExecuting && !isComplete && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Upload className="h-5 w-5" />
              Upload Feedback Data
            </CardTitle>
            <CardDescription>
              Upload CSV, JSON, or text files containing customer feedback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Drag & Drop Zone */}
            <div
              className={`
                relative border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer
                ${dragActive 
                  ? 'border-primary bg-primary/5' 
                  : 'border-muted-foreground/25 hover:border-muted-foreground/50'
                }
              `}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".csv,.json,.txt"
                onChange={handleFileSelect}
                className="hidden"
              />
              
              <div className="space-y-4">
                <div className="mx-auto w-12 h-12 text-muted-foreground">
                  <FileText className="w-full h-full" />
                </div>
                
                <div>
                  <p className="text-lg font-medium">
                    {selectedFile ? selectedFile.name : 'Drop your feedback file here'}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    or click to browse files
                  </p>
                </div>
                
                <div className="flex justify-center space-x-2">
                  <Badge variant="secondary">CSV</Badge>
                  <Badge variant="secondary">JSON</Badge>
                  <Badge variant="secondary">TXT</Badge>
                </div>
              </div>
            </div>

            {/* Source Selection */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Feedback Source</label>
              <div className="flex flex-wrap gap-2">
                {['survey', 'support', 'interview', 'slack', 'other'].map((srcType) => (
                  <Button
                    key={srcType}
                    variant={source === srcType ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setSource(srcType)}
                  >
                    {srcType.charAt(0).toUpperCase() + srcType.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {/* API Key Warning */}
            {!apiKeys.openai && (
              <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                <div className="flex items-center gap-2 text-amber-800">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-sm font-medium">OpenAI API Key Required</span>
                </div>
                <p className="text-sm text-amber-700 mt-1">
                  Please configure your OpenAI API key in settings to run the pipeline.
                </p>
              </div>
            )}

            {/* Upload Button */}
            <InsightLoopButton 
              insightVariant="ai"
              withIcon
              onClick={startPipeline}
              disabled={!selectedFile || !apiKeys.openai}
              className="w-full"
              size="lg"
            >
              Start Enhanced AI Pipeline
            </InsightLoopButton>
          </CardContent>
        </Card>
      )}

      {/* Conditional Views Based on Pipeline State */}
      {(isExecuting || hasEvents) && (
        <>
          {/* In Progress View - Always show if there are events, collapsed when completed */}
          {hasEvents && (
            <Card className={`transition-all duration-500 ${!isExecuting && isComplete ? 'mb-6' : ''}`}>
              <CardHeader 
                className="cursor-pointer" 
                onClick={() => toggleSection('pipeline-progress')}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full transition-colors ${
                      isExecuting 
                        ? 'bg-primary/10 text-primary' 
                        : isComplete 
                          ? 'bg-green-100 text-green-600 dark:bg-green-900' 
                          : 'bg-muted text-muted-foreground'
                    }`}>
                      {isExecuting ? (
                        <Clock className="h-5 w-5 animate-spin" />
                      ) : isComplete ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Activity className="h-5 w-5" />
                      )}
                    </div>
                    <div>
                      <CardTitle className="text-lg">
                        {isExecuting ? 'Pipeline In Progress' : 'Pipeline Execution Summary'}
                      </CardTitle>
                      <CardDescription>
                        {isExecuting 
                          ? 'Processing your feedback through AI enrichment, clustering, and insight generation'
                          : `Completed in ${Math.round((Date.now() - Date.parse(events[0]?.timestamp || new Date().toISOString())) / 1000)}s • ${enrichedFeedback.length} feedback processed • ${clusterCount} clusters • ${insightCount} insights`
                        }
                      </CardDescription>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {!isExecuting && isComplete && (
                      <Badge variant="secondary" className="bg-green-50 text-green-700 dark:bg-green-950">
                        Complete
                      </Badge>
                    )}
                    {expandedSections.has('pipeline-progress') ? (
                      <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                      <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {(expandedSections.has('pipeline-progress') || isExecuting) && (
                <CardContent className="animate-in fade-in-0 duration-300">
                  <UpdatedPipelineView
                    stages={stages}
                    enrichedFeedback={enrichedFeedback}
                    enrichedClusters={enrichedClusters}
                    events={events}
                    expandedSections={expandedSections}
                    onToggleSection={toggleSection}
                    onViewFeedback={(feedback: any) => setSelectedModal({ type: 'enriched-feedback', data: feedback })}
                    onViewCluster={(cluster: any) => setSelectedModal({ type: 'cluster', data: cluster })}
                    getSentimentColor={getSentimentColor}
                    stageProgress={stageProgress}
                    progressStats={progressStats}
                  />
                </CardContent>
              )}
            </Card>
          )}

          {/* Completed View - Shows generated insights after completion */}
          {!isExecuting && hasEvents && isComplete && (
            <div className="animate-in fade-in-0 slide-in-from-bottom-4 duration-700">
              <div className="flex items-center gap-2 mb-4">
                <Lightbulb className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Generated Insights</h2>
                <Badge className="bg-primary/10 text-primary">
                  Primary Results
                </Badge>
              </div>
              
              <PipelineCompletedView
                enrichedInsights={enrichedInsights}
                totalUsersAffected={totalUsersAffected}
                highSeverityInsights={highSeverityInsights}
                mediumSeverityInsights={mediumSeverityInsights}
                lowSeverityInsights={lowSeverityInsights}
                onViewInsight={(insight) => setSelectedModal({ type: 'insight', data: insight })}
                onComplete={onComplete}
              />
              
              <div className="mt-6 flex justify-center">
                <Button onClick={handleReset} variant="outline" size="lg">
                  <Activity className="w-4 h-4 mr-2" />
                  Start New Analysis
                </Button>
              </div>
            </div>
          )}
        </>
      )}
      {/* Error Handling */}
      {error && (
        <div className="space-y-6">
          <Separator />
          
          <div className="flex items-center justify-between">
            <div className="space-y-2">
              <h2 className="text-2xl font-bold">Enhanced Analysis Results</h2>
              <p className="text-muted-foreground">
                Explore the enriched feedback, semantic clusters, and actionable insights
              </p>
            </div>
            <Button onClick={handleReset} variant="outline">
              <Activity className="w-4 h-4 mr-2" />
              New Analysis
            </Button>
          </div>

          {/* Pipeline Summary */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Pipeline Summary
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <MessageSquare className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {enrichedFeedback.length}
                  </div>
                  <div className="text-sm text-muted-foreground">Enriched Feedback</div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Layers className="h-5 w-5 text-green-600" />
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {clusterCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Semantic Clusters</div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Lightbulb className="h-5 w-5 text-purple-600" />
                  </div>
                  <div className="text-2xl font-bold text-purple-600">
                    {insightCount}
                  </div>
                  <div className="text-sm text-muted-foreground">Business Insights</div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="flex items-center justify-center mb-2">
                    <Users className="h-5 w-5 text-orange-600" />
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {totalUsersAffected}
                  </div>
                  <div className="text-sm text-muted-foreground">Users Affected</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Enriched Feedback Section */}
          {enrichedFeedback.length > 0 && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('enriched-feedback')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    Enriched Feedback ({enrichedFeedback.length})
                  </CardTitle>
                  {expandedSections.has('enriched-feedback') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSections.has('enriched-feedback') && (
                <CardContent>
                  <div className="max-h-96 overflow-y-auto space-y-4">
                    {enrichedFeedback.map((feedback, index) => (
                      <div key={feedback.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <p className="font-medium text-sm mb-2">"{feedback.originalFeedback.text}"</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{feedback.originalFeedback.source}</Badge>
                              <Badge className={getSentimentColor(feedback.enrichmentData.sentiment.label)}>
                                {feedback.enrichmentData.sentiment.label}
                              </Badge>
                              <Badge variant="outline">{feedback.enrichmentData.urgency}</Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedModal({ type: 'enriched-feedback', data: feedback })}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                        
                        <div className="space-y-1">
                          <div className="text-xs text-muted-foreground">
                            <span className="font-medium">Features:</span> {feedback.enrichmentData.extractedFeatures.join(', ')}
                          </div>
                          {feedback.enrichmentData.linkedProductAreas.length > 0 && (
                            <div className="text-xs text-muted-foreground">
                              <span className="font-medium">Product Areas:</span>{' '}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {feedback.enrichmentData.linkedProductAreas.map((area, areaIndex) => (
                                  <Badge 
                                    key={`${area.id}-${areaIndex}`} 
                                    variant="secondary" 
                                    className="text-xs px-1.5 py-0.5"
                                  >
                                    {area.name || area.id}
                                    {area.confidence && (
                                      <span className="ml-1 opacity-70">
                                        ({Math.round(area.confidence * 100)}%)
                                      </span>
                                    )}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Clusters Section */}
          {hasClusters && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('clusters')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Semantic Clusters ({clusterCount})
                  </CardTitle>
                  {expandedSections.has('clusters') ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CardHeader>
              
              {expandedSections.has('clusters') && (
                <CardContent>
                  <div className="space-y-4">
                    {enrichedClusters.map((cluster) => (
                      <div key={cluster.id} className="border rounded-lg p-4 space-y-3">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-sm mb-1">{cluster.theme}</h4>
                            <p className="text-xs text-muted-foreground mb-2">{cluster.description}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">{cluster.size} feedback</Badge>
                              <Badge className={getSentimentColor(cluster.dominantSentiment)}>
                                {cluster.dominantSentiment}
                              </Badge>
                              <Badge variant="outline">
                                {Math.round(cluster.avgConfidence * 100)}% confidence
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedModal({ type: 'cluster', data: cluster })}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium">Product Areas:</span> {cluster.productAreas.join(', ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Insights Section */}
          {hasInsights && (
            <Card>
              <CardHeader className="cursor-pointer" onClick={() => toggleSection('insights')}>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Lightbulb className="h-5 w-5" />
                    Business Insights ({insightCount})
                  </CardTitle>
                  <div className="flex items-center gap-2">
                    {highSeverityInsights > 0 && (
                      <Badge className="bg-red-50 text-red-600 dark:bg-red-950">
                        {highSeverityInsights} High
                      </Badge>
                    )}
                    {mediumSeverityInsights > 0 && (
                      <Badge className="bg-yellow-50 text-yellow-600 dark:bg-yellow-950">
                        {mediumSeverityInsights} Medium
                      </Badge>
                    )}
                    {expandedSections.has('insights') ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CardHeader>
              
              {expandedSections.has('insights') && (
                <CardContent>
                  <div className="space-y-4">
                    {enrichedInsights.map((insight) => (
                      <div key={insight.id} className={`border rounded-lg p-4 space-y-3 ${
                        insight.severity === 'high' ? 'border-red-200 bg-red-50 dark:bg-red-950' :
                        insight.severity === 'medium' ? 'border-yellow-200 bg-yellow-50 dark:bg-yellow-950' :
                        'border-green-200 bg-green-50 dark:bg-green-950'
                      }`}>
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-semibold text-sm">{insight.title}</h4>
                              <Badge className={getSeverityColor(insight.severity)}>
                                {insight.severity}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground mb-2">{insight.summary}</p>
                            <div className="flex items-center gap-2 text-xs">
                              <Badge variant="outline">
                                <Users className="w-3 h-3 mr-1" />
                                {insight.usersAffected} users
                              </Badge>
                              <Badge variant="outline">
                                <Target className="w-3 h-3 mr-1" />
                                {insight.recommendationCount} recommendations
                              </Badge>
                              <Badge variant="outline">
                                <FileSearch className="w-3 h-3 mr-1" />
                                {insight.evidenceCount} evidence
                              </Badge>
                              <Badge variant="outline">
                                <Star className="w-3 h-3 mr-1" />
                                {Math.round(insight.confidence * 100)}%
                              </Badge>
                            </div>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setSelectedModal({ type: 'insight', data: insight })}
                          >
                            <Eye className="w-3 h-3 mr-1" />
                            Details
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          )}

          {/* Event Timeline */}
          <Card>
            <CardHeader className="cursor-pointer" onClick={() => toggleSection('events')}>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Event Timeline ({eventCount} events)
                </CardTitle>
                {expandedSections.has('events') ? (
                  <ChevronDown className="h-4 w-4" />
                ) : (
                  <ChevronRight className="h-4 w-4" />
                )}
              </div>
            </CardHeader>
            
            {expandedSections.has('events') && (
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {events.map((event, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm p-2 rounded border">
                      <div className="text-xs text-muted-foreground mt-0.5 w-20 flex-shrink-0">
                        {new Date(event.timestamp).toLocaleTimeString()}
                      </div>
                      <Badge variant="outline" className="text-xs">
                        {event.type}
                      </Badge>
                      <span className="text-muted-foreground flex-1 text-xs">
                        {event.type === 'insight_created' && `"${event.title}" - ${event.severity} severity`}
                        {event.type === 'cluster_created' && `"${event.theme}" - ${event.size} feedback`}
                        {event.type === 'feedback_enrichment_complete' && `Enriched: "${event.feedbackId}"`}
                        {!['insight_created', 'cluster_created', 'feedback_enrichment_complete'].includes(event.type) && 
                          JSON.stringify(event).substring(0, 100) + '...'
                        }
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <Card className="border-red-200 bg-red-50 dark:bg-red-950">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              Pipeline Error
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-600 mb-4">{error}</p>
            <div className="flex gap-2">
              <Button onClick={handleReset} variant="outline">
                Reset Pipeline
              </Button>
              {isExecuting && (
                <Button onClick={cancelExecution} variant="destructive">
                  Cancel Execution
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Detail Dialogs */}
      <EnrichedFeedbackDialog 
        feedback={selectedModal?.type === 'enriched-feedback' ? selectedModal.data : null}
        open={selectedModal?.type === 'enriched-feedback'}
        onOpenChange={(open) => !open && setSelectedModal(null)}
      />
      
      <ClusterDialog 
        cluster={selectedModal?.type === 'cluster' ? selectedModal.data : null}
        enrichedFeedback={enrichedFeedback}
        open={selectedModal?.type === 'cluster'}
        onOpenChange={(open) => !open && setSelectedModal(null)}
        onViewFeedback={(feedbackId) => {
          // Find the feedback by ID and open it
          const feedback = enrichedFeedback.find(f => f.id === feedbackId)
          if (feedback) {
            setSelectedModal({ type: 'enriched-feedback', data: feedback })
          }
        }}
      />
      
      <InsightDialog 
        insight={selectedModal?.type === 'insight' ? selectedModal.data : null}
        enrichedFeedback={enrichedFeedback}
        enrichedClusters={enrichedClusters}
        open={selectedModal?.type === 'insight'}
        onOpenChange={(open) => !open && setSelectedModal(null)}
        onViewFeedback={(feedbackId) => {
          // Find the feedback by ID and open it
          const feedback = enrichedFeedback.find(f => f.id === feedbackId)
          if (feedback) {
            setSelectedModal({ type: 'enriched-feedback', data: feedback })
          }
        }}
      />
    </div>
  )
}
