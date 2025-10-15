#!/usr/bin/env tsx

/**
 * Payment Configuration Setup Script
 * 
 * This script helps set up the payment system configuration
 * by generating secure keys and providing guidance for API setup.
 * 
 * Usage: npm run setup-payment-config
 */

import crypto from 'crypto';
import fs from 'fs';
import path from 'path';

interface ConfigTemplate {
  [key: string]: string;
}

class PaymentConfigSetup {
  private readonly envPath = path.join(process.cwd(), '.env.local');
  private readonly examplePath = path.join(process.cwd(), '.env.example');

  /**
   * Generate secure random strings for security keys
   */
  private generateSecureKey(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate JWT secret
   */
  private generateJWTSecret(): string {
    return crypto.randomBytes(64).toString('hex');
  }

  /**
   * Generate encryption key
   */
  private generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Create configuration template
   */
  private createConfigTemplate(): ConfigTemplate {
    return {
      // Maya Checkout Configuration
      'NEXT_PUBLIC_MAYA_PUBLIC_KEY': 'pk-test-your-maya-public-key-here',
      'MAYA_SECRET_KEY': 'sk-test-your-maya-secret-key-here',
      'MAYA_ENVIRONMENT': 'sandbox',
      'MAYA_WEBHOOK_SECRET': this.generateSecureKey(32),

      // PayPal Configuration
      'NEXT_PUBLIC_PAYPAL_CLIENT_ID': 'your-paypal-client-id-here',
      'PAYPAL_CLIENT_SECRET': 'your-paypal-client-secret-here',

      // Firebase Configuration
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID': 'your-firebase-project-id',
      'FIREBASE_PRIVATE_KEY': '"-----BEGIN PRIVATE KEY-----\\nYour Firebase Private Key Here\\n-----END PRIVATE KEY-----\\n"',
      'FIREBASE_CLIENT_EMAIL': 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',

      // Security Configuration (Generated)
      'JWT_SECRET': this.generateJWTSecret(),
      'ENCRYPTION_KEY': this.generateEncryptionKey(),

      // Application Configuration
      'NEXT_PUBLIC_APP_URL': 'http://localhost:3000',

      // Bank Transfer Configuration
      'BANK_ACCOUNT_NAME': 'Your Company Name Here',
      'BANK_ACCOUNT_NUMBER': '1234-5678-9012',
      'BANK_NAME': 'Your Bank Name (e.g., BPI, BDO, Metrobank)',

      // Email Service Configuration
      'RESEND_API_KEY': 're_your_resend_api_key_here',

      // Development Settings
      'NODE_ENV': 'development',
      'NEXT_PUBLIC_DEBUG': 'true',
    };
  }

  /**
   * Create .env.local file
   */
  private createEnvFile(): void {
    const config = this.createConfigTemplate();
    const envContent = this.generateEnvContent(config);

    try {
      fs.writeFileSync(this.envPath, envContent);
      console.log('✅ Created .env.local file');
    } catch (error) {
      console.error('❌ Failed to create .env.local file:', error);
      throw error;
    }
  }

  /**
   * Generate environment file content
   */
  private generateEnvContent(config: ConfigTemplate): string {
    const sections = [
      {
        title: 'MAYA CHECKOUT CONFIGURATION',
        description: 'Get these from Maya Business Manager (https://business.maya.ph/)',
        keys: ['NEXT_PUBLIC_MAYA_PUBLIC_KEY', 'MAYA_SECRET_KEY', 'MAYA_ENVIRONMENT', 'MAYA_WEBHOOK_SECRET']
      },
      {
        title: 'PAYPAL CONFIGURATION',
        description: 'Get these from PayPal Developer Dashboard (https://developer.paypal.com/)',
        keys: ['NEXT_PUBLIC_PAYPAL_CLIENT_ID', 'PAYPAL_CLIENT_SECRET']
      },
      {
        title: 'FIREBASE CONFIGURATION',
        description: 'Get these from Firebase Console (https://console.firebase.google.com/)',
        keys: ['NEXT_PUBLIC_FIREBASE_PROJECT_ID', 'FIREBASE_PRIVATE_KEY', 'FIREBASE_CLIENT_EMAIL']
      },
      {
        title: 'SECURITY CONFIGURATION',
        description: 'Generated secure keys (keep these secret!)',
        keys: ['JWT_SECRET', 'ENCRYPTION_KEY']
      },
      {
        title: 'APPLICATION CONFIGURATION',
        description: 'Update for production deployment',
        keys: ['NEXT_PUBLIC_APP_URL']
      },
      {
        title: 'BANK TRANSFER CONFIGURATION',
        description: 'Update with your actual bank account details',
        keys: ['BANK_ACCOUNT_NAME', 'BANK_ACCOUNT_NUMBER', 'BANK_NAME']
      },
      {
        title: 'EMAIL SERVICE CONFIGURATION',
        description: 'Get this from Resend (https://resend.com/)',
        keys: ['RESEND_API_KEY']
      },
      {
        title: 'DEVELOPMENT SETTINGS',
        description: 'Development environment settings',
        keys: ['NODE_ENV', 'NEXT_PUBLIC_DEBUG']
      }
    ];

    let content = '# ===========================================\n';
    content += '# LOCALPRO PH - ENVIRONMENT CONFIGURATION\n';
    content += '# ===========================================\n';
    content += '# Generated on: ' + new Date().toISOString() + '\n\n';

    sections.forEach(section => {
      content += `# ===========================================\n`;
      content += `# ${section.title}\n`;
      content += `# ===========================================\n`;
      content += `# ${section.description}\n`;
      
      section.keys.forEach(key => {
        content += `${key}=${config[key]}\n`;
      });
      
      content += '\n';
    });

    return content;
  }

  /**
   * Create .env.example file
   */
  private createExampleFile(): void {
    const config = this.createConfigTemplate();
    
    // Replace sensitive values with placeholders
    const exampleConfig = { ...config };
    exampleConfig['JWT_SECRET'] = 'your-super-secure-jwt-secret-key-here';
    exampleConfig['ENCRYPTION_KEY'] = 'your-32-character-encryption-key-here';
    exampleConfig['MAYA_WEBHOOK_SECRET'] = 'your-maya-webhook-secret-here';

    const envContent = this.generateEnvContent(exampleConfig);

    try {
      fs.writeFileSync(this.examplePath, envContent);
      console.log('✅ Created .env.example file');
    } catch (error) {
      console.error('❌ Failed to create .env.example file:', error);
    }
  }

  /**
   * Display setup instructions
   */
  private displaySetupInstructions(): void {
    console.log('\n🚀 PAYMENT SYSTEM SETUP INSTRUCTIONS');
    console.log('=====================================\n');

    console.log('📋 NEXT STEPS:');
    console.log('1. Update the generated .env.local file with your actual API keys');
    console.log('2. Set up your payment gateway accounts:');
    console.log('   - Maya: https://business.maya.ph/');
    console.log('   - PayPal: https://developer.paypal.com/');
    console.log('3. Configure Firebase project: https://console.firebase.google.com/');
    console.log('4. Set up Resend for emails: https://resend.com/');
    console.log('5. Update bank account details with your real information');
    console.log('6. Test the configuration: npm run validate-payments\n');

    console.log('🔑 SECURITY NOTES:');
    console.log('- JWT_SECRET and ENCRYPTION_KEY have been generated automatically');
    console.log('- Keep these keys secure and never commit them to version control');
    console.log('- The .env.local file is already in .gitignore\n');

    console.log('🧪 TESTING:');
    console.log('- Use sandbox/test credentials for development');
    console.log('- Test all payment methods before going to production');
    console.log('- Run: npm run test-maya and npm run test-paypal\n');

    console.log('📚 DOCUMENTATION:');
    console.log('- Maya Setup: See MAYA_CHECKOUT_SETUP.md');
    console.log('- PayPal Setup: Check PayPal Developer Documentation');
    console.log('- Firebase Setup: See Firebase Console documentation\n');
  }

  /**
   * Run the setup process
   */
  public async run(): Promise<void> {
    console.log('🔧 Setting up Payment System Configuration...\n');

    try {
      // Check if .env.local already exists
      if (fs.existsSync(this.envPath)) {
        console.log('⚠️  .env.local already exists. Creating backup...');
        const backupPath = this.envPath + '.backup.' + Date.now();
        fs.copyFileSync(this.envPath, backupPath);
        console.log(`✅ Backup created: ${backupPath}`);
      }

      // Create configuration files
      this.createEnvFile();
      this.createExampleFile();

      // Display instructions
      this.displaySetupInstructions();

      console.log('✅ Payment system configuration setup completed!');
      console.log('📁 Files created:');
      console.log('   - .env.local (your configuration)');
      console.log('   - .env.example (template for others)');

    } catch (error) {
      console.error('❌ Setup failed:', error);
      process.exit(1);
    }
  }
}

// Run the setup
const setup = new PaymentConfigSetup();
setup.run().catch(console.error);
