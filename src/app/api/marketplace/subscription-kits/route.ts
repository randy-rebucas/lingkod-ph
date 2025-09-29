import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionServiceServer } from '@/lib/marketplace/subscription-service-server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const featured = searchParams.get('featured') === 'true';

    let kits;

    if (featured) {
      kits = await SubscriptionServiceServer.getFeaturedKits();
    } else if (category) {
      kits = await SubscriptionServiceServer.getKitsByCategory(category);
    } else {
      kits = await SubscriptionServiceServer.getSubscriptionKits();
    }

    return NextResponse.json({
      success: true,
      data: kits
    });
  } catch (error) {
    console.error('Error fetching subscription kits:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription kits'
      },
      { status: 500 }
    );
  }
}
