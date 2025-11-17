/**
 * Detailed Results Components for Interactive Feedback Pipeline
 * 
 * These components provide detailed, expandable views of:
 * - Enrichment results with LLM prompts/responses
 * - Cluster visualizations with feedback groupings  
 * - Insight cards with evidence and relationships
 */

'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'
import { 
  Brain, 
  MessageSquare, 
  Users, 
  Target, 
  TrendingUp,
  ChevronDown,
  ChevronRight,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock,
  Lightbulb,
  BarChart3
} from 'lucide-react'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'

// Types
interface EnrichedFeedback {
  id: string
  text: string
  productArea: string
  sentiment: 'positive' | 'negative' | 'neutral'
  urgency: 'low' | 'medium' | 'high'
  customerSegment: string
  enrichedData?: any
  llmPrompt?: string
  llmResponse?: string
}

interface FeedbackCluster {
  id: string
  name: string
  theme: string
  description: string
  feedback: EnrichedFeedback[]
  sentiment: {
    positive: number
    negative: number
    neutral: number
  }
  urgency: {
    low: number
    medium: number
    high: number
  }
}

interface GeneratedInsight {
  id: string
  title: string
  description: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  confidence: number
  clusters: string[]
  evidence: string[]
  recommendation: string
  impact: string
  stakeholders: string[]
}

// Enrichment Results Component
interface EnrichmentResultsProps {
  enrichedFeedback: EnrichedFeedback[]
  events: any[]
}

export function EnrichmentResults({ enrichedFeedback, events }: EnrichmentResultsProps) {
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  
  const toggleExpanded = (id: string) => {
    setExpandedItems(prev => {
      const newSet = new Set(prev)
      if (newSet.has(id)) {
        newSet.delete(id)
      } else {
        newSet.add(id)
      }
      return newSet
    })
  }

  const enrichmentEvents = events.filter(e => 
    e.type.includes('enrichment') || e.type.includes('ai_call')
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5" />
          AI Enrichment Results ({enrichedFeedback.length})
        </CardTitle>
        <CardDescription>
          View how AI enhanced each piece of feedback with sentiment, urgency, and product area analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Summary Stats */}
        <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-lg">
          <div className="text-center">
            <div className="text-lg font-semibold text-green-600">
              {enrichedFeedback.filter(f => f.sentiment === 'positive').length}
            </div>
            <div className="text-xs text-muted-foreground">Positive</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-red-600">
              {enrichedFeedback.filter(f => f.sentiment === 'negative').length}
            </div>
            <div className="text-xs text-muted-foreground">Negative</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-semibold text-orange-600">
              {enrichedFeedback.filter(f => f.urgency === 'high').length}
            </div>
            <div className="text-xs text-muted-foreground">High Urgency</div>
          </div>
        </div>

        {/* Individual Feedback Items */}
        {enrichedFeedback.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Brain className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="text-lg font-medium">No enriched feedback yet</p>
            <p className="text-sm">AI enrichment results will appear here once the pipeline processes your feedback.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {enrichedFeedback.map((feedback) => (
            <Card key={feedback.id} className="border-l-4 border-l-primary/20">
              <CardHeader 
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => toggleExpanded(feedback.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 space-y-2">
                    <p className="text-sm leading-relaxed">{feedback.text}</p>
                    
                    <div className="flex flex-wrap gap-2">
                      <Badge variant={
                        feedback.sentiment === 'positive' ? 'default' :
                        feedback.sentiment === 'negative' ? 'destructive' : 'secondary'
                      }>
                        {feedback.sentiment}
                      </Badge>
                      
                      <Badge variant={
                        feedback.urgency === 'high' ? 'destructive' :
                        feedback.urgency === 'medium' ? 'default' : 'secondary'
                      }>
                        {feedback.urgency} urgency
                      </Badge>
                      
                      <Badge variant="outline">
                        {feedback.productArea}
                      </Badge>
                      
                      <Badge variant="outline">
                        {feedback.customerSegment}
                      </Badge>
                    </div>
                  </div>
                  
                  {expandedItems.has(feedback.id) ? (
                    <ChevronDown className="h-4 w-4 text-muted-foreground ml-2" />
                  ) : (
                    <ChevronRight className="h-4 w-4 text-muted-foreground ml-2" />
                  )}
                </div>
              </CardHeader>
              
              {expandedItems.has(feedback.id) && (
                <CardContent className="pt-0">
                  <div className="space-y-4">
                    <Separator />
                    
                    {/* LLM Interaction */}
                    {feedback.llmPrompt && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4" />
                          AI Analysis Details
                        </h4>
                        
                        <div className="bg-muted p-3 rounded text-xs">
                          <strong>Prompt:</strong>
                          <pre className="mt-1 whitespace-pre-wrap">{feedback.llmPrompt}</pre>
                        </div>
                        
                        {feedback.llmResponse && (
                          <div className="bg-primary/5 p-3 rounded text-xs">
                            <strong>AI Response:</strong>
                            <pre className="mt-1 whitespace-pre-wrap">{feedback.llmResponse}</pre>
                          </div>
                        )}
                      </div>
                    )}
                    
                    {/* Enriched Data */}
                    {feedback.enrichedData && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium">Extracted Data</h4>
                        <pre className="bg-muted p-3 rounded text-xs overflow-auto">
                          {JSON.stringify(feedback.enrichedData, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </CardContent>
              )}
            </Card>
          ))}
        </div>
        )}
      </CardContent>
    </Card>
  )
}

// Cluster Visualization Component
interface ClusterVisualizationProps {
  clusters: FeedbackCluster[]
}

export function ClusterVisualization({ clusters }: ClusterVisualizationProps) {
  const [selectedCluster, setSelectedCluster] = useState<string | null>(null)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="h-5 w-5" />
          Semantic Clusters ({clusters.length})
        </CardTitle>
        <CardDescription>
          Feedback grouped by AI into thematic clusters based on semantic similarity
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {clusters.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BarChart3 className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No clusters were created from this dataset.</p>
            <p className="text-sm">This is normal for small datasets or highly diverse feedback.</p>
          </div>
        ) : (
          <div className="grid gap-4">
            {clusters.map((cluster) => (
              <Card key={cluster.id} className="border-l-4 border-l-blue-500">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <CardTitle className="text-lg">{cluster.name}</CardTitle>
                      <CardDescription>{cluster.description}</CardDescription>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {cluster.feedback.length} feedback
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <TrendingUp className="h-3 w-3" />
                          Theme: {cluster.theme}
                        </span>
                      </div>
                      
                      {/* Sentiment Distribution */}
                      <div className="flex gap-2">
                        <Badge variant="default" className="bg-green-100 text-green-800">
                          {cluster.sentiment.positive} positive
                        </Badge>
                        <Badge variant="destructive">
                          {cluster.sentiment.negative} negative
                        </Badge>
                        <Badge variant="secondary">
                          {cluster.sentiment.neutral} neutral
                        </Badge>
                      </div>
                    </div>
                    
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-2" />
                          View Details
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                        <DialogHeader>
                          <DialogTitle>{cluster.name}</DialogTitle>
                          <DialogDescription>{cluster.description}</DialogDescription>
                        </DialogHeader>
                        
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Sentiment Distribution</h4>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>Positive</span>
                                  <span>{cluster.sentiment.positive}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Negative</span>
                                  <span>{cluster.sentiment.negative}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Neutral</span>
                                  <span>{cluster.sentiment.neutral}</span>
                                </div>
                              </div>
                            </div>
                            
                            <div>
                              <h4 className="text-sm font-medium mb-2">Urgency Levels</h4>
                              <div className="space-y-1">
                                <div className="flex justify-between text-sm">
                                  <span>High</span>
                                  <span>{cluster.urgency.high}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Medium</span>
                                  <span>{cluster.urgency.medium}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                  <span>Low</span>
                                  <span>{cluster.urgency.low}</span>
                                </div>
                              </div>
                            </div>
                          </div>
                          
                          <Separator />
                          
                          <div>
                            <h4 className="text-sm font-medium mb-3">Feedback in this Cluster</h4>
                            <div className="space-y-3">
                              {cluster.feedback.map((feedback) => (
                                <Card key={feedback.id} className="p-3">
                                  <p className="text-sm mb-2">{feedback.text}</p>
                                  <div className="flex gap-2">
                                    <Badge variant="outline" size="sm">
                                      {feedback.sentiment}
                                    </Badge>
                                    <Badge variant="outline" size="sm">
                                      {feedback.urgency}
                                    </Badge>
                                    <Badge variant="outline" size="sm">
                                      {feedback.productArea}
                                    </Badge>
                                  </div>
                                </Card>
                              ))}
                            </div>
                          </div>
                        </div>
                      </DialogContent>
                    </Dialog>
                  </div>
                </CardHeader>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

// Insights Dashboard Component
interface InsightsDashboardProps {
  insights: GeneratedInsight[]
  clusters: FeedbackCluster[]
}

export function InsightsDashboard({ insights, clusters }: InsightsDashboardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5" />
          Generated Insights ({insights.length})
        </CardTitle>
        <CardDescription>
          Actionable business insights derived from your feedback analysis
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {insights.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>No insights were generated from this analysis.</p>
            <p className="text-sm">This typically happens when there are no clear thematic clusters.</p>
          </div>
        ) : (
          <div className="grid gap-6">
            {insights.map((insight) => (
              <Card key={insight.id} className={`
                border-l-4
                ${insight.severity === 'critical' ? 'border-l-red-500' :
                  insight.severity === 'high' ? 'border-l-orange-500' :
                  insight.severity === 'medium' ? 'border-l-yellow-500' :
                  'border-l-blue-500'
                }
              `}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{insight.title}</CardTitle>
                        <Badge variant={
                          insight.severity === 'critical' ? 'destructive' :
                          insight.severity === 'high' ? 'default' :
                          insight.severity === 'medium' ? 'secondary' :
                          'outline'
                        }>
                          {insight.severity}
                        </Badge>
                      </div>
                      
                      <CardDescription className="text-base">
                        {insight.description}
                      </CardDescription>
                      
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Target className="h-3 w-3" />
                          Confidence: {Math.round(insight.confidence * 100)}%
                        </span>
                        
                        <span className="flex items-center gap-1">
                          <BarChart3 className="h-3 w-3" />
                          {insight.clusters.length} clusters
                        </span>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Recommendation */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <CheckCircle className="h-4 w-4 text-green-600" />
                      Recommendation
                    </h4>
                    <p className="text-sm bg-green-50 dark:bg-green-950 p-3 rounded-lg">
                      {insight.recommendation}
                    </p>
                  </div>
                  
                  {/* Impact */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-blue-600" />
                      Expected Impact
                    </h4>
                    <p className="text-sm bg-blue-50 dark:bg-blue-950 p-3 rounded-lg">
                      {insight.impact}
                    </p>
                  </div>
                  
                  {/* Stakeholders */}
                  {insight.stakeholders.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Users className="h-4 w-4 text-purple-600" />
                        Key Stakeholders
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {insight.stakeholders.map((stakeholder, i) => (
                          <Badge key={i} variant="outline">
                            {stakeholder}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Evidence */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium flex items-center gap-2">
                      <Eye className="h-4 w-4 text-gray-600" />
                      Supporting Evidence
                    </h4>
                    <div className="space-y-2">
                      {insight.evidence.map((evidence, i) => (
                        <div key={i} className="flex items-start gap-2 text-sm">
                          <div className="w-1 h-1 rounded-full bg-muted-foreground mt-2 flex-shrink-0" />
                          <span className="text-muted-foreground">{evidence}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Supporting Feedback */}
                  {(() => {
                    const supportingFeedback = insight.clusters
                      .map(clusterId => clusters.find(c => c.id === clusterId))
                      .filter((cluster): cluster is NonNullable<typeof cluster> => cluster !== undefined)
                      .flatMap(cluster => cluster.feedback)
                      .filter((feedback, index, self) => 
                        self.findIndex(f => f.id === feedback.id) === index
                      ) // Remove duplicates
                    
                    return supportingFeedback.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-medium flex items-center gap-2">
                          <MessageSquare className="h-4 w-4 text-blue-600" />
                          Supporting Feedback ({supportingFeedback.length})
                        </h4>
                        <div className="space-y-3 max-h-60 overflow-y-auto">
                          {supportingFeedback.map((feedback) => (
                            <div key={feedback.id} className="bg-muted/30 p-3 rounded-lg space-y-2">
                              <p className="text-sm text-foreground">
                                "{feedback.text}"
                              </p>
                              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                                <Badge variant="outline" className="text-xs">
                                  {feedback.sentiment}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {feedback.urgency} urgency
                                </Badge>
                                <span>{feedback.productArea}</span>
                                {feedback.customerSegment && (
                                  <span>• {feedback.customerSegment}</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    )
                  })()}
                  
                  {/* Related Clusters */}
                  <div className="space-y-2">
                    <h4 className="text-sm font-medium">Related Clusters</h4>
                    <div className="flex flex-wrap gap-2">
                      {insight.clusters.map((clusterId) => {
                        const cluster = clusters.find(c => c.id === clusterId)
                        return cluster ? (
                          <Badge key={clusterId} variant="secondary">
                            {cluster.name}
                          </Badge>
                        ) : null
                      })}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}
