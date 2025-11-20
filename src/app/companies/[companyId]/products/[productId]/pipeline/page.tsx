/**
 * Enhanced AI Pipeline Page
 * 
 * A comprehensive, production-ready interface for feedback upload and enhanced pipeline execution
 * featuring real-time progress tracking, enriched feedback analysis, semantic clustering, 
 * actionable business insights, and interactive exploration capabilities with drill-down details.
 * 
 * Features:
 * - Enriched Feedback: Original feedback + AI enrichment metadata + LLM call details
 * - Semantic Clusters: Grouped feedback with themes and sentiment analysis
 * - Business Insights: Actionable insights with severity levels and user impact metrics
 * - Real-time Progress: Live SSE event streaming with detailed stage tracking
 * - Interactive UI: Expandable sections, detail modals, and comprehensive result views
 */

'use client'

import React from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import { EnhancedPipelineExecutor } from '@/components/EnhancedPipelineExecutor'

export default function ProductFeedbackPipelinePage() {
  const params = useParams()
  const companyId = params.companyId as string
  const productId = params.productId as string

  const handlePipelineComplete = (results: any) => {
    console.log('Enhanced Pipeline completed with results:', results)
    // You can add additional completion logic here:
    // - Show success notification
    // - Navigate to results page
    // - Trigger analytics events
    // - Update application state
  }

  return (
    <div className="container mx-auto py-8 px-4 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/companies/${companyId}/products/${productId}`}>
          <Button variant="ghost" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product
          </Button>
        </Link>
      </div>

      {/* Enhanced Pipeline Executor Component */}
      <EnhancedPipelineExecutor 
        companyId={companyId} 
        productId={productId}
        onComplete={handlePipelineComplete}
      />
    </div>
  )
}
