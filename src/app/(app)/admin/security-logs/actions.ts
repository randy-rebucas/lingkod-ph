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
  const timestampFields = ['createdAt', 'updatedAt', 'timestamp'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Get security logs
export async function getSecurityLogs(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const logsQuery = query(
      collection(getDb(), "auditLogs"), 
      orderBy("timestamp", "desc")
    );
    const logsSnapshot = await getDocs(logsQuery);
    const logs = logsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: logs
    };
  } catch (error) {
    console.error('Error fetching security logs:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch security logs'
    };
  }
}
