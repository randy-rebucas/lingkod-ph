import { NextRequest, NextResponse } from 'next/server';
import { CartServiceServer } from '@/lib/marketplace/cart-service-server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

export async function PUT(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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

    const { itemId } = params;
    const body = await request.json();
    const { quantity } = body;

    if (quantity === undefined || quantity < 0) {
      return NextResponse.json(
        {
          success: false,
          error: 'Valid quantity is required'
        },
        { status: 400 }
      );
    }

    await CartServiceServer.updateCartItemQuantity(userInfo.uid, itemId, quantity);

    return NextResponse.json({
      success: true,
      message: 'Cart item updated successfully'
    });
  } catch (error) {
    console.error('Error updating cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update cart item'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { itemId: string } }
) {
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

    const { itemId } = params;

    await CartServiceServer.removeFromCart(userInfo.uid, itemId);

    return NextResponse.json({
      success: true,
      message: 'Item removed from cart successfully'
    });
  } catch (error) {
    console.error('Error removing cart item:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to remove cart item'
      },
      { status: 500 }
    );
  }
}
