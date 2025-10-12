import { NextRequest, NextResponse } from 'next/server';
import { PayMayaAnalytics } from '@/lib/paymaya-analytics';

export async function POST(request: NextRequest) {
  try {
    const { startDate, endDate } = await request.json();

    if (!startDate || !endDate) {
      return NextResponse.json(
        { error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const metrics = await PayMayaAnalytics.getPaymentMetrics(
      new Date(startDate),
      new Date(endDate)
    );

    return NextResponse.json(metrics);
  } catch (error) {
    console.error('Error fetching PayMaya metrics:', error);
    return NextResponse.json(
      { error: 'Failed to fetch metrics' },
      { status: 500 }
    );
  }
}
