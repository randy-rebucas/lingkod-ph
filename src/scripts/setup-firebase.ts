#!/usr/bin/env tsx

/**
 * Firebase Setup Helper Script
 * 
 * This script helps you set up Firebase for the Learning Hub mock data seeding.
 * Run this script to get step-by-step instructions for Firebase setup.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { join } from 'path';

function printBanner() {
  console.log(`
🔥 Firebase Setup Helper
========================

This script will help you set up Firebase for the Learning Hub mock data seeding.
`);
}

function printInstructions() {
  console.log(`
📋 Step-by-Step Firebase Setup Instructions:

1. 🌐 Go to Firebase Console
   https://console.firebase.google.com/

2. 🆕 Create a new project or select existing project
   - Click "Create a project" or select your project
   - Follow the setup wizard

3. 🗄️ Enable Firestore Database
   - Go to "Firestore Database" in the left sidebar
   - Click "Create database"
   - Choose "Start in test mode" (for development)
   - Select a location for your database

4. 🔧 Get Firebase Configuration
   - Go to "Project Settings" (gear icon)
   - Scroll down to "Your apps" section
   - Click the web app icon (</>) or "Add app" > "Web"
   - Register your app with a nickname (e.g., "localpro-web")
   - Copy the Firebase SDK configuration

5. 📝 Create Environment File
   - Create a file named ".env.local" in your project root
   - Add the following content with your actual values:

NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

6. 🔒 Set Up Firestore Security Rules (for development)
   - Go to "Firestore Database" > "Rules"
   - Replace the rules with:

rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if true;
    }
  }
}

⚠️  WARNING: These rules allow anyone to read/write all data. 
    Only use for development!

7. ✅ Test the Setup
   - Run: npm run dev
   - Check browser console for Firebase connection status
   - If successful, you should see: "✅ Firebase initialized successfully"

8. 🌱 Seed Mock Data
   - Once Firebase is set up, run:
   - npx tsx src/scripts/seed-mock-learning-hub-data.ts

📚 Need Help?
- Firebase Documentation: https://firebase.google.com/docs
- Firestore Quickstart: https://firebase.google.com/docs/firestore/quickstart
- Firebase Console: https://console.firebase.google.com/
`);
}

function checkEnvironmentFile() {
  const envPath = join(process.cwd(), '.env.local');
  
  if (existsSync(envPath)) {
    console.log('✅ Found .env.local file');
    
    try {
      const envContent = readFileSync(envPath, 'utf8');
      
      // Check for required Firebase environment variables
      const requiredVars = [
        'NEXT_PUBLIC_FIREBASE_API_KEY',
        'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
        'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
        'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
        'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
        'NEXT_PUBLIC_FIREBASE_APP_ID'
      ];
      
      const missingVars = requiredVars.filter(varName => 
        !envContent.includes(varName) || envContent.includes(`${varName}=your_`)
      );
      
      if (missingVars.length === 0) {
        console.log('✅ All required Firebase environment variables are configured');
        console.log('🚀 You can now run the mock data seeding script:');
        console.log('   npx tsx src/scripts/seed-mock-learning-hub-data.ts');
      } else {
        console.log('⚠️  Missing or incomplete Firebase environment variables:');
        missingVars.forEach(varName => console.log(`   - ${varName}`));
        console.log('\n📝 Please update your .env.local file with the correct values');
      }
    } catch (error) {
      console.log('❌ Error reading .env.local file:', error);
    }
  } else {
    console.log('❌ No .env.local file found');
    console.log('📝 Please create .env.local file with your Firebase configuration');
  }
}

function createEnvTemplate() {
  const envPath = join(process.cwd(), '.env.local');
  
  if (!existsSync(envPath)) {
    const template = `# Firebase Configuration
# Get these values from Firebase Console > Project Settings > Your apps > Web app
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key_here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Optional: Firebase Admin SDK (for server-side operations)
# Get these from Firebase Console > Project Settings > Service accounts
FIREBASE_ADMIN_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour private key here\\n-----END PRIVATE KEY-----\\n"
FIREBASE_ADMIN_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your_project_id.iam.gserviceaccount.com
`;
    
    try {
      writeFileSync(envPath, template);
      console.log('✅ Created .env.local template file');
      console.log('📝 Please edit .env.local with your actual Firebase configuration values');
    } catch (error) {
      console.log('❌ Error creating .env.local file:', error);
    }
  }
}

async function main() {
  printBanner();
  
  const args = process.argv.slice(2);
  
  if (args.includes('--create-env')) {
    createEnvTemplate();
    return;
  }
  
  if (args.includes('--check')) {
    checkEnvironmentFile();
    return;
  }
  
  printInstructions();
  checkEnvironmentFile();
  
  console.log('\n🔧 Quick Commands:');
  console.log('   --create-env  Create .env.local template file');
  console.log('   --check       Check current Firebase configuration');
}

main().catch(console.error);
