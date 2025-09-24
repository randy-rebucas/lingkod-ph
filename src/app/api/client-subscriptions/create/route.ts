import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';
import { CreateClientSubscriptionInput } from '@/lib/client-subscription-types';

export async function POST(request: NextRequest) {
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
    
    // Validate required fields
    const { planId, paymentMethod, amount, startTrial } = body;
    
    if (!planId || !paymentMethod || amount === undefined) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: planId, paymentMethod, amount'
        },
        { status: 400 }
      );
    }

    const input: CreateClientSubscriptionInput = {
      planId,
      paymentMethod,
      amount,
      startTrial: startTrial || false
    };

    const subscription = await clientSubscriptionService.createSubscription(userId, input);
    
    return NextResponse.json({
      success: true,
      subscription,
      message: startTrial ? 'Trial started successfully' : 'Subscription created successfully'
    });
  } catch (error) {
    console.error('Error creating client subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to create client subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
