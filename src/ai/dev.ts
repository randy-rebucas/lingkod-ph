
import { config } from 'dotenv';
config();

import { seedCategories } from '@/lib/seed-categories';
import { seedRewards } from '@/lib/seed-rewards';

import '@/ai/flows/smart-rate-suggestions.ts';
import '@/ai/flows/generate-quote-description.ts';
import '@/ai/flows/generate-service-description.ts';
import '@/ai/flows/generate-job-details.ts';
import '@/ai/flows/request-payout.ts';
import '@/ai/flows/find-matching-providers.ts';
import '@/ai/flows/help-center-assistant.ts';
import '@/ai/flows/create-backup.ts';

// Seed the database with initial data
async function seedDatabase() {
    console.log('Seeding database...');
    await seedCategories();
    await seedRewards();
    console.log('Database seeding complete.');
}

seedDatabase();
