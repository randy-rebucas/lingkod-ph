import { NextRequest, NextResponse } from 'next/server';
import { paymayaPaymentService, PayMayaPaymentService } from '@/lib/paymaya-payment-service';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  let webhookId = 'unknown';
  
  try {
    // Check if PayMaya is configured
    if (!process.env.NEXT_PUBLIC_PAYMAYA_PUBLIC_KEY || !process.env.PAYMAYA_SECRET_KEY) {
      console.error('PayMaya not configured');
      return NextResponse.json({ error: 'Service not configured' }, { status: 503 });
    }

    const body = await request.text();
    const signature = request.headers.get('x-paymaya-signature');
    const webhookSecret = process.env.PAYMAYA_WEBHOOK_SECRET || '';

    // Parse webhook event early to get ID for logging
    let webhookEvent;
    try {
      webhookEvent = JSON.parse(body);
      webhookId = webhookEvent.id || webhookEvent.data?.id || 'unknown';
    } catch (parseError) {
      console.error('Failed to parse webhook body:', parseError);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    console.log(`Processing PayMaya webhook ${webhookId} of type ${webhookEvent.type}`);

    // Verify webhook signature
    if (signature && webhookSecret) {
      const isValidSignature = PayMayaPaymentService.verifyWebhookSignature(
        body,
        signature,
        webhookSecret
      );

      if (!isValidSignature) {
        console.error(`Invalid PayMaya webhook signature for ${webhookId}`);
        return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
      }
    } else {
      console.warn(`Webhook ${webhookId} received without signature verification`);
    }

    // Validate webhook event structure
    if (!webhookEvent.type || !webhookEvent.data) {
      console.error(`Invalid webhook event structure for ${webhookId}:`, webhookEvent);
      return NextResponse.json({ error: 'Invalid webhook event structure' }, { status: 400 });
    }
    
    // Process webhook event
    await paymayaPaymentService.processWebhookEvent(webhookEvent);

    const processingTime = Date.now() - startTime;
    console.log(`Successfully processed PayMaya webhook ${webhookId} in ${processingTime}ms`);

    return NextResponse.json({ 
      received: true, 
      webhookId,
      processingTime: `${processingTime}ms`
    });
  } catch (error) {
    const processingTime = Date.now() - startTime;
    console.error(`PayMaya webhook processing error for ${webhookId} after ${processingTime}ms:`, error);
    
    // Return appropriate error response
    if (error instanceof SyntaxError) {
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }
    
    return NextResponse.json({ 
      error: 'Webhook processing failed',
      webhookId,
      processingTime: `${processingTime}ms`
    }, { status: 500 });
  }
}
