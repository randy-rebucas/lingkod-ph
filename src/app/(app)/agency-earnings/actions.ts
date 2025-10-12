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
  const timestampFields = ['createdAt', 'updatedAt', 'requestedAt', 'date'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const AgencyIdSchema = z.string().min(1, 'Agency ID is required');

// Get agency earnings data
export async function getAgencyEarningsData(agencyId: string): Promise<{
  success: boolean;
  data?: {
    bookings: any[];
    payouts: any[];
    totalEarnings: number;
    totalPayouts: number;
    pendingEarnings: number;
  };
  error?: string;
}> {
  try {
    const validatedAgencyId = AgencyIdSchema.parse(agencyId);
    
    // Get providers under this agency
    const providersQuery = query(
      collection(getDb(), "users"), 
      where("agencyId", "==", validatedAgencyId)
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providerIds = providersSnapshot.docs.map(doc => doc.id);

    if (providerIds.length === 0) {
      return {
        success: true,
        data: {
          bookings: [],
          payouts: [],
          totalEarnings: 0,
          totalPayouts: 0,
          pendingEarnings: 0
        }
      };
    }

    // Get completed bookings for these providers
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "in", providerIds),
      where("status", "==", "Completed"),
      orderBy("date", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get payouts for this agency
    const payoutsQuery = query(
      collection(getDb(), "payouts"), 
      where("agencyId", "==", validatedAgencyId),
      orderBy("requestedAt", "desc")
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    const payouts = payoutsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate totals
    const totalEarnings = bookings.reduce((sum, booking) => sum + booking.price, 0);
    const paidPayouts = payouts.filter(payout => payout.status === 'Paid');
    const totalPayouts = paidPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const pendingEarnings = totalEarnings - totalPayouts;

    return {
      success: true,
      data: {
        bookings,
        payouts,
        totalEarnings,
        totalPayouts,
        pendingEarnings
      }
    };
  } catch (error) {
    console.error('Error fetching agency earnings data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch agency earnings data'
    };
  }
}
