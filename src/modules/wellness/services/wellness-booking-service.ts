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
import { SpaBooking, WellnessBookingForm } from '../types';

const COLLECTION = 'wellness-bookings';

/**
 * Create a new wellness booking
 */
export async function createWellnessBooking(
  bookingData: WellnessBookingForm,
  clientId: string,
  providerId: string,
  services: { serviceId: string; serviceName: string; duration: number; price: number }[]
): Promise<{ success: boolean; data?: SpaBooking; error?: string }> {
  try {
    const db = getDb();
    
    const totalAmount = services.reduce((sum, service) => sum + service.price, 0);
    const totalDuration = services.reduce((sum, service) => sum + service.duration, 0);
    
    // Calculate end time based on start time and total duration
    const startTime = new Date(`2000-01-01T${bookingData.startTime}`);
    const endTime = new Date(startTime.getTime() + totalDuration * 60000);
    
    const booking: Omit<SpaBooking, 'id'> = {
      clientId,
      providerId,
      serviceId: services[0]?.serviceId || '', // Use first service as primary
      appointmentDate: new Date(bookingData.appointmentDate),
      startTime: bookingData.startTime,
      endTime: endTime.toTimeString().slice(0, 5),
      services,
      totalAmount,
      status: 'pending',
      paymentStatus: 'pending',
      specialRequests: bookingData.specialRequests || '',
      notes: bookingData.notes || '',
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
      } as SpaBooking,
    };
  } catch (error) {
    console.error('Error creating wellness booking:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Get bookings for a specific client
 */
export async function getClientWellnessBookings(clientId: string): Promise<SpaBooking[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION),
      where('clientId', '==', clientId),
      orderBy('appointmentDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SpaBooking[];
  } catch (error) {
    console.error('Error fetching client bookings:', error);
    return [];
  }
}

/**
 * Get bookings for a specific provider
 */
export async function getProviderWellnessBookings(providerId: string): Promise<SpaBooking[]> {
  try {
    const db = getDb();
    const q = query(
      collection(db, COLLECTION),
      where('providerId', '==', providerId),
      orderBy('appointmentDate', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
    })) as SpaBooking[];
  } catch (error) {
    console.error('Error fetching provider bookings:', error);
    return [];
  }
}

/**
 * Update booking status
 */
export async function updateWellnessBookingStatus(
  bookingId: string, 
  status: SpaBooking['status']
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
export async function cancelWellnessBooking(bookingId: string): Promise<boolean> {
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
export async function getWellnessBookingById(bookingId: string): Promise<SpaBooking | null> {
  try {
    const db = getDb();
    const bookingDoc = await getDoc(doc(db, COLLECTION, bookingId));
    
    if (bookingDoc.exists()) {
      return {
        id: bookingDoc.id,
        ...bookingDoc.data(),
      } as SpaBooking;
    }
    
    return null;
  } catch (error) {
    console.error('Error fetching booking:', error);
    return null;
  }
}