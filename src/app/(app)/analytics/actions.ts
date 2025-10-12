'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'date', 'issueDate', 'dueDate'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

// Get provider analytics data
export async function getProviderAnalyticsData(providerId: string): Promise<{
  success: boolean;
  data?: {
    bookings: any[];
    reviews: any[];
    earnings: any[];
  };
  error?: string;
}> {
  try {
    const validatedProviderId = UserIdSchema.parse(providerId);
    
    // Get bookings for this provider
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "==", validatedProviderId),
      orderBy("date", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get reviews for this provider
    const reviewsQuery = query(
      collection(getDb(), "reviews"), 
      where("providerId", "==", validatedProviderId),
      orderBy("createdAt", "desc")
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get earnings data (completed bookings)
    const completedBookings = bookings.filter(booking => booking.status === 'Completed');
    const earnings = completedBookings.map(booking => ({
      id: booking.id,
      amount: booking.price,
      date: booking.date,
      serviceName: booking.serviceName,
      clientName: booking.clientName
    }));

    return {
      success: true,
      data: {
        bookings,
        reviews,
        earnings
      }
    };
  } catch (error) {
    console.error('Error fetching provider analytics data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics data'
    };
  }
}

// Get agency analytics data
export async function getAgencyAnalyticsData(agencyId: string): Promise<{
  success: boolean;
  data?: {
    bookings: any[];
    reviews: any[];
    earnings: any[];
    providers: any[];
  };
  error?: string;
}> {
  try {
    const validatedAgencyId = UserIdSchema.parse(agencyId);
    
    // Get providers under this agency
    const providersQuery = query(
      collection(getDb(), "users"), 
      where("agencyId", "==", validatedAgencyId)
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providers = providersSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );
    
    const providerIds = providers.map(provider => provider.id);

    if (providerIds.length === 0) {
      return {
        success: true,
        data: {
          bookings: [],
          reviews: [],
          earnings: [],
          providers: []
        }
      };
    }

    // Get bookings for these providers
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "in", providerIds),
      orderBy("date", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get reviews for these providers
    const reviewsQuery = query(
      collection(getDb(), "reviews"), 
      where("providerId", "in", providerIds),
      orderBy("createdAt", "desc")
    );
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get earnings data (completed bookings)
    const completedBookings = bookings.filter(booking => booking.status === 'Completed');
    const earnings = completedBookings.map(booking => ({
      id: booking.id,
      amount: booking.price,
      date: booking.date,
      serviceName: booking.serviceName,
      clientName: booking.clientName,
      providerId: booking.providerId
    }));

    return {
      success: true,
      data: {
        bookings,
        reviews,
        earnings,
        providers
      }
    };
  } catch (error) {
    console.error('Error fetching agency analytics data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch analytics data'
    };
  }
}
