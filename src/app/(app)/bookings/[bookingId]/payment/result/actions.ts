'use server';

import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const BookingIdSchema = z.string().min(1, 'Booking ID is required');
const UserIdSchema = z.string().min(1, 'User ID is required');

const PaymentResultSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  status: z.enum(['success', 'failed', 'pending', 'cancelled']),
  amount: z.number().min(0, 'Amount must be positive'),
  currency: z.string().min(1, 'Currency is required'),
  paymentMethod: z.string().min(1, 'Payment method is required'),
  transactionId: z.string().optional(),
  errorMessage: z.string().optional(),
  processedAt: z.date().optional(),
});

export type PaymentResultInput = z.infer<typeof PaymentResultSchema>;

// Get payment result
export async function getPaymentResult(bookingId: string, userId: string) {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const bookingRef = doc(getDb(), 'bookings', validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return { success: false, error: 'Booking not found' };
    }

    const bookingData = bookingSnap.data();
    
    // Check if user has access to this booking
    if (bookingData.clientId !== validatedUserId && bookingData.providerId !== validatedUserId) {
      return { success: false, error: 'Access denied' };
    }

    const paymentResult = {
      bookingId: validatedBookingId,
      bookingStatus: bookingData.status,
      paymentStatus: bookingData.paymentStatus || 'pending',
      amount: bookingData.amount || 0,
      currency: bookingData.currency || 'PHP',
      paymentMethod: bookingData.paymentMethod || 'unknown',
      transactionId: bookingData.transactionId,
      paymentDate: bookingData.paymentDate,
      serviceName: bookingData.serviceName,
      providerName: bookingData.providerName,
      clientName: bookingData.clientName,
      bookingDate: bookingData.date,
    };

    return { success: true, data: paymentResult };
  } catch (error) {
    console.error('Error getting payment result:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get payment result' 
    };
  }
}

// Update payment status
export async function updatePaymentStatus(bookingId: string, paymentResult: PaymentResultInput) {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedPaymentResult = PaymentResultSchema.parse(paymentResult);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const bookingRef = doc(getDb(), 'bookings', validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return { success: false, error: 'Booking not found' };
    }

    const updateData: any = {
      paymentStatus: validatedPaymentResult.status,
      paymentId: validatedPaymentResult.paymentId,
      transactionId: validatedPaymentResult.transactionId,
      paymentMethod: validatedPaymentResult.paymentMethod,
      paymentProcessedAt: validatedPaymentResult.processedAt || new Date(),
      updatedAt: serverTimestamp(),
    };

    // Update booking status based on payment status
    if (validatedPaymentResult.status === 'success') {
      updateData.status = 'Confirmed';
    } else if (validatedPaymentResult.status === 'failed') {
      updateData.status = 'Payment Failed';
    }

    await updateDoc(bookingRef, updateData);

    return { success: true, message: 'Payment status updated successfully' };
  } catch (error) {
    console.error('Error updating payment status:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update payment status' 
    };
  }
}

// Get booking details for payment result
export async function getBookingDetails(bookingId: string, userId: string) {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const bookingRef = doc(getDb(), 'bookings', validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return { success: false, error: 'Booking not found' };
    }

    const bookingData = bookingSnap.data();
    
    // Check if user has access to this booking
    if (bookingData.clientId !== validatedUserId && bookingData.providerId !== validatedUserId) {
      return { success: false, error: 'Access denied' };
    }

    const bookingDetails = {
      id: bookingSnap.id,
      serviceName: bookingData.serviceName,
      providerName: bookingData.providerName,
      clientName: bookingData.clientName,
      amount: bookingData.amount,
      currency: bookingData.currency,
      status: bookingData.status,
      paymentStatus: bookingData.paymentStatus,
      date: bookingData.date,
      location: bookingData.location,
      description: bookingData.description,
      specialInstructions: bookingData.specialInstructions,
      createdAt: bookingData.createdAt,
    };

    return { success: true, data: bookingDetails };
  } catch (error) {
    console.error('Error getting booking details:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get booking details' 
    };
  }
}

// Create payment receipt
export async function createPaymentReceipt(bookingId: string, userId: string) {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedUserId = UserIdSchema.parse(userId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const bookingRef = doc(getDb(), 'bookings', validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);

    if (!bookingSnap.exists()) {
      return { success: false, error: 'Booking not found' };
    }

    const bookingData = bookingSnap.data();
    
    // Check if user has access to this booking
    if (bookingData.clientId !== validatedUserId && bookingData.providerId !== validatedUserId) {
      return { success: false, error: 'Access denied' };
    }

    const receipt = {
      receiptId: `RCP-${validatedBookingId.slice(-8).toUpperCase()}`,
      bookingId: validatedBookingId,
      serviceName: bookingData.serviceName,
      providerName: bookingData.providerName,
      clientName: bookingData.clientName,
      amount: bookingData.amount,
      currency: bookingData.currency,
      paymentMethod: bookingData.paymentMethod,
      transactionId: bookingData.transactionId,
      paymentDate: bookingData.paymentProcessedAt || new Date(),
      bookingDate: bookingData.date,
      status: bookingData.paymentStatus,
      generatedAt: new Date(),
    };

    return { success: true, data: receipt };
  } catch (error) {
    console.error('Error creating payment receipt:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create payment receipt' 
    };
  }
}

// Get payment history for user
export async function getPaymentHistory(userId: string, _limit: number = 10) {
  try {
    const _validatedUserId = UserIdSchema.parse(userId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    // For now, return a placeholder
    // In a real implementation, you'd query the bookings collection
    const paymentHistory = {
      payments: [],
      totalPayments: 0,
      totalAmount: 0,
      currency: 'PHP',
    };

    return { success: true, data: paymentHistory };
  } catch (error) {
    console.error('Error getting payment history:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get payment history' 
    };
  }
}
