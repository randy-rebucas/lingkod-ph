
'use server';

/**
 * @fileOverview A Genkit flow for creating a backup of key Firestore collections.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { getDb } from '@/lib/firebase';
import { adminStorage } from '@/lib/firebase-admin';

const BackupResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  backupUrl: z.string().optional(),
  documentCount: z.number(),
});
export type BackupResult = z.infer<typeof BackupResultSchema>;

type Actor = {
  id: string;
  name: string | null;
  role: string;
};

const COLLECTIONS_TO_BACKUP = [
    'users', 'jobs', 'bookings', 'services', 'reviews', 
    'invoices', 'quotes', 'transactions', 'payouts', 
    'categories', 'loyaltyRewards', 'adCampaigns'
];

export async function createBackup(actor: Actor): Promise<BackupResult> {
  // Verify admin role
  if (actor.role !== 'admin') {
    return {
      success: false,
      message: 'Admin privileges required to create backups.',
      documentCount: 0
    };
  }
  
  return createBackupFlow({ actor });
}

const createBackupFlow = ai.defineFlow(
  {
    name: 'createBackupFlow',
    inputSchema: z.object({
      actor: z.object({
        id: z.string(),
        name: z.string().nullable(),
        role: z.string(),
      }),
    }),
    outputSchema: BackupResultSchema,
  },
  async ({ actor: _actor }) => {
    try {
        const backupData: Record<string, any[]> = {};
        let totalDocuments = 0;

        const db = getDb();
        for (const collectionName of COLLECTIONS_TO_BACKUP) {
            const snapshot = await getDocs(collection(db, collectionName));
            backupData[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            totalDocuments += snapshot.docs.length;
        }

        const backupContent = JSON.stringify(backupData, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `backup-${timestamp}.json`;
        const storagePath = `backups/${fileName}`;
        
        // Use Firebase Admin SDK for storage operations (bypasses security rules)
        // Following Google Cloud best practices for client library authentication
        const bucketName = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
        if (!bucketName) {
            throw new Error('Firebase Storage bucket name not configured. Please set NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET environment variable.');
        }
        
        // Get the storage bucket - the client library automatically uses ADC for authentication
        const bucket = adminStorage.bucket(bucketName);
        const file = bucket.file(storagePath);
        
        // Upload the backup file
        await file.save(backupContent, {
            metadata: {
                contentType: 'application/json',
            },
        });
        
        // Make the file publicly accessible and generate download URL
        await file.makePublic();
        const downloadUrl = `https://storage.googleapis.com/${bucketName}/${storagePath}`;

        // Create a metadata record in Firestore
        await addDoc(collection(db, 'backups'), {
            fileName,
            filePath: storagePath,
            downloadUrl,
            collections: COLLECTIONS_TO_BACKUP,
            documentCount: totalDocuments,
            createdAt: serverTimestamp(),
        });
      
        return {
            success: true,
            message: `Successfully backed up ${totalDocuments} documents from ${COLLECTIONS_TO_BACKUP.length} collections.`,
            backupUrl: downloadUrl,
            documentCount: totalDocuments
        };
    } catch (error: any) {
      console.error("Backup failed:", error);
      return {
        success: false,
        message: error.message || 'An unknown error occurred during backup.',
        documentCount: 0
      };
    }
  }
);
