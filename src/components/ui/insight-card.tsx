/**
 * Reusable Insight Card Component
 * 
 * A flexible card component that can display insights in different formats:
 * - Compact format (for dashboards and lists)
 * - Detailed format (for expanded views)
 * - Custom format (configurable display options)
 */

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { 
  Lightbulb, 
  Users, 
  TrendingUp, 
  AlertTriangle, 
  Target, 
  Clock,
  ChevronDown,
  ChevronUp,
  Eye,
  Download,
  Share,
  CheckCircle,
  User,
  Building,
  Code,
  HeadphonesIcon,
  MoreHorizontal
} from 'lucide-react'

// Flexible insight type that can work with both database insights and generated insights
export interface InsightCardData {
  id: string
  title: string
  summary?: string
  executiveSummary?: string
  description?: string
  theme?: string
  status?: 'active' | 'archived' | 'implemented'
  created_at?: string
  
  // Scoring fields (from database insights)
  insight_score?: number | null
  urgency_score?: number | null
  volume_score?: number | null
  value_alignment_score?: number | null
  
  // Generated insight fields
  confidence?: number
  painPoint?: {
    severity?: 'low' | 'medium' | 'high' | 'critical'
    description?: string
    userJourneyStage?: string
    frequencyOfMention?: number
  }
  impact?: {
    usersAffected?: number
    userSegments?: string[]
    businessImpact?: any
  }
  recommendations?: Array<{
    title: string
    description: string
    priority: string
    effort: string
    timeline: string
  }>
  stakeholderFormats?: Record<string, string>
  evidence?: {
    supportingFeedback?: any[]
    sourceCluster?: {
      size?: number
      theme?: string
    }
  }
  detailedAnalysis?: string
}

export interface InsightCardProps {
  insight: InsightCardData
  variant?: 'compact' | 'detailed' | 'dashboard'
  showActions?: boolean
  showMetrics?: boolean
  showStakeholders?: boolean
  expandable?: boolean
  index?: number
  onClick?: (insight: InsightCardData) => void
  onAction?: (action: 'view' | 'export' | 'share', insight: InsightCardData) => void
}

// Utility functions
const getSeverityColor = (severity?: string) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800 border-red-200'
    case 'high':
      return 'bg-orange-100 text-orange-800 border-orange-200'
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    case 'low':
      return 'bg-green-100 text-green-800 border-green-200'
    default:
      return 'bg-gray-100 text-gray-800 border-gray-200'
  }
}

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

const getPriorityColor = (priority: string) => {
  switch (priority) {
    case 'critical':
      return 'bg-red-500 text-white'
    case 'high':
      return 'bg-orange-500 text-white'
    case 'medium':
      return 'bg-yellow-500 text-white'
    case 'low':
      return 'bg-green-500 text-white'
    default:
      return 'bg-gray-500 text-white'
  }
}

const getBusinessImpactIcon = (impact: any) => {
  if (impact?.revenue === 'negative' || impact?.churn === 'increase') {
    return <TrendingUp className="h-4 w-4 text-red-500 rotate-180" />
  }
  if (impact?.revenue === 'positive' || impact?.satisfaction === 'improve') {
    return <TrendingUp className="h-4 w-4 text-green-500" />
  }
  return <TrendingUp className="h-4 w-4 text-gray-400" />
}

const StakeholderIcon = ({ stakeholder }: { stakeholder: string }) => {
  switch (stakeholder) {
    case 'executive':
      return <Building className="h-4 w-4" />
    case 'product':
      return <Target className="h-4 w-4" />
    case 'engineering':
      return <Code className="h-4 w-4" />
    case 'customerSuccess':
      return <HeadphonesIcon className="h-4 w-4" />
    default:
      return <User className="h-4 w-4" />
  }
}

export function InsightCard({
  insight,
  variant = 'detailed',
  showActions = true,
  showMetrics = true,
  showStakeholders = false,
  expandable = true,
  index,
  onClick,
  onAction
}: InsightCardProps) {
  const [isExpanded, setIsExpanded] = useState(false)
  const [activeStakeholder, setActiveStakeholder] = useState<string>('executive')

  // Calculate derived values
  const mainScore = insight.insight_score ?? insight.confidence ?? 0
  const confidencePercentage = Math.round((insight.confidence ?? mainScore) * 100)
  const evidenceCount = insight.evidence?.supportingFeedback?.length ?? 0
  const displaySummary = insight.summary || insight.executiveSummary || insight.description || ''

  const handleCardClick = () => {
    if (onClick) {
      onClick(insight)
    }
  }

  const handleActionClick = (action: 'view' | 'export' | 'share', e: React.MouseEvent) => {
    e.stopPropagation()
    if (onAction) {
      onAction(action, insight)
    }
  }

  // Dashboard variant (compact)
  if (variant === 'dashboard') {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <CardHeader className="space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <CardTitle className="text-lg mb-2">
                {insight.title}
              </CardTitle>
              {insight.theme && (
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary/10 text-primary">
                  {insight.theme}
                </span>
              )}
            </div>
            {mainScore > 0 && (
              <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getScoreColor(mainScore)}`}>
                <span className="w-2 h-2 bg-current rounded-full mr-1"></span>
                {Math.round(mainScore * 100)}%
              </div>
            )}
          </div>
        </CardHeader>

        <CardContent>
          <CardDescription className="line-clamp-3 mb-4">
            {displaySummary}
          </CardDescription>

          {showMetrics && (
            <div className="grid grid-cols-3 gap-4 pt-4 border-t border-gray-100">
              <div className="text-center">
                <div className={`text-lg font-semibold ${insight.urgency_score ? getUrgencyColor(insight.urgency_score) : 'text-muted-foreground'}`}>
                  {insight.urgency_score ? Math.round(insight.urgency_score * 100) : '--'}%
                </div>
                <div className="text-xs text-gray-500">Urgency</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-blue-600">
                  {insight.volume_score ? Math.round(insight.volume_score * 100) : (insight.impact?.usersAffected || '--')}
                </div>
                <div className="text-xs text-gray-500">
                  {insight.volume_score ? 'Volume' : 'Users'}
                </div>
              </div>
              <div className="text-center">
                <div className="text-lg font-semibold text-purple-600">
                  {insight.value_alignment_score ? Math.round(insight.value_alignment_score * 100) : (insight.recommendations?.length || '--')}%
                </div>
                <div className="text-xs text-gray-500">
                  {insight.value_alignment_score ? 'Alignment' : 'Actions'}
                </div>
              </div>
            </div>
          )}

          <div className="flex items-center justify-between text-xs text-muted-foreground mt-4">
            <span>
              {insight.status === 'active' && <span className="text-green-600 dark:text-green-400">● Active</span>}
              {insight.status === 'archived' && <span className="text-muted-foreground">● Archived</span>}
              {insight.status === 'implemented' && <span className="text-primary">● Implemented</span>}
              {!insight.status && insight.painPoint?.severity && (
                <Badge variant="outline" className={getSeverityColor(insight.painPoint.severity)}>
                  {insight.painPoint.severity.toUpperCase()}
                </Badge>
              )}
            </span>
            <span>
              {insight.created_at ? new Date(insight.created_at).toLocaleDateString() : 'Recent'}
            </span>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Compact variant
  if (variant === 'compact') {
    return (
      <Card 
        className="hover:shadow-md transition-shadow cursor-pointer"
        onClick={handleCardClick}
      >
        <CardContent className="p-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                {index !== undefined && (
                  <Badge variant="outline" className="text-xs">
                    #{index + 1}
                  </Badge>
                )}
                {insight.theme && (
                  <Badge variant="secondary" className="text-xs">
                    {insight.theme}
                  </Badge>
                )}
              </div>
              <h4 className="font-semibold text-gray-900 mb-1">{insight.title}</h4>
              <p className="text-sm text-gray-600 line-clamp-2">{displaySummary}</p>
            </div>
            {mainScore > 0 && (
              <Badge variant="secondary" className="text-sm ml-2">
                {Math.round(mainScore * 100)}%
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  // Detailed variant (default)
  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Lightbulb className="h-5 w-5 text-yellow-600" />
              {index !== undefined && (
                <Badge variant="outline" className="text-xs">
                  Insight #{index + 1}
                </Badge>
              )}
              {insight.painPoint?.severity && (
                <Badge className={getSeverityColor(insight.painPoint.severity)}>
                  {insight.painPoint.severity.toUpperCase()} Priority
                </Badge>
              )}
              {insight.theme && !insight.painPoint?.severity && (
                <Badge variant="secondary">
                  {insight.theme}
                </Badge>
              )}
              {mainScore >= 0.8 && <CheckCircle className="h-4 w-4 text-green-600" />}
            </div>
            
            <CardTitle className="text-xl mb-2 text-gray-900">
              {insight.title}
            </CardTitle>
            
            <CardDescription className="text-base text-gray-700">
              {displaySummary}
            </CardDescription>
          </div>
          
          <div className="text-right space-y-1">
            <Badge variant="secondary" className="text-sm">
              {confidencePercentage}% Confidence
            </Badge>
            {evidenceCount > 0 && (
              <div className="text-xs text-gray-500">
                {evidenceCount} Evidence Points
              </div>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics Row */}
        {showMetrics && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <Users className="h-5 w-5 text-blue-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-blue-900">
                {insight.impact?.usersAffected || 0}
              </div>
              <div className="text-xs text-blue-700">Users Affected</div>
            </div>
            
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-purple-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-purple-900">
                {insight.painPoint?.frequencyOfMention || insight.urgency_score ? Math.round((insight.urgency_score || 0) * 100) : 0}
              </div>
              <div className="text-xs text-purple-700">
                {insight.painPoint?.frequencyOfMention ? 'Mentions' : 'Urgency'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <Target className="h-5 w-5 text-green-600 mx-auto mb-1" />
              <div className="text-lg font-semibold text-green-900">
                {insight.recommendations?.length || insight.volume_score ? Math.round((insight.volume_score || 0) * 100) : 0}
              </div>
              <div className="text-xs text-green-700">
                {insight.recommendations?.length ? 'Actions' : 'Volume'}
              </div>
            </div>
            
            <div className="text-center p-3 bg-orange-50 rounded-lg flex items-center justify-center">
              {getBusinessImpactIcon(insight.impact?.businessImpact)}
              <div className="ml-2">
                <div className="text-sm font-semibold text-orange-900">
                  {insight.value_alignment_score ? Math.round(insight.value_alignment_score * 100) + '%' : 'Business'}
                </div>
                <div className="text-xs text-orange-700">
                  {insight.value_alignment_score ? 'Alignment' : 'Impact'}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Pain Point Summary */}
        {insight.painPoint?.description && (
          <div className="p-4 bg-gray-50 rounded-lg">
            <h4 className="font-semibold text-gray-900 mb-2 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Pain Point Analysis
            </h4>
            <p className="text-gray-700 mb-2">{insight.painPoint.description}</p>
            <div className="flex items-center gap-4 text-sm text-gray-600">
              {insight.painPoint.userJourneyStage && (
                <span>Journey Stage: <strong>{insight.painPoint.userJourneyStage}</strong></span>
              )}
              {insight.impact?.userSegments?.length && (
                <span>Segments: <strong>{insight.impact.userSegments.join(', ')}</strong></span>
              )}
            </div>
          </div>
        )}

        {/* Stakeholder Views */}
        {showStakeholders && insight.stakeholderFormats && Object.keys(insight.stakeholderFormats).length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">Stakeholder Perspectives</h4>
            
            <div className="flex gap-2 mb-4 overflow-x-auto">
              {Object.entries(insight.stakeholderFormats).map(([stakeholder, _]) => (
                <Button
                  key={stakeholder}
                  variant={activeStakeholder === stakeholder ? "default" : "outline"}
                  size="sm"
                  onClick={() => setActiveStakeholder(stakeholder)}
                  className="flex items-center gap-2 whitespace-nowrap"
                >
                  <StakeholderIcon stakeholder={stakeholder} />
                  {stakeholder.charAt(0).toUpperCase() + stakeholder.slice(1)}
                </Button>
              ))}
            </div>
            
            {insight.stakeholderFormats[activeStakeholder] && (
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-blue-900">
                  {insight.stakeholderFormats[activeStakeholder]}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Recommendations Preview */}
        {insight.recommendations && insight.recommendations.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-900 mb-3">
              Top Recommendations ({insight.recommendations.length})
            </h4>
            <div className="space-y-2">
              {insight.recommendations.slice(0, 2).map((rec, idx) => (
                <div key={idx} className="flex items-center justify-between p-3 bg-white border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className={getPriorityColor(rec.priority)} size="sm">
                        {rec.priority}
                      </Badge>
                      <span className="font-medium text-gray-900">{rec.title}</span>
                    </div>
                    <p className="text-sm text-gray-600">{rec.description}</p>
                  </div>
                  <div className="text-right text-sm text-gray-500">
                    <div>{rec.effort} effort</div>
                    <div className="flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {rec.timeline}
                    </div>
                  </div>
                </div>
              ))}
              
              {insight.recommendations.length > 2 && expandable && (
                <div className="text-center">
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsExpanded(!isExpanded)}
                  >
                    {isExpanded ? 'Show Less' : `Show ${insight.recommendations.length - 2} More`}
                    {isExpanded ? <ChevronUp className="h-4 w-4 ml-1" /> : <ChevronDown className="h-4 w-4 ml-1" />}
                  </Button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Expanded Content */}
        {isExpanded && expandable && (
          <div className="space-y-6 pt-4 border-t">
            {/* Detailed Analysis */}
            {insight.detailedAnalysis && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Detailed Analysis</h4>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-gray-700 whitespace-pre-line">{insight.detailedAnalysis}</p>
                </div>
              </div>
            )}

            {/* All Recommendations */}
            {insight.recommendations && insight.recommendations.length > 2 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">All Recommendations</h4>
                <div className="space-y-3">
                  {insight.recommendations.slice(2).map((rec, idx) => (
                    <div key={idx + 2} className="p-4 bg-white border rounded-lg">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <Badge className={getPriorityColor(rec.priority)} size="sm">
                              {rec.priority}
                            </Badge>
                            <span className="font-medium text-gray-900">{rec.title}</span>
                          </div>
                          <p className="text-gray-600">{rec.description}</p>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {rec.effort} effort
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 pt-3 border-t text-sm">
                        <div>
                          <span className="font-medium text-gray-900">Timeline:</span>
                          <span className="ml-2 text-gray-600">{rec.timeline}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-900">Effort:</span>
                          <span className="ml-2 text-gray-600">{rec.effort}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Evidence Summary */}
            {evidenceCount > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 mb-3">Evidence Summary</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 bg-blue-50 rounded-lg">
                    <h5 className="font-medium text-blue-900 mb-2">Confidence</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Overall Confidence:</span>
                        <span className="font-medium">{confidencePercentage}%</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Evidence Count:</span>
                        <span className="font-medium">{evidenceCount}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="p-4 bg-green-50 rounded-lg">
                    <h5 className="font-medium text-green-900 mb-2">Source Details</h5>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span>Cluster Size:</span>
                        <span className="font-medium">{insight.evidence?.sourceCluster?.size || 0}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Theme:</span>
                        <span className="font-medium">{insight.evidence?.sourceCluster?.theme || 'N/A'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        {showActions && (
          <div className="flex gap-2 pt-4 border-t">
            {expandable && (
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                <Eye className="h-4 w-4 mr-2" />
                {isExpanded ? 'Show Less' : 'View Details'}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => handleActionClick('export', e)}
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={(e) => handleActionClick('share', e)}
            >
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
