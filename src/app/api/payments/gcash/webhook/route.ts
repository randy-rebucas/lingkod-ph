import { NextRequest, NextResponse } from 'next/server';
import { adyenPaymentService } from '@/lib/adyen-payment-service';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    // Check if Adyen is configured
    if (!process.env.ADYEN_API_KEY || !process.env.ADYEN_MERCHANT_ACCOUNT) {
      console.error('Adyen not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.text();
    const signature = request.headers.get('adyen-signature');
    
    if (!signature) {
      console.error('Missing Adyen signature');
      return NextResponse.json({ error: 'Missing signature' }, { status: 400 });
    }

    // Verify webhook signature
    const isValidSignature = verifyWebhookSignature(body, signature);
    if (!isValidSignature) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
    }

    const notification = JSON.parse(body);
    
    // Process each notification item
    for (const notificationItem of notification.notificationItems) {
      const event = notificationItem.NotificationRequestItem;
      
      if (event.eventCode === 'AUTHORISATION') {
        if (event.success === 'true') {
          // Payment was successful
          const bookingId = event.merchantReference?.split('_')[1]; // Extract booking ID from reference
          if (bookingId) {
            await adyenPaymentService.handlePaymentResult(bookingId, event.pspReference);
          }
        } else {
          // Payment failed
          const bookingId = event.merchantReference?.split('_')[1];
          if (bookingId) {
            await adyenPaymentService.handlePaymentResult(bookingId, event.pspReference);
          }
        }
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    
    let errorMessage = 'Webhook processing failed';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('signature')) {
        errorMessage = 'Invalid webhook signature';
        statusCode = 400;
      } else if (error.message.includes('JSON')) {
        errorMessage = 'Invalid webhook payload';
        statusCode = 400;
      } else if (error.message.includes('Adyen')) {
        errorMessage = 'Payment service error';
        statusCode = 503;
      }
    }
    
    return NextResponse.json(
      { error: errorMessage },
      { status: statusCode }
    );
  }
}

function verifyWebhookSignature(payload: string, signature: string): boolean {
  try {
    const hmacKey = process.env.ADYEN_HMAC_KEY;
    if (!hmacKey) {
      console.error('ADYEN_HMAC_KEY not configured');
      return false;
    }

    // Parse signature header
    const signatureParts = signature.split(',');
    const signatureData: { [key: string]: string } = {};
    
    signatureParts.forEach(part => {
      const [key, value] = part.split('=');
      signatureData[key] = value;
    });

    const expectedSignature = crypto
      .createHmac('sha256', hmacKey)
      .update(payload)
      .digest('base64');

    return signatureData['hmac'] === expectedSignature;
  } catch (error) {
    console.error('Signature verification error:', error);
    return false;
  }
}
