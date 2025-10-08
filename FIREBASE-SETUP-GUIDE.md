# Firebase Setup Guide

## 🔥 Firestore Connection Error Fix

The error you're seeing occurs because Firebase environment variables are not configured. Follow these steps to set up Firebase properly:

## Step 1: Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Create a project" or select an existing project
3. Follow the setup wizard

## Step 2: Enable Firestore

1. In your Firebase project, go to **Firestore Database**
2. Click "Create database"
3. Choose "Start in test mode" (for development)
4. Select a location for your database

## Step 3: Get Firebase Configuration

1. Go to **Project Settings** (gear icon)
2. Scroll down to "Your apps" section
3. Click the web app icon `</>` or "Add app" > "Web"
4. Register your app with a nickname (e.g., "lingkod-ph-web")
5. Copy the Firebase SDK configuration

## Step 4: Create Environment File

Create a `.env.local` file in your project root with the following content:

```bash
# Firebase Configuration
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Admin SDK (for server-side operations)
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYour private key here\n-----END PRIVATE KEY-----\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
```

Replace the placeholder values with your actual Firebase configuration values.

## Step 5: Enable Authentication (Optional)

If you plan to use Firebase Authentication:

1. Go to **Authentication** in Firebase Console
2. Click "Get started"
3. Go to **Sign-in method** tab
4. Enable the authentication methods you want to use:
   - **Email/Password**: For traditional email/password login
   - **Google**: For Google OAuth login
   - **Facebook**: For Facebook OAuth login

### Facebook Authentication Setup

To enable Facebook login:

1. In Firebase Console, go to **Authentication** > **Sign-in method**
2. Click on **Facebook** provider
3. Enable Facebook authentication
4. You'll need to create a Facebook App:
   - Go to [Facebook Developers](https://developers.facebook.com/)
   - Create a new app or use an existing one
   - Add Facebook Login product to your app
   - Get your **App ID** and **App Secret**
   - Add your domain to the Facebook app settings
5. Enter your Facebook **App ID** and **App Secret** in Firebase Console
6. Add your authorized domains (your website domain and localhost for development)

### Required Facebook App Settings

In your Facebook App settings, make sure to:

1. Add your domain to **App Domains**
2. Add your website URL to **Website** platform
3. Add `https://your-project-id.firebaseapp.com/__/auth/handler` to **Valid OAuth Redirect URIs**
4. For development, also add `http://localhost:3000/__/auth/handler`

## Step 6: Set Up Firestore Security Rules

1. Go to **Firestore Database** > **Rules**
2. For development, you can use these basic rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents for authenticated users
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**⚠️ Important**: These rules allow any authenticated user to read/write all data. For production, implement proper security rules.

## Step 7: Test the Connection

1. Restart your development server:
   ```bash
   npm run dev
   ```

2. Check the browser console - the Firestore connection error should be resolved.

## Troubleshooting

### Still getting connection errors?

1. **Check your internet connection**
2. **Verify environment variables are loaded**:
   ```bash
   echo $NEXT_PUBLIC_FIREBASE_PROJECT_ID
   ```
3. **Check Firebase project status** in the Firebase Console
4. **Verify Firestore is enabled** in your Firebase project

### For Production Deployment

1. Set up proper Firestore security rules
2. Configure Firebase Admin SDK for server-side operations
3. Set up proper environment variables in your hosting platform
4. Enable Firebase App Check for additional security

## Quick Test

After setup, you can test Firestore connection by adding this to any component:

```typescript
import { getDb } from '@/lib/firebase';
import { collection, getDocs } from 'firebase/firestore';

// Test connection
const testConnection = async () => {
  try {
    const db = getDb();
    const testCollection = collection(db, 'test');
    await getDocs(testCollection);
    console.log('✅ Firestore connection successful!');
  } catch (error) {
    console.error('❌ Firestore connection failed:', error);
  }
};
```

## Need Help?

- [Firebase Documentation](https://firebase.google.com/docs)
- [Firestore Quickstart](https://firebase.google.com/docs/firestore/quickstart)
- [Firebase Console](https://console.firebase.google.com/)
