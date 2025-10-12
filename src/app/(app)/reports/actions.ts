
'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  updateDoc,
  serverTimestamp,
  orderBy
} from 'firebase/firestore';
import { z } from 'zod';

// Utility function to serialize Firebase Timestamps for client components
const serializeTimestamps = (data: any): any => {
  if (!data || typeof data !== 'object') return data;
  
  const serialized = { ...data };
  
  // Convert common Timestamp fields
  const timestampFields = [
    'createdAt', 'updatedAt', 'requestedAt', 'date', 'submittedAt', 'endDate', 
    'favoritedAt', 'timestamp', 'establishedDate'
  ];
  
  // Handle top-level timestamp fields
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  // Handle nested timestamp fields in verification object
  if (serialized.verification && typeof serialized.verification === 'object') {
    const verification = { ...serialized.verification };
    timestampFields.forEach(field => {
      if (verification[field] && typeof verification[field].toDate === 'function') {
        verification[field] = verification[field].toDate();
      }
    });
    serialized.verification = verification;
  }
  
  // Handle nested timestamp fields in other common nested objects
  const nestedObjects = ['payoutDetails', 'documents', 'metadata'];
  nestedObjects.forEach(objKey => {
    if (serialized[objKey] && typeof serialized[objKey] === 'object') {
      if (Array.isArray(serialized[objKey])) {
        serialized[objKey] = serialized[objKey].map((item: any) => 
          typeof item === 'object' ? serializeTimestamps(item) : item
        );
      } else {
        serialized[objKey] = serializeTimestamps(serialized[objKey]);
      }
    }
  });
  
  return serialized;
};

// Validation schemas
const AgencyIdSchema = z.string().min(1, 'Agency ID is required');
const PayoutIdSchema = z.string().min(1, 'Payout ID is required');

// Get agency reports data
export async function getAgencyReportsData(agencyId: string): Promise<{
  success: boolean;
  data?: {
    bookings: any[];
    payouts: any[];
    providerIds: string[];
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
          providerIds: []
        }
      };
    }

    // Get bookings for these providers
    const bookingsQuery = query(
      collection(getDb(), "bookings"), 
      where("providerId", "in", providerIds)
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

    return {
      success: true,
      data: {
        bookings,
        payouts,
        providerIds
      }
    };
  } catch (error) {
    console.error('Error fetching agency reports data:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch reports data'
    };
  }
}

// Mark payout as paid
export async function markPayoutAsPaid(payoutId: string): Promise<{
  success: boolean;
  error?: string;
}> {
  try {
    const validatedPayoutId = PayoutIdSchema.parse(payoutId);
    
    const payoutRef = doc(getDb(), "payouts", validatedPayoutId);
    await updateDoc(payoutRef, {
      status: "Paid",
      paidAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });

    return { success: true };
  } catch (error) {
    console.error('Error marking payout as paid:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to mark payout as paid'
    };
  }
}
