import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '@/lib/services/FeatureService'

const featureService = new FeatureService()

export async function PATCH(request: NextRequest) {
  try {
    const { action, feature_ids, value } = await request.json()

    if (!feature_ids || !Array.isArray(feature_ids) || feature_ids.length === 0) {
      return NextResponse.json({ error: 'feature_ids array is required' }, { status: 400 })
    }

    let features
    if (action === 'bulk_update_status') {
      features = await featureService.bulkUpdateFeatureStatus(feature_ids, value)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(features)
  } catch (error: any) {
    console.error('Error performing bulk operation:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
