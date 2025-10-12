import { NextRequest, NextResponse } from 'next/server';
import { PayMayaAnalytics } from '@/lib/paymaya-analytics';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '50');

    const events = await PayMayaAnalytics.getRecentPaymentEvents(limit);

    return NextResponse.json(events);
  } catch (error) {
    console.error('Error fetching PayMaya events:', error);
    return NextResponse.json(
      { error: 'Failed to fetch events' },
      { status: 500 }
    );
  }
}
