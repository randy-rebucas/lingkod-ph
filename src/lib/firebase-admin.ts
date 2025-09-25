import { initializeApp, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK with fallback configuration for development
if (!getApps().length) {
  try {
    // Try to initialize with project ID if available
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localpro-dev';
    
    initializeApp({
      projectId: projectId,
      storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
    });
  } catch (error) {
    console.warn('Firebase Admin initialization failed:', error);
    // Initialize with minimal config for development
    initializeApp({
      projectId: 'localpro-dev',
      storageBucket: 'localpro-dev.appspot.com',
    });
  }
}

// Export with error handling for development
export const adminDb = getFirestore();
export const adminStorage = getStorage();
export const adminAuth = getAuth();
