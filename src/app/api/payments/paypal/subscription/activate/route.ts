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
    const { subscriptionId, token, baToken, planId } = body;

    if (!subscriptionId || !token || !planId) {
      return NextResponse.json(
        { error: 'Missing required fields: subscriptionId, token, planId' },
        { status: 400 }
      );
    }

    // Activate PayPal subscription
    const paypalService = new PayPalPaymentService();
    const activationResult = await paypalService.activateSubscription(subscriptionId, token, baToken, getDb());

    if (!activationResult.success) {
      return NextResponse.json(
        { error: activationResult.error || 'Failed to activate PayPal subscription' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: {
        subscriptionId: activationResult.data?.id,
        status: activationResult.data?.status,
      },
    });
  } catch (error) {
    console.error('PayPal subscription activation error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
