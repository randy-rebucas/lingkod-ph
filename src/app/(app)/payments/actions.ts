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
  const timestampFields = ['createdAt', 'updatedAt', 'verifiedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const UserIdSchema = z.string().min(1, 'User ID is required');

// Get payment transactions for a user
export async function getPaymentTransactions(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const validatedUserId = UserIdSchema.parse(userId);
    
    // Get transactions where user is either client or provider
    const transactionsQuery = query(
      collection(getDb(), "transactions"), 
      where("clientId", "==", validatedUserId),
      orderBy("createdAt", "desc")
    );
    const transactionsSnapshot = await getDocs(transactionsQuery);
    const clientTransactions = transactionsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Get transactions where user is provider
    const providerTransactionsQuery = query(
      collection(getDb(), "transactions"), 
      where("providerId", "==", validatedUserId),
      orderBy("createdAt", "desc")
    );
    const providerTransactionsSnapshot = await getDocs(providerTransactionsQuery);
    const providerTransactions = providerTransactionsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    // Combine and sort all transactions
    const allTransactions = [...clientTransactions, ...providerTransactions]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return {
      success: true,
      data: allTransactions
    };
  } catch (error) {
    console.error('Error fetching payment transactions:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch payment transactions'
    };
  }
}

// Get payments data (alias for getPaymentTransactions)
export async function getPaymentsData(userId: string): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  return getPaymentTransactions(userId);
}