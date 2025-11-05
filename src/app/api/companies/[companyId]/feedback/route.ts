import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { FeedbackService } from '@/lib/services/FeedbackService'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await params
    const { searchParams } = new URL(request.url)
    const source = searchParams.getAll('source')
    const sentiment = searchParams.getAll('sentiment')
    const productArea = searchParams.getAll('product_area')
    const dateFrom = searchParams.get('date_from')
    const dateTo = searchParams.get('date_to')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '20')

    const feedbackService = new FeedbackService(supabase)

    const filters: any = {}
    if (source.length) filters.source = source
    if (sentiment.length) filters.sentiment = sentiment
    if (productArea.length) filters.product_area = productArea
    if (dateFrom) filters.date_from = dateFrom
    if (dateTo) filters.date_to = dateTo

    const result = await feedbackService.getFeedbackByCompany(
      companyId,
      filters,
      { page, limit }
    )

    return NextResponse.json(result)
  } catch (error) {
    console.error('Error fetching feedback:', error)
    return NextResponse.json(
      { error: 'Failed to fetch feedback' },
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
    const formData = await request.formData()
    const file = formData.get('file') as File
    const contentColumn = formData.get('contentColumn') as string
    const sentimentColumn = formData.get('sentimentColumn') as string
    const productAreaColumn = formData.get('productAreaColumn') as string
    const submittedAtColumn = formData.get('submittedAtColumn') as string
    const userMetadataColumns = formData.getAll('userMetadataColumns') as string[]

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      )
    }

    if (!contentColumn) {
      return NextResponse.json(
        { error: 'Content column is required' },
        { status: 400 }
      )
    }

    // Read file content
    const csvContent = await file.text()

    const feedbackService = new FeedbackService(supabase)
    
    const mapping = {
      contentColumn,
      sentimentColumn: sentimentColumn || undefined,
      productAreaColumn: productAreaColumn || undefined,
      submittedAtColumn: submittedAtColumn || undefined,
      userMetadataColumns: userMetadataColumns.length ? userMetadataColumns : undefined
    }

    const feedbackItems = await feedbackService.uploadCSVFeedback(
      companyId,
      csvContent,
      mapping
    )

    return NextResponse.json({
      message: `Successfully uploaded ${feedbackItems.length} feedback items`,
      data: feedbackItems
    }, { status: 201 })
  } catch (error) {
    console.error('Error uploading feedback:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to upload feedback' },
      { status: 500 }
    )
  }
}
