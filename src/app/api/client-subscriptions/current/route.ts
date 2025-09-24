import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-utils';
import { clientSubscriptionService } from '@/lib/client-subscription-service';

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const decodedToken = await verifyIdToken(token);
    
    if (!decodedToken || decodedToken.role !== 'client') {
      return NextResponse.json(
        { success: false, error: 'Client access required' },
        { status: 403 }
      );
    }

    const subscription = await clientSubscriptionService.getClientSubscription(decodedToken.uid);
    
    return NextResponse.json({
      success: true,
      subscription
    });
  } catch (error) {
    console.error('Error fetching client subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}
