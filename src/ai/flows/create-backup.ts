
'use server';

/**
 * @fileOverview A Genkit flow for creating a backup of key Firestore collections.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadString, getDownloadURL } from 'firebase/storage';
import { db, storage } from '@/lib/firebase';

const BackupResultSchema = z.object({
  success: z.boolean(),
  message: z.string(),
  backupUrl: z.string().optional(),
  documentCount: z.number(),
});
export type BackupResult = z.infer<typeof BackupResultSchema>;

const COLLECTIONS_TO_BACKUP = [
    'users', 'jobs', 'bookings', 'services', 'reviews', 
    'invoices', 'quotes', 'transactions', 'payouts', 
    'categories', 'loyaltyRewards', 'adCampaigns'
];

export async function createBackup(): Promise<BackupResult> {
  return createBackupFlow();
}

const createBackupFlow = ai.defineFlow(
  {
    name: 'createBackupFlow',
    inputSchema: z.void(),
    outputSchema: BackupResultSchema,
  },
  async () => {
    try {
        const backupData: Record<string, any[]> = {};
        let totalDocuments = 0;

        for (const collectionName of COLLECTIONS_TO_BACKUP) {
            const snapshot = await getDocs(collection(db, collectionName));
            backupData[collectionName] = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            totalDocuments += snapshot.docs.length;
        }

        const backupContent = JSON.stringify(backupData, null, 2);
        const timestamp = new Date().toISOString().replace(/:/g, '-');
        const fileName = `backup-${timestamp}.json`;
        const storagePath = `backups/${fileName}`;
        const storageRef = ref(storage, storagePath);

        // Upload the JSON string
        await uploadString(storageRef, backupContent, 'raw', {
            contentType: 'application/json'
        });
        const downloadUrl = await getDownloadURL(storageRef);

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
