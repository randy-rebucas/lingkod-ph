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
    const { orderId, transactionId } = body;

    if (!orderId || !transactionId) {
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

    // Verify payment with Adyen
    const verificationResult = await adyenService.verifyPayment(transactionId);

    return NextResponse.json({
      success: verificationResult.success,
      status: verificationResult.success ? 'paid' : 'failed',
      error: verificationResult.error
    });
  } catch (error) {
    console.error('Error verifying GCash payment:', error);
    return NextResponse.json(
      {
        success: false,
        status: 'failed',
        error: 'Failed to verify payment'
      },
      { status: 500 }
    );
  }
}
