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
    const { bookingId, returnUrl, cancelUrl } = body;

    if (!bookingId || !returnUrl || !cancelUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: bookingId, returnUrl, cancelUrl' },
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
    
    // Create PayPal payment request
    const paymentRequest = {
      bookingId,
      amount: bookingData.price || 0,
      currency: 'PHP',
      serviceName: bookingData.serviceName || 'Service',
      returnUrl,
      cancelUrl,
    };

    // Create PayPal order
    const paypalService = new PayPalPaymentService();
    const orderResult = await paypalService.createOrder(paymentRequest, db);

    if (!orderResult.success) {
      return NextResponse.json(
        { error: orderResult.error || 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // Update booking with PayPal order ID
    await updateDoc(bookingRef, {
      paypalOrderId: orderResult.data?.id,
      paymentMethod: 'paypal',
      updatedAt: serverTimestamp(),
    });

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.data?.id,
        approvalUrl: orderResult.data?.approvalUrl,
        status: orderResult.data?.status,
      },
    });
  } catch (error) {
    console.error('PayPal create order error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
