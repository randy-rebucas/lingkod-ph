import { NextRequest, NextResponse } from 'next/server';
import { ProductServiceServer } from '@/lib/marketplace/product-service-server';

export async function GET(request: NextRequest) {
  try {
    const categories = await ProductServiceServer.getCategories();
    const brands = await ProductServiceServer.getBrands();

    return NextResponse.json({
      success: true,
      data: {
        categories,
        brands
      }
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch categories'
      },
      { status: 500 }
    );
  }
}
