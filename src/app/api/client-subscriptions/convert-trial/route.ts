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
    const body = await request.json();
    
    const { paymentMethod, paymentReference } = body;
    
    if (!paymentMethod || !paymentReference) {
      return NextResponse.json(
        {
          success: false,
          message: 'Missing required fields: paymentMethod, paymentReference'
        },
        { status: 400 }
      );
    }

    const subscription = await clientSubscriptionService.convertTrialToPaid(
      userId, 
      paymentMethod, 
      paymentReference
    );
    
    return NextResponse.json({
      success: true,
      subscription,
      message: 'Client trial converted to paid subscription successfully'
    });
  } catch (error) {
    console.error('Error converting client trial:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to convert client trial',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
