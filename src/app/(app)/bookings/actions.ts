'use server';

import { getDb, getStorageInstance } from '@/lib/firebase';
import { doc, updateDoc, getDoc, serverTimestamp, collection, addDoc, runTransaction, query, where, getDocs } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { PaymentRetryService } from '@/lib/payment-retry-service';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'paidAt', 'date', 'endDate', 'startDate', 
    'completedAt', 'cancelledAt', 'verifiedAt', 'scheduledAt'
  ];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// PayPal payment creation action
export async function createPayPalPayment(data: {
  bookingId: string;
  returnUrl: string;
  cancelUrl: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Call the PayPal create API endpoint
    const response = await fetch('/api/payments/paypal/create', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Payment creation failed' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error creating PayPal payment:', error);
    return { success: false, error: 'Failed to create payment' };
  }
}

// PayPal payment capture action
export async function capturePayPalPayment(data: {
  bookingId: string;
  orderId: string;
}): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    // Call the PayPal capture API endpoint
    const response = await fetch('/api/payments/paypal/capture', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (!response.ok) {
      return { success: false, error: result.error || 'Payment capture failed' };
    }

    return { success: true, data: result.data };
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return { success: false, error: 'Failed to capture payment' };
  }
}

// Create booking action
export async function createBooking(data: {
  serviceId: string;
  providerId: string;
  clientId: string;
  date: string;
  time: string;
  price: number;
  notes?: string;
}): Promise<{ success: boolean; data?: { bookingId: string }; error?: string }> {
  try {
    const db = getDb();
    const bookingsRef = collection(db, 'bookings');
    
    const bookingData = {
      ...data,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    
    const docRef = await addDoc(bookingsRef, bookingData);
    
    return { success: true, data: { bookingId: docRef.id } };
  } catch (error) {
    console.error('Error creating booking:', error);
    return { success: false, error: 'Failed to create booking' };
  }
}

// Update booking status
export async function updateBookingStatus(
  bookingId: string,
  status: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const bookingRef = doc(db, 'bookings', bookingId);
    
    await updateDoc(bookingRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating booking status:', error);
    return { success: false, error: 'Failed to update booking status' };
  }
}

// Get booking by ID
export async function getBooking(bookingId: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const db = getDb();
    const bookingRef = doc(db, 'bookings', bookingId);
    const bookingDoc = await getDoc(bookingRef);
    
    if (!bookingDoc.exists()) {
      return { success: false, error: 'Booking not found' };
    }
    
    const bookingData = bookingDoc.data();
    return { 
      success: true, 
      data: serializeTimestamps({
        id: bookingDoc.id,
        ...bookingData,
      })
    };
  } catch (error) {
    console.error('Error fetching booking:', error);
    return { success: false, error: 'Failed to fetch booking' };
  }
}

// Get all bookings for a user (both as client and provider)
export async function fetchUserBookings(userId: string): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    console.log('🚀 fetchUserBookings called with userId:', userId);
    
    if (!userId) {
      console.error('❌ No user ID provided to fetchUserBookings');
      return { success: false, error: '[NEW CODE] User ID is required for fetchUserBookings' };
    }
    
    const db = getDb();
    if (!db) {
      return { success: false, error: 'Database not available' };
    }
    
    console.log('Querying bookings for user:', userId);
    
    // Query for bookings where user is either client or provider
    // Using separate queries to avoid composite index requirements
    const [clientBookingsQuery, providerBookingsQuery] = [
      query(collection(db, 'bookings'), where('clientId', '==', userId)),
      query(collection(db, 'bookings'), where('providerId', '==', userId))
    ];
    
    const [clientBookingsSnapshot, providerBookingsSnapshot] = await Promise.all([
      getDocs(clientBookingsQuery),
      getDocs(providerBookingsQuery)
    ]);
    
    console.log('Found', clientBookingsSnapshot.docs.length, 'client bookings');
    console.log('Found', providerBookingsSnapshot.docs.length, 'provider bookings');
    
    // Combine results and remove duplicates
    const allBookings = new Map();
    
    clientBookingsSnapshot.docs.forEach(doc => {
      allBookings.set(doc.id, doc);
    });
    
    providerBookingsSnapshot.docs.forEach(doc => {
      allBookings.set(doc.id, doc);
    });
    
    const bookingsSnapshot = { docs: Array.from(allBookings.values()) };
    console.log('Total unique bookings:', bookingsSnapshot.docs.length);
    
    const bookings = bookingsSnapshot.docs.map(doc => {
      const data = doc.data();
      return serializeTimestamps({
        id: doc.id,
        ...data,
      });
    });
    
    console.log('Processed bookings:', bookings.length);
    
    // Return success even if no bookings are found
    console.log('✅ getUserBookings completed successfully with', bookings.length, 'bookings');
    return { 
      success: true, 
      data: bookings || [] 
    };
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    return { 
      success: false, 
      error: `[NEW CODE] fetchUserBookings error: ${error instanceof Error ? error.message : 'Failed to fetch user bookings'}` 
    };
  }
}

// Complete booking action
export async function completeBookingAction(data: {
  bookingId: string;
  clientId: string;
  jobId?: string;
  serviceName: string;
  price: number;
  photoDataUrl: string;
  fileName: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate input
    if (!data.bookingId || !data.clientId || !data.serviceName || data.price < 0 || !data.photoDataUrl || !data.fileName) {
      return { success: false, error: 'Invalid input.' };
    }

    if (!data.photoDataUrl.startsWith('data:image/')) {
      return { success: false, error: 'Invalid input.' };
    }

    const db = getDb();
    const storage = getStorageInstance();
    
    // Upload photo to storage
    const timestamp = Date.now();
    const photoRef = ref(storage, `completion-photos/${data.bookingId}/${timestamp}_${data.fileName}`);
    
    try {
      await uploadString(photoRef, data.photoDataUrl, 'data_url');
      const photoUrl = await getDownloadURL(photoRef);
      
      // Process booking completion in a transaction
      await runTransaction(db, async (transaction) => {
        // Get client document for loyalty points
        const clientRef = doc(db, 'users', data.clientId);
        const clientDoc = await transaction.get(clientRef);
        
        if (!clientDoc.exists()) {
          throw new Error('Client document does not exist!');
        }
        
        const clientData = clientDoc.data();
        const currentPoints = clientData.loyaltyPoints || 0;
        const pointsToAward = Math.floor(data.price / 10);
        const newPoints = currentPoints + pointsToAward;
        
        // Update client loyalty points
        transaction.update(clientRef, {
          loyaltyPoints: newPoints,
          updatedAt: serverTimestamp(),
        });
        
        // Update booking status
        const bookingRef = doc(db, 'bookings', data.bookingId);
        transaction.update(bookingRef, {
          status: 'completed',
          completedAt: serverTimestamp(),
          completionProof: {
            photoUrl,
            fileName: data.fileName,
            uploadedAt: serverTimestamp(),
          },
          updatedAt: serverTimestamp(),
        });
        
        // Update job status if jobId is provided
        if (data.jobId) {
          const jobRef = doc(db, 'jobs', data.jobId);
          transaction.update(jobRef, {
            status: 'completed',
            completedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
          });
        }
      });
      
      // Create notification (don't fail if this fails)
      try {
        const notificationsRef = collection(db, 'notifications');
        await addDoc(notificationsRef, {
          userId: data.clientId,
          message: `Your booking for "${data.serviceName}" has been completed successfully!`,
          link: '/bookings',
          type: 'booking_update',
          read: false,
          createdAt: serverTimestamp(),
        });
      } catch (notificationError) {
        console.warn('Failed to create notification:', notificationError);
        // Don't fail the entire operation if notification fails
      }
      
      return { success: true };
    } catch (uploadError) {
      console.error('Photo upload failed:', uploadError);
      return { success: false, error: uploadError instanceof Error ? uploadError.message : 'Upload failed' };
    }
  } catch (error) {
    console.error('Error completing booking:', error);
    if (error instanceof Error) {
      return { success: false, error: error.message };
    }
    return { success: false, error: 'Could not complete the booking.' };
  }
}