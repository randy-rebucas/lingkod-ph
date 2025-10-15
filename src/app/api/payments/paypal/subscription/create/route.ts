import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/lib/paypal-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal create subscription API called');
    
    // Check if PayPal is configured
    if (!PayPalService.isConfigured()) {
      console.error('PayPal is not configured');
      return NextResponse.json(
        { success: false, error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { planId, planName, amount, billingCycle, returnUrl, cancelUrl } = body;

    console.log('PayPal create subscription request:', { planId, planName, amount, billingCycle });

    if (!planId || !planName || !amount || !billingCycle || !returnUrl || !cancelUrl) {
      console.error('Missing required fields:', { planId, planName, amount, billingCycle, returnUrl, cancelUrl });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: planId, planName, amount, billingCycle, returnUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Create PayPal subscription payment request
    const subscriptionRequest = {
      planId,
      planName,
      amount: parseFloat(amount),
      billingCycle: billingCycle as 'monthly' | 'yearly',
      returnUrl,
      cancelUrl,
    };

    // Create PayPal subscription order
    console.log('Creating PayPal subscription order with request:', subscriptionRequest);
    const paypalService = new PayPalService();
    const orderResult = await paypalService.createSubscriptionPayment(subscriptionRequest);

    console.log('PayPal subscription order result:', orderResult);

    if (!orderResult.success) {
      console.error('PayPal subscription order creation failed:', orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error || 'Failed to create PayPal subscription order' },
        { status: 500 }
      );
    }

    // Store subscription order in database
    const db = adminDb;
    const subscriptionRef = db.collection('subscriptions').doc();
    await subscriptionRef.set({
      planId,
      planName,
      amount: parseFloat(amount),
      billingCycle,
      paypalOrderId: orderResult.orderId,
      status: 'pending',
      createdAt: FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    });

    console.log('PayPal subscription order created successfully:', orderResult.orderId);

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        approvalUrl: orderResult.approvalUrl,
        subscriptionId: subscriptionRef.id,
      },
    });
  } catch (error) {
    console.error('PayPal create subscription error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}