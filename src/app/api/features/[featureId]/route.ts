import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { withAuth, AuthenticatedRequest } from '@/lib/middleware/auth'

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ featureId: string }> }
) {
  return withAuth(request, async (authRequest: AuthenticatedRequest) => {
    try {
      const { featureId } = await context.params

      const { data: feature, error } = await supabase
        .from('features')
        .select('*')
        .eq('id', featureId)
        .eq('user_id', authRequest.userId)
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Feature not found' },
          { status: 404 }
        )
      }

      return NextResponse.json(feature)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ featureId: string }> }
) {
  return withAuth(request, async (authRequest: AuthenticatedRequest) => {
    try {
      const { featureId } = await context.params
      const body = await authRequest.json()

      const { data: feature, error } = await supabase
        .from('features')
        .update(body)
        .eq('id', featureId)
        .eq('user_id', authRequest.userId)
        .select()
        .single()

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to update feature' },
          { status: 500 }
        )
      }

      return NextResponse.json(feature)
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ featureId: string }> }
) {
  return withAuth(request, async (authRequest: AuthenticatedRequest) => {
    try {
      const { featureId } = await context.params

      const { error } = await supabase
        .from('features')
        .delete()
        .eq('id', featureId)
        .eq('user_id', authRequest.userId)

      if (error) {
        console.error('Database error:', error)
        return NextResponse.json(
          { error: 'Failed to delete feature' },
          { status: 500 }
        )
      }

      return NextResponse.json({ success: true })
    } catch (error) {
      console.error('Unexpected error:', error)
      return NextResponse.json(
        { error: 'Internal server error' },
        { status: 500 }
      )
    }
  })
}
