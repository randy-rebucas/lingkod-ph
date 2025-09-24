import { NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';

export async function GET() {
  try {
    const plans = await clientSubscriptionService.getClientSubscriptionPlans();
    
    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching client subscription plans:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
