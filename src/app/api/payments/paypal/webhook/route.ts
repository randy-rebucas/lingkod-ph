import { NextRequest, NextResponse } from 'next/server';
// import { paypalPaymentService } from '@/lib/paypal-payment-service';
// import crypto from 'crypto';

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
  _authAlgo: string,
  _transmissionId: string,
  _transmissionTime: string
): boolean {
  try {
    // In production, implement proper PayPal webhook verification
    // For now, we'll do basic validation
    const expectedCertId = process.env.PAYPAL_WEBHOOK_CERT_ID;
    if (expectedCertId && certId !== expectedCertId) {
      return false;
    }

    // Additional validation can be added here
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

    console.log(`Processing PayPal webhook event: ${eventType}`);

    switch (eventType) {
      case 'PAYMENT.CAPTURE.COMPLETED':
        // Payment was successfully captured
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment completed for booking: ${bookingId}`);
          // Additional processing can be added here
        }
        break;

      case 'PAYMENT.CAPTURE.DENIED':
        // Payment was denied
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment denied for booking: ${bookingId}`);
          // Handle payment denial
        }
        break;

      case 'PAYMENT.CAPTURE.REFUNDED':
        // Payment was refunded
        if (resource?.custom_id) {
          const bookingId = resource.custom_id;
          console.log(`Payment refunded for booking: ${bookingId}`);
          // Handle refund
        }
        break;

      // Subscription events
      case 'BILLING.SUBSCRIPTION.ACTIVATED':
      case 'BILLING.SUBSCRIPTION.CANCELLED':
      case 'BILLING.SUBSCRIPTION.SUSPENDED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.COMPLETED':
      case 'BILLING.SUBSCRIPTION.PAYMENT.FAILED':
      case 'BILLING.SUBSCRIPTION.EXPIRED':
        // Forward subscription events to subscription webhook handler
        try {
          const subscriptionWebhookUrl = `${request.nextUrl.origin}/api/subscriptions/webhook`;
          await fetch(subscriptionWebhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'paypal-transmission-sig': request.headers.get('paypal-transmission-sig') || '',
              'paypal-cert-id': request.headers.get('paypal-cert-id') || '',
              'paypal-auth-algo': request.headers.get('paypal-auth-algo') || '',
              'paypal-transmission-id': request.headers.get('paypal-transmission-id') || '',
              'paypal-transmission-time': request.headers.get('paypal-transmission-time') || '',
            },
            body: JSON.stringify(webhookEvent),
          });
        } catch (error) {
          console.error('Error forwarding subscription webhook:', error);
        }
        break;

      default:
        console.log(`Unhandled PayPal webhook event type: ${eventType}`);
    }
  } catch (error) {
    console.error('Error processing PayPal webhook event:', error);
  }
}
