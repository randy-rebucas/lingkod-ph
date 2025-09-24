import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';
import { TrackClientUsageInput } from '@/lib/client-subscription-types';

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
    
    const { feature, amount, metadata } = body;
    
    if (!feature) {
      return NextResponse.json(
        {
          success: false,
          message: 'Feature parameter is required'
        },
        { status: 400 }
      );
    }

    const input: TrackClientUsageInput = {
      feature,
      amount: amount || 1,
      metadata
    };

    await clientSubscriptionService.trackUsage(userId, input);
    
    return NextResponse.json({
      success: true,
      message: 'Client usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking client usage:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to track client usage',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
