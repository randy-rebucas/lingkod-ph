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
  const timestampFields = ['createdAt', 'updatedAt', 'joinedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Get admin dashboard data
export async function getAdminDashboardData(): Promise<{
  success: boolean;
  data?: {
    totalUsers: number;
    totalBookings: number;
    totalRevenue: number;
    recentBookings: any[];
    recentUsers: any[];
    userStats: {
      clients: number;
      providers: number;
      agencies: number;
    };
  };
  error?: string;
}> {
  try {
    // Get all users
    const usersQuery = query(
      collection(getDb(), "users"), 
      orderBy("joinedAt", "desc")
    );
    const usersSnapshot = await getDocs(usersQuery);
    const users = usersSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get all bookings
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      orderBy("createdAt", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate stats
    const totalUsers = users.length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(booking => booking.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, booking) => sum + booking.price, 0);

    // User role stats
    const userStats = {
      clients: users.filter(user => user.role === 'client').length,
      providers: users.filter(user => user.role === 'provider').length,
      agencies: users.filter(user => user.role === 'agency').length,
    };

    // Recent data
    const recentBookings = bookings.slice(0, 10);
    const recentUsers = users.slice(0, 10);

    return {
      success: true,
      data: {
        totalUsers,
        totalBookings,
        totalRevenue,
        recentBookings,
        recentUsers,
        userStats
      }
    };
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch admin dashboard data'
    };
  }
}
