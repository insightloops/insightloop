'use client'

import { useEffect } from 'react'
import { useInsightWithEvidence } from '@/hooks'
import { Insight, FeedbackItem } from '@/types/database'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface EvidenceModalProps {
  isOpen: boolean
  onClose: () => void
  insight: Insight | null
  companyId: string
}

function FeedbackCard({ feedback }: { feedback: FeedbackItem }) {
  const getSentimentColor = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return 'text-green-600 bg-green-100 dark:text-green-400 dark:bg-green-900/20'
      case 'negative':
        return 'text-red-600 bg-red-100 dark:text-red-400 dark:bg-red-900/20'
      case 'neutral':
        return 'text-muted-foreground bg-muted'
      default:
        return 'text-muted-foreground bg-muted'
    }
  }

  const getSentimentIcon = (sentiment: string | null) => {
    switch (sentiment) {
      case 'positive':
        return '😊'
      case 'negative':
        return '😞'
      case 'neutral':
        return '😐'
      default:
        return '❓'
    }
  }

  return (
    <Card className="bg-muted/30">
      <CardContent className="p-4 space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-muted-foreground">
              {feedback.source}
            </span>
            {feedback.product_area && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-sm text-primary">
                  {feedback.product_area}
                </span>
              </>
            )}
          </div>
          {feedback.sentiment && (
            <div className={`flex items-center px-2 py-1 rounded-full text-xs font-medium ${getSentimentColor(feedback.sentiment)}`}>
              <span className="mr-1">{getSentimentIcon(feedback.sentiment)}</span>
              {feedback.sentiment}
            </div>
          )}
        </div>

        {/* Content */}
        <blockquote className="text-foreground italic">
          "{feedback.content}"
        </blockquote>

        {/* Metadata */}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <span>
            {feedback.submitted_at 
              ? new Date(feedback.submitted_at).toLocaleDateString()
              : 'Date not available'
            }
          </span>
          {feedback.user_metadata && Object.keys(feedback.user_metadata).length > 0 && (
            <div className="flex items-center space-x-2">
              {feedback.user_metadata.user_type && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary rounded text-xs">
                  {feedback.user_metadata.user_type}
                </span>
              )}
              {feedback.user_metadata.plan && (
                <span className="px-2 py-0.5 bg-secondary text-secondary-foreground rounded text-xs">
                  {feedback.user_metadata.plan}
                </span>
              )}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

export function EvidenceModal({ isOpen, onClose, insight, companyId }: EvidenceModalProps) {
  const { insight: insightWithEvidence, loading, error } = useInsightWithEvidence(
    companyId, 
    insight?.id || ''
  )

  const getScoreColor = (score: number) => {
    if (score >= 0.8) return 'text-green-600 dark:text-green-400'
    if (score >= 0.6) return 'text-yellow-600 dark:text-yellow-400'
    return 'text-red-600 dark:text-red-400'
  }

  if (!insight) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="text-xl">
            {insight.title}
          </DialogTitle>
          <div className="flex items-center space-x-4 mt-2">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-primary/10 text-primary">
              {insight.theme}
            </span>
            <div className={`text-sm font-medium ${getScoreColor(insight.insight_score)}`}>
              {Math.round(insight.insight_score * 100)}% Insight Score
            </div>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-140px)] space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-medium mb-2">Summary</h3>
            <p className="text-muted-foreground">{insight.summary}</p>
          </div>

          {/* Scores Grid */}
          <Card className="bg-muted/50">
            <CardContent className="p-4">
              <div className="grid grid-cols-4 gap-4">
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(insight.insight_score)}`}>
                    {Math.round(insight.insight_score * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Insight Score</div>
                </div>
                <div className="text-center">
                  <div className={`text-2xl font-bold ${getScoreColor(insight.urgency_score)}`}>
                    {Math.round(insight.urgency_score * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Urgency</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-primary">
                    {Math.round(insight.volume_score * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Volume</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-secondary-foreground">
                    {Math.round(insight.value_alignment_score * 100)}%
                  </div>
                  <div className="text-sm text-muted-foreground">Alignment</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Segment Context */}
          {insight.segment_context && Object.keys(insight.segment_context).length > 0 && (
            <div>
              <h3 className="text-lg font-medium mb-3">Segment Context</h3>
              <Card className="border-primary bg-primary/5">
                <CardContent className="p-4">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    {insight.segment_context.primary_segment && (
                      <div>
                        <span className="font-medium text-primary">Primary Segment:</span>
                        <div className="text-primary/80">{insight.segment_context.primary_segment}</div>
                      </div>
                    )}
                    {insight.segment_context.plans && (
                      <div>
                        <span className="font-medium text-primary">Plans:</span>
                        <div className="text-primary/80">{insight.segment_context.plans.join(', ')}</div>
                      </div>
                    )}
                    {insight.segment_context.company_sizes && (
                      <div>
                        <span className="font-medium text-primary">Company Sizes:</span>
                        <div className="text-primary/80">{insight.segment_context.company_sizes.join(', ')}</div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Evidence */}
          <div>
            <h3 className="text-lg font-medium mb-4">
              Supporting Evidence
              {insightWithEvidence?.feedback_items && (
                <span className="text-sm font-normal text-muted-foreground ml-2">
                  ({insightWithEvidence.feedback_items.length} feedback items)
                </span>
              )}
            </h3>

            {loading && (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-4">
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-1/4"></div>
                        <div className="h-4 bg-muted rounded w-full"></div>
                        <div className="h-4 bg-muted rounded w-3/4"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {error && (
              <Card className="border-destructive bg-destructive/5">
                <CardContent className="p-4">
                  <p className="text-sm text-destructive">{error}</p>
                </CardContent>
              </Card>
            )}

            {insightWithEvidence?.feedback_items && insightWithEvidence.feedback_items.length > 0 && (
              <div className="space-y-4">
                {insightWithEvidence.feedback_items.map((feedback: FeedbackItem) => (
                  <FeedbackCard key={feedback.id} feedback={feedback} />
                ))}
              </div>
            )}

            {insightWithEvidence && (!insightWithEvidence.feedback_items || insightWithEvidence.feedback_items.length === 0) && !loading && (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="mx-auto w-12 h-12 text-muted-foreground mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-muted-foreground">No supporting evidence found for this insight.</p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
