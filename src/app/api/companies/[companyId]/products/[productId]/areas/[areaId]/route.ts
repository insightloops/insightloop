import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'
import { ProductAreaRepository } from '@/lib/repositories/ProductAreaRepository'
import { ProductRepository } from '@/lib/repositories/ProductRepository'
import { supabase } from '@/lib/supabase'

const productAreaRepository = new ProductAreaRepository(supabase)
const productRepository = new ProductRepository(supabase)

async function handleGET(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string; areaId: string }> }
) {
  try {
    const { companyId, productId, areaId } = await context.params

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

    // Fetch the product area
    const productArea = await productAreaRepository.findById(areaId)
    if (!productArea) {
      return NextResponse.json(
        { error: 'Product area not found' },
        { status: 404 }
      )
    }

    // Verify the product area belongs to the specified product
    if (productArea.product_id !== productId) {
      return NextResponse.json(
        { error: 'Product area not found' },
        { status: 404 }
      )
    }

    return NextResponse.json({ product_area: productArea })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product area' },
      { status: 500 }
    )
  }
}

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string; areaId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) =>
    handleGET(authRequest, context)
  )(request)
}
