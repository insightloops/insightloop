import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProductService } from '@/lib/services/ProductService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get('company_id');

    const productService = new ProductService(supabase);
    const products = await productService.getAllProducts(companyId || undefined);

    return NextResponse.json({ products });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.company_id) {
      return NextResponse.json(
        { error: 'Product name and company ID are required' },
        { status: 400 }
      );
    }

    const productService = new ProductService(supabase);
    const product = await productService.createProduct({
      name: body.name,
      company_id: body.company_id,
      description: body.description,
      metadata: body.metadata
    });

    return NextResponse.json({ product }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product' },
      { status: 500 }
    );
  }
}
