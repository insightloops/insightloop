import { supabase } from '@/lib/supabase'
import { NextRequest, NextResponse } from 'next/server'
import { createAuthenticatedHandler, AuthenticatedRequest } from '@/lib/middleware/auth'
import { ProductRepository } from '@/lib/repositories/ProductRepository'

const productRepository = new ProductRepository(supabase)

async function handleGET(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  try {
    const { companyId, productId } = await context.params

    const product = await productRepository.findById(productId)

    if (!product) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    // Verify the product belongs to the specified company
    if (product.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    return NextResponse.json(product)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch product' },
      { status: 500 }
    )
  }
}

async function handlePUT(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  try {
    const { companyId, productId } = await context.params
    const updateData = await request.json()

    // First verify the product exists and belongs to the company
    const existingProduct = await productRepository.findById(productId)
    
    if (!existingProduct || existingProduct.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    const updatedProduct = await productRepository.update(productId, {
      name: updateData.name,
      description: updateData.description,
      updated_at: new Date().toISOString()
    })

    return NextResponse.json(updatedProduct)
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to update product' },
      { status: 500 }
    )
  }
}

async function handleDELETE(
  request: AuthenticatedRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  try {
    const { companyId, productId } = await context.params

    // First verify the product exists and belongs to the company
    const existingProduct = await productRepository.findById(productId)
    
    if (!existingProduct || existingProduct.company_id !== companyId) {
      return NextResponse.json(
        { error: 'Product not found' },
        { status: 404 }
      )
    }

    await productRepository.delete(productId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('API error:', error)
    return NextResponse.json(
      { error: 'Failed to delete product' },
      { status: 500 }
    )
  }
}

// Export authenticated handlers
export async function GET(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) => 
    handleGET(authRequest, context)
  )(request)
}

export async function PUT(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) => 
    handlePUT(authRequest, context)
  )(request)
}

export async function DELETE(
  request: NextRequest,
  context: { params: Promise<{ companyId: string; productId: string }> }
) {
  return createAuthenticatedHandler((authRequest: AuthenticatedRequest) => 
    handleDELETE(authRequest, context)
  )(request)
}
