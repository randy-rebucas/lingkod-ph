import { adminDb } from '@/lib/firebase-admin';
import { readFileSync } from 'fs';
import { join } from 'path';

interface SeedData {
  authors: Array<{
    id: string;
    name: string;
    email: string;
    bio: string;
    role: string;
    status: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
    slug: string;
    description: string;
    icon: string;
    color: string;
    sortOrder: number;
    status: string;
  }>;
  articles: Array<{
    id: string;
    title: string;
    slug: string;
    description: string;
    content: string;
    category: string;
    tags: string[];
    role: string;
    difficulty: string;
    readTime: number;
    featured: boolean;
    popular: boolean;
    status: string;
    authorId: string;
    seoTitle?: string;
    seoDescription?: string;
    featuredImage?: string;
    viewCount: number;
    likeCount: number;
    shareCount: number;
    attachments: string[];
    createdAt: string;
    updatedAt: string;
    publishedAt: string;
  }>;
}

async function seedLearningHub() {
  try {
    console.log('🌱 Starting Learning Hub seeding...');

    // Read seed data
    const seedDataPath = join(process.cwd(), 'src', 'data', 'learning-hub-seed.json');
    const seedData: SeedData = JSON.parse(readFileSync(seedDataPath, 'utf8'));

    // Create authors
    console.log('👤 Creating authors...');
    for (const author of seedData.authors) {
      await adminDb.collection('authors').doc(author.id).set({
        name: author.name,
        email: author.email,
        bio: author.bio,
        role: author.role,
        status: author.status,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    // Create categories
    console.log('📁 Creating categories...');
    for (const category of seedData.categories) {
      await adminDb.collection('categories').doc(category.id).set({
        name: category.name,
        slug: category.slug,
        description: category.description,
        icon: category.icon,
        color: category.color,
        sortOrder: category.sortOrder,
        status: category.status,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    // Create articles
    console.log('📝 Creating articles...');
    for (const article of seedData.articles) {
      await adminDb.collection('articles').doc(article.id).set({
        title: article.title,
        slug: article.slug,
        description: article.description,
        content: article.content,
        category: article.category,
        tags: article.tags,
        role: article.role,
        difficulty: article.difficulty,
        readTime: article.readTime,
        featured: article.featured,
        popular: article.popular,
        status: article.status,
        author: 'LocalPro Admin', // Use author name directly
        seoTitle: article.seoTitle,
        seoDescription: article.seoDescription,
        featuredImage: article.featuredImage,
        viewCount: article.viewCount,
        likeCount: article.likeCount,
        shareCount: article.shareCount,
        attachments: article.attachments,
        publishedAt: new Date(article.publishedAt),
        createdAt: new Date(article.createdAt),
        updatedAt: new Date(article.updatedAt)
      }, { merge: true });
    }

    // Create some sample tutorials
    console.log('🎥 Creating sample tutorials...');
    const tutorials = [
      {
        id: 'tutorial-1',
        title: 'Complete Client Onboarding Tutorial',
        description: 'Step-by-step guide for new clients to get started with LocalPro',
        content: 'This tutorial covers everything new clients need to know...',
        category: 'For Clients',
        role: 'clients',
      difficulty: 'Beginner',
        readTime: 15,
      featured: true,
      popular: true,
      status: 'published',
        author: 'LocalPro Admin',
        viewCount: 11200,
        likeCount: 89,
        shareCount: 23
      },
      {
        id: 'tutorial-2',
        title: 'Provider Verification Process',
        description: 'Complete guide to becoming a verified service provider',
        content: 'Learn how to complete the verification process...',
        category: 'For Providers',
        role: 'providers',
        difficulty: 'Intermediate',
        readTime: 20,
        featured: true,
        popular: false,
        status: 'published',
        author: 'LocalPro Admin',
        viewCount: 8900,
        likeCount: 67,
        shareCount: 15
      }
    ];

    for (const tutorial of tutorials) {
      await adminDb.collection('tutorials').doc(tutorial.id).set({
        ...tutorial,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    // Create some sample topics
    console.log('📚 Creating sample topics...');
    const topics = [
      {
        id: 'topic-1',
        title: 'Account Setup',
        description: 'Everything you need to know about setting up your account',
        content: 'Account setup is the first step...',
      category: 'Getting Started',
        role: 'clients',
      difficulty: 'Beginner',
        readTime: 10,
      featured: true,
      popular: true,
      status: 'published',
        author: 'LocalPro Admin',
        viewCount: 18900,
        likeCount: 156,
        shareCount: 45
      }
    ];

    for (const topic of topics) {
      await adminDb.collection('topics').doc(topic.id).set({
        ...topic,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    // Create some sample resources
    console.log('📄 Creating sample resources...');
    const resources = [
      {
        id: 'resource-1',
        title: 'LocalPro User Guide',
        description: 'Comprehensive user guide for all LocalPro features',
        content: 'This guide covers all features...',
        category: 'Documentation',
      role: 'all',
      difficulty: 'Beginner',
        readTime: 30,
        featured: true,
      popular: true,
      status: 'published',
        author: 'LocalPro Admin',
        downloadCount: 15420,
        likeCount: 234,
        shareCount: 78
      }
    ];

    for (const resource of resources) {
      await adminDb.collection('resources').doc(resource.id).set({
        ...resource,
        createdAt: new Date(),
        updatedAt: new Date()
      }, { merge: true });
    }

    console.log('✅ Learning Hub seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   - ${seedData.authors.length} authors`);
    console.log(`   - ${seedData.categories.length} categories`);
    console.log(`   - ${seedData.articles.length} articles`);
    console.log(`   - ${tutorials.length} tutorials`);
    console.log(`   - ${topics.length} topics`);
    console.log(`   - ${resources.length} resources`);
    
  } catch (error) {
    console.error('❌ Error seeding Learning Hub:', error);
    throw error;
  }
}

// Run the seed function
seedLearningHub()
  .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

export default seedLearningHub;