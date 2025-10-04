import { getDb } from '@/shared/db';
import { 
  collection, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  getDocs, 
  getDoc, 
  doc, 
  query, 
  where, 
  orderBy, 
  limit,
  serverTimestamp 
} from 'firebase/firestore';
import { 
  CateringBooking, 
  CateringBookingForm, 
  BookingResponse 
} from '../types';

const COLLECTION = 'catering-bookings';

/**
 * Create a new catering booking
 */
export async function createCateringBooking(
  bookingData: CateringBookingForm,
  clientId: string,
  providerId: string,
  serviceId: string
): Promise<BookingResponse> {
  try {
    const db = getDb();
    
    // Calculate total amount (this would typically involve pricing logic)
    const totalAmount = await calculateBookingAmount(bookingData, serviceId);
    
    const booking: Omit<CateringBooking, 'id'> = {
      clientId,
      providerId,
      serviceId,
      eventType: bookingData.eventType as any,
      guestCount: bookingData.guestCount,
      eventDate: new Date(bookingData.eventDate),
      startTime: bookingData.startTime,
      endTime: bookingData.endTime,
      location: {
        address: bookingData.location.address,
        city: bookingData.location.city,
      },
      menuPreferences: bookingData.menuPreferences,
      dietaryRestrictions: bookingData.dietaryRestrictions,
      specialRequests: bookingData.specialRequests,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const docRef = await addDoc(collection(db, COLLECTION), {
      ...booking,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return {
      success: true,
      data: {
        ...booking,
        id: docRef.id,
      } as CateringBooking,
    };
  } catch (error) {
    console.error('Error creating catering booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get bookings for a specific client
 */
export async function getClientCateringBookings(clientId: string): Promise<CateringBooking[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId),
      orderBy('eventDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CateringBooking[];
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    return [];
  }
}

/**
 * Get bookings for a specific provider
 */
export async function getProviderCateringBookings(providerId: string): Promise<CateringBooking[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION),
      where('providerId', '==', providerId),
      orderBy('eventDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as CateringBooking[];
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return [];
  }
}

/**
 * Update booking status
 */
export async function updateCateringBookingStatus(
  bookingId: string, 
  status: CateringBooking['status']
): Promise<boolean> {
  try {
    const db = getDb();
    const bookingRef = doc(db, COLLECTION, bookingId);
    
    await updateDoc(bookingRef, {
      status,
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error updating booking status:', error);
    return false;
  }
}

/**
 * Cancel a booking
 */
export async function cancelCateringBooking(bookingId: string): Promise<boolean> {
  try {
    const db = getDb();
    const bookingRef = doc(db, COLLECTION, bookingId);
    
    await updateDoc(bookingRef, {
      status: 'cancelled',
      updatedAt: serverTimestamp(),
    });
    
    return true;
  } catch (error) {
    console.error('Error cancelling booking:', error);
    return false;
  }
}

/**
 * Get booking by ID
 */
export async function getCateringBookingById(bookingId: string): Promise<CateringBooking | null> {
  try {
    const db = getDb();
    const bookingDoc = await getDoc(doc(db, COLLECTION, bookingId));
    
    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data(),
      } as CateringBooking;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}

/**
 * Calculate booking amount based on guest count and service
 */
async function calculateBookingAmount(
  bookingData: CateringBookingForm,
  serviceId: string
): Promise<number> {
  // This would typically fetch service pricing from the database
  // For now, using a simple calculation
  const basePricePerGuest = 500; // PHP
  const guestCount = bookingData.guestCount;
  
  // Add premium for special event types
  const eventMultiplier = bookingData.eventType === 'wedding' ? 1.5 : 1.0;
  
  return Math.round(basePricePerGuest * guestCount * eventMultiplier);
}

/**
 * Get available time slots for a specific date and provider
 */
export async function getAvailableCateringTimeSlots(
  providerId: string,
  date: string
): Promise<string[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION),
      where('providerId', '==', providerId),
      where('eventDate', '==', new Date(date)),
      where('status', 'in', ['confirmed', 'in_progress'])
    );
    
    const querySnapshot = await getDocs(q);
    const bookedSlots = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return `${data.startTime}-${data.endTime}`;
    });
    
    // Return available time slots (this would be more sophisticated in practice)
    const allSlots = [
      '09:00-12:00',
      '12:00-15:00',
      '15:00-18:00',
      '18:00-21:00',
    ];
    
    return allSlots.filter(slot => !bookedSlots.includes(slot));
  } catch (error) {
    console.error('Error fetching available time slots:', error);
    return [];
  }
}