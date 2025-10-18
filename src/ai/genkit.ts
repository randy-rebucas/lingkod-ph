import {genkit} from 'genkit';
import {googleAI} from '@genkit-ai/googleai';

// Check if Gemini API key is available
const isAIConfigured = !!process.env.GEMINI_API_KEY;

if (!isAIConfigured) {
  console.warn('⚠️  GEMINI_API_KEY not found. AI features will use fallback responses.');
}

export const ai = isAIConfigured ? genkit({
  plugins: [googleAI({
    apiKey: process.env.GEMINI_API_KEY!,
  })],
  model: 'googleai/gemini-2.0-flash',
}) : null;

// Export a flag to check if AI is available
export const isAIAvailable = isAIConfigured;
