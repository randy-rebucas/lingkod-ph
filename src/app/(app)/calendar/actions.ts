'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  or,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'start', 'end', 'date'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const EventSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().optional(),
  start: z.date(),
  end: z.date(),
  userId: z.string().min(1, 'User ID is required'),
  serviceName: z.string().optional(),
  type: z.enum(['booking', 'personal', 'reminder']).default('personal'),
});

// Get calendar events for a user
export async function getCalendarEvents(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Get bookings for this user (as provider or client)
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      or(
        where("providerId", "==", validatedUserId),
        where("clientId", "==", validatedUserId)
      )
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get personal events
    const eventsQuery = query(
      collection(getDb(), "calendarEvents"), 
      where("userId", "==", validatedUserId)
    );
    const eventsSnapshot = await getDocs(eventsQuery);
    const events = eventsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Combine and format events
    const allEvents = [
      ...bookings.map(booking => ({
        id: booking.id,
        title: booking.serviceName || 'Booking',
        start: booking.date,
        end: booking.date, // Assuming single day bookings
        status: booking.status,
        providerName: booking.providerName,
        clientName: booking.clientName,
        serviceName: booking.serviceName,
        type: 'booking' as const
      })),
      ...events.map(event => ({
        id: event.id,
        title: event.title,
        start: event.start,
        end: event.end,
        description: event.description,
        type: event.type || 'personal'
      }))
    ];

    return {
      success: true,
      data: allEvents
    };
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch calendar events'
    };
  }
}

// Create calendar event - updated to include serviceName
export async function createCalendarEvent(data: {
  title: string;
  description?: string;
  start: Date;
  end: Date;
  userId: string;
  serviceName?: string;
  type?: 'booking' | 'personal' | 'reminder';
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const validatedData = EventSchema.parse(data);
    
    const eventData = {
      ...validatedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(getDb(), "calendarEvents"), eventData);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating calendar event:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create calendar event'
    };
  }
}
