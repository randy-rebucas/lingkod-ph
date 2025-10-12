'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  addDoc, 
  collection,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'scheduledDate', 'completedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const BookingIdSchema = z.string().min(1, 'Booking ID is required');
const PaymentDataSchema = z.object({
  amount: z.number().min(0, 'Amount must be positive'),
  method: z.string().min(1, 'Payment method is required'),
  transactionId: z.string().optional()
});

// Get booking details
export async function getBookingDetails(bookingId: string): Promise<{
  success: boolean;
  data?: any;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    const bookingData = serializeTimestamps({ id: bookingSnap.id, ...bookingSnap.data() });

    return {
      success: true,
      data: bookingData
    };
  } catch (error) {
    console.error('Error fetching booking details:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch booking details'
    };
  }
}

// Process payment
export async function processPayment(bookingId: string, paymentData: {
  amount: number;
  method: string;
  transactionId?: string;
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedPayment = PaymentDataSchema.parse(paymentData);
    
    // Update booking with payment information
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    await updateDoc(bookingRef, {
      payment: {
        amount: validatedPayment.amount,
        method: validatedPayment.method,
        transactionId: validatedPayment.transactionId,
        status: 'completed',
        paidAt: serverTimestamp()
      },
      status: 'paid',
      updatedAt: serverTimestamp()
    });

    // Create payment record
    await addDoc(collection(getDb(), "payments"), {
      bookingId: validatedBookingId,
      amount: validatedPayment.amount,
      method: validatedPayment.method,
      transactionId: validatedPayment.transactionId,
      status: 'completed',
      createdAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error processing payment:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to process payment'
    };
  }
}
