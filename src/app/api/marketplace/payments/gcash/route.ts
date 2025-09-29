import { NextRequest, NextResponse } from 'next/server';
import { AdyenPaymentService } from '@/lib/adyen-payment-service';
import { PaymentConfig } from '@/lib/payment-config';
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
    const { orderId, amount, currency, returnUrl, userId } = body;

    if (!orderId || !amount || !currency || !returnUrl || !userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Missing required fields'
        },
        { status: 400 }
      );
    }

    // Verify user owns this order
    if (userInfo.uid !== userId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Access denied'
        },
        { status: 403 }
      );
    }

    // Initialize Adyen service
    const adyenService = new AdyenPaymentService();
    const paymentConfig = new PaymentConfig();

    // Create GCash payment session
    const paymentSession = await adyenService.createGCashPayment({
      amount: {
        currency: currency,
        value: Math.round(amount * 100) // Convert to cents
      },
      reference: `marketplace_${orderId}`,
      returnUrl: returnUrl,
      merchantAccount: paymentConfig.adyen.merchantAccount,
      metadata: {
        orderId: orderId,
        userId: userId,
        type: 'marketplace'
      }
    });

    return NextResponse.json({
      success: true,
      transactionId: paymentSession.pspReference,
      paymentUrl: paymentSession.paymentUrl
    });
  } catch (error) {
    console.error('Error processing GCash payment:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to process GCash payment'
      },
      { status: 500 }
    );
  }
}
