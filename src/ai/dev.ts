
import { config } from 'dotenv';
config();

import '@/ai/flows/smart-rate-suggestions.ts';
import '@/ai/flows/generate-quote-description.ts';
import '@/ai/flows/generate-service-description.ts';
import '@/ai/flows/generate-job-details.ts';
import '@/ai/flows/request-payout.ts';
import '@/ai/flows/find-matching-providers.ts';
import '@/ai/flows/help-center-assistant.ts';
