# Firebase Setup Guide

## Quick Fix for "Failed to fetch" Error

The "Failed to fetch" error you're experiencing is caused by missing Firebase configuration. Here are two ways to fix it:

### Option 1: Quick Development Setup (Recommended for now)

The application has been updated to run in development mode without Firebase. Simply restart your development server:

```bash
npm run dev
```

The app will now work without Firebase configuration, but authentication features will be disabled.

### Option 2: Full Firebase Setup (For production)

1. Create a `.env.local` file in your project root with the following content:

```env
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (for server-side operations)
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nyour-private-key-here\n-----END PRIVATE KEY-----\n"
```

2. Get these values from your Firebase Console:
   - Go to Project Settings > General
   - Copy the config values from "Your apps" section
   - For Admin SDK, go to Project Settings > Service Accounts and generate a new private key

3. Restart your development server:
```bash
npm run dev
```

## What Was Fixed

1. **Firebase Initialization**: Made Firebase initialization more robust with proper error handling
2. **Development Mode**: Added a development mode that allows the app to run without Firebase
3. **Middleware**: Updated middleware to skip authentication when Firebase is not configured
4. **Auth Context**: Updated auth context to handle missing Firebase gracefully

## Current Status

- ✅ App will run without Firebase configuration
- ✅ Navigation and routing will work
- ✅ UI components will render properly
- ⚠️ Authentication features are disabled in development mode
- ⚠️ Database operations are disabled in development mode

To enable full functionality, set up Firebase as described in Option 2.
