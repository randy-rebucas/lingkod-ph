// Load environment variables from .env.local FIRST
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env.local file before any other imports
config({ path: resolve(process.cwd(), '.env.local') });

// Import Firebase modules
import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, initializeFirestore } from 'firebase/firestore';
import { collection, doc, setDoc, serverTimestamp } from 'firebase/firestore';

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

interface ArticleData {
  id: number;
  title: string;
  description: string;
  category: string;
  readTime: string;
  isPopular: boolean;
  lastUpdated: string;
  tags: string[];
  href: string;
}

async function seedArticlesData() {
  try {
    console.log('🌱 Starting Articles data seeding...');
    
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

    // Articles data from the all-articles page
    const articles: ArticleData[] = [
      // Client Articles
      {
        id: 1,
        title: "How to Find and Book Services as a Client",
        description: "Complete guide to finding and booking the best local services on LocalPro",
        category: "For Clients",
        readTime: "8 min read",
        isPopular: true,
        lastUpdated: "2024-01-15",
        tags: ["booking", "client", "services", "tutorial"],
        href: "/learning-hub/articles/client-booking-guide"
      },
      {
        id: 2,
        title: "Understanding Client Payment Security",
        description: "Learn how your payments are protected and secure on LocalPro",
        category: "For Clients",
        readTime: "6 min read",
        isPopular: false,
        lastUpdated: "2024-01-14",
        tags: ["payment", "security", "client", "protection"],
        href: "/learning-hub/articles/client-payment-security"
      },
      {
        id: 3,
        title: "How to Write Effective Reviews",
        description: "Tips for writing helpful reviews that benefit other clients",
        category: "For Clients",
        readTime: "4 min read",
        isPopular: true,
        lastUpdated: "2024-01-13",
        tags: ["reviews", "feedback", "client", "tips"],
        href: "/learning-hub/articles/writing-reviews"
      },
      {
        id: 4,
        title: "Client Account Management",
        description: "How to manage your client account, preferences, and settings",
        category: "For Clients",
        readTime: "5 min read",
        isPopular: false,
        lastUpdated: "2024-01-12",
        tags: ["account", "settings", "client", "management"],
        href: "/learning-hub/articles/client-account-management"
      },

      // Provider Articles
      {
        id: 5,
        title: "Provider Verification Process",
        description: "Complete guide to becoming a verified service provider on LocalPro",
        category: "For Providers",
        readTime: "10 min read",
        isPopular: true,
        lastUpdated: "2024-01-16",
        tags: ["verification", "provider", "setup", "process"],
        href: "/learning-hub/articles/provider-verification"
      },
      {
        id: 6,
        title: "Optimizing Your Provider Profile",
        description: "Best practices for creating an attractive and effective provider profile",
        category: "For Providers",
        readTime: "7 min read",
        isPopular: true,
        lastUpdated: "2024-01-15",
        tags: ["profile", "optimization", "provider", "marketing"],
        href: "/learning-hub/articles/provider-profile-optimization"
      },
      {
        id: 7,
        title: "Managing Bookings and Schedule",
        description: "How to efficiently manage your bookings and availability",
        category: "For Providers",
        readTime: "8 min read",
        isPopular: false,
        lastUpdated: "2024-01-14",
        tags: ["bookings", "schedule", "provider", "management"],
        href: "/learning-hub/articles/provider-booking-management"
      },
      {
        id: 8,
        title: "Provider Earnings and Payouts",
        description: "Understanding how earnings work and how to get paid",
        category: "For Providers",
        readTime: "6 min read",
        isPopular: false,
        lastUpdated: "2024-01-13",
        tags: ["earnings", "payouts", "provider", "finance"],
        href: "/learning-hub/articles/provider-earnings"
      },

      // Agency Articles
      {
        id: 9,
        title: "Agency Setup and Registration",
        description: "How to register and set up your agency on LocalPro",
        category: "For Agencies",
        readTime: "12 min read",
        isPopular: true,
        lastUpdated: "2024-01-17",
        tags: ["agency", "setup", "registration", "business"],
        href: "/learning-hub/articles/agency-setup"
      },
      {
        id: 10,
        title: "Managing Multiple Providers",
        description: "Best practices for managing a team of service providers",
        category: "For Agencies",
        readTime: "9 min read",
        isPopular: false,
        lastUpdated: "2024-01-16",
        tags: ["team", "management", "agency", "providers"],
        href: "/learning-hub/articles/agency-team-management"
      },
      {
        id: 11,
        title: "Agency Quality Control",
        description: "How to maintain high service quality across your agency",
        category: "For Agencies",
        readTime: "7 min read",
        isPopular: false,
        lastUpdated: "2024-01-15",
        tags: ["quality", "control", "agency", "standards"],
        href: "/learning-hub/articles/agency-quality-control"
      },
      {
        id: 12,
        title: "Agency Analytics and Reporting",
        description: "Understanding your agency's performance metrics and analytics",
        category: "For Agencies",
        readTime: "8 min read",
        isPopular: false,
        lastUpdated: "2024-01-14",
        tags: ["analytics", "reporting", "agency", "metrics"],
        href: "/learning-hub/articles/agency-analytics"
      },

      // Partner Articles
      {
        id: 13,
        title: "Partnership Application Process",
        description: "How to apply and become a LocalPro partner",
        category: "For Partners",
        readTime: "10 min read",
        isPopular: true,
        lastUpdated: "2024-01-18",
        tags: ["partnership", "application", "process", "business"],
        href: "/learning-hub/articles/partnership-application"
      },
      {
        id: 14,
        title: "Partnership Benefits and Opportunities",
        description: "Understanding the benefits and opportunities available to partners",
        category: "For Partners",
        readTime: "6 min read",
        isPopular: false,
        lastUpdated: "2024-01-17",
        tags: ["benefits", "opportunities", "partnership", "growth"],
        href: "/learning-hub/articles/partnership-benefits"
      },
      {
        id: 15,
        title: "Partner Success Strategies",
        description: "Proven strategies for successful partnerships with LocalPro",
        category: "For Partners",
        readTime: "8 min read",
        isPopular: false,
        lastUpdated: "2024-01-16",
        tags: ["success", "strategies", "partnership", "growth"],
        href: "/learning-hub/articles/partner-success-strategies"
      },

      // Getting Started Articles
      {
        id: 17,
        title: "How to Create Your First Booking",
        description: "Step-by-step guide to booking your first service on LocalPro",
        category: "Getting Started",
        readTime: "5 min read",
        isPopular: true,
        lastUpdated: "2024-01-15",
        tags: ["booking", "first-time", "tutorial"],
        href: "/learning-hub/articles/first-booking"
      },
      {
        id: 18,
        title: "Account Setup Guide",
        description: "Complete guide to setting up your LocalPro account",
        category: "Getting Started",
        readTime: "8 min read",
        isPopular: false,
        lastUpdated: "2024-01-10",
        tags: ["account", "setup", "profile"],
        href: "/learning-hub/articles/account-setup"
      },
      {
        id: 19,
        title: "Profile Creation Best Practices",
        description: "Learn how to create an attractive and effective profile",
        category: "Getting Started",
        readTime: "6 min read",
        isPopular: true,
        lastUpdated: "2024-01-12",
        tags: ["profile", "optimization", "tips"],
        href: "/learning-hub/articles/profile-creation"
      },
      {
        id: 20,
        title: "Payment Setup and Verification",
        description: "How to set up and verify your payment methods",
        category: "Getting Started",
        readTime: "4 min read",
        isPopular: false,
        lastUpdated: "2024-01-08",
        tags: ["payment", "verification", "setup"],
        href: "/learning-hub/articles/payment-setup"
      },

      // Features & Functionality Articles
      {
        id: 21,
        title: "Advanced Search Features",
        description: "Master the search functionality to find exactly what you need",
        category: "Features & Functionality",
        readTime: "6 min read",
        isPopular: false,
        lastUpdated: "2024-01-14",
        tags: ["search", "filters", "advanced"],
        href: "/learning-hub/articles/advanced-search"
      },
      {
        id: 22,
        title: "Booking Management System",
        description: "Complete guide to managing your bookings and appointments",
        category: "Features & Functionality",
        readTime: "10 min read",
        isPopular: true,
        lastUpdated: "2024-01-16",
        tags: ["booking", "management", "calendar"],
        href: "/learning-hub/articles/booking-management"
      },
      {
        id: 23,
        title: "Reviews and Ratings System",
        description: "How to use and benefit from the review system",
        category: "Features & Functionality",
        readTime: "7 min read",
        isPopular: false,
        lastUpdated: "2024-01-11",
        tags: ["reviews", "ratings", "feedback"],
        href: "/learning-hub/articles/reviews-ratings"
      },
      {
        id: 24,
        title: "Analytics Dashboard Guide",
        description: "Understanding your analytics and performance metrics",
        category: "Features & Functionality",
        readTime: "9 min read",
        isPopular: false,
        lastUpdated: "2024-01-13",
        tags: ["analytics", "dashboard", "metrics"],
        href: "/learning-hub/articles/analytics-dashboard"
      },

      // Troubleshooting Articles
      {
        id: 25,
        title: "Troubleshooting Login Issues",
        description: "Common login problems and their solutions",
        category: "Troubleshooting",
        readTime: "3 min read",
        isPopular: true,
        lastUpdated: "2024-01-17",
        tags: ["login", "troubleshooting", "password"],
        href: "/learning-hub/articles/login-troubleshooting"
      },
      {
        id: 26,
        title: "Payment Problems and Solutions",
        description: "Resolve common payment issues and errors",
        category: "Troubleshooting",
        readTime: "5 min read",
        isPopular: true,
        lastUpdated: "2024-01-15",
        tags: ["payment", "errors", "solutions"],
        href: "/learning-hub/articles/payment-troubleshooting"
      },
      {
        id: 27,
        title: "Booking Errors and Fixes",
        description: "Common booking issues and how to resolve them",
        category: "Troubleshooting",
        readTime: "4 min read",
        isPopular: false,
        lastUpdated: "2024-01-12",
        tags: ["booking", "errors", "fixes"],
        href: "/learning-hub/articles/booking-errors"
      },
      {
        id: 28,
        title: "Account Recovery Process",
        description: "How to recover your account if you're locked out",
        category: "Troubleshooting",
        readTime: "6 min read",
        isPopular: false,
        lastUpdated: "2024-01-09",
        tags: ["account", "recovery", "security"],
        href: "/learning-hub/articles/account-recovery"
      },

      // Security & Privacy Articles
      {
        id: 29,
        title: "Understanding Payment Security",
        description: "Learn about our secure payment system and fraud protection",
        category: "Security & Privacy",
        readTime: "8 min read",
        isPopular: false,
        lastUpdated: "2024-01-16",
        tags: ["security", "payment", "fraud"],
        href: "/learning-hub/articles/payment-security"
      },
      {
        id: 30,
        title: "Data Protection and Privacy",
        description: "How we protect your personal information",
        category: "Security & Privacy",
        readTime: "7 min read",
        isPopular: false,
        lastUpdated: "2024-01-14",
        tags: ["privacy", "data", "protection"],
        href: "/learning-hub/articles/data-protection"
      },
      {
        id: 31,
        title: "Privacy Settings Guide",
        description: "Control your privacy and data sharing preferences",
        category: "Security & Privacy",
        readTime: "5 min read",
        isPopular: false,
        lastUpdated: "2024-01-11",
        tags: ["privacy", "settings", "control"],
        href: "/learning-hub/articles/privacy-settings"
      },
      {
        id: 32,
        title: "Account Security Best Practices",
        description: "Keep your account secure with these essential tips",
        category: "Security & Privacy",
        readTime: "6 min read",
        isPopular: true,
        lastUpdated: "2024-01-13",
        tags: ["security", "account", "best-practices"],
        href: "/learning-hub/articles/account-security"
      }
    ];

    // Store articles in Firebase
    console.log('📝 Storing articles...');
    for (const article of articles) {
      try {
        // Extract read time number from string (e.g., "8 min read" -> 8)
        const readTimeMatch = article.readTime.match(/(\d+)/);
        const readTime = readTimeMatch ? parseInt(readTimeMatch[1]) : 5;

        // Determine role based on category
        let role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all' = 'all';
        if (article.category === 'For Clients') role = 'clients';
        else if (article.category === 'For Providers') role = 'providers';
        else if (article.category === 'For Agencies') role = 'agencies';
        else if (article.category === 'For Partners') role = 'partners';

        const articleData = {
          title: article.title,
          slug: generateSlug(article.title),
          description: article.description,
          content: `# ${article.title}\n\n${article.description}\n\nThis comprehensive article covers everything you need to know about ${article.title.toLowerCase()}. Our detailed guide will help you understand the concepts and apply them effectively.\n\n## Key Topics Covered\n\n- Understanding the fundamentals\n- Step-by-step instructions\n- Best practices and tips\n- Common challenges and solutions\n- Advanced techniques\n\n## Getting Started\n\nThis article is designed to be accessible to users of all skill levels. Whether you're just getting started or looking to enhance your existing knowledge, you'll find valuable insights here.\n\n## Conclusion\n\nBy following the guidance in this article, you'll be well-equipped to ${article.title.toLowerCase().replace('how to ', '').replace('understanding ', '').replace('guide', '')} effectively on LocalPro.`,
          excerpt: article.description,
          category: article.category,
          tags: article.tags,
          role: role,
          difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
          readTime: readTime,
          featured: article.isPopular,
          popular: article.isPopular,
          status: 'published' as 'draft' | 'published' | 'archived',
          authorId: 'admin-user-id',
          publishedAt: serverTimestamp(),
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          viewCount: Math.floor(Math.random() * 10000) + 1000, // Random view count between 1000-11000
          likeCount: Math.floor(Math.random() * 500) + 50, // Random like count between 50-550
          shareCount: Math.floor(Math.random() * 100) + 10, // Random share count between 10-110
          attachments: [],
          seoTitle: article.title,
          seoDescription: article.description,
          featuredImage: null
        };
        
        await setDoc(doc(db, 'articles', article.id.toString()), articleData);
        console.log(`   ✅ Created article: ${article.title}`);
      } catch (error) {
        console.error(`   ❌ Failed to create article "${article.title}":`, error);
        throw error;
      }
    }

    console.log('✅ Articles data seeding completed successfully!');
    console.log(`📊 Summary:`);
    console.log(`   - ${articles.length} articles created`);
    console.log(`   - Categories: ${[...new Set(articles.map(a => a.category))].join(', ')}`);
    console.log(`   - Popular articles: ${articles.filter(a => a.isPopular).length}`);
    console.log('');
    console.log('🔗 Articles stored in Firebase collection: articles');
    
  } catch (error) {
    console.error('❌ Error seeding Articles data:', error);
    
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
seedArticlesData()
  .then(() => {
    console.log('🎉 Articles data seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Articles data seeding failed:', error);
    process.exit(1);
  });

export default seedArticlesData;
