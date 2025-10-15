import { NextRequest, NextResponse } from 'next/server';
import { PayPalPaymentService } from '@/lib/paypal-payment-service';
import { getDb } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!PayPalPaymentService.isConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { planId, planName, amount, billingCycle, returnUrl, cancelUrl } = body;

    if (!planId || !planName || !amount || !billingCycle || !returnUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: planId, planName, amount, billingCycle, returnUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Create PayPal subscription request
    const subscriptionRequest = {
      planId,
      planName,
      amount,
      billingCycle,
      returnUrl,
      cancelUrl,
    };

    // Create PayPal subscription
    const paypalService = new PayPalPaymentService();
    const subscriptionResult = await paypalService.createSubscription(subscriptionRequest, getDb());

    if (!subscriptionResult.success) {
      return NextResponse.json(
        { error: subscriptionResult.error || 'Failed to create PayPal subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: subscriptionResult.data?.id,
        approvalUrl: subscriptionResult.data?.approvalUrl,
      },
    });
  } catch (error) {
    console.error('PayPal subscription creation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
