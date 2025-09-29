import { NextRequest, NextResponse } from 'next/server';
import { OrderServiceServer } from '@/lib/marketplace/order-service-server';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    const { orderId } = params;

    const order = await OrderServiceServer.getOrder(orderId);

    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Check if user owns this order or is admin
    if (order.userId !== userInfo.uid && userInfo.role !== 'admin') {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied'
        },
        { status: 403 }
      );
    }

    const tracking = await OrderServiceServer.getOrderTracking(orderId);

    return NextResponse.json({
      success: true,
      data: {
        order,
        tracking
      }
    });
  } catch (error) {
    console.error('Error fetching order:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch order'
      },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { orderId: string } }
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

    const { orderId } = params;
    const body = await request.json();
    const { action, ...data } = body;

    const order = await OrderServiceServer.getOrder(orderId);
    if (!order) {
      return NextResponse.json(
        {
          success: false,
          error: 'Order not found'
        },
        { status: 404 }
      );
    }

    // Check if user owns this order
    if (order.userId !== userInfo.uid) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied'
        },
        { status: 403 }
      );
    }

    switch (action) {
      case 'cancel':
        await OrderServiceServer.cancelOrder(orderId, data.reason);
        break;
      case 'update_shipping':
        await OrderServiceServer.updateShipping(orderId, data.trackingNumber, data.estimatedDelivery);
        break;
      default:
        return NextResponse.json(
          {
            success: false,
            error: 'Invalid action'
          },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      message: 'Order updated successfully'
    });
  } catch (error) {
    console.error('Error updating order:', error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update order'
      },
      { status: 500 }
    );
  }
}
