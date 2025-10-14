import { NextRequest, NextResponse } from 'next/server';
import { PayPalPaymentService } from '@/lib/paypal-payment-service';
import { getDb } from '@/lib/firebase-admin';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if PayPal is configured
    if (!process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID || !process.env.PAYPAL_CLIENT_SECRET) {
      console.error('PayPal not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.text();
    const signature = request.headers.get('paypal-transmission-sig');
    const certId = request.headers.get('paypal-cert-id');
    const _authAlgo = request.headers.get('paypal-auth-algo');
    const _transmissionId = request.headers.get('paypal-transmission-id');
    const _transmissionTime = request.headers.get('paypal-transmission-time');
    
    if (!signature || !certId || !_authAlgo || !_transmissionId || !_transmissionTime) {
      console.error('Missing PayPal webhook headers');
      return NextResponse.json({ error: 'Missing required headers' }, { status: 400 });
    }

    // Verify webhook signature (simplified - in production, use PayPal's webhook verification)
    const isValidSignature = verifyWebhookSignature(body, signature, certId, _authAlgo, _transmissionId, _transmissionTime);
    if (!isValidSignature) {
      console.error('Invalid PayPal webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const webhookEvent = JSON.parse(body);
    
    // Process webhook event
    await processWebhookEvent(webhookEvent);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('PayPal webhook processing error:', error);
    return NextResponse.json({ error: 'Webhook processing failed' }, { status: 500 });
  }
}

/**
 * Verify PayPal webhook signature
 * Note: This is a simplified version. In production, you should use PayPal's official webhook verification
 */
function verifyWebhookSignature(
  body: string,
  signature: string,
  certId: string,
  authAlgo: string,
  transmissionId: string,
  transmissionTime: string
): boolean {
  try {
    // In production, implement proper PayPal webhook verification
    // For now, we'll do basic validation
    const expectedCertId = process.env.PAYPAL_WEBHOOK_CERT_ID;
    if (expectedCertId && certId !== expectedCertId) {
      console.error('PayPal webhook cert ID mismatch');
      return false;
    }

    // Validate required headers
    if (!signature || !certId || !authAlgo || !transmissionId || !transmissionTime) {
      console.error('Missing required PayPal webhook headers');
      return false;
    }

    // In production, you should:
    // 1. Fetch PayPal's certificate using the certId
    // 2. Verify the signature using the certificate and the webhook data
    // 3. Validate the transmission timestamp (should be recent)
    
    // For now, we'll do basic validation
    const transmissionTimeMs = new Date(transmissionTime).getTime();
    const currentTimeMs = Date.now();
    const timeDiff = Math.abs(currentTimeMs - transmissionTimeMs);
    
    // Reject webhooks older than 5 minutes
    if (timeDiff > 5 * 60 * 1000) {
      console.error('PayPal webhook timestamp too old');
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error verifying PayPal webhook signature:', error);
    return false;
  }
}

/**
 * Process PayPal webhook event
 */
async function processWebhookEvent(webhookEvent: any) {
  try {
    const eventType = webhookEvent.event_type;
    const resource = webhookEvent.resource;
    const eventId = webhookEvent.id;

    console.log(`Processing PayPal webhook event: ${eventType} (ID: ${eventId})`);

    const db = getDb();

    // Store webhook event for audit trail
    try {
      await db.collection('paypalWebhookEvents').doc(eventId).set({
        eventType,
        eventId,
        resource,
        processedAt: new Date(),
        status: 'processing',
      });
    } catch (error) {
      console.error('Error storing webhook event:', error);
    }

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was successfully captured
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment completed for booking: ${bookingId}`);
          
          // Update booking status
          const bookingRef = doc(db, 'bookings', bookingId);
          await updateDoc(bookingRef, {
            paymentStatus: 'paid',
            paymentMethod: 'paypal',
            paymentId: resource.id,
            paidAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            paypalTransactionId: resource.id,
            paypalPayerEmail: resource.payer?.email_address,
          });

          // Send confirmation email or notification
          console.log(`Booking ${bookingId} payment confirmed via PayPal webhook`);
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Payment was denied
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment denied for booking: ${bookingId}`);
          
          // Update booking status
          const bookingRef = doc(db, 'bookings', bookingId);
          await updateDoc(bookingRef, {
            paymentStatus: 'failed',
            paymentMethod: 'paypal',
            updatedAt: serverTimestamp(),
            paymentError: 'Payment was denied by PayPal',
          });
        }
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment was refunded
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment refunded for booking: ${bookingId}`);
          
          // Update booking status
          const bookingRef = doc(db, 'bookings', bookingId);
          await updateDoc(bookingRef, {
            paymentStatus: 'refunded',
            paymentMethod: 'paypal',
            updatedAt: serverTimestamp(),
            refundedAt: serverTimestamp(),
            refundId: resource.id,
          });
        }
        break;

      case 'CHECKOUT.ORDER.APPROVED':
        // Order was approved by user
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`PayPal order approved for booking: ${bookingId}`);
          
          // Update booking with order approval
          const bookingRef = doc(db, 'bookings', bookingId);
          await updateDoc(bookingRef, {
            paypalOrderId: resource.id,
            paypalOrderStatus: 'approved',
            updatedAt: serverTimestamp(),
          });
        }
        break;

      default:
        console.log(`Unhandled PayPal webhook event type: ${eventType}`);
    }

    // Update webhook event status to completed
    try {
      await db.collection('paypalWebhookEvents').doc(eventId).update({
        status: 'completed',
        completedAt: new Date(),
      });
    } catch (error) {
      console.error('Error updating webhook event status:', error);
    }
  } catch (error) {
    console.error('Error processing PayPal webhook event:', error);
    
    // Update webhook event status to failed
    try {
      const db = getDb();
      await db.collection('paypalWebhookEvents').doc(webhookEvent.id).update({
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        failedAt: new Date(),
      });
    } catch (updateError) {
      console.error('Error updating failed webhook event status:', updateError);
    }
  }
}
