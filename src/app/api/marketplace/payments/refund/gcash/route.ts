import { NextRequest, NextResponse } from 'next/server';
import { AdyenPaymentService } from '@/lib/adyen-payment-service';
import { verifyTokenAndGetRole } from '@/lib/auth-utils';

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
    const { orderId, originalTransactionId, amount, reason } = body;

    if (!orderId || !originalTransactionId || !amount) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Initialize Adyen service
    const adyenService = new AdyenPaymentService();

    // Process refund with Adyen
    const refundResult = await adyenService.processRefund({
      originalReference: originalTransactionId,
      amount: {
        currency: 'PHP',
        value: Math.round(amount * 100)
      },
      reference: `refund_${orderId}_${Date.now()}`
    });

    return NextResponse.json({
      success: refundResult.success,
      transactionId: refundResult.pspReference,
      error: refundResult.error
    });
  } catch (error) {
    console.error('Error processing GCash refund:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process refund'
      },
      { status: 500 }
    );
  }
}
