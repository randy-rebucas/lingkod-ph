import { NextRequest, NextResponse } from 'next/server';
import { clientSubscriptionService } from '@/lib/client-subscription-service';

export async function GET(request: NextRequest) {
  try {
    const plans = await clientSubscriptionService.getPlans();
    
    return NextResponse.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error fetching client subscription plans:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to fetch client subscription plans',
        error: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
