import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';
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
    const subscription = await clientSubscriptionService.getCurrentSubscription(userId);
    
    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching current client subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch current client subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
