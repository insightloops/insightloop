import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '../../../../lib/services/FeatureService'

const featureService = new FeatureService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    
    // Parse search parameters
    const searchOptions = {
      query: searchParams.get('q') || undefined,
      companyId: searchParams.get('company_id') || undefined,
      productId: searchParams.get('product_id') || undefined,
      productAreaId: searchParams.get('product_area_id') || undefined,
      status: searchParams.get('status')?.split(',') || undefined,
      priority: searchParams.get('priority')?.split(',') || undefined,
      effortScoreMin: searchParams.get('effort_score_min') ? 
        parseInt(searchParams.get('effort_score_min')!) : undefined,
      effortScoreMax: searchParams.get('effort_score_max') ? 
        parseInt(searchParams.get('effort_score_max')!) : undefined,
      businessValueMin: searchParams.get('business_value_min') ? 
        parseInt(searchParams.get('business_value_min')!) : undefined,
      businessValueMax: searchParams.get('business_value_max') ? 
        parseInt(searchParams.get('business_value_max')!) : undefined,
      createdAfter: searchParams.get('created_after') || undefined,
      createdBefore: searchParams.get('created_before') || undefined,
      limit: searchParams.get('limit') ? 
        parseInt(searchParams.get('limit')!) : 50,
      offset: searchParams.get('offset') ? 
        parseInt(searchParams.get('offset')!) : 0
    }

    // Validate limit
    if (searchOptions.limit > 100) {
      searchOptions.limit = 100
    }

    const result = await featureService.searchFeatures(searchOptions)

    return NextResponse.json({
      features: result.features,
      total: result.total,
      limit: searchOptions.limit,
      offset: searchOptions.offset,
      hasMore: result.total > (searchOptions.offset + searchOptions.limit)
    })

  } catch (error: any) {
    console.error('Search features error:', error)
    return NextResponse.json(
      { error: 'Failed to search features', details: error.message },
      { status: 500 }
    )
  }
}
