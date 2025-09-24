import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';
import { UpdateClientSubscriptionInput } from '@/lib/client-subscription-types';

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
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found' },
        { status: 400 }
      );
    }
    const body = await request.json();
    
    const input: UpdateClientSubscriptionInput = {
      autoRenew: body.autoRenew,
      paymentMethod: body.paymentMethod,
      paymentReference: body.paymentReference
    };

    // Get current subscription
    const currentSubscription = await clientSubscriptionService.getCurrentSubscription(userId);
    if (!currentSubscription) {
      return NextResponse.json(
        { success: false, message: 'No active subscription found' },
        { status: 404 }
      );
    }

    await clientSubscriptionService.updateSubscription(userId, input);
    
    return NextResponse.json({
      success: true,
      message: 'Client subscription updated successfully'
    });
  } catch (error) {
    console.error('Error updating client subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to update client subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
