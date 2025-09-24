import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { subscriptionService } from '@/lib/subscription-service';
import { SUBSCRIPTION_FEATURES } from '@/lib/subscription-types';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    
    // Verify token
    const decodedToken = await getAuth().verifyIdToken(token);
    const userId = decodedToken.uid;

    // Parse request body
    const body = await request.json();
    const { feature } = body;

    // Validate feature
    if (!feature || !Object.values(SUBSCRIPTION_FEATURES).includes(feature)) {
      return NextResponse.json(
        { success: false, error: 'Invalid feature' },
        { status: 400 }
      );
    }

    // Check feature access
    const access = await subscriptionService.checkFeatureAccess(userId, feature);

    return NextResponse.json({
      success: true,
      hasAccess: access.hasAccess,
      remainingUsage: access.remainingUsage,
      limit: access.limit
    });
  } catch (error) {
    console.error('Feature access check error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
