import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';

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
    
    await clientSubscriptionService.cancelSubscription(userId);
    
    return NextResponse.json({
      success: true,
      message: 'Client subscription cancelled successfully'
    });
  } catch (error) {
    console.error('Error cancelling client subscription:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to cancel client subscription',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
