#!/usr/bin/env tsx

/**
 * AI Configuration Setup Script
 * Helps set up Google AI API key for the AI features
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const AI_ENV_TEMPLATE = `
# Google AI Configuration (Gemini)
# Get your API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
`;

function setupAIConfiguration() {
  console.log('🤖 Setting up AI configuration...\n');

  const envPath = join(process.cwd(), '.env.local');
  let existingEnv = '';

  // Read existing .env.local if it exists
  if (existsSync(envPath)) {
    existingEnv = readFileSync(envPath, 'utf8');
    console.log('✅ Found existing .env.local file');
  } else {
    console.log('📝 Creating new .env.local file');
  }

  // Check if Gemini AI configuration already exists
  if (existingEnv.includes('GEMINI_API_KEY')) {
    console.log('⚠️  Gemini AI configuration already exists in .env.local');
    console.log('   If you need to update it, please edit .env.local manually');
    return;
  }

  // Add AI configuration to existing env or create new file
  const newEnvContent = existingEnv + AI_ENV_TEMPLATE;
  
  try {
    writeFileSync(envPath, newEnvContent);
    console.log('✅ AI configuration added to .env.local');
    console.log('\n📋 Next steps:');
    console.log('1. Get your Gemini API key from: https://aistudio.google.com/app/apikey');
    console.log('2. Replace "your_gemini_api_key_here" with your actual API key');
    console.log('3. Restart your development server');
    console.log('\n💡 Without the API key, the AI features will use fallback suggestions');
  } catch (error) {
    console.error('❌ Error writing to .env.local:', error);
  }
}

// Run the setup
setupAIConfiguration();
