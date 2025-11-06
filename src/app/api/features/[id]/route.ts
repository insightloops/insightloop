import { NextRequest, NextResponse } from 'next/server'
import { FeatureService } from '@/lib/services/FeatureService'

const featureService = new FeatureService()

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { searchParams } = new URL(request.url)
    const withInsights = searchParams.get('with_insights') === 'true'

    let feature
    if (withInsights) {
      feature = await featureService.getFeatureWithInsights(resolvedParams.id)
    } else {
      feature = await featureService.getFeature(resolvedParams.id)
    }

    if (!feature) {
      return NextResponse.json({ error: 'Feature not found' }, { status: 404 })
    }

    return NextResponse.json(feature)
  } catch (error: any) {
    console.error('Error fetching feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const updates = await request.json()
    const feature = await featureService.updateFeature(resolvedParams.id, updates)
    return NextResponse.json(feature)
  } catch (error: any) {
    console.error('Error updating feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    const { action, value } = await request.json()

    let feature
    if (action === 'update_status') {
      feature = await featureService.updateFeatureStatus(resolvedParams.id, value)
    } else if (action === 'update_priority') {
      feature = await featureService.updateFeaturePriority(resolvedParams.id, value)
    } else {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json(feature)
  } catch (error: any) {
    console.error('Error updating feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    await featureService.deleteFeature(resolvedParams.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting feature:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
