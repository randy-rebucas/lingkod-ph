import { NextRequest, NextResponse } from 'next/server';
import { paypalPaymentService } from '@/lib/paypal-payment-service';
import { adminDb as db } from '@/lib/firebase-admin';
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
    } catch {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, orderId } = body;

    if (!bookingId || !orderId) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Verify booking exists and belongs to user
    const bookingDoc = await db.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const bookingData = bookingDoc.data();
    if (bookingData?.clientId !== decodedToken.uid) {
      return NextResponse.json({ error: 'Unauthorized access to booking' }, { status: 403 });
    }

    // Verify PayPal order exists and belongs to this booking
    const orderDoc = await db.collection('paypalOrders').doc(bookingId).get();
    if (!orderDoc.exists) {
      return NextResponse.json({ error: 'PayPal order not found' }, { status: 404 });
    }

    const orderData = orderDoc.data();
    if (orderData?.orderId !== orderId) {
      return NextResponse.json({ error: 'Invalid PayPal order' }, { status: 400 });
    }

    // Capture PayPal payment
    const result = await paypalPaymentService.captureOrder(orderId, bookingId, db);

    if (result.success) {
      return NextResponse.json({
        success: true,
        transactionId: result.transactionId,
        payerEmail: result.payerEmail,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('PayPal payment capture error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('PayPal')) {
        errorMessage = 'Payment service temporarily unavailable';
        statusCode = 503;
      } else if (error.message.includes('network') || error.message.includes('fetch')) {
        errorMessage = 'Network error. Please try again.';
        statusCode = 503;
      } else if (error.message.includes('validation')) {
        errorMessage = 'Invalid payment request';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
