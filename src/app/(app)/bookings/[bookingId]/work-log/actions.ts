'use server';

import { getDb } from '@/lib/firebase';
import { 
  doc, 
  getDoc, 
  updateDoc, 
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'startTime', 'endTime', 'scheduledDate'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const BookingIdSchema = z.string().min(1, 'Booking ID is required');
const WorkLogEntrySchema = z.object({
  startTime: z.date(),
  endTime: z.date().optional(),
  description: z.string().optional(),
  photos: z.array(z.string()).optional()
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

// Add work log entry
export async function addWorkLogEntry(bookingId: string, workLogData: {
  startTime: Date;
  endTime?: Date;
  description?: string;
  photos?: string[];
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    const validatedWorkLog = WorkLogEntrySchema.parse(workLogData);
    
    const workLogEntry = {
      startTime: serverTimestamp(),
      endTime: validatedWorkLog.endTime ? serverTimestamp() : null,
      description: validatedWorkLog.description || '',
      photos: validatedWorkLog.photos || [],
      createdAt: serverTimestamp()
    };

    // Add to booking's work log
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    await updateDoc(bookingRef, {
      workLog: arrayUnion(workLogEntry),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding work log entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add work log entry'
    };
  }
}

// Update work log entry
export async function updateWorkLogEntry(bookingId: string, entryIndex: number, updates: {
  endTime?: Date;
  description?: string;
  photos?: string[];
}): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedBookingId = BookingIdSchema.parse(bookingId);
    
    // Get current booking data
    const bookingRef = doc(getDb(), "bookings", validatedBookingId);
    const bookingSnap = await getDoc(bookingRef);
    
    if (!bookingSnap.exists()) {
      return {
        success: false,
        error: 'Booking not found'
      };
    }

    const bookingData = bookingSnap.data();
    const workLog = bookingData.workLog || [];
    
    if (entryIndex < 0 || entryIndex >= workLog.length) {
      return {
        success: false,
        error: 'Invalid work log entry index'
      };
    }

    // Update the specific entry
    workLog[entryIndex] = {
      ...workLog[entryIndex],
      ...updates,
      endTime: updates.endTime ? serverTimestamp() : workLog[entryIndex].endTime,
      updatedAt: serverTimestamp()
    };

    await updateDoc(bookingRef, {
      workLog: workLog,
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating work log entry:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update work log entry'
    };
  }
}
