import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK using Application Default Credentials (ADC)
// This follows Google Cloud best practices for authentication
if (!getApps().length) {
  initializeApp({
    // No explicit credentials - uses Application Default Credentials
    // The client library automatically finds credentials using ADC
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  });
}

export const adminDb = getFirestore();
export const adminStorage = getStorage();
export const adminAuth = getAuth();
