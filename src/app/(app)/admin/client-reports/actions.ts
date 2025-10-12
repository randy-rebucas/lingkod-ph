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
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const _RoleSchema = z.enum(['client', 'provider', 'agency', 'admin']);

// Get client reports data
export async function getClientReportsData(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    // Get all clients
    const clientsQuery = query(
      collection(getDb(), "users"), 
      where("role", "==", "client"),
      orderBy("joinedAt", "desc")
    );
    const clientsSnapshot = await getDocs(clientsQuery);
    const clients = clientsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get all completed bookings
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("status", "==", "Completed")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get all reviews
    const reviewsQuery = query(collection(getDb(), "reviews"));
    const reviewsSnapshot = await getDocs(reviewsQuery);
    const reviews = reviewsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Process data to create client reports
    const clientReports = clients.map(client => {
      const clientBookings = bookings.filter(booking => booking.clientId === client.id);
      const clientReviews = reviews.filter(review => review.clientId === client.id);
      
      const completedBookings = clientBookings.length;
      const totalSpent = clientBookings.reduce((sum, booking) => sum + booking.price, 0);
      const averageRating = clientReviews.length > 0 
        ? clientReviews.reduce((sum, review) => sum + review.rating, 0) / clientReviews.length 
        : 0;

      return {
        user: client,
        completedBookings,
        totalSpent,
        averageRating
      };
    });

    // Sort by total spent (descending)
    clientReports.sort((a, b) => b.totalSpent - a.totalSpent);

    return {
      success: true,
      data: clientReports
    };
  } catch (error) {
    console.error('Error fetching client reports data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch client reports data'
    };
  }
}
