import { NextRequest, NextResponse } from 'next/server';
import { ProductServiceServer } from '@/lib/marketplace/product-service-server';
import { ProductFilters } from '@/lib/marketplace/types';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    
    // Extract query parameters
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const category = searchParams.get('category') || undefined;
    const subcategory = searchParams.get('subcategory') || undefined;
    const brand = searchParams.get('brand') ? searchParams.get('brand')!.split(',') : undefined;
    const minPrice = searchParams.get('minPrice') ? parseFloat(searchParams.get('minPrice')!) : undefined;
    const maxPrice = searchParams.get('maxPrice') ? parseFloat(searchParams.get('maxPrice')!) : undefined;
    const inStock = searchParams.get('inStock') === 'true';
    const isFeatured = searchParams.get('isFeatured') === 'true';
    const searchQuery = searchParams.get('search') || undefined;

    // Build filters
    const filters: ProductFilters = {
      category,
      subcategory,
      brand,
      inStock,
      isFeatured,
      searchQuery
    };

    if (minPrice !== undefined || maxPrice !== undefined) {
      filters.priceRange = {
        min: minPrice || 0,
        max: maxPrice || 999999
      };
    }

    // Fetch products
    const result = await ProductServiceServer.getProducts(filters, page, limit);

    return NextResponse.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch products'
      },
      { status: 500 }
    );
  }
}
