import { NextRequest, NextResponse } from 'next/server';
import { PayPalService, PayPalWebhookEvent } from '@/lib/paypal-service';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    console.log('PayPal webhook received');
    
    // Check if PayPal is configured
    if (!PayPalService.isConfigured()) {
      console.error('PayPal is not configured');
      return NextResponse.json(
        { error: 'PayPal is not properly configured' },
        { status: 503 }
      );
    }

    // Get request body and headers
    const body = await request.text();
    const headers = Object.fromEntries(request.headers.entries());

    console.log('PayPal webhook headers:', headers);
    console.log('PayPal webhook body:', body);

    // Verify webhook signature
    const paypalService = new PayPalService();
    const isValidSignature = await paypalService.verifyWebhookSignature(headers, body);

    if (!isValidSignature) {
      console.error('Invalid PayPal webhook signature');
      return NextResponse.json(
        { error: 'Invalid webhook signature' },
        { status: 401 }
      );
    }

    // Parse webhook event
    let event: PayPalWebhookEvent;
    try {
      event = JSON.parse(body);
    } catch (error) {
      console.error('Failed to parse PayPal webhook body:', error);
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    console.log('Processing PayPal webhook event:', event.event_type);

    // Process the webhook event
    const processResult = await paypalService.processWebhookEvent(event);

    if (!processResult.success) {
      console.error('Failed to process PayPal webhook event:', processResult.error);
      return NextResponse.json(
        { error: processResult.error || 'Failed to process webhook event' },
        { status: 500 }
      );
    }

    // Handle specific event types
    await handleWebhookEvent(event);

    console.log('PayPal webhook processed successfully');
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('PayPal webhook error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleWebhookEvent(event: PayPalWebhookEvent) {
  const db = adminDb;

  try {
    switch (event.event_type) {
      case 'CHECKOUT.ORDER.APPROVED':
        await handleOrderApproved(event, db);
        break;

      case 'PAYMENT.CAPTURE.COMPLETED':
        await handlePaymentCaptured(event, db);
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        await handlePaymentDenied(event, db);
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        await handlePaymentRefunded(event, db);
        break;

      default:
        console.log('Unhandled PayPal webhook event type:', event.event_type);
    }
  } catch (error) {
    console.error('Error handling PayPal webhook event:', error);
  }
}

async function handleOrderApproved(event: PayPalWebhookEvent, db: any) {
  const orderId = event.resource?.id;
  console.log('Handling order approved:', orderId);

  // Update booking or subscription status
  if (orderId) {
    // Find booking by PayPal order ID
    const bookingsQuery = await db.collection('bookings')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!bookingsQuery.empty) {
      const bookingDoc = bookingsQuery.docs[0];
      await bookingDoc.ref.update({
        paypalStatus: 'approved',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated booking status to approved:', bookingDoc.id);
    }

    // Find subscription by PayPal order ID
    const subscriptionsQuery = await db.collection('subscriptions')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!subscriptionsQuery.empty) {
      const subscriptionDoc = subscriptionsQuery.docs[0];
      await subscriptionDoc.ref.update({
        paypalStatus: 'approved',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated subscription status to approved:', subscriptionDoc.id);
    }
  }
}

async function handlePaymentCaptured(event: PayPalWebhookEvent, db: any) {
  const captureId = event.resource?.id;
  const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
  console.log('Handling payment captured:', captureId, 'for order:', orderId);

  if (orderId) {
    // Find booking by PayPal order ID
    const bookingsQuery = await db.collection('bookings')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!bookingsQuery.empty) {
      const bookingDoc = bookingsQuery.docs[0];
      await bookingDoc.ref.update({
        paymentStatus: 'paid',
        paypalTransactionId: captureId,
        paypalStatus: 'captured',
        paidAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated booking payment status to paid:', bookingDoc.id);
    }

    // Find subscription by PayPal order ID
    const subscriptionsQuery = await db.collection('subscriptions')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!subscriptionsQuery.empty) {
      const subscriptionDoc = subscriptionsQuery.docs[0];
      await subscriptionDoc.ref.update({
        status: 'active',
        paypalTransactionId: captureId,
        paypalStatus: 'captured',
        activatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated subscription status to active:', subscriptionDoc.id);
    }
  }
}

async function handlePaymentDenied(event: PayPalWebhookEvent, db: any) {
  const captureId = event.resource?.id;
  const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
  console.log('Handling payment denied:', captureId, 'for order:', orderId);

  if (orderId) {
    // Update booking status
    const bookingsQuery = await db.collection('bookings')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!bookingsQuery.empty) {
      const bookingDoc = bookingsQuery.docs[0];
      await bookingDoc.ref.update({
        paymentStatus: 'failed',
        paypalStatus: 'denied',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated booking payment status to failed:', bookingDoc.id);
    }

    // Update subscription status
    const subscriptionsQuery = await db.collection('subscriptions')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!subscriptionsQuery.empty) {
      const subscriptionDoc = subscriptionsQuery.docs[0];
      await subscriptionDoc.ref.update({
        status: 'failed',
        paypalStatus: 'denied',
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated subscription status to failed:', subscriptionDoc.id);
    }
  }
}

async function handlePaymentRefunded(event: PayPalWebhookEvent, db: any) {
  const captureId = event.resource?.id;
  const orderId = event.resource?.supplementary_data?.related_ids?.order_id;
  console.log('Handling payment refunded:', captureId, 'for order:', orderId);

  if (orderId) {
    // Update booking status
    const bookingsQuery = await db.collection('bookings')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!bookingsQuery.empty) {
      const bookingDoc = bookingsQuery.docs[0];
      await bookingDoc.ref.update({
        paymentStatus: 'refunded',
        paypalStatus: 'refunded',
        refundedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated booking payment status to refunded:', bookingDoc.id);
    }

    // Update subscription status
    const subscriptionsQuery = await db.collection('subscriptions')
      .where('paypalOrderId', '==', orderId)
      .limit(1)
      .get();

    if (!subscriptionsQuery.empty) {
      const subscriptionDoc = subscriptionsQuery.docs[0];
      await subscriptionDoc.ref.update({
        status: 'cancelled',
        paypalStatus: 'refunded',
        cancelledAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      });
      console.log('Updated subscription status to cancelled:', subscriptionDoc.id);
    }
  }
}