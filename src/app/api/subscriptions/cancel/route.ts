import { NextRequest, NextResponse } from 'next/server';
import { paypalSubscriptionService } from '@/lib/paypal-subscription-service';
import { updateUserSubscription } from '@/app/(app)/subscription/actions';
import { z } from 'zod';

const CancelSubscriptionSchema = z.object({
  subscriptionId: z.string().min(1, 'Subscription ID is required'),
  userId: z.string().min(1, 'User ID is required'),
  reason: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.json();
    const validatedData = CancelSubscriptionSchema.parse(body);

    // Cancel PayPal subscription
    const cancelResult = await paypalSubscriptionService.cancelSubscription(
      validatedData.subscriptionId,
      validatedData.reason || 'User requested cancellation'
    );

    if (!cancelResult.success) {
      return NextResponse.json(
        { error: cancelResult.error || 'Failed to cancel subscription' },
        { status: 400 }
      );
    }

    // Update user subscription to free plan
    const updateResult = await updateUserSubscription(validatedData.userId, {
      planId: 'free',
      planName: 'Free',
      price: 0,
      period: 'month',
    });

    if (!updateResult.success) {
      console.error('Failed to update user subscription after cancellation:', updateResult.error);
      // Don't fail the request since PayPal cancellation succeeded
    }

    return NextResponse.json({
      success: true,
      message: 'Subscription cancelled successfully',
    });
  } catch (error) {
    console.error('Error cancelling subscription:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
