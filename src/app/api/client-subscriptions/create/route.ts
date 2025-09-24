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
    const { planId, paymentMethod, paymentReference, amount } = body;

    if (!planId || !paymentMethod || !paymentReference || !amount) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const result = await clientSubscriptionService.createClientSubscription(
      decodedToken.uid,
      planId,
      {
        paymentMethod,
        paymentReference,
        amount
      }
    );

    if (result.success) {
      return NextResponse.json({
        success: true,
        subscriptionId: result.subscriptionId
      });
    } else {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 400 }
      );
    }
  } catch (error) {
    console.error('Error creating client subscription:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}
