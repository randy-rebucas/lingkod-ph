import { NextRequest, NextResponse } from 'next/server';
import { ProductServiceServer } from '@/lib/marketplace/product-service-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { productId: string } }
) {
  try {
    const { productId } = params;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required'
        },
        { status: 400 }
      );
    }

    const product = await ProductServiceServer.getProduct(productId);

    if (!product) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product not found'
        },
        { status: 404 }
      );
    }

    // Get related products
    const relatedProducts = await ProductServiceServer.getRelatedProducts(productId, 4);

    return NextResponse.json({
      success: true,
      data: {
        product,
        relatedProducts
      }
    });
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch product'
      },
      { status: 500 }
    );
  }
}
