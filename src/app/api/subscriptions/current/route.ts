import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
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
    const subscription = await subscriptionService.getCurrentSubscription(userId);
    
    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching current subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch current subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
