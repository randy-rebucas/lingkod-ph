// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Import the individual seeders
import seedMockLearningHubData from './seed-mock-learning-hub-data';
import seedArticlesData from './seed-articles-data';

async function seedAllLearningHubData() {
  try {
    console.log('🚀 Starting Complete Learning Hub Data Seeding...');
    console.log('================================================');
    
    // Run mock data seeder first
    console.log('\n📦 Step 1: Seeding Mock Learning Hub Data...');
    await seedMockLearningHubData();
    
    console.log('\n📚 Step 2: Seeding Articles Data...');
    await seedArticlesData();
    
    console.log('\n🎉 Complete Learning Hub Data Seeding Finished!');
    console.log('================================================');
    console.log('✅ All data has been successfully seeded to Firebase');
    console.log('📊 Collections created:');
    console.log('   - articles (34 total articles)');
    console.log('   - tutorials (2 tutorials)');
    console.log('   - topics (1 topic)');
    console.log('   - resources (1 resource)');
    console.log('\n🔗 You can now access the Learning Hub with real data!');
    
  } catch (error) {
    console.error('❌ Error in complete Learning Hub data seeding:', error);
    throw error;
  }
}

// Run the complete seed function
seedAllLearningHubData()
  .then(() => {
    console.log('\n🎊 All Learning Hub data seeding completed successfully!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n💥 Complete Learning Hub data seeding failed:', error);
    process.exit(1);
  });

export default seedAllLearningHubData;
