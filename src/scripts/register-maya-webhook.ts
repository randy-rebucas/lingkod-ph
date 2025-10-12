/**
 * Script to register Maya webhook endpoints
 * Based on Maya documentation: https://developers.maya.ph/reference/configuring-your-webhook-for-maya-checkout
 */

import { PaymentConfig } from '../lib/payment-config';

interface WebhookRegistration {
  name: string;
  callbackUrl: string;
}

const WEBHOOK_EVENTS: WebhookRegistration[] = [
  {
    name: 'PAYMENT_SUCCESS',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/maya/webhook`
  },
  {
    name: 'PAYMENT_FAILED',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/maya/webhook`
  },
  {
    name: 'PAYMENT_CANCELLED',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/maya/webhook`
  },
  {
    name: 'PAYMENT_EXPIRED',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/maya/webhook`
  },
  {
    name: 'AUTHORIZED',
    callbackUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/api/payments/maya/webhook`
  }
];

async function registerWebhook(event: WebhookRegistration): Promise<boolean> {
  try {
    const config = PaymentConfig.MAYA;
    const baseUrl = config.environment === 'production' 
      ? 'https://pg.maya.ph'
      : 'https://pg-sandbox.maya.ph';

    const response = await fetch(`${baseUrl}/payments/v1/webhooks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${Buffer.from(`${config.publicKey}:`).toString('base64')}`,
      },
      body: JSON.stringify({
        name: event.name,
        callbackUrl: event.callbackUrl
      }),
    });

    const data = await response.json();

    if (response.ok) {
      console.log(`✅ Successfully registered webhook: ${event.name}`);
      console.log(`   URL: ${event.callbackUrl}`);
      return true;
    } else {
      console.error(`❌ Failed to register webhook: ${event.name}`);
      console.error(`   Error: ${data.message || data.error || 'Unknown error'}`);
      return false;
    }
  } catch (error) {
    console.error(`❌ Error registering webhook ${event.name}:`, error);
    return false;
  }
}

async function main() {
  console.log('🚀 Starting Maya webhook registration...\n');

  if (!PaymentConfig.validateMayaConfig()) {
    console.error('❌ Maya configuration is invalid. Please check your API keys.');
    process.exit(1);
  }

  console.log(`Environment: ${PaymentConfig.MAYA.environment}`);
  console.log(`Base URL: ${PaymentConfig.MAYA.environment === 'production' ? 'https://pg.maya.ph' : 'https://pg-sandbox.maya.ph'}\n`);

  let successCount = 0;
  let totalCount = WEBHOOK_EVENTS.length;

  for (const event of WEBHOOK_EVENTS) {
    const success = await registerWebhook(event);
    if (success) successCount++;
    
    // Add delay between requests to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  console.log(`\n📊 Registration Summary:`);
  console.log(`   Successful: ${successCount}/${totalCount}`);
  console.log(`   Failed: ${totalCount - successCount}/${totalCount}`);

  if (successCount === totalCount) {
    console.log('\n🎉 All webhooks registered successfully!');
  } else {
    console.log('\n⚠️  Some webhooks failed to register. Please check the errors above.');
  }
}

// Run the script
main().catch(console.error);
