import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '@/lib/services/FeatureService'
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'

const featureService = new FeatureService()

async function handleGET(request: AuthenticatedRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const companyId = searchParams.get('company_id')
    const productAreaId = searchParams.get('product_area_id')
    const status = searchParams.get('status')
    const priority = searchParams.get('priority')
    const format = searchParams.get('format') // 'roadmap' for roadmap view
    const assigned = searchParams.get('assigned') // 'me' for user's assigned features

    // Get user's assigned features
    if (assigned === 'me') {
      const features = await featureService.getAssignedFeatures(request.userId)
      return NextResponse.json(features)
    }

    // Get roadmap view
    if (format === 'roadmap' && companyId) {
      const roadmap = await featureService.getRoadmap(companyId, request.userId)
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

async function handlePOST(request: AuthenticatedRequest) {
  try {
    const featureData = await request.json()
    const feature = await featureService.createFeature({
      ...featureData,
      userId: request.userId
    })
    return NextResponse.json(feature, { status: 201 })
  } catch (error: any) {
    console.error('Error creating feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// Export authenticated handlers
export const GET = createAuthenticatedHandler(handleGET);
export const POST = createAuthenticatedHandler(handlePOST);
