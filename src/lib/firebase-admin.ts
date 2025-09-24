import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

try {
  // Initialize Firebase Admin SDK
  if (!getApps().length) {
    adminApp = initializeApp({
      credential: cert({
        projectId: process.env.FIREBASE_PROJECT_ID,
        clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
        privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      }),
    });
  } else {
    adminApp = getApps()[0];
  }
  
  adminAuth = getAuth(adminApp);
  adminDb = getFirestore(adminApp);
  adminStorage = getStorage(adminApp);
} catch (error) {
  console.warn('Firebase Admin initialization failed:', error);
  console.warn('Please configure your Firebase Admin environment variables');
  
  // Create mock objects for development
  adminApp = {} as App;
  adminAuth = {} as Auth;
  adminDb = {} as Firestore;
  adminStorage = {} as Storage;
}

export { adminApp, adminAuth, adminDb, adminStorage };