import { NextRequest, NextResponse } from 'next/server';
import { adyenPaymentService } from '@/lib/adyen-payment-service';
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
    } catch (error) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, pspReference } = body;

    if (!bookingId || !pspReference) {
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

    // Handle payment result
    const result = await adyenPaymentService.handlePaymentResult(bookingId, pspReference);

    if (result.success) {
      return NextResponse.json({
        success: true,
        paymentId: result.paymentId,
        pspReference: result.pspReference,
      });
    } else {
      return NextResponse.json({
        success: false,
        error: result.error,
      }, { status: 400 });
    }
  } catch (error) {
    console.error('GCash payment result handling error:', error);
    
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
        errorMessage = 'Invalid payment verification request';
        statusCode = 400;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}
