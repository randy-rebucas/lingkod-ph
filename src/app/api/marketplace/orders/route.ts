import { NextRequest, NextResponse } from 'next/server';
import { OrderServiceServer } from '@/lib/marketplace/order-service-server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';
import { ShippingAddress } from '@/lib/marketplace/types';

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

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') as any;
    const limit = parseInt(searchParams.get('limit') || '20');

    const orders = await OrderServiceServer.getUserOrders(userInfo.uid, status, limit);
    const statistics = await OrderServiceServer.getOrderStatistics(userInfo.uid);

    return NextResponse.json({
      success: true,
      data: {
        orders,
        statistics
      }
    });
  } catch (error) {
    console.error('Error fetching orders:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch orders'
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

    // Check if user role is provider or agency
    if (!['provider', 'agency'].includes(userInfo.role)) {
      return NextResponse.json(
        {
          success: false,
          error: 'Only providers and agencies can place orders'
        },
        { status: 403 }
      );
    }

    const body = await request.json();
    const { shippingAddress, paymentMethod } = body;

    if (!shippingAddress || !paymentMethod) {
      return NextResponse.json(
        {
          success: false,
          error: 'Shipping address and payment method are required'
        },
        { status: 400 }
      );
    }

    // Validate shipping address
    const requiredFields = ['street', 'city', 'province', 'postalCode'];
    for (const field of requiredFields) {
      if (!shippingAddress[field]) {
        return NextResponse.json(
          {
            success: false,
            error: `Shipping address ${field} is required`
          },
          { status: 400 }
        );
      }
    }

    const order = await OrderServiceServer.createOrder(
      userInfo.uid,
      userInfo.role as 'provider' | 'agency',
      shippingAddress as ShippingAddress,
      paymentMethod
    );

    return NextResponse.json({
      success: true,
      data: order,
      message: 'Order created successfully'
    });
  } catch (error) {
    console.error('Error creating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to create order'
      },
      { status: 500 }
    );
  }
}
