
import { getApp, getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { Firestore, initializeFirestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

// Check if Firebase environment variables are configured
const isFirebaseConfigured = () => {
  return !!(
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY &&
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN &&
    process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET &&
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID &&
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID
  );
};

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY || "demo-api-key",
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || "demo-project.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "demo-project",
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || "demo-project.appspot.com",
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "123456789",
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID || "1:123456789:web:demo",
};

// Initialize Firebase with error handling for development
let app: FirebaseApp | null;
let auth: Auth | null;
let db: Firestore | null;
let storage: FirebaseStorage | null;

// Only initialize Firebase if environment variables are properly configured
if (isFirebaseConfigured()) {
  try {
    app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
    auth = getAuth(app);
    
    // Initialize Firestore with long polling to avoid WebChannel issues
    db = initializeFirestore(app, {
      experimentalForceLongPolling: true,
    });
    
    storage = getStorage(app);
    console.log('✅ Firebase initialized successfully with long polling');
  } catch (error) {
    console.error('❌ Firebase client initialization failed:', error);
    console.warn('Please check your Firebase configuration in .env.local');
    
    // Create mock objects for development
    app = null;
    auth = null;
    db = null;
    storage = null;
  }
} else {
  console.warn('⚠️  Firebase environment variables not configured');
  console.warn('📖 Please follow the setup guide: FIREBASE-SETUP-GUIDE.md');
  console.warn('🔧 Create a .env.local file with your Firebase configuration');
  
  // Create mock objects for development
  app = null;
  auth = null;
  db = null;
  storage = null;
}

// Helper function to ensure database is available
export function getDb(): Firestore {
  if (!db) {
    const errorMessage = isFirebaseConfigured() 
      ? 'Firebase Firestore is not initialized. Please check your Firebase configuration.'
      : 'Firebase environment variables are not configured. Please create a .env.local file with your Firebase configuration. See FIREBASE-SETUP-GUIDE.md for instructions.';
    throw new Error(errorMessage);
  }
  return db;
}

// Safe version that returns null instead of throwing
export function getDbSafe(): Firestore | null {
  return db;
}

// Helper function to ensure auth is available
export function getAuthInstance(): Auth {
  if (!auth) {
    const errorMessage = isFirebaseConfigured() 
      ? 'Firebase Auth is not initialized. Please check your Firebase configuration.'
      : 'Firebase environment variables are not configured. Please create a .env.local file with your Firebase configuration. See FIREBASE-SETUP-GUIDE.md for instructions.';
    throw new Error(errorMessage);
  }
  return auth;
}

// Helper function to ensure storage is available
export function getStorageInstance(): FirebaseStorage {
  if (!storage) {
    const errorMessage = isFirebaseConfigured() 
      ? 'Firebase Storage is not initialized. Please check your Firebase configuration.'
      : 'Firebase environment variables are not configured. Please create a .env.local file with your Firebase configuration. See FIREBASE-SETUP-GUIDE.md for instructions.';
    throw new Error(errorMessage);
  }
  return storage;
}

export { app, auth, db, storage };
