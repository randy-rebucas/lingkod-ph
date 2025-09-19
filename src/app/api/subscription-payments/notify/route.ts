import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionNotificationService } from '@/lib/subscription-notifications';
import { getAuth } from 'firebase-admin/auth';

export async function POST(request: NextRequest) {
  try {
    // Get authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Missing or invalid authorization header' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    // Verify Firebase token
    let decodedToken;
    try {
      decodedToken = await getAuth().verifyIdToken(token);
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { type, paymentData } = body;

    if (!type || !paymentData) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Send notification based on type
    switch (type) {
      case 'payment_submitted':
        await SubscriptionNotificationService.sendPaymentSubmittedNotification(paymentData);
        break;
      case 'payment_verified':
        await SubscriptionNotificationService.sendPaymentVerifiedNotification(paymentData);
        break;
      case 'payment_rejected':
        await SubscriptionNotificationService.sendPaymentRejectedNotification(paymentData);
        break;
      case 'admin_notification':
        await SubscriptionNotificationService.sendAdminNotification(paymentData);
        break;
      default:
        return NextResponse.json({ error: 'Invalid notification type' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Notification API error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
