#!/usr/bin/env tsx

/**
 * AI Assistant Setup Script
 * Helps users set up the AI Assistant with proper configuration
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const AI_SETUP_TEMPLATE = `
# AI Assistant Configuration
# Get your Gemini API key from: https://aistudio.google.com/app/apikey
GEMINI_API_KEY=your_gemini_api_key_here
`;

function setupAIAssistant() {
  console.log('🤖 Setting up AI Assistant...\n');

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
    console.log('   Current configuration:');
    const lines = existingEnv.split('\n');
    const geminiLine = lines.find(line => line.includes('GEMINI_API_KEY'));
    if (geminiLine) {
      console.log(`   ${geminiLine}`);
    }
    console.log('\n   If you need to update it, please edit .env.local manually');
    return;
  }

  // Add AI configuration to existing env or create new file
  const newEnvContent = existingEnv + AI_SETUP_TEMPLATE;
  
  try {
    writeFileSync(envPath, newEnvContent);
    console.log('✅ AI Assistant configuration added to .env.local');
    console.log('\n📋 Next steps:');
    console.log('1. Get your Gemini API key from: https://aistudio.google.com/app/apikey');
    console.log('2. Replace "your_gemini_api_key_here" with your actual API key');
    console.log('3. Restart your development server');
    console.log('\n💡 Without the API key, the AI Assistant will use fallback responses');
    console.log('   The fallback responses still provide helpful answers for common questions');
  } catch (error) {
    console.error('❌ Error writing to .env.local:', error);
  }
}

// Run the setup
setupAIAssistant();
