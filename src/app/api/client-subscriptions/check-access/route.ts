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
    if (!userId) {
      return NextResponse.json(
        { success: false, message: 'User ID not found' },
        { status: 400 }
      );
    }
    const body = await request.json();
    
    const { feature } = body;
    
    if (!feature) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feature parameter is required'
        },
        { status: 400 }
      );
    }

    const result = await clientSubscriptionService.checkFeatureAccess(userId, feature);
    
    return NextResponse.json({
      success: true,
      result
    });
  } catch (error) {
    console.error('Error checking client feature access:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to check client feature access',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
