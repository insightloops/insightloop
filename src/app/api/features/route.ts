import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '@/lib/services/FeatureService'

const featureService = new FeatureService()

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const productAreaId = searchParams.get('product_area_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const format = searchParams.get('format') // 'roadmap' for roadmap view

    // Get roadmap view
    if (format === 'roadmap' && companyId) {
      const roadmap = await featureService.getRoadmap(companyId)
      return NextResponse.json(roadmap)
    }

    // Get features by different filters
    if (productAreaId) {
      const features = await featureService.getFeaturesByProductArea(productAreaId)
      return NextResponse.json(features)
    }

    if (status && companyId) {
      const features = await featureService.getFeaturesByStatus(status as any, companyId)
      return NextResponse.json(features)
    }

    if (priority && companyId) {
      const features = await featureService.getFeaturesByPriority(priority as any, companyId)
      return NextResponse.json(features)
    }

    if (companyId) {
      const features = await featureService.getFeatures(companyId)
      return NextResponse.json(features)
    }

    return NextResponse.json({ error: 'company_id or product_area_id is required' }, { status: 400 })
  } catch (error: any) {
    console.error('Error fetching features:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const featureData = await request.json()
    const feature = await featureService.createFeature(featureData)
    return NextResponse.json(feature, { status: 201 })
  } catch (error: any) {
    console.error('Error creating feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
