import { NextRequest, NextResponse } from 'next/server';
import { MayaCheckoutService } from '@/lib/maya-checkout-service';
import { adminDb } from '@/lib/firebase-admin';
import { doc, updateDoc, addDoc, collection, serverTimestamp, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    // 1. Verify IP address (Security requirement from Maya docs)
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     '127.0.0.1';
    
    const allowedIPs = process.env.MAYA_ENVIRONMENT === 'production' 
      ? ['18.138.50.235', '3.1.207.200'] // Production IPs
      : ['13.229.160.234', '3.1.199.75']; // Sandbox IPs
    
    // For development/testing, allow localhost and common proxy IPs
    const isLocalhost = clientIP === '127.0.0.1' || clientIP === '::1' || clientIP.startsWith('192.168.') || clientIP.startsWith('10.');
    const isAllowedIP = allowedIPs.includes(clientIP);
    
    if (!isAllowedIP && !isLocalhost) {
      console.warn(`Webhook request from unauthorized IP: ${clientIP}`);
      // In development, log but don't block
      if (process.env.NODE_ENV === 'production') {
        return NextResponse.json(
          { success: false, error: 'Unauthorized IP address' },
          { status: 403 }
        );
      }
    }

    const body = await request.text();
    const signature = request.headers.get('x-maya-signature');

    if (!signature) {
      return NextResponse.json(
        { success: false, error: 'Missing signature' },
        { status: 400 }
      );
    }

    const mayaService = new MayaCheckoutService();
    
    // Verify webhook signature (bypass in development for testing)
    if (process.env.NODE_ENV === 'production') {
      if (!mayaService.verifyWebhookSignature(body, signature)) {
        return NextResponse.json(
          { success: false, error: 'Invalid signature' },
          { status: 401 }
        );
      }
    } else {
      console.log('Development mode: Skipping webhook signature verification');
    }

    const webhookData = JSON.parse(body);
    const { id: checkoutId, paymentStatus, requestReferenceNumber, metadata, fundSource } = webhookData;

    console.log('Maya webhook received:', { 
      checkoutId, 
      paymentStatus, 
      requestReferenceNumber,
      eventType: 'PAYMENT_' + paymentStatus,
      fundSource: fundSource?.type || 'unknown',
      amount: webhookData.totalAmount?.value || 'unknown'
    });

    const db = adminDb;

    // Check for duplicate webhook events (idempotency)
    const webhookLogRef = doc(db, 'webhookLogs', `${checkoutId}_${paymentStatus}`);
    const webhookLogDoc = await getDoc(webhookLogRef);
    
    if (webhookLogDoc.exists()) {
      console.log('Duplicate webhook event received, skipping processing:', checkoutId);
      return NextResponse.json({ success: true, message: 'Duplicate event ignored' });
    }

    // Log this webhook event to prevent duplicate processing
    await addDoc(collection(db, 'webhookLogs'), {
      checkoutId,
      paymentStatus,
      requestReferenceNumber,
      processedAt: serverTimestamp(),
      webhookData: webhookData,
    });

    // Handle new PAYMENT_* events (migrated from legacy CHECKOUT_* events)
    switch (paymentStatus) {
      case 'SUCCESS':
        await handleSuccessfulPayment(db, webhookData, metadata);
        break;
      case 'FAILED':
        await handleFailedPayment(db, webhookData, metadata);
        break;
      case 'CANCELLED':
        await handleCancelledPayment(db, webhookData, metadata);
        break;
      case 'EXPIRED':
        await handleExpiredPayment(db, webhookData, metadata);
        break;
      case 'AUTHORIZED':
        await handleAuthorizedPayment(db, webhookData, metadata);
        break;
      default:
        console.warn('Unknown payment status received:', paymentStatus);
        // Log the full webhook data for debugging
        console.log('Full webhook data:', JSON.stringify(webhookData, null, 2));
    }

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error('Error processing Maya webhook:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

async function handleSuccessfulPayment(db: any, webhookData: any, metadata: any) {
  try {
    const { id: checkoutId, totalAmount, paidAt, requestReferenceNumber } = webhookData;
    
    if (metadata?.type === 'booking_payment' && metadata?.bookingId) {
      const bookingId = metadata.bookingId;
      
      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        status: 'Upcoming',
        paymentVerifiedAt: serverTimestamp(),
        paymentVerifiedBy: 'maya',
        paymentMethod: 'maya',
        mayaCheckoutId: checkoutId,
        mayaTransactionId: requestReferenceNumber,
      });

      // Get booking data for transaction record
      const bookingDoc = await getDoc(bookingRef);
      if (bookingDoc.exists()) {
        const bookingData = bookingDoc.data();
        
        // Create transaction record
        await addDoc(collection(db, 'transactions'), {
          bookingId,
          clientId: bookingData?.clientId,
          providerId: bookingData?.providerId,
          amount: totalAmount.value,
          type: 'booking_payment',
          status: 'completed',
          paymentMethod: 'maya',
          createdAt: serverTimestamp(),
          verifiedAt: serverTimestamp(),
          verifiedBy: 'maya',
          mayaCheckoutId: checkoutId,
          mayaTransactionId: requestReferenceNumber,
        });
      }

      // Create Maya payment record
      await addDoc(collection(db, 'mayaPayments'), {
        checkoutId,
        bookingId,
        amount: totalAmount.value,
        currency: totalAmount.currency,
        status: 'PAID',
        paidAt: new Date(paidAt),
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });

    } else if (metadata?.type === 'subscription_payment' && metadata?.planId) {
      const planId = metadata.planId;
      
      // Create subscription payment record
      await addDoc(collection(db, 'subscriptionPayments'), {
        checkoutId,
        planId,
        amount: totalAmount.value,
        currency: totalAmount.currency,
        status: 'PAID',
        paidAt: new Date(paidAt),
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });
    }

    console.log('Successfully processed Maya payment:', checkoutId);
  } catch (error) {
    console.error('Error handling successful Maya payment:', error);
  }
}

async function handleFailedPayment(db: any, webhookData: any, metadata: any) {
  try {
    const { id: checkoutId, paymentStatus, requestReferenceNumber } = webhookData;
    
    if (metadata?.type === 'booking_payment' && metadata?.bookingId) {
      const bookingId = metadata.bookingId;
      
      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'failed',
        paymentMethod: 'maya',
        mayaCheckoutId: checkoutId,
        mayaTransactionId: requestReferenceNumber,
        updatedAt: serverTimestamp(),
      });

      // Create Maya payment record
      await addDoc(collection(db, 'mayaPayments'), {
        checkoutId,
        bookingId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });

    } else if (metadata?.type === 'subscription_payment' && metadata?.planId) {
      const planId = metadata.planId;
      
      // Create subscription payment record
      await addDoc(collection(db, 'subscriptionPayments'), {
        checkoutId,
        planId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });
    }

    console.log('Processed failed Maya payment:', checkoutId);
  } catch (error) {
    console.error('Error handling failed Maya payment:', error);
  }
}

async function handleCancelledPayment(db: any, webhookData: any, metadata: any) {
  try {
    const { id: checkoutId, paymentStatus, requestReferenceNumber } = webhookData;
    
    if (metadata?.type === 'booking_payment' && metadata?.bookingId) {
      const bookingId = metadata.bookingId;
      
      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'cancelled',
        paymentMethod: 'maya',
        mayaCheckoutId: checkoutId,
        mayaTransactionId: requestReferenceNumber,
        updatedAt: serverTimestamp(),
      });

      // Create Maya payment record
      await addDoc(collection(db, 'mayaPayments'), {
        checkoutId,
        bookingId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });

    } else if (metadata?.type === 'subscription_payment' && metadata?.planId) {
      const planId = metadata.planId;
      
      // Create subscription payment record
      await addDoc(collection(db, 'subscriptionPayments'), {
        checkoutId,
        planId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });
    }

    console.log('Processed cancelled Maya payment:', checkoutId);
  } catch (error) {
    console.error('Error handling cancelled Maya payment:', error);
  }
}

async function handleExpiredPayment(db: any, webhookData: any, metadata: any) {
  try {
    const { id: checkoutId, paymentStatus, requestReferenceNumber } = webhookData;
    
    if (metadata?.type === 'booking_payment' && metadata?.bookingId) {
      const bookingId = metadata.bookingId;
      
      // Update booking status
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'expired',
        paymentMethod: 'maya',
        mayaCheckoutId: checkoutId,
        mayaTransactionId: requestReferenceNumber,
        updatedAt: serverTimestamp(),
      });

      // Create Maya payment record
      await addDoc(collection(db, 'mayaPayments'), {
        checkoutId,
        bookingId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });

    } else if (metadata?.type === 'subscription_payment' && metadata?.planId) {
      const planId = metadata.planId;
      
      // Create subscription payment record
      await addDoc(collection(db, 'subscriptionPayments'), {
        checkoutId,
        planId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });
    }

    console.log('Processed expired Maya payment:', checkoutId);
  } catch (error) {
    console.error('Error handling expired Maya payment:', error);
  }
}

async function handleAuthorizedPayment(db: any, webhookData: any, metadata: any) {
  try {
    const { id: checkoutId, paymentStatus, requestReferenceNumber } = webhookData;
    
    // For authorized payments (card payments only), we typically just log
    // The actual capture will happen later via PAYMENT_SUCCESS
    
    if (metadata?.type === 'booking_payment' && metadata?.bookingId) {
      const bookingId = metadata.bookingId;
      
      // Update booking status to show authorization
      const bookingRef = doc(db, 'bookings', bookingId);
      await updateDoc(bookingRef, {
        paymentStatus: 'authorized',
        paymentMethod: 'maya',
        mayaCheckoutId: checkoutId,
        mayaTransactionId: requestReferenceNumber,
        updatedAt: serverTimestamp(),
      });

      // Create Maya payment record
      await addDoc(collection(db, 'mayaPayments'), {
        checkoutId,
        bookingId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });

    } else if (metadata?.type === 'subscription_payment' && metadata?.planId) {
      const planId = metadata.planId;
      
      // Create subscription payment record
      await addDoc(collection(db, 'subscriptionPayments'), {
        checkoutId,
        planId,
        status: paymentStatus,
        requestReferenceNumber,
        createdAt: serverTimestamp(),
        metadata,
      });
    }

    console.log('Processed authorized Maya payment:', checkoutId);
  } catch (error) {
    console.error('Error handling authorized Maya payment:', error);
  }
}
