// Database Services
export { getDb, getAuthInstance, getStorageInstance } from './firebase';
export { app, auth, db, storage } from './firebase';

// Re-export types
export type { FirebaseApp } from 'firebase/app';
export type { Auth } from 'firebase/auth';
export type { Firestore } from 'firebase/firestore';
export type { FirebaseStorage } from 'firebase/storage';
