
import { getApp, getApps, initializeApp, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getStorage, FirebaseStorage } from "firebase/storage";

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

try {
  app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
  auth = getAuth(app);
  db = getFirestore(app);
  storage = getStorage(app);
} catch (error) {
  console.warn('Firebase client initialization failed:', error);
  console.warn('Please configure your Firebase environment variables in .env.local');
  
  // Create mock objects for development
  app = null;
  auth = null;
  db = null;
  storage = null;
}

// Helper function to ensure database is available
export function getDb(): Firestore | null {
  if (!db) {
    console.warn('Firebase Firestore is not initialized. Please check your Firebase configuration.');
    return null;
  }
  return db;
}

// Helper function to ensure auth is available
export function getAuthInstance(): Auth | null {
  if (!auth) {
    console.warn('Firebase Auth is not initialized. Please check your Firebase configuration.');
    return null;
  }
  return auth;
}

// Helper function to ensure storage is available
export function getStorageInstance(): FirebaseStorage | null {
  if (!storage) {
    console.warn('Firebase Storage is not initialized. Please check your Firebase configuration.');
    return null;
  }
  return storage;
}

export { app, auth, db, storage };
