#!/usr/bin/env tsx

/**
 * Firebase Environment Setup
 * 
 * This script helps set up the Firebase environment for the subscription system.
 * It provides guidance on enabling Firestore API and configuring the project.
 * 
 * Usage: npm run setup-firebase
 */

import { existsSync } from 'fs';
import { join } from 'path';

interface FirebaseSetupStep {
  step: number;
  title: string;
  description: string;
  action: string;
  critical: boolean;
}

class FirebaseSetupGuide {
  private projectRoot: string;

  constructor() {
    this.projectRoot = process.cwd();
  }

  private checkEnvironmentFile(): boolean {
    const envFiles = ['.env.local', '.env', '.env.development'];
    
    for (const envFile of envFiles) {
      const envPath = join(this.projectRoot, envFile);
      if (existsSync(envPath)) {
        console.log(`✅ Found environment file: ${envFile}`);
        return true;
      }
    }
    
    console.log('❌ No environment file found');
    return false;
  }

  private getSetupSteps(): FirebaseSetupStep[] {
    return [
      {
        step: 1,
        title: 'Create Firebase Project',
        description: 'Create a new Firebase project or use an existing one',
        action: 'Visit https://console.firebase.google.com/ and create a new project',
        critical: true
      },
      {
        step: 2,
        title: 'Enable Firestore Database',
        description: 'Enable Cloud Firestore API for your project',
        action: 'Go to Firebase Console > Firestore Database > Create database > Start in test mode',
        critical: true
      },
      {
        step: 3,
        title: 'Enable Authentication',
        description: 'Enable Firebase Authentication',
        action: 'Go to Firebase Console > Authentication > Get started > Sign-in method > Enable Email/Password',
        critical: true
      },
      {
        step: 4,
        title: 'Get Project Configuration',
        description: 'Get your Firebase project configuration',
        action: 'Go to Firebase Console > Project Settings > General > Your apps > Web app > Config',
        critical: true
      },
      {
        step: 5,
        title: 'Create Service Account',
        description: 'Create a service account for server-side operations',
        action: 'Go to Firebase Console > Project Settings > Service accounts > Generate new private key',
        critical: true
      },
      {
        step: 6,
        title: 'Configure Environment Variables',
        description: 'Set up your environment variables',
        action: 'Create .env.local file with your Firebase configuration',
        critical: true
      },
      {
        step: 7,
        title: 'Test Connection',
        description: 'Test the Firebase connection',
        action: 'Run: npm run init-subscriptions',
        critical: false
      }
    ];
  }

  private generateEnvTemplate(): string {
    return `# Firebase Configuration
# Get these values from Firebase Console > Project Settings > General > Your apps

NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key-here
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-sender-id
NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id

# Firebase Admin SDK (for server-side operations)
# Get these from Firebase Console > Project Settings > Service accounts

FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\nYour-private-key-here\\n-----END PRIVATE KEY-----"

# Payment Configuration (Optional - for production)
ADYEN_API_KEY=your-adyen-api-key
ADYEN_MERCHANT_ACCOUNT=your-merchant-account
ADYEN_ENVIRONMENT=test
ADYEN_CLIENT_KEY=your-client-key
ADYEN_HMAC_KEY=your-hmac-key

PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_CLIENT_SECRET=your-paypal-client-secret

# GCash Configuration
GCASH_ACCOUNT_NAME=Your Business Name
GCASH_ACCOUNT_NUMBER=your-gcash-number

# Maya Configuration
MAYA_ACCOUNT_NAME=Your Business Name
MAYA_ACCOUNT_NUMBER=your-maya-number

# Bank Transfer Configuration
BANK_ACCOUNT_NAME=Your Business Name Inc.
BANK_ACCOUNT_NUMBER=your-bank-account
BANK_NAME=Your Bank Name
`;
  }

  async runSetup(): Promise<void> {
    console.log('🔥 Firebase Environment Setup Guide\n');
    console.log('=' .repeat(60));

    // Check current environment
    console.log('\n📋 Current Environment Status:');
    const hasEnvFile = this.checkEnvironmentFile();

    if (!hasEnvFile) {
      console.log('\n⚠️  No environment file found. You need to create one.');
    }

    // Display setup steps
    console.log('\n📋 Firebase Setup Steps:');
    const steps = this.getSetupSteps();

    steps.forEach(step => {
      const icon = step.critical ? '🔴' : '🟡';
      console.log(`\n${icon} Step ${step.step}: ${step.title}`);
      console.log(`   Description: ${step.description}`);
      console.log(`   Action: ${step.action}`);
    });

    // Generate environment template
    console.log('\n📋 Environment Variables Template:');
    console.log('=' .repeat(60));
    console.log(this.generateEnvTemplate());

    // Instructions
    console.log('\n📋 Instructions:');
    console.log('1. Follow the setup steps above');
    console.log('2. Copy the environment template above');
    console.log('3. Create a .env.local file in your project root');
    console.log('4. Replace the placeholder values with your actual Firebase configuration');
    console.log('5. Run: npm run init-subscriptions');

    // Common issues and solutions
    console.log('\n🔧 Common Issues & Solutions:');
    console.log('\n❌ "Firestore API has not been used"');
    console.log('   Solution: Enable Firestore Database in Firebase Console');
    console.log('   Go to: Firebase Console > Firestore Database > Create database');

    console.log('\n❌ "Permission denied"');
    console.log('   Solution: Check your Firebase project ID and service account permissions');
    console.log('   Make sure the service account has Firestore access');

    console.log('\n❌ "Invalid API key"');
    console.log('   Solution: Verify your API key in Firebase Console > Project Settings');

    console.log('\n❌ "Project not found"');
    console.log('   Solution: Check your project ID and make sure the project exists');

    // Next steps
    console.log('\n🚀 Next Steps:');
    console.log('1. Complete the Firebase setup');
    console.log('2. Configure your environment variables');
    console.log('3. Run: npm run init-subscriptions');
    console.log('4. Run: npm run test-subscriptions');
    console.log('5. Run: npm run check-production-readiness');

    console.log('\n💡 Need Help?');
    console.log('- Firebase Documentation: https://firebase.google.com/docs');
    console.log('- Firestore Setup: https://firebase.google.com/docs/firestore/quickstart');
    console.log('- Authentication Setup: https://firebase.google.com/docs/auth/web/start');
  }
}

// Run the setup guide
if (require.main === module) {
  const setup = new FirebaseSetupGuide();
  setup.runSetup()
    .then(() => {
      console.log('\n✨ Firebase setup guide completed!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Firebase setup guide failed:', error);
      process.exit(1);
    });
}

export { FirebaseSetupGuide };
