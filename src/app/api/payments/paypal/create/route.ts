import { NextRequest, NextResponse } from 'next/server';
import { PayPalPaymentService } from '@/lib/paypal-payment-service';
import { getDb } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal create payment API called');
    
    // Check if PayPal is configured
    if (!PayPalPaymentService.isConfigured()) {
      console.error('PayPal is not configured');
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { bookingId, returnUrl, cancelUrl } = body;

    console.log('PayPal create payment request:', { bookingId, returnUrl, cancelUrl });

    if (!bookingId || !returnUrl || !cancelUrl) {
      console.error('Missing required fields:', { bookingId, returnUrl, cancelUrl });
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
      clientId: bookingData.clientId || 'unknown',
      serviceName: bookingData.serviceName || 'Service',
      returnUrl,
      cancelUrl,
    };

    // Create PayPal order
    console.log('Creating PayPal order with request:', paymentRequest);
    const paypalService = new PayPalPaymentService();
    const orderResult = await paypalService.createOrder(paymentRequest, db);

    console.log('PayPal order result:', orderResult);

    if (!orderResult.success) {
      console.error('PayPal order creation failed:', orderResult.error);
      return NextResponse.json(
        { error: orderResult.error || 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // Update booking with PayPal order ID
    await updateDoc(bookingRef, {
      paypalOrderId: orderResult.orderId,
      paymentMethod: 'paypal',
      updatedAt: serverTimestamp(),
    });

    console.log('PayPal order created successfully:', orderResult.orderId);

    return NextResponse.json({
      success: true,
      data: {
        orderId: orderResult.orderId,
        approvalUrl: orderResult.approvalUrl,
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
