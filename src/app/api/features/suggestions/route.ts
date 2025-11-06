import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '../../../../lib/services/FeatureService'

const featureService = new FeatureService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    const query = searchParams.get('q')
    const companyId = searchParams.get('company_id') || undefined
    const limit = searchParams.get('limit') ? 
      Math.min(parseInt(searchParams.get('limit')!), 10) : 5

    if (!query || query.trim().length < 2) {
      return NextResponse.json({ suggestions: [] })
    }

    const suggestions = await featureService.getSearchSuggestions(query, companyId, limit)

    return NextResponse.json({ suggestions })

  } catch (error: any) {
    console.error('Get search suggestions error:', error)
    return NextResponse.json(
      { error: 'Failed to get search suggestions', details: error.message },
      { status: 500 }
    )
  }
}
