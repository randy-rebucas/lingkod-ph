import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';
import { verifyAuthToken } from '@/lib/auth-utils';
import { TrackUsageInput } from '@/lib/subscription-types';

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

    const input: TrackUsageInput = {
      feature,
      amount: amount || 1,
      metadata
    };

    await subscriptionService.trackUsage(userId, input);
    
    return NextResponse.json({
      success: true,
      message: 'Usage tracked successfully'
    });
  } catch (error) {
    console.error('Error tracking usage:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to track usage',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
