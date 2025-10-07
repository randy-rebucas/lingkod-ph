import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getStorage } from 'firebase-admin/storage';
import { getAuth } from 'firebase-admin/auth';

// Initialize Firebase Admin SDK with proper credentials
let adminDb: any = null;
let adminStorage: any = null;
let adminAuth: any = null;

if (!getApps().length) {
  try {
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'localpro-dev';
    
    // Check if we have service account credentials
    if (process.env.FIREBASE_PRIVATE_KEY && process.env.FIREBASE_CLIENT_EMAIL) {
      // Initialize with service account credentials
      initializeApp({
        credential: cert({
          projectId: projectId,
          privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
          clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        }),
        projectId: projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      console.log('✅ Firebase Admin SDK initialized with service account credentials');
    } else {
      // Initialize with project ID only (for development)
      initializeApp({
        projectId: projectId,
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || `${projectId}.appspot.com`,
      });
      console.log('⚠️ Firebase Admin SDK initialized without service account credentials (development mode)');
    }
    
    // Initialize services
    adminDb = getFirestore();
    adminStorage = getStorage();
    adminAuth = getAuth();
    
  } catch (error) {
    console.error('❌ Firebase Admin initialization failed:', error);
    // Set to null to indicate failure
    adminDb = null;
    adminStorage = null;
    adminAuth = null;
  }
} else {
  // App already initialized, get services
  adminDb = getFirestore();
  adminStorage = getStorage();
  adminAuth = getAuth();
}

// Export with error handling
export { adminDb, adminStorage, adminAuth };
