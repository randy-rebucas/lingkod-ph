'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc,
  orderBy,
  serverTimestamp
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = ['createdAt', 'updatedAt', 'date', 'requestedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');
const PayoutRequestSchema = z.object({
  amount: z.number().min(0.01, 'Amount must be greater than 0'),
  providerId: z.string().min(1, 'Provider ID is required'),
  agencyId: z.string().optional(),
});

// Get provider earnings data
export async function getProviderEarningsData(providerId: string): Promise<{
  success: boolean;
  data?: {
    completedBookings: any[];
    payouts: any[];
    totalEarnings: number;
    pendingEarnings: number;
  };
  error?: string;
}> {
  try {
    const validatedProviderId = UserIdSchema.parse(providerId);
    
    // Get completed bookings for this provider
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "==", validatedProviderId),
      where("status", "==", "Completed"),
      orderBy("date", "desc")
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const completedBookings = bookingsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get payout requests for this provider
    const payoutsQuery = query(
      collection(getDb(), "payouts"), 
      where("providerId", "==", validatedProviderId),
      orderBy("requestedAt", "desc")
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    const payouts = payoutsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Calculate totals
    const totalEarnings = completedBookings.reduce((sum, booking) => sum + booking.price, 0);
    const paidPayouts = payouts.filter(payout => payout.status === 'Paid');
    const totalPaid = paidPayouts.reduce((sum, payout) => sum + payout.amount, 0);
    const pendingEarnings = totalEarnings - totalPaid;

    return {
      success: true,
      data: {
        completedBookings,
        payouts,
        totalEarnings,
        pendingEarnings
      }
    };
  } catch (error) {
    console.error('Error fetching provider earnings data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch earnings data'
    };
  }
}

// Request payout
export async function requestPayout(data: {
  amount: number;
  providerId: string;
  agencyId?: string;
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const validatedData = PayoutRequestSchema.parse(data);
    
    const payoutData = {
      ...validatedData,
      status: 'Pending',
      requestedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(getDb(), "payouts"), payoutData);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error requesting payout:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to request payout'
    };
  }
}
