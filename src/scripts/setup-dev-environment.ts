#!/usr/bin/env tsx

/**
 * Development Environment Setup Script
 * Helps set up the development environment with proper configuration
 */

import { writeFileSync, existsSync } from 'fs';
import { join } from 'path';

const ENV_TEMPLATE = `# Firebase Configuration
NEXT_PUBLIC_FIREBASE_PROJECT_ID=lingkod-ph-dev
NEXT_PUBLIC_FIREBASE_API_KEY=your-firebase-api-key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=lingkod-ph-dev.firebaseapp.com
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=lingkod-ph-dev.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=123456789
NEXT_PUBLIC_FIREBASE_APP_ID=1:123456789:web:abcdef123456

# Application Configuration
NEXT_PUBLIC_APP_URL=http://localhost:3000
JWT_SECRET=dev-jwt-secret-key-${Date.now()}
ENCRYPTION_KEY=dev-encryption-key-32-chars-long

# Payment Configuration
# GCash Configuration
GCASH_ACCOUNT_NAME=Lingkod PH Services
GCASH_ACCOUNT_NUMBER=0917-123-4567

# Maya Configuration
MAYA_ACCOUNT_NAME=Lingkod PH Services
MAYA_ACCOUNT_NUMBER=0918-000-5678

# Bank Configuration
BANK_ACCOUNT_NAME=Lingkod PH Services Inc.
BANK_ACCOUNT_NUMBER=1234-5678-90
BANK_NAME=BPI

# Adyen Configuration (for GCash payments) - Set these for production
ADYEN_API_KEY=
ADYEN_MERCHANT_ACCOUNT=
ADYEN_ENVIRONMENT=test
ADYEN_CLIENT_KEY=
ADYEN_HMAC_KEY=

# PayPal Configuration (for subscriptions) - Set these for production
NEXT_PUBLIC_PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=

# Email Configuration - Set these for production
RESEND_API_KEY=
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=

# Google Cloud Configuration (for Firebase Admin)
GOOGLE_APPLICATION_CREDENTIALS=
`;

function setupDevelopmentEnvironment() {
  console.log('🚀 Setting up development environment...\n');

  const envPath = join(process.cwd(), '.env.local');
  
  if (existsSync(envPath)) {
    console.log('⚠️  .env.local already exists. Skipping creation.');
    console.log('   If you want to recreate it, delete the existing file first.\n');
  } else {
    try {
      writeFileSync(envPath, ENV_TEMPLATE);
      console.log('✅ Created .env.local with development configuration');
      console.log('   Please update the Firebase configuration with your actual project details.\n');
    } catch (error) {
      console.error('❌ Failed to create .env.local:', error);
      console.log('\n📝 Please create .env.local manually with the following content:\n');
      console.log(ENV_TEMPLATE);
    }
  }

  console.log('📋 Next Steps:');
  console.log('1. Update Firebase configuration in .env.local');
  console.log('2. Set up Firebase project and get your configuration values');
  console.log('3. For production, configure Adyen and PayPal credentials');
  console.log('4. Run the payment system validation: npm run validate-payment-system\n');

  console.log('🔧 Development Mode Features:');
  console.log('- Payment system will work with manual uploads');
  console.log('- GCash automated payments require Adyen configuration');
  console.log('- PayPal subscriptions require PayPal configuration');
  console.log('- Firebase features will be limited without proper configuration\n');

  console.log('🌐 Firebase Setup:');
  console.log('1. Go to https://console.firebase.google.com/');
  console.log('2. Create a new project or use existing one');
  console.log('3. Enable Firestore Database');
  console.log('4. Enable Authentication');
  console.log('5. Get your project configuration from Project Settings');
  console.log('6. Update .env.local with your Firebase configuration\n');
}

if (require.main === module) {
  setupDevelopmentEnvironment();
}

export { setupDevelopmentEnvironment };
