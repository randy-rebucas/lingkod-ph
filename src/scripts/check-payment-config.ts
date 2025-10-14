#!/usr/bin/env tsx

/**
 * Payment Configuration Checker
 * 
 * This script checks the current payment configuration and provides
 * specific guidance on what needs to be configured.
 * 
 * Usage: npm run check-payment-config
 */

import fs from 'fs';
import path from 'path';

interface ConfigCheck {
  key: string;
  name: string;
  placeholder: string;
  required: boolean;
  category: string;
  instructions: string;
}

class PaymentConfigChecker {
  private readonly envPath = path.join(process.cwd(), '.env.local');

  private readonly configChecks: ConfigCheck[] = [
    {
      key: 'NEXT_PUBLIC_MAYA_PUBLIC_KEY',
      name: 'Maya Public Key',
      placeholder: 'pk-test-your-maya-public-key-here',
      required: true,
      category: 'Maya Checkout',
      instructions: 'Get from Maya Business Manager > API Keys > Public Key'
    },
    {
      key: 'MAYA_SECRET_KEY',
      name: 'Maya Secret Key',
      placeholder: 'sk-test-your-maya-secret-key-here',
      required: true,
      category: 'Maya Checkout',
      instructions: 'Get from Maya Business Manager > API Keys > Secret Key'
    },
    {
      key: 'MAYA_WEBHOOK_SECRET',
      name: 'Maya Webhook Secret',
      placeholder: 'your-maya-webhook-secret-here',
      required: true,
      category: 'Maya Checkout',
      instructions: 'Get from Maya Business Manager > Webhooks > Webhook Secret'
    },
    {
      key: 'NEXT_PUBLIC_PAYPAL_CLIENT_ID',
      name: 'PayPal Client ID',
      placeholder: 'your-paypal-client-id-here',
      required: true,
      category: 'PayPal',
      instructions: 'Get from PayPal Developer Dashboard > My Apps > Client ID'
    },
    {
      key: 'PAYPAL_CLIENT_SECRET',
      name: 'PayPal Client Secret',
      placeholder: 'your-paypal-client-secret-here',
      required: true,
      category: 'PayPal',
      instructions: 'Get from PayPal Developer Dashboard > My Apps > Client Secret'
    },
    {
      key: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      name: 'Firebase Project ID',
      placeholder: 'your-firebase-project-id',
      required: true,
      category: 'Firebase',
      instructions: 'Get from Firebase Console > Project Settings > Project ID'
    },
    {
      key: 'FIREBASE_PRIVATE_KEY',
      name: 'Firebase Private Key',
      placeholder: '"-----BEGIN PRIVATE KEY-----\\nYour Firebase Private Key Here\\n-----END PRIVATE KEY-----\\n"',
      required: true,
      category: 'Firebase',
      instructions: 'Get from Firebase Console > Project Settings > Service Accounts > Generate New Private Key'
    },
    {
      key: 'FIREBASE_CLIENT_EMAIL',
      name: 'Firebase Client Email',
      placeholder: 'firebase-adminsdk-xxxxx@your-project.iam.gserviceaccount.com',
      required: true,
      category: 'Firebase',
      instructions: 'Get from Firebase Console > Project Settings > Service Accounts > Client Email'
    },
    {
      key: 'JWT_SECRET',
      name: 'JWT Secret',
      placeholder: 'your-super-secure-jwt-secret-key-here',
      required: true,
      category: 'Security',
      instructions: 'Auto-generated secure key (should be different from placeholder)'
    },
    {
      key: 'ENCRYPTION_KEY',
      name: 'Encryption Key',
      placeholder: 'your-32-character-encryption-key-here',
      required: true,
      category: 'Security',
      instructions: 'Auto-generated secure key (should be different from placeholder)'
    },
    {
      key: 'RESEND_API_KEY',
      name: 'Resend API Key',
      placeholder: 're_your_resend_api_key_here',
      required: false,
      category: 'Email Service',
      instructions: 'Get from Resend Dashboard > API Keys > Create API Key'
    },
    {
      key: 'BANK_ACCOUNT_NAME',
      name: 'Bank Account Name',
      placeholder: 'Your Company Name Here',
      required: false,
      category: 'Bank Transfer',
      instructions: 'Your actual company/business name as it appears on bank records'
    },
    {
      key: 'BANK_ACCOUNT_NUMBER',
      name: 'Bank Account Number',
      placeholder: '1234-5678-9012',
      required: false,
      category: 'Bank Transfer',
      instructions: 'Your actual bank account number'
    },
    {
      key: 'BANK_NAME',
      name: 'Bank Name',
      placeholder: 'Your Bank Name (e.g., BPI, BDO, Metrobank)',
      required: false,
      category: 'Bank Transfer',
      instructions: 'Official name of your bank (e.g., Bank of the Philippine Islands)'
    },
    {
      key: 'NEXT_PUBLIC_APP_URL',
      name: 'App URL',
      placeholder: 'http://localhost:3000',
      required: true,
      category: 'Application',
      instructions: 'Your application URL (use https:// for production)'
    }
  ];

  /**
   * Check if .env.local exists
   */
  private checkEnvFile(): boolean {
    if (!fs.existsSync(this.envPath)) {
      console.log('❌ .env.local file not found');
      console.log('Run: npm run setup-payment-config first\n');
      return false;
    }
    return true;
  }

  /**
   * Parse environment file
   */
  private parseEnvFile(): Map<string, string> {
    const envContent = fs.readFileSync(this.envPath, 'utf8');
    const envMap = new Map<string, string>();

    envContent.split('\n').forEach(line => {
      const trimmedLine = line.trim();
      if (trimmedLine && !trimmedLine.startsWith('#')) {
        const [key, ...valueParts] = trimmedLine.split('=');
        if (key && valueParts.length > 0) {
          envMap.set(key.trim(), valueParts.join('=').trim());
        }
      }
    });

    return envMap;
  }

  /**
   * Check configuration status
   */
  private checkConfiguration(): void {
    console.log('🔍 PAYMENT CONFIGURATION STATUS');
    console.log('===============================\n');

    const envMap = this.parseEnvFile();
    const categories = new Map<string, { configured: number; total: number; required: number; requiredConfigured: number }>();

    // Initialize categories
    this.configChecks.forEach(check => {
      if (!categories.has(check.category)) {
        categories.set(check.category, { configured: 0, total: 0, required: 0, requiredConfigured: 0 });
      }
    });

    // Check each configuration
    this.configChecks.forEach(check => {
      const category = categories.get(check.category)!;
      category.total++;
      if (check.required) category.required++;

      const value = envMap.get(check.key);
      const isConfigured = value && value !== check.placeholder;

      if (isConfigured) {
        category.configured++;
        if (check.required) category.requiredConfigured++;
        console.log(`✅ ${check.name}: Configured`);
      } else {
        const status = check.required ? '❌' : '⚠️';
        console.log(`${status} ${check.name}: ${check.required ? 'Required' : 'Optional'} - Not configured`);
        console.log(`   Instructions: ${check.instructions}`);
      }
    });

    // Display category summaries
    console.log('\n📊 CATEGORY SUMMARY');
    console.log('===================\n');

    categories.forEach((stats, category) => {
      const percentage = Math.round((stats.configured / stats.total) * 100);
      const requiredPercentage = stats.required > 0 ? Math.round((stats.requiredConfigured / stats.required) * 100) : 100;
      
      let status = '✅';
      if (requiredPercentage < 100) status = '❌';
      else if (percentage < 100) status = '⚠️';

      console.log(`${status} ${category}: ${stats.configured}/${stats.total} configured (${percentage}%)`);
      if (stats.required > 0) {
        console.log(`   Required: ${stats.requiredConfigured}/${stats.required} (${requiredPercentage}%)`);
      }
    });

    // Overall status
    const totalConfigured = Array.from(categories.values()).reduce((sum, cat) => sum + cat.configured, 0);
    const totalRequired = Array.from(categories.values()).reduce((sum, cat) => sum + cat.required, 0);
    const totalRequiredConfigured = Array.from(categories.values()).reduce((sum, cat) => sum + cat.requiredConfigured, 0);
    const totalItems = this.configChecks.length;

    console.log('\n🎯 OVERALL STATUS');
    console.log('=================\n');

    const overallPercentage = Math.round((totalConfigured / totalItems) * 100);
    const requiredPercentage = Math.round((totalRequiredConfigured / totalRequired) * 100);

    if (requiredPercentage === 100) {
      console.log('✅ All required configurations are set up!');
      if (overallPercentage < 100) {
        console.log(`⚠️  ${totalItems - totalConfigured} optional configurations still need setup`);
      }
    } else {
      console.log(`❌ ${totalRequired - totalRequiredConfigured} required configurations still need setup`);
    }

    console.log(`📈 Progress: ${totalConfigured}/${totalItems} (${overallPercentage}%)`);
    console.log(`🔑 Required: ${totalRequiredConfigured}/${totalRequired} (${requiredPercentage}%)`);
  }

  /**
   * Display next steps
   */
  private displayNextSteps(): void {
    console.log('\n🚀 NEXT STEPS');
    console.log('=============\n');

    console.log('1. 🔧 Configure Missing Settings:');
    console.log('   - Run: npm run setup-payment-gateways');
    console.log('   - Follow the step-by-step instructions\n');

    console.log('2. 🧪 Test Your Configuration:');
    console.log('   - Run: npm run validate-payments');
    console.log('   - Run: npm run test-maya');
    console.log('   - Run: npm run test-paypal\n');

    console.log('3. 🚀 Start Development:');
    console.log('   - Run: npm run dev');
    console.log('   - Test payment flows in the application\n');

    console.log('4. 📚 Documentation:');
    console.log('   - Maya: MAYA_CHECKOUT_SETUP.md');
    console.log('   - PayPal: Check PayPal Developer Documentation');
    console.log('   - Firebase: Firebase Console Documentation\n');
  }

  /**
   * Display quick fixes
   */
  private displayQuickFixes(): void {
    console.log('\n⚡ QUICK FIXES');
    console.log('==============\n');

    const envMap = this.parseEnvFile();
    const missingRequired = this.configChecks.filter(check => 
      check.required && (!envMap.has(check.key) || envMap.get(check.key) === check.placeholder)
    );

    if (missingRequired.length === 0) {
      console.log('✅ No quick fixes needed - all required configurations are set!');
      return;
    }

    console.log('🔧 Required configurations that need attention:\n');

    missingRequired.forEach(check => {
      console.log(`❌ ${check.name}`);
      console.log(`   Key: ${check.key}`);
      console.log(`   Instructions: ${check.instructions}`);
      console.log('');
    });

    console.log('💡 Tip: Run "npm run setup-payment-gateways" for detailed setup instructions');
  }

  /**
   * Run the configuration check
   */
  public async run(): Promise<void> {
    console.log('🔍 PAYMENT CONFIGURATION CHECKER');
    console.log('=================================\n');

    if (!this.checkEnvFile()) {
      return;
    }

    this.checkConfiguration();
    this.displayQuickFixes();
    this.displayNextSteps();

    console.log('🎉 Configuration check completed!');
  }
}

// Run the checker
const checker = new PaymentConfigChecker();
checker.run().catch(console.error);
