import { NextRequest, NextResponse } from 'next/server';
import { PayPalService } from '@/lib/paypal-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal create order API called');
    
    // Check if PayPal is configured
    if (!PayPalService.isConfigured()) {
      console.error('PayPal is not configured');
      return NextResponse.json(
        { success: false, error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    const body = await request.json();
    const { bookingId, returnUrl, cancelUrl } = body;

    console.log('PayPal create order request:', { bookingId, returnUrl, cancelUrl });

    if (!bookingId || !returnUrl || !cancelUrl) {
      console.error('Missing required fields:', { bookingId, returnUrl, cancelUrl });
      return NextResponse.json(
        { success: false, error: 'Missing required fields: bookingId, returnUrl, cancelUrl' },
        { status: 400 }
      );
    }

    // Get booking details from database
    const db = adminDb;
    const bookingRef = db.collection('bookings').doc(bookingId);
    const bookingDoc = await bookingRef.get();

    if (!bookingDoc.exists) {
      return NextResponse.json(
        { success: false, error: 'Booking not found' },
        { status: 404 }
      );
    }

    const bookingData = bookingDoc.data();
    
    // Create PayPal order request
    const orderRequest = {
      amount: bookingData?.price || 0,
      currency: 'PHP',
      description: `Payment for ${bookingData?.serviceName || 'Service'}`,
      returnUrl,
      cancelUrl,
      customId: bookingId,
      referenceId: `booking_${bookingId}`,
    };

    // Create PayPal order
    console.log('Creating PayPal order with request:', orderRequest);
    const paypalService = new PayPalService();
    const orderResult = await paypalService.createOrder(orderRequest);

    console.log('PayPal order result:', orderResult);

    if (!orderResult.success) {
      console.error('PayPal order creation failed:', orderResult.error);
      return NextResponse.json(
        { success: false, error: orderResult.error || 'Failed to create PayPal order' },
        { status: 500 }
      );
    }

    // Update booking with PayPal order ID
    await bookingRef.update({
      paypalOrderId: orderResult.orderId,
      paymentMethod: 'paypal',
      updatedAt: FieldValue.serverTimestamp(),
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
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
