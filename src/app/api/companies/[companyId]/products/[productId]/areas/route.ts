import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository'
import { ProductRepository } from '@/lib/repositories/ProductRepository'
import { supabase } from '@/lib/supabase'

const productAreaRepository = new ProductAreaRepository(supabase)
const productRepository = new ProductRepository(supabase)

async function handleGET(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  try {
    const { companyId, productId } = await context.params
    const { searchParams } = new URL(request.url)
    const hierarchical = searchParams.get('hierarchical') === 'true'

    // First verify the product exists and belongs to the company
    const product = await productRepository.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Fetch product areas
    const productAreas = hierarchical
      ? await productAreaRepository.findHierarchical({ product_id: productId })
      : await productAreaRepository.findByProductId(productId)

    return NextResponse.json({ product_areas: productAreas })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product areas' },
      { status: 500 }
    )
  }
}

async function handlePOST(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  try {
    const { companyId, productId } = await context.params
    const body = await request.json()

    // First verify the product exists and belongs to the company
    const product = await productRepository.findById(productId)
    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    if (product.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Validate required fields
    if (!body.name) {
      return NextResponse.json(
        { error: 'Product area name is required' },
        { status: 400 }
      )
    }

    // Create the product area
    const productArea = await productAreaRepository.create({
      name: body.name,
      product_id: productId, // Use the productId from the URL
      description: body.description,
      parent_area_id: body.parent_area_id,
      keywords: body.keywords,
      metadata: body.metadata,
      user_id: request.userId
    })

    return NextResponse.json({ product_area: productArea }, { status: 201 })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to create product area' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) =>
    handleGET(authRequest, context)
  )(request)
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) =>
    handlePOST(authRequest, context)
  )(request)
}
