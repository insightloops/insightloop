import { NextRequest, NextResponse } from 'next/server'
import { ProductService } from '@/lib/services/ProductService'
import { supabase } from '@/lib/supabase'

const productService = new ProductService(supabase)

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    console.log('Product API params:', resolvedParams)
    console.log('Product ID:', resolvedParams.id)
    
    if (!resolvedParams.id) {
      return NextResponse.json({ error: 'Product ID is required' }, { status: 400 })
    }
    
    const product = await productService.getProductById(resolvedParams.id)
    
    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 })
    }

    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error fetching product:', error)
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
    const product = await productService.updateProduct(resolvedParams.id, updates)
    return NextResponse.json(product)
  } catch (error: any) {
    console.error('Error updating product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params
    await productService.deleteProduct(resolvedParams.id)
    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error deleting product:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
