import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'

async function handleGET(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await context.params

    const { data: products, error } = await supabase
      .from('products')
      .select('*')
      .eq('company_id', companyId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to fetch products' },
        { status: 500 }
      )
    }

    return NextResponse.json(products)
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

async function handlePOST(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  try {
    const { companyId } = await context.params
    const body = await request.json()
    const { name, type, description } = body

    if (!name) {
      return NextResponse.json(
        { error: 'Product name is required' },
        { status: 400 }
      )
    }



    // Verify company exists
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('id')
      .eq('id', companyId)
      .single()

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found' },
        { status: 404 }
      )
    }

    const { data: product, error } = await supabase
      .from('products')
      .insert([
        {
          company_id: companyId,
          name,
          description: description || null,
          metadata: type ? { type } : null,
          user_id: request.userId,
        },
      ])
      .select()
      .single()

    if (error) {
      console.error('Database error:', error)
      return NextResponse.json(
        { error: 'Failed to create product' },
        { status: 500 }
      )
    }

    return NextResponse.json(product, { status: 201 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// Export authenticated handlers
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) => 
    handleGET(authRequest, context)
  )(request)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) => 
    handlePOST(authRequest, context)
  )(request)
}
