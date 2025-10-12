import { NextRequest, NextResponse } from 'next/server';
import { MayaCheckoutService } from '@/lib/maya-checkout-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const checkoutId = searchParams.get('checkoutId');

    if (!checkoutId) {
      return NextResponse.json(
        { success: false, error: 'Checkout ID is required' },
        { status: 400 }
      );
    }

    const mayaService = new MayaCheckoutService();
    const result = await mayaService.getPaymentStatus(checkoutId);

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error getting Maya payment status:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
