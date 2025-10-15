import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/lib/paypal-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal capture order API called');
    
    // Check if PayPal is configured
    if (!PayPalService.isConfigured()) {
      console.error('PayPal is not configured');
      return NextResponse.json(
        { success: false, error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { orderId, bookingId } = body;

    console.log('PayPal capture order request:', { orderId, bookingId });

    if (!orderId) {
      console.error('Missing required fields:', { orderId });
      return NextResponse.json(
        { success: false, error: 'Missing required field: orderId' },
        { status: 400 }
      );
    }

    // Capture PayPal order
    console.log('Capturing PayPal order:', orderId);
    const paypalService = new PayPalService();
    const captureResult = await paypalService.captureOrder(orderId);

    console.log('PayPal capture result:', captureResult);

    if (!captureResult.success) {
      console.error('PayPal order capture failed:', captureResult.error);
      return NextResponse.json(
        { success: false, error: captureResult.error || 'Failed to capture PayPal order' },
        { status: 500 }
      );
    }

    // Update booking with payment details if bookingId is provided
    if (bookingId) {
      const db = adminDb;
      const bookingRef = db.collection('bookings').doc(bookingId);
      const bookingDoc = await bookingRef.get();

      if (bookingDoc.exists) {
        await bookingRef.update({
          paymentStatus: 'paid',
          paymentMethod: 'paypal',
          paymentId: captureResult.transactionId,
          paidAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
          paypalTransactionId: captureResult.transactionId,
          paypalPayerEmail: captureResult.payerEmail,
        });
        console.log('Booking updated with payment details:', bookingId);
      }
    }

    console.log('PayPal order captured successfully:', captureResult.transactionId);

    return NextResponse.json({
      success: true,
      data: {
        transactionId: captureResult.transactionId,
        payerEmail: captureResult.payerEmail,
        amount: captureResult.amount,
        currency: captureResult.currency,
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('PayPal capture order error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
