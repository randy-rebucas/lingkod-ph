import { NextRequest, NextResponse } from 'next/server';
import { PayPalPaymentService } from '@/lib/paypal-payment-service';
import { getDb } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!PayPalPaymentService.isConfigured()) {
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { bookingId, orderId } = body;

    if (!bookingId || !orderId) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, orderId' },
        { status: 400 }
      );
    }

    // Get booking details from database
    const db = getDb();
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();

    // Capture PayPal payment
    const paypalService = new PayPalPaymentService();
    const captureResult = await paypalService.captureOrder(orderId, db);

    if (!captureResult.success) {
      return NextResponse.json(
        { error: captureResult.error || 'Failed to capture PayPal payment' },
        { status: 500 }
      );
    }

    // Update booking with payment details
    await updateDoc(bookingRef, {
      paymentStatus: 'paid',
      paymentMethod: 'paypal',
      paymentId: captureResult.data?.transactionId || orderId,
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      paypalTransactionId: captureResult.data?.transactionId,
      paypalPayerEmail: captureResult.data?.payerEmail,
    });

    return NextResponse.json({
      success: true,
      data: {
        transactionId: captureResult.data?.transactionId,
        payerEmail: captureResult.data?.payerEmail,
        amount: bookingData.price,
        currency: 'PHP',
        status: 'completed',
      },
    });
  } catch (error) {
    console.error('PayPal capture payment error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
