# Firebase Setup Guide

## 🚨 Current Issue

Your application is failing to build because Firebase Admin SDK is not properly configured. The error indicates that required environment variables are missing.

## 🔧 Quick Fix

### Step 1: Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Firebase Configuration
FIREBASE_PROJECT_ID=your-firebase-project-id
FIREBASE_CLIENT_EMAIL=your-service-account-email@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY_HERE\n-----END PRIVATE KEY-----\n"

# Next.js Public Firebase Configuration (for client-side)
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-firebase-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
```

### Step 2: Get Firebase Configuration Values

1. **Go to Firebase Console**: https://console.firebase.google.com/
2. **Select your project** (or create a new one)
3. **Get Project Settings**:
   - Click the gear icon ⚙️ next to "Project Overview"
   - Select "Project settings"
   - Scroll down to "Your apps" section
   - Click on the web app icon `</>` or add a new web app

4. **Get Service Account Credentials**:
   - In Project Settings, go to "Service accounts" tab
   - Click "Generate new private key"
   - Download the JSON file
   - Extract the values:
     - `project_id` → `FIREBASE_PROJECT_ID`
     - `client_email` → `FIREBASE_CLIENT_EMAIL`
     - `private_key` → `FIREBASE_PRIVATE_KEY`

5. **Get Web App Configuration**:
   - In Project Settings, go to "General" tab
   - Scroll to "Your apps" section
   - Copy the config values:
     - `apiKey` → `NEXT_PUBLIC_FIREBASE_API_KEY`
     - `authDomain` → `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`
     - `projectId` → `NEXT_PUBLIC_FIREBASE_PROJECT_ID`
     - `storageBucket` → `NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET`
     - `messagingSenderId` → `NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID`
     - `appId` → `NEXT_PUBLIC_FIREBASE_APP_ID`

### Step 3: Enable Required Services

In your Firebase Console, enable these services:

1. **Firestore Database**:
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location

2. **Authentication**:
   - Go to "Authentication" in the left sidebar
   - Click "Get started"
   - Go to "Sign-in method" tab
   - Enable "Email/Password" provider

3. **Storage** (optional):
   - Go to "Storage" in the left sidebar
   - Click "Get started"
   - Choose "Start in test mode"

### Step 4: Restart Development Server

After creating the `.env.local` file:

```bash
# Stop your current development server (Ctrl+C)
# Then restart it
npm run dev
```

## 🔍 Verification

After setup, you should see:
- ✅ `Firebase Admin SDK initialized successfully` in your console
- No more "Service account object must contain a string 'project_id' property" errors
- Your application builds and runs without Firebase errors

## 🚨 Important Security Notes

1. **Never commit `.env.local`** to version control
2. **Keep your private keys secure**
3. **Use different Firebase projects** for development and production
4. **Set up proper Firestore security rules** before going to production

## 📚 Additional Resources

- [Firebase Admin SDK Setup](https://firebase.google.com/docs/admin/setup)
- [Next.js Environment Variables](https://nextjs.org/docs/basic-features/environment-variables)
- [Firestore Security Rules](https://firebase.google.com/docs/firestore/security/get-started)

## 🆘 Still Having Issues?

If you're still experiencing problems:

1. **Check the console output** for specific error messages
2. **Verify all environment variables** are set correctly
3. **Ensure your Firebase project** has the required services enabled
4. **Check that your private key** is properly formatted with `\n` characters

The updated Firebase Admin configuration now provides detailed error messages to help you identify exactly what's missing.
