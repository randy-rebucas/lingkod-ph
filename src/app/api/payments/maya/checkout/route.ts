import { NextRequest, NextResponse } from 'next/server';
import { MayaCheckoutService } from '@/lib/maya-checkout-service';
import { getAuth } from 'firebase-admin/auth';
import { adminDb } from '@/lib/firebase-admin';
import { doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { bookingId, planId, amount, type } = body;

    // Validate required fields
    if (!amount || !type) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: amount and type' },
        { status: 400 }
      );
    }

    if (type === 'booking' && !bookingId) {
      return NextResponse.json(
        { success: false, error: 'Booking ID is required for booking payments' },
        { status: 400 }
      );
    }

    if (type === 'subscription' && !planId) {
      return NextResponse.json(
        { success: false, error: 'Plan ID is required for subscription payments' },
        { status: 400 }
      );
    }

    // Get user from authorization header
    const authHeader = request.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json(
        { success: false, error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.split('Bearer ')[1];
    let user;
    try {
      user = await getAuth().verifyIdToken(token);
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid token' },
        { status: 401 }
      );
    }

    const mayaService = new MayaCheckoutService();
    let result;

    if (type === 'booking') {
      // Verify booking exists and belongs to user
      const db = adminDb;
      const bookingDoc = await getDoc(doc(db, 'bookings', bookingId));
      
      if (!bookingDoc.exists()) {
        return NextResponse.json(
          { success: false, error: 'Booking not found' },
          { status: 404 }
        );
      }

      const bookingData = bookingDoc.data();
      if (bookingData?.clientId !== user.uid) {
        return NextResponse.json(
          { success: false, error: 'Unauthorized access to booking' },
          { status: 403 }
        );
      }

      // Verify amount matches booking price
      if (Math.abs(bookingData.price - amount) > 0.01) {
        return NextResponse.json(
          { success: false, error: 'Amount does not match booking price' },
          { status: 400 }
        );
      }

      result = await mayaService.createBookingCheckout(
        bookingId,
        amount,
        user.email
      );
    } else if (type === 'subscription') {
      result = await mayaService.createSubscriptionCheckout(
        planId,
        amount,
        user.email
      );
    } else {
      return NextResponse.json(
        { success: false, error: 'Invalid payment type' },
        { status: 400 }
      );
    }

    if (!result.success) {
      return NextResponse.json(
        { success: false, error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.data
    });

  } catch (error) {
    console.error('Error creating Maya checkout:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
