import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '@/lib/services/FeatureService'

const featureService = new FeatureService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')

    if (!companyId) {
      return NextResponse.json({ error: 'company_id is required' }, { status: 400 })
    }

    const metrics = await featureService.getFeatureMetrics(companyId)
    return NextResponse.json(metrics)
  } catch (error: any) {
    console.error('Error fetching feature metrics:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
