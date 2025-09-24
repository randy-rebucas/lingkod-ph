import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';
import { UpdateSubscriptionInput } from '@/lib/subscription-types';

export async function PUT(request: NextRequest) {
  try {
    const authResult = await verifyAuthToken(request);
    if (!authResult.success) {
      return NextResponse.json(
        { success: false, message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { userId } = authResult;
    const body = await request.json();
    
    const input: UpdateSubscriptionInput = {
      autoRenew: body.autoRenew,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference
    };

    // Get current subscription
    const currentSubscription = await subscriptionService.getCurrentSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { success: false, message: 'No active subscription found' },
        { status: 404 }
      );
    }

    await subscriptionService.updateSubscription(userId, input);
    
    return NextResponse.json({
      success: true,
      message: 'Subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
