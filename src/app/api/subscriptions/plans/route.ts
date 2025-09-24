import { NextResponse } from 'next/server';
import { subscriptionService } from '@/lib/subscription-service';

export async function GET() {
  try {
    // Get all available subscription plans
    const plans = await subscriptionService.getSubscriptionPlans();

    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Get subscription plans error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
