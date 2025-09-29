import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionServiceServer } from '@/lib/marketplace/subscription-service-server';

export async function GET(
  request: NextRequest,
  { params }: { params: { kitId: string } }
) {
  try {
    const { kitId } = params;

    if (!kitId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Kit ID is required'
        },
        { status: 400 }
      );
    }

    const kit = await SubscriptionServiceServer.getSubscriptionKit(kitId);

    if (!kit) {
      return NextResponse.json(
        {
          success: false,
          error: 'Subscription kit not found'
        },
        { status: 404 }
      );
    }

    // Get detailed product information
    const productDetails = await SubscriptionService.getKitProductDetails(kit);
    const savings = SubscriptionService.calculateKitSavings(kit);

    return NextResponse.json({
      success: true,
      data: {
        kit,
        productDetails,
        savings
      }
    });
  } catch (error) {
    console.error('Error fetching subscription kit:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch subscription kit'
      },
      { status: 500 }
    );
  }
}
