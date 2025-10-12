'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  getDocs, 
  orderBy
} from 'firebase/firestore';

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

// Get admin reports data
export async function getAdminReportsData(): Promise<{
  success: boolean;
  data?: {
    bookings: any[];
    users: any[];
    totalRevenue: number;
    totalBookings: number;
    totalUsers: number;
  };
  error?: string;
}> {
  try {
    // Get all bookings
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      orderBy("date", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get all users
    const usersQuery = query(
      collection(getDb(), "users"), 
      orderBy("joinedAt", "desc")
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate totals
    const completedBookings = bookings.filter(booking => booking.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.price, 0);
    const totalBookings = bookings.length;
    const totalUsers = users.length;

    return {
      success: true,
      data: {
        bookings,
        users,
        totalRevenue,
        totalBookings,
        totalUsers
      }
    };
  } catch (error) {
    console.error('Error fetching admin reports data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch admin reports data'
    };
  }
}
