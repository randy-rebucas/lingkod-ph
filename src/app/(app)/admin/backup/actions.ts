'use server';

import { getDb } from '@/lib/firebase';
import { 
  collection, 
  query, 
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
  const timestampFields = ['createdAt', 'updatedAt'];
  
  timestampFields.forEach(field => {
    if (serialized[field] && typeof serialized[field].toDate === 'function') {
      serialized[field] = serialized[field].toDate();
    }
  });
  
  return serialized;
};

// Validation schemas
const BackupSchema = z.object({
  fileName: z.string().min(1, 'File name is required'),
  downloadUrl: z.string().url('Valid download URL is required'),
  documentCount: z.number().min(0, 'Document count must be non-negative'),
  collections: z.array(z.string()).min(1, 'At least one collection is required'),
});

// Get all backups
export async function getAllBackups(): Promise<{
  success: boolean;
  data?: any[];
  error?: string;
}> {
  try {
    const backupsQuery = query(
      collection(getDb(), "backups"), 
      orderBy("createdAt", "desc")
    );
    const backupsSnapshot = await getDocs(backupsQuery);
    const backups = backupsSnapshot.docs.map(doc => 
      serializeTimestamps({ id: doc.id, ...doc.data() })
    );

    return {
      success: true,
      data: backups
    };
  } catch (error) {
    console.error('Error fetching backups:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch backups'
    };
  }
}

// Create backup record
export async function createBackupRecord(data: {
  fileName: string;
  downloadUrl: string;
  documentCount: number;
  collections: string[];
}): Promise<{
  success: boolean;
  data?: { id: string };
  error?: string;
}> {
  try {
    const validatedData = BackupSchema.parse(data);
    
    const backupData = {
      ...validatedData,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    };

    const docRef = await addDoc(collection(getDb(), "backups"), backupData);

    return {
      success: true,
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating backup record:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to create backup record'
    };
  }
}
