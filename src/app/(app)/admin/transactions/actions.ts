'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  updateDoc,
  doc,
  orderBy,
  serverTimestamp,
  where
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'date'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const BookingIdSchema = z.string().min(1, 'Booking ID is required');
const RejectionReasonSchema = z.string().min(1, 'Rejection reason is required');

// Get payment verification bookings
export async function getPaymentVerificationBookings(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("status", "==", "Pending Payment Verification"),
      orderBy("createdAt", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: bookings
    };
  } catch (error) {
    console.error('Error fetching payment verification bookings:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment verification bookings'
    };
  }
}

// Approve payment
export async function approvePayment(bookingId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    await updateDoc(bookingRef, {
      status: "Completed",
      paymentVerified: true,
      paymentVerifiedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error approving payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to approve payment'
    };
  }
}

// Reject payment
export async function rejectPayment(bookingId: string, reason: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedReason = RejectionReasonSchema.parse(reason);
    
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    await updateDoc(bookingRef, {
      status: "Payment Rejected",
      paymentRejectionReason: validatedReason,
      paymentRejectedAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error rejecting payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to reject payment'
    };
  }
}
