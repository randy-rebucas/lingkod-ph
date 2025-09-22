import { NextRequest, NextResponse } from 'next/server';
import { SubscriptionPaymentProcessor } from '@/lib/subscription-payment-processor';

export async function POST(request: NextRequest) {
  try {
    const { action, paymentId, verifiedBy, rejectionReason } = await request.json();

    if (!verifiedBy) {
      return NextResponse.json(
        { error: 'Verified by user ID is required' },
        { status: 400 }
      );
    }

    let result;

    switch (action) {
      case 'verify':
        if (!paymentId) {
          return NextResponse.json(
            { error: 'Payment ID is required for verification' },
            { status: 400 }
          );
        }
        result = await SubscriptionPaymentProcessor.verifySubscriptionPayment(
          paymentId,
          verifiedBy
        );
        break;

      case 'reject':
        if (!paymentId || !rejectionReason) {
          return NextResponse.json(
            { error: 'Payment ID and rejection reason are required for rejection' },
            { status: 400 }
          );
        }
        result = await SubscriptionPaymentProcessor.rejectSubscriptionPayment(
          paymentId,
          verifiedBy,
          rejectionReason
        );
        break;

      case 'get_pending':
        const pendingPayments = await SubscriptionPaymentProcessor.getPendingSubscriptionPayments();
        return NextResponse.json({ 
          success: true, 
          data: pendingPayments 
        });

      case 'get_all':
        const allPayments = await SubscriptionPaymentProcessor.getAllSubscriptionPayments();
        return NextResponse.json({ 
          success: true, 
          data: allPayments 
        });

      case 'get_stats':
        const stats = await SubscriptionPaymentProcessor.getSubscriptionPaymentStats();
        return NextResponse.json({ 
          success: true, 
          data: stats 
        });

      case 'batch_process':
        const batchResult = await SubscriptionPaymentProcessor.processPendingPayments(
          verifiedBy,
          false // Don't auto-verify
        );
        return NextResponse.json({ 
          success: true, 
          data: batchResult 
        });

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported actions: verify, reject, get_pending, get_all, get_stats, batch_process' },
          { status: 400 }
        );
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error processing subscription payment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'pending';

    let data;

    switch (type) {
      case 'pending':
        data = await SubscriptionPaymentProcessor.getPendingSubscriptionPayments();
        break;
      case 'all':
        data = await SubscriptionPaymentProcessor.getAllSubscriptionPayments();
        break;
      case 'stats':
        data = await SubscriptionPaymentProcessor.getSubscriptionPaymentStats();
        break;
      case 'transactions':
        data = await SubscriptionPaymentProcessor.getSubscriptionTransactions();
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid type. Supported types: pending, all, stats, transactions' },
          { status: 400 }
        );
    }

    return NextResponse.json({ 
      success: true, 
      data 
    });

  } catch (error) {
    console.error('Error fetching subscription data:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
