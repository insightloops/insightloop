import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { InsightService } from '@/lib/services/InsightService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const { searchParams } = new URL(request.url)
    const theme = searchParams.getAll('theme')
    const status = searchParams.getAll('status')
    const minScore = searchParams.get('min_score')
    const maxScore = searchParams.get('max_score')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const insightService = new InsightService(supabase)

    const filters: any = {}
    if (theme.length) filters.theme = theme
    if (status.length) filters.status = status
    if (minScore) filters.min_score = parseFloat(minScore)
    if (maxScore) filters.max_score = parseFloat(maxScore)

    const result = await insightService.getInsightsByCompany(
      companyId,
      filters,
      { page, limit }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching insights:', error)
    return NextResponse.json(
      { error: 'Failed to fetch insights' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const { theme, options } = await request.json()
    
    const insightService = new InsightService(supabase)

    const insights = await insightService.generateInsightsFromFeedback(
      companyId,
      options
    )

    return NextResponse.json({
      message: `Successfully generated ${insights.length} insights`,
      data: insights
    }, { status: 201 })
  } catch (error) {
    console.error('Error generating insights:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to generate insights' },
      { status: 500 }
    )
  }
}
