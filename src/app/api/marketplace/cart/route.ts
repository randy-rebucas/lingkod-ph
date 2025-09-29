import { NextRequest, NextResponse } from 'next/server';
import { CartServiceServer } from '@/lib/marketplace/cart-service-server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const userInfo = await verifyTokenAndGetRole(token);
    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token'
        },
        { status: 401 }
      );
    }

    const cart = await CartServiceServer.getCart(userInfo.uid);
    const totals = await CartServiceServer.calculateCartTotals(userInfo.uid);

    return NextResponse.json({
      success: true,
      data: {
        cart,
        totals
      }
    });
  } catch (error) {
    console.error('Error fetching cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch cart'
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('authorization')?.replace('Bearer ', '');
    
    if (!token) {
      return NextResponse.json(
        {
          success: false,
          error: 'Authentication required'
        },
        { status: 401 }
      );
    }

    const userInfo = await verifyTokenAndGetRole(token);
    if (!userInfo) {
      return NextResponse.json(
        {
          success: false,
          error: 'Invalid token'
        },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { productId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Product ID is required'
        },
        { status: 400 }
      );
    }

    await CartServiceServer.addToCart(userInfo.uid, productId, quantity);

    return NextResponse.json({
      success: true,
      message: 'Item added to cart successfully'
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to add item to cart'
      },
      { status: 500 }
    );
  }
}
