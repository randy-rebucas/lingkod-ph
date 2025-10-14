#!/usr/bin/env tsx

/**
 * Payment Gateway Setup Guide
 * 
 * This script provides step-by-step instructions for setting up
 * Maya and PayPal payment gateways with the application.
 * 
 * Usage: npm run setup-payment-gateways
 */

import fs from 'fs';
import path from 'path';

class PaymentGatewaySetup {
  private readonly envPath = path.join(process.cwd(), '.env.local');

  /**
   * Display Maya setup instructions
   */
  private displayMayaSetup(): void {
    console.log('\n🏦 MAYA CHECKOUT SETUP');
    console.log('======================\n');

    console.log('📋 STEP 1: Create Maya Developer Account');
    console.log('1. Go to: https://developers.maya.ph/');
    console.log('2. Sign up for a developer account');
    console.log('3. Complete the registration process\n');

    console.log('📋 STEP 2: Access Maya Business Manager');
    console.log('1. Go to: https://business.maya.ph/');
    console.log('2. Log in with your developer account');
    console.log('3. Navigate to "API Keys" section\n');

    console.log('📋 STEP 3: Generate API Keys');
    console.log('1. Click "Generate New Key"');
    console.log('2. Select "Sandbox" environment for testing');
    console.log('3. Copy the Public Key (starts with pk-)');
    console.log('4. Copy the Secret Key (starts with sk-)\n');

    console.log('📋 STEP 4: Configure Webhooks');
    console.log('1. Go to "Webhooks" section in Maya Business Manager');
    console.log('2. Add webhook URL: http://localhost:3000/api/payments/maya/webhook');
    console.log('3. Select events: payment.paid, payment.failed, payment.cancelled');
    console.log('4. Copy the webhook secret\n');

    console.log('📋 STEP 5: Update Environment Variables');
    console.log('Update these in your .env.local file:');
    console.log('NEXT_PUBLIC_MAYA_PUBLIC_KEY=pk-your-actual-public-key');
    console.log('MAYA_SECRET_KEY=sk-your-actual-secret-key');
    console.log('MAYA_WEBHOOK_SECRET=your-webhook-secret\n');

    console.log('🧪 TESTING:');
    console.log('- Use test cards from Maya documentation');
    console.log('- Test with small amounts first');
    console.log('- Run: npm run test-maya\n');
  }

  /**
   * Display PayPal setup instructions
   */
  private displayPayPalSetup(): void {
    console.log('\n💳 PAYPAL SETUP');
    console.log('================\n');

    console.log('📋 STEP 1: Create PayPal Developer Account');
    console.log('1. Go to: https://developer.paypal.com/');
    console.log('2. Sign up for a developer account');
    console.log('3. Complete the registration process\n');

    console.log('📋 STEP 2: Create Application');
    console.log('1. Go to "My Apps & Credentials"');
    console.log('2. Click "Create App"');
    console.log('3. Select "Default Application"');
    console.log('4. Choose "Sandbox" for testing');
    console.log('5. Add features: "Accept payments" and "Future payments"\n');

    console.log('📋 STEP 3: Get API Credentials');
    console.log('1. Click on your created app');
    console.log('2. Copy the "Client ID"');
    console.log('3. Copy the "Client Secret"\n');

    console.log('📋 STEP 4: Configure Webhooks');
    console.log('1. Go to "Webhooks" section');
    console.log('2. Click "Create Webhook"');
    console.log('3. Webhook URL: http://localhost:3000/api/payments/paypal/webhook');
    console.log('4. Select events:');
    console.log('   - PAYMENT.CAPTURE.COMPLETED');
    console.log('   - PAYMENT.CAPTURE.DENIED');
    console.log('   - PAYMENT.CAPTURE.REFUNDED');
    console.log('5. Copy the webhook ID\n');

    console.log('📋 STEP 5: Update Environment Variables');
    console.log('Update these in your .env.local file:');
    console.log('NEXT_PUBLIC_PAYPAL_CLIENT_ID=your-client-id');
    console.log('PAYPAL_CLIENT_SECRET=your-client-secret\n');

    console.log('🧪 TESTING:');
    console.log('- Use PayPal sandbox test accounts');
    console.log('- Test with small amounts first');
    console.log('- Run: npm run test-paypal\n');
  }

  /**
   * Display Firebase setup instructions
   */
  private displayFirebaseSetup(): void {
    console.log('\n🔥 FIREBASE SETUP');
    console.log('==================\n');

    console.log('📋 STEP 1: Create Firebase Project');
    console.log('1. Go to: https://console.firebase.google.com/');
    console.log('2. Click "Create a project"');
    console.log('3. Enter project name: "localpro"');
    console.log('4. Enable Google Analytics (optional)');
    console.log('5. Create project\n');

    console.log('📋 STEP 2: Enable Firestore Database');
    console.log('1. Go to "Firestore Database" in the left menu');
    console.log('2. Click "Create database"');
    console.log('3. Choose "Start in test mode" (for development)');
    console.log('4. Select a location (choose closest to Philippines)\n');

    console.log('📋 STEP 3: Enable Authentication');
    console.log('1. Go to "Authentication" in the left menu');
    console.log('2. Click "Get started"');
    console.log('3. Go to "Sign-in method" tab');
    console.log('4. Enable "Email/Password" provider\n');

    console.log('📋 STEP 4: Generate Service Account Key');
    console.log('1. Go to "Project settings" (gear icon)');
    console.log('2. Go to "Service accounts" tab');
    console.log('3. Click "Generate new private key"');
    console.log('4. Download the JSON file');
    console.log('5. Copy the values from the JSON file\n');

    console.log('📋 STEP 5: Update Environment Variables');
    console.log('Update these in your .env.local file:');
    console.log('NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id');
    console.log('FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\\n...\\n-----END PRIVATE KEY-----\\n"');
    console.log('FIREBASE_CLIENT_EMAIL=firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com\n');
  }

  /**
   * Display Resend setup instructions
   */
  private displayResendSetup(): void {
    console.log('\n📧 RESEND EMAIL SETUP');
    console.log('======================\n');

    console.log('📋 STEP 1: Create Resend Account');
    console.log('1. Go to: https://resend.com/');
    console.log('2. Sign up for an account');
    console.log('3. Verify your email address\n');

    console.log('📋 STEP 2: Get API Key');
    console.log('1. Go to "API Keys" section');
    console.log('2. Click "Create API Key"');
    console.log('3. Give it a name: "Localpro PH Development"');
    console.log('4. Copy the API key (starts with re_)\n');

    console.log('📋 STEP 3: Verify Domain (Optional)');
    console.log('1. Go to "Domains" section');
    console.log('2. Add your domain (for production)');
    console.log('3. Follow DNS verification steps\n');

    console.log('📋 STEP 4: Update Environment Variables');
    console.log('Update this in your .env.local file:');
    console.log('RESEND_API_KEY=re_your_actual_api_key\n');
  }

  /**
   * Display bank account setup instructions
   */
  private displayBankSetup(): void {
    console.log('\n🏦 BANK ACCOUNT SETUP');
    console.log('======================\n');

    console.log('📋 STEP 1: Prepare Bank Account Information');
    console.log('You need the following information:');
    console.log('- Account holder name (exactly as it appears on the account)');
    console.log('- Account number');
    console.log('- Bank name (e.g., BPI, BDO, Metrobank, etc.)\n');

    console.log('📋 STEP 2: Update Environment Variables');
    console.log('Update these in your .env.local file:');
    console.log('BANK_ACCOUNT_NAME=Your Real Company Name');
    console.log('BANK_ACCOUNT_NUMBER=1234567890');
    console.log('BANK_NAME=Your Bank Name\n');

    console.log('⚠️  IMPORTANT NOTES:');
    console.log('- Use the exact account holder name as it appears on bank records');
    console.log('- Account number should not include spaces or special characters');
    console.log('- Bank name should be the official name of the bank\n');
  }

  /**
   * Check current configuration status
   */
  private checkConfigurationStatus(): void {
    console.log('\n🔍 CONFIGURATION STATUS CHECK');
    console.log('==============================\n');

    if (!fs.existsSync(this.envPath)) {
      console.log('❌ .env.local file not found');
      console.log('Run: npm run setup-payment-config first\n');
      return;
    }

    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const lines = envContent.split('\n');

    const configs = [
      { key: 'NEXT_PUBLIC_MAYA_PUBLIC_KEY', name: 'Maya Public Key', placeholder: 'pk-test-your-maya-public-key-here' },
      { key: 'MAYA_SECRET_KEY', name: 'Maya Secret Key', placeholder: 'sk-test-your-maya-secret-key-here' },
      { key: 'NEXT_PUBLIC_PAYPAL_CLIENT_ID', name: 'PayPal Client ID', placeholder: 'your-paypal-client-id-here' },
      { key: 'PAYPAL_CLIENT_SECRET', name: 'PayPal Client Secret', placeholder: 'your-paypal-client-secret-here' },
      { key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', name: 'Firebase Project ID', placeholder: 'your-firebase-project-id' },
      { key: 'RESEND_API_KEY', name: 'Resend API Key', placeholder: 're_your_resend_api_key_here' },
      { key: 'BANK_ACCOUNT_NAME', name: 'Bank Account Name', placeholder: 'Your Company Name Here' },
    ];

    configs.forEach(config => {
      const line = lines.find(l => l.startsWith(config.key + '='));
      if (line) {
        const value = line.split('=')[1];
        if (value === config.placeholder) {
          console.log(`⚠️  ${config.name}: Using placeholder value`);
        } else {
          console.log(`✅ ${config.name}: Configured`);
        }
      } else {
        console.log(`❌ ${config.name}: Not found`);
      }
    });

    console.log('\n');
  }

  /**
   * Display testing instructions
   */
  private displayTestingInstructions(): void {
    console.log('\n🧪 TESTING YOUR CONFIGURATION');
    console.log('==============================\n');

    console.log('📋 STEP 1: Validate Configuration');
    console.log('Run: npm run validate-payments');
    console.log('This will check all your configuration settings\n');

    console.log('📋 STEP 2: Test Payment Gateways');
    console.log('Test Maya: npm run test-maya');
    console.log('Test PayPal: npm run test-paypal\n');

    console.log('📋 STEP 3: Test in Development');
    console.log('1. Start development server: npm run dev');
    console.log('2. Go to: http://localhost:3000');
    console.log('3. Create a test booking');
    console.log('4. Try the payment flow\n');

    console.log('📋 STEP 4: Test Webhooks');
    console.log('1. Use ngrok to expose local server: ngrok http 3000');
    console.log('2. Update webhook URLs in payment gateways');
    console.log('3. Test webhook delivery\n');
  }

  /**
   * Run the setup guide
   */
  public async run(): Promise<void> {
    console.log('🚀 PAYMENT GATEWAY SETUP GUIDE');
    console.log('===============================\n');

    console.log('This guide will help you set up all payment gateways and services.');
    console.log('Follow each section step by step.\n');

    // Check current status
    this.checkConfigurationStatus();

    // Display setup instructions
    this.displayMayaSetup();
    this.displayPayPalSetup();
    this.displayFirebaseSetup();
    this.displayResendSetup();
    this.displayBankSetup();
    this.displayTestingInstructions();

    console.log('🎉 SETUP COMPLETE!');
    console.log('==================\n');
    console.log('After completing all steps:');
    console.log('1. Run: npm run validate-payments');
    console.log('2. Run: npm run dev');
    console.log('3. Test the payment flows\n');

    console.log('📚 ADDITIONAL RESOURCES:');
    console.log('- Maya Documentation: https://developers.maya.ph/docs/');
    console.log('- PayPal Documentation: https://developer.paypal.com/docs/');
    console.log('- Firebase Documentation: https://firebase.google.com/docs/');
    console.log('- Resend Documentation: https://resend.com/docs\n');
  }
}

// Run the setup guide
const setup = new PaymentGatewaySetup();
setup.run().catch(console.error);
