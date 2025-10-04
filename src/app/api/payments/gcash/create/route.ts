import { NextRequest, NextResponse } from 'next/server';
import { adyenPaymentService } from '@/shared/payments/adyen-payment-service';
import { adminDb as db } from '@/shared/db/server';
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
    const { bookingId, returnUrl } = body;

    if (!bookingId || !returnUrl) {
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

    // Check if booking is in correct state for payment
    if (bookingData?.status !== 'Pending Payment') {
      return NextResponse.json({ error: 'Booking is not in pending payment state' }, { status: 400 });
    }

    // Create GCash payment
    const paymentRequest = {
      amount: bookingData.price,
      currency: 'PHP',
      reference: `booking_${bookingId}_${Date.now()}`,
      returnUrl,
      bookingId,
      clientId: decodedToken.uid,
      serviceName: bookingData.serviceName,
    };

    const result = await adyenPaymentService.createGCashPayment(paymentRequest);

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentId: result.paymentId,
        redirectUrl: result.redirectUrl,
        pspReference: result.pspReference,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('GCash payment creation error:', error);
    
    let errorMessage = 'Internal server error';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('Adyen')) {
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
