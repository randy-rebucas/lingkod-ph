#!/usr/bin/env tsx

/**
 * Payment System Validation Script
 * 
 * This script validates the entire payment system implementation
 * and provides a comprehensive report on production readiness.
 * 
 * Usage: npm run validate-payments
 * or: tsx src/scripts/validate-payment-system.ts
 */

import { PaymentProductionValidator } from '../lib/payment-production-validator';
import { PaymentFlowTester } from '../lib/payment-flow-tester';
import { PaymentConfig } from '../lib/payment-config';
import { validatePaymentConfiguration } from '../lib/config-validator';

async function main() {
  console.log('🚀 Starting Payment System Validation...\n');

  try {
    // 1. Configuration Validation
    console.log('📋 Step 1: Configuration Validation');
    console.log('=====================================');
    
    const configValidation = validatePaymentConfiguration();
    console.log(`Configuration Status: ${configValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (configValidation.errors.length > 0) {
      console.log('\n❌ Configuration Errors:');
      configValidation.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (configValidation.warnings.length > 0) {
      console.log('\n⚠️ Configuration Warnings:');
      configValidation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }

    // 2. Payment Gateway Configuration
    console.log('\n🔧 Step 2: Payment Gateway Configuration');
    console.log('==========================================');
    
    const adyenValid = PaymentConfig.validateAdyenConfig();
    const paypalValid = PaymentConfig.validatePayPalConfig();
    
    console.log(`Adyen Configuration: ${adyenValid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`PayPal Configuration: ${paypalValid ? '✅ Valid' : '❌ Invalid'}`);
    
    if (!adyenValid) {
      console.log('   Missing Adyen configuration for GCash payments');
    }
    
    if (!paypalValid) {
      console.log('   Missing PayPal configuration for subscription payments');
    }

    // 3. Production Readiness Validation
    console.log('\n🏭 Step 3: Production Readiness Validation');
    console.log('===========================================');
    
    const productionValidation = await PaymentProductionValidator.validateProductionReadiness();
    console.log(`Overall Status: ${productionValidation.overall.toUpperCase()}`);
    console.log(`Summary: ${productionValidation.summary}`);
    
    // Display validation results
    Object.entries(productionValidation.checks).forEach(([key, check]) => {
      const status = check.status === 'pass' ? '✅' : check.status === 'warning' ? '⚠️' : '❌';
      console.log(`${status} ${key.toUpperCase()}: ${check.message}`);
      
      if (check.details && check.details.length > 0) {
        check.details.forEach(detail => console.log(`   - ${detail}`));
      }
    });

    // 4. Payment Flow Testing
    console.log('\n🧪 Step 4: Payment Flow Testing');
    console.log('================================');
    
    const testSuites = await PaymentFlowTester.runAllTests();
    
    let totalTests = 0;
    let totalPassed = 0;
    let totalFailed = 0;
    let totalSkipped = 0;
    
    testSuites.forEach(suite => {
      console.log(`\n📊 ${suite.suiteName}:`);
      console.log(`   Status: ${suite.overallStatus.toUpperCase()}`);
      console.log(`   Summary: ${suite.summary}`);
      
      suite.results.forEach(result => {
        const status = result.status === 'pass' ? '✅' : result.status === 'fail' ? '❌' : '⏭️';
        console.log(`   ${status} ${result.testName}: ${result.message}`);
        
        totalTests++;
        if (result.status === 'pass') totalPassed++;
        else if (result.status === 'fail') totalFailed++;
        else if (result.status === 'skip') totalSkipped++;
      });
    });

    // 5. Overall Summary
    console.log('\n📈 Overall Summary');
    console.log('==================');
    
    const successRate = totalTests > 0 ? ((totalPassed / totalTests) * 100).toFixed(1) : 0;
    
    console.log(`Configuration: ${configValidation.valid ? '✅ Valid' : '❌ Invalid'}`);
    console.log(`Production Ready: ${productionValidation.overall.toUpperCase()}`);
    console.log(`Test Results: ${totalPassed}/${totalTests} passed (${successRate}%)`);
    console.log(`   - Passed: ${totalPassed}`);
    console.log(`   - Failed: ${totalFailed}`);
    console.log(`   - Skipped: ${totalSkipped}`);

    // 6. Recommendations
    if (productionValidation.recommendations.length > 0) {
      console.log('\n💡 Recommendations');
      console.log('===================');
      productionValidation.recommendations.forEach((rec, index) => {
        console.log(`${index + 1}. ${rec}`);
      });
    }

    // 7. Final Status
    console.log('\n🎯 Final Status');
    console.log('================');
    
    const isReady = configValidation.valid && 
                   productionValidation.overall !== 'not_ready' && 
                   totalFailed === 0;
    
    if (isReady) {
      console.log('✅ PAYMENT SYSTEM IS READY FOR PRODUCTION!');
      console.log('\n🚀 Next Steps:');
      console.log('1. Configure production environment variables');
      console.log('2. Set up production payment gateway accounts');
      console.log('3. Deploy to production environment');
      console.log('4. Monitor system closely after deployment');
    } else {
      console.log('❌ PAYMENT SYSTEM IS NOT READY FOR PRODUCTION');
      console.log('\n🔧 Required Actions:');
      
      if (!configValidation.valid) {
        console.log('- Fix configuration errors');
      }
      
      if (productionValidation.overall === 'not_ready') {
        console.log('- Address production readiness issues');
      }
      
      if (totalFailed > 0) {
        console.log('- Fix failed tests');
      }
      
      console.log('- Re-run validation after fixes');
    }

    // 8. Environment Information
    console.log('\n🌍 Environment Information');
    console.log('===========================');
    console.log(`Node.js Version: ${process.version}`);
    console.log(`Platform: ${process.platform}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`Timestamp: ${new Date().toISOString()}`);

  } catch (error) {
    console.error('\n❌ Validation Error:');
    console.error(error instanceof Error ? error.message : String(error));
    console.error('\nStack trace:');
    console.error(error instanceof Error ? error.stack : 'No stack trace available');
    process.exit(1);
  }
}

// Run the validation
if (require.main === module) {
  main().catch(error => {
    console.error('Fatal error during validation:', error);
    process.exit(1);
  });
}

export { main as validatePaymentSystem };
