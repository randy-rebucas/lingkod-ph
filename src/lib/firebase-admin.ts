import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

let adminApp: App;
let adminAuth: Auth;
let adminDb: Firestore;
let adminStorage: Storage;

try {
  // Check if required environment variables are present
  const requiredEnvVars = {
    FIREBASE_PROJECT_ID: process.env.FIREBASE_PROJECT_ID,
    FIREBASE_CLIENT_EMAIL: process.env.FIREBASE_CLIENT_EMAIL,
    FIREBASE_PRIVATE_KEY: process.env.FIREBASE_PRIVATE_KEY,
  };

  const missingVars = Object.entries(requiredEnvVars)
    .filter(([_, value]) => !value || value.trim() === '')
    .map(([key, _]) => key);

  if (missingVars.length > 0) {
    throw new Error(`Missing required Firebase environment variables: ${missingVars.join(', ')}`);
  }

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
  
  console.log('✅ Firebase Admin SDK initialized successfully');
} catch (error) {
  console.warn('❌ Firebase Admin initialization failed:', error);
  console.warn('📋 To fix this issue:');
  console.warn('   1. Create a .env.local file in your project root');
  console.warn('   2. Add the following environment variables:');
  console.warn('      FIREBASE_PROJECT_ID=your-firebase-project-id');
  console.warn('      FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com');
  console.warn('      FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYOUR_PRIVATE_KEY_HERE\\n-----END PRIVATE KEY-----\\n"');
  console.warn('   3. Get these values from Firebase Console > Project Settings > Service Accounts');
  console.warn('   4. Restart your development server');
  
  // Create mock objects for development
  adminApp = {} as App;
  adminAuth = {} as Auth;
  adminDb = {} as Firestore;
  adminStorage = {} as Storage;
}

export { adminApp, adminAuth, adminDb, adminStorage };