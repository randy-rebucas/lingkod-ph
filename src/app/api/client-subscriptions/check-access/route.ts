import { NextRequest, NextResponse } from 'next/server';
import { verifyIdToken } from '@/lib/auth-utils';
import { clientSubscriptionService } from '@/lib/client-subscription-service';

export async function POST(request: NextRequest) {
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

    const body = await request.json();
    const { feature } = body;

    if (!feature) {
      return NextResponse.json(
        { success: false, error: 'Feature parameter required' },
        { status: 400 }
      );
    }

    const access = await clientSubscriptionService.checkClientFeatureAccess(
      decodedToken.uid,
      feature
    );

    return NextResponse.json({
      success: true,
      hasAccess: access.hasAccess,
      remainingUsage: access.remainingUsage,
      limit: access.limit
    });
  } catch (error) {
    console.error('Error checking client feature access:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check feature access' },
      { status: 500 }
    );
  }
}
