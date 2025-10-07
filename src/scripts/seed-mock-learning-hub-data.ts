// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Import Firebase modules
import { initializeApp, getApps, getApp } from 'firebase/app';
import { initializeFirestore } from 'firebase/firestore';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

interface MockArticle {
  id: string;
  title: string;
  type: 'article';
  category: string;
  role: string;
  status: string;
  featured: boolean;
  popular: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  rating: number;
}

// Helper function to generate slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .trim();
}

// Custom Firebase initialization for the seeder
function initializeFirebaseForSeeder() {
  const firebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  };

  // Check if all required config is present
  if (!firebaseConfig.apiKey || !firebaseConfig.projectId) {
    throw new Error('Firebase configuration is incomplete. Please check your .env.local file.');
  }

  // Initialize Firebase app
  let app;
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApp();
  }

  // Initialize Firestore with long polling
  const db = initializeFirestore(app, {
    experimentalForceLongPolling: true,
  });

  return db;
}

interface MockTutorial {
  id: string;
  title: string;
  type: 'tutorial';
  category: string;
  role: string;
  status: string;
  featured: boolean;
  popular: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  rating: number;
}

interface MockTopic {
  id: string;
  title: string;
  type: 'topic';
  category: string;
  role: string;
  status: string;
  featured: boolean;
  popular: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount: number;
  rating: number;
}

interface MockResource {
  id: string;
  title: string;
  type: 'resource';
  category: string;
  role: string;
  status: string;
  featured: boolean;
  popular: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  downloadCount: number;
  rating: number;
}

async function seedMockLearningHubData() {
  try {
    console.log('🌱 Starting Mock Learning Hub data seeding...');
    
    // Debug: Check if environment variables are loaded
    console.log('🔍 Checking Firebase configuration...');
    const hasApiKey = !!process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const hasProjectId = !!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    console.log(`   - API Key: ${hasApiKey ? '✅' : '❌'}`);
    console.log(`   - Project ID: ${hasProjectId ? '✅' : '❌'}`);
    console.log(`   - Project: ${process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || 'Not set'}`);
    
    // Initialize Firebase for the seeder
    const db = initializeFirebaseForSeeder();
    console.log('✅ Firebase database connection established');

    // Mock articles data from the API route
    const articles: MockArticle[] = [
      {
        id: '1',
        title: 'Welcome to LocalPro: Your Complete Getting Started Guide',
        type: 'article',
        category: 'Getting Started',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        viewCount: 15420,
        rating: 4.8
      },
      {
        id: '2',
        title: 'How to Create and Verify Your LocalPro Account',
        type: 'article',
        category: 'Getting Started',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-14',
        viewCount: 12850,
        rating: 4.7
      },
      {
        id: '3',
        title: 'Understanding LocalPro Service Categories and Types',
        type: 'article',
        category: 'Getting Started',
        role: 'all',
        status: 'published',
        featured: false,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-13',
        updatedAt: '2024-01-13',
        viewCount: 11200,
        rating: 4.6
      }
    ];

    // Mock tutorials data from the API route
    const tutorials: MockTutorial[] = [
      {
        id: 'tutorial-1',
        title: 'Complete Client Onboarding Tutorial',
        type: 'tutorial',
        category: 'For Clients',
        role: 'clients',
        status: 'published',
        featured: true,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-12',
        viewCount: 11200,
        rating: 4.6
      },
      {
        id: 'tutorial-2',
        title: 'Provider Verification Process',
        type: 'tutorial',
        category: 'For Providers',
        role: 'providers',
        status: 'published',
        featured: true,
        popular: false,
        author: 'LocalPro Admin',
        createdAt: '2024-01-11',
        updatedAt: '2024-01-11',
        viewCount: 8900,
        rating: 4.5
      }
    ];

    // Mock topics data from the API route
    const topics: MockTopic[] = [
      {
        id: 'topic-1',
        title: 'Account Setup',
        type: 'topic',
        category: 'Getting Started',
        role: 'clients',
        status: 'published',
        featured: true,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10',
        viewCount: 18900,
        rating: 4.8
      }
    ];

    // Mock resources data from the API route
    const resources: MockResource[] = [
      {
        id: 'resource-1',
        title: 'LocalPro User Guide',
        type: 'resource',
        category: 'Documentation',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'LocalPro Admin',
        createdAt: '2024-01-09',
        updatedAt: '2024-01-09',
        downloadCount: 15420,
        rating: 4.8
      }
    ];

    // Store articles in Firebase
    console.log('📝 Storing articles...');
    for (const article of articles) {
      try {
        const articleData = {
          title: article.title,
          slug: generateSlug(article.title),
          description: `Learn about ${article.title.toLowerCase()}`,
          content: `This is the content for ${article.title}. This article provides comprehensive information about the topic.`,
          excerpt: `A comprehensive guide about ${article.title.toLowerCase()}`,
          category: article.category,
          tags: [article.category.toLowerCase().replace(' ', '-'), 'localpro', 'guide'],
          role: article.role as 'clients' | 'providers' | 'agencies' | 'partners' | 'all',
          difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
          readTime: 5,
          featured: article.featured,
          popular: article.popular,
          status: article.status as 'draft' | 'published' | 'archived',
          authorId: 'admin-user-id', // Default admin user ID
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          viewCount: article.viewCount,
          likeCount: Math.floor(article.viewCount * 0.1),
          shareCount: Math.floor(article.viewCount * 0.05),
          attachments: [],
          seoTitle: article.title,
          seoDescription: `Learn about ${article.title.toLowerCase()} with LocalPro`,
          featuredImage: null
        };
        
        await setDoc(doc(db, 'articles', article.id), articleData);
        console.log(`   ✅ Created article: ${article.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create article "${article.title}":`, error);
        throw error;
      }
    }

    // Store tutorials in Firebase
    console.log('🎥 Storing tutorials...');
    for (const tutorial of tutorials) {
      try {
        const tutorialData = {
          title: tutorial.title,
          slug: generateSlug(tutorial.title),
          description: `Step-by-step tutorial: ${tutorial.title.toLowerCase()}`,
          content: `This tutorial covers everything you need to know about ${tutorial.title.toLowerCase()}.`,
          excerpt: `A comprehensive tutorial about ${tutorial.title.toLowerCase()}`,
          category: tutorial.category,
          tags: [tutorial.category.toLowerCase().replace(' ', '-'), 'tutorial', 'localpro'],
          role: tutorial.role as 'clients' | 'providers' | 'agencies' | 'partners' | 'all',
          difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
          duration: 10,
          featured: tutorial.featured,
          popular: tutorial.popular,
          status: tutorial.status as 'draft' | 'published' | 'archived',
          authorId: 'admin-user-id',
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          viewCount: tutorial.viewCount,
          likeCount: Math.floor(tutorial.viewCount * 0.1),
          shareCount: Math.floor(tutorial.viewCount * 0.05),
          attachments: [],
          videoUrl: null,
          thumbnailUrl: null,
          steps: [
            { title: 'Introduction', description: 'Get started with this tutorial', duration: 2 },
            { title: 'Main Content', description: 'Learn the core concepts', duration: 6 },
            { title: 'Conclusion', description: 'Wrap up and next steps', duration: 2 }
          ],
          prerequisites: [],
          learningObjectives: [`Understand ${tutorial.title.toLowerCase()}`, 'Apply the concepts learned'],
          seoTitle: tutorial.title,
          seoDescription: `Learn ${tutorial.title.toLowerCase()} with LocalPro`,
          featuredImage: null
        };
        
        await setDoc(doc(db, 'tutorials', tutorial.id), tutorialData);
        console.log(`   ✅ Created tutorial: ${tutorial.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create tutorial "${tutorial.title}":`, error);
        throw error;
      }
    }

    // Store topics in Firebase
    console.log('📚 Storing topics...');
    for (const topic of topics) {
      try {
        const topicData = {
          title: topic.title,
          slug: generateSlug(topic.title),
          description: `Learn about ${topic.title.toLowerCase()}`,
          content: `This topic covers ${topic.title.toLowerCase()} in detail.`,
          category: topic.category,
          tags: [topic.category.toLowerCase().replace(' ', '-'), 'topic', 'localpro'],
          role: topic.role as 'clients' | 'providers' | 'agencies' | 'partners' | 'all',
          difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
          estimatedTime: 8,
          featured: topic.featured,
          popular: topic.popular,
          status: topic.status as 'draft' | 'published' | 'archived',
          authorId: 'admin-user-id',
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          viewCount: topic.viewCount,
          likeCount: Math.floor(topic.viewCount * 0.1),
          shareCount: Math.floor(topic.viewCount * 0.05),
          relatedTopics: [],
          relatedArticles: [],
          relatedTutorials: [],
          faq: [
            { question: `What is ${topic.title.toLowerCase()}?`, answer: `This topic covers the fundamentals of ${topic.title.toLowerCase()}.` },
            { question: `How do I get started?`, answer: 'Follow the step-by-step guide provided in this topic.' }
          ],
          tips: [
            { title: 'Quick Tip', description: 'Start with the basics before moving to advanced concepts', icon: '💡' },
            { title: 'Best Practice', description: 'Take notes while going through the content', icon: '📝' }
          ],
          seoTitle: topic.title,
          seoDescription: `Learn about ${topic.title.toLowerCase()} with LocalPro`,
          featuredImage: null
        };
        
        await setDoc(doc(db, 'topics', topic.id), topicData);
        console.log(`   ✅ Created topic: ${topic.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create topic "${topic.title}":`, error);
        throw error;
      }
    }

    // Store resources in Firebase
    console.log('📄 Storing resources...');
    for (const resource of resources) {
      try {
        const resourceData = {
          title: resource.title,
          description: `Downloadable resource: ${resource.title.toLowerCase()}`,
          type: 'pdf' as 'pdf' | 'doc' | 'xlsx' | 'image' | 'video' | 'zip' | 'link',
          category: resource.category,
          tags: [resource.category.toLowerCase(), 'resource', 'localpro'],
          role: resource.role as 'clients' | 'providers' | 'agencies' | 'partners' | 'all',
          fileUrl: `https://example.com/resources/${generateSlug(resource.title)}.pdf`,
          fileSize: 1024000, // 1MB in bytes
          fileName: `${generateSlug(resource.title)}.pdf`,
          featured: resource.featured,
          popular: resource.popular,
          status: resource.status as 'draft' | 'published' | 'archived',
          authorId: 'admin-user-id',
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          downloadCount: resource.downloadCount,
          likeCount: Math.floor(resource.downloadCount * 0.1),
          shareCount: Math.floor(resource.downloadCount * 0.05),
          version: '1.0',
          language: 'en',
          seoTitle: resource.title,
          seoDescription: `Download ${resource.title.toLowerCase()} from LocalPro`,
          featuredImage: null
        };
        
        await setDoc(doc(db, 'resources', resource.id), resourceData);
        console.log(`   ✅ Created resource: ${resource.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create resource "${resource.title}":`, error);
        throw error;
      }
    }

    console.log('✅ Mock Learning Hub data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${articles.length} articles created`);
    console.log(`   - ${tutorials.length} tutorials created`);
    console.log(`   - ${topics.length} topics created`);
    console.log(`   - ${resources.length} resources created`);
    console.log(`   - Total: ${articles.length + tutorials.length + topics.length + resources.length} items`);
    console.log('');
    console.log('🔗 Collections created in Firebase:');
    console.log('   - articles');
    console.log('   - tutorials');
    console.log('   - topics');
    console.log('   - resources');
    
  } catch (error) {
    console.error('❌ Error seeding Mock Learning Hub data:', error);
    
    // Provide more specific error information
    if (error instanceof Error) {
      if (error.message.includes('Firebase')) {
        console.error('💡 Firebase connection issue. Please check:');
        console.error('   1. Firebase configuration in .env.local');
        console.error('   2. Firestore database is enabled');
        console.error('   3. Network connection');
        console.error('   4. Run: npx tsx src/scripts/setup-firebase.ts --check');
      } else if (error.message.includes('permission')) {
        console.error('💡 Permission issue. Please check:');
        console.error('   1. Firestore security rules allow writes');
        console.error('   2. Firebase project permissions');
      }
    }
    
    throw error;
  }
}

// Run the seed function
seedMockLearningHubData()
  .then(() => {
    console.log('🎉 Mock data seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Mock data seeding failed:', error);
    process.exit(1);
  });

export default seedMockLearningHubData;
