import { NextRequest, NextResponse } from 'next/server';
import { paypalSubscriptionService } from '@/lib/paypal-subscription-service';
import { updateUserSubscription } from '@/app/(app)/subscription/actions';
import { z } from 'zod';

const CreateSubscriptionSchema = z.object({
  planId: z.string().min(1, 'Plan ID is required'),
  planName: z.string().min(1, 'Plan name is required'),
  price: z.number().min(0, 'Price must be positive'),
  currency: z.string().default('PHP'),
  userId: z.string().min(1, 'User ID is required'),
  userEmail: z.string().email('Valid email is required'),
});

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.json();
    const validatedData = CreateSubscriptionSchema.parse(body);

    // Create PayPal subscription
    const returnUrl = `${request.nextUrl.origin}/subscription/success?plan=${validatedData.planId}`;
    const cancelUrl = `${request.nextUrl.origin}/subscription?cancelled=true`;

    const subscriptionResult = await paypalSubscriptionService.createSubscription({
      planId: validatedData.planId,
      planName: validatedData.planName,
      price: validatedData.price,
      currency: validatedData.currency,
      userId: validatedData.userId,
      userEmail: validatedData.userEmail,
      returnUrl,
      cancelUrl,
    });

    if (!subscriptionResult.success) {
      return NextResponse.json(
        { error: subscriptionResult.error || 'Failed to create subscription' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      subscriptionId: subscriptionResult.subscriptionId,
      approvalUrl: subscriptionResult.approvalUrl,
    });
  } catch (error) {
    console.error('Error creating subscription:', error);
    
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
