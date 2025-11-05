import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { InsightService } from '@/lib/services/InsightService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string; insightId: string }> }
) {
  try {
    const { companyId, insightId } = await params
    const insightService = new InsightService(supabase)
    const insight = await insightService.getInsightWithEvidence(insightId)

    if (!insight) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    // Verify the insight belongs to the company
    if (insight.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: insight })
  } catch (error) {
    console.error('Error fetching insight:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insight' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { companyId: string; insightId: string } }
) {
  try {
    const body = await request.json()
    const { insight_score, urgency_score, volume_score, value_alignment_score, status } = body

    const insightService = new InsightService(supabase)

    const scores: any = {}
    if (insight_score !== undefined) scores.insight_score = insight_score
    if (urgency_score !== undefined) scores.urgency_score = urgency_score
    if (volume_score !== undefined) scores.volume_score = volume_score
    if (value_alignment_score !== undefined) scores.value_alignment_score = value_alignment_score
    if (status !== undefined) scores.status = status

    const updatedInsight = await insightService.updateInsightScore(params.insightId, scores)

    // Verify the insight belongs to the company
    if (updatedInsight.company_id !== params.companyId) {
      return NextResponse.json(
        { error: 'Insight not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ data: updatedInsight })
  } catch (error) {
    console.error('Error updating insight:', error)
    return NextResponse.json(
      { error: 'Failed to update insight' },
      { status: 500 }
    )
  }
}
