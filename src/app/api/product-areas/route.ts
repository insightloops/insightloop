import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { ProductAreaService } from '@/lib/services/ProductAreaService';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const productId = searchParams.get('product_id');
    const hierarchical = searchParams.get('hierarchical') === 'true';

    const productAreaService = new ProductAreaService(supabase);
    
    const filters = productId ? { product_id: productId } : {};
    
    const productAreas = hierarchical 
      ? await productAreaService.getProductAreasHierarchical(filters)
      : await productAreaService.getAllProductAreas(filters);

    return NextResponse.json({ product_areas: productAreas });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch product areas' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.name || !body.product_id) {
      return NextResponse.json(
        { error: 'Product area name and product ID are required' },
        { status: 400 }
      );
    }

    const productAreaService = new ProductAreaService(supabase);
    const productArea = await productAreaService.createProductArea({
      name: body.name,
      product_id: body.product_id,
      description: body.description,
      parent_area_id: body.parent_area_id,
      keywords: body.keywords,
      metadata: body.metadata
    });

    return NextResponse.json({ product_area: productArea }, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create product area' },
      { status: 500 }
    );
  }
}
