#!/usr/bin/env tsx

import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

// Mock seed data for learning hub
const seedData = {
  authors: [
    {
      id: '1',
      name: 'LocalPro Admin',
      email: 'admin@localpro.com',
      bio: 'LocalPro content team',
      role: 'admin',
      status: 'active'
    }
  ],
  categories: [
    {
      id: '1',
      name: 'Getting Started',
      slug: 'getting-started',
      description: 'Essential guides for new users',
      icon: 'BookOpen',
      color: 'bg-blue-50 text-blue-600 border-blue-200',
      sortOrder: 1,
      status: 'published'
    },
    {
      id: '2',
      name: 'For Clients',
      slug: 'for-clients',
      description: 'Resources and guides specifically designed for service clients',
      icon: 'Users',
      color: 'bg-green-50 text-green-600 border-green-200',
      sortOrder: 2,
      status: 'published'
    },
    {
      id: '3',
      name: 'For Providers',
      slug: 'for-providers',
      description: 'Tools and strategies for service providers to grow their business',
      icon: 'UserCheck',
      color: 'bg-purple-50 text-purple-600 border-purple-200',
      sortOrder: 3,
      status: 'published'
    },
    {
      id: '4',
      name: 'For Agencies',
      slug: 'for-agencies',
      description: 'Management tools and strategies for agency owners and managers',
      icon: 'Building2',
      color: 'bg-orange-50 text-orange-600 border-orange-200',
      sortOrder: 4,
      status: 'published'
    },
    {
      id: '5',
      name: 'For Partners',
      slug: 'for-partners',
      description: 'Partnership opportunities and collaboration strategies',
      icon: 'Target',
      color: 'bg-indigo-50 text-indigo-600 border-indigo-200',
      sortOrder: 5,
      status: 'published'
    }
  ],
  articles: [
    {
      id: '1',
      title: 'Welcome to LocalPro: Your Complete Getting Started Guide',
      slug: 'welcome-to-localpro-complete-guide',
      description: 'Everything you need to know to get started with LocalPro, from account creation to your first booking.',
      content: `# Welcome to LocalPro!

LocalPro is your gateway to connecting with trusted local service providers. This comprehensive guide will walk you through everything you need to know to get started.

## What is LocalPro?

LocalPro is a platform that connects clients with verified local service providers. Whether you need home cleaning, pet care, handyman services, or professional consultations, LocalPro makes it easy to find, book, and pay for services in your area.

## Getting Started

### 1. Create Your Account
- Visit our website or download the mobile app
- Sign up with your email address or phone number
- Verify your account through the confirmation email/SMS
- Complete your profile with basic information

### 2. Set Your Location
- Enable location services for automatic detection
- Or manually enter your address
- This helps us show you relevant local services

### 3. Browse Services
- Use the search bar to find specific services
- Browse categories like Home & Garden, Personal Care, Professional Services
- Filter by location, price, availability, and ratings

### 4. Book Your First Service
- Select a service provider
- Choose your preferred date and time
- Add any special instructions
- Complete payment securely

### 5. Track Your Booking
- Monitor your booking status in real-time
- Receive notifications about provider updates
- Get estimated arrival times

## Key Features

- **Verified Providers**: All service providers are background-checked and verified
- **Secure Payments**: Your payments are protected with fraud detection
- **Real-time Tracking**: Track your service provider's location and arrival time
- **Reviews & Ratings**: Read reviews and leave feedback for others
- **24/7 Support**: Get help whenever you need it

## Next Steps

Now that you understand the basics, explore our role-specific guides:
- [For Clients](/learning-hub/clients) - Advanced client features and tips
- [For Providers](/learning-hub/providers) - How to become a service provider
- [For Agencies](/learning-hub/agencies) - Managing multiple providers
- [For Partners](/learning-hub/partners) - Partnership opportunities

## Need Help?

If you have any questions or need assistance, our support team is here to help:
- Live chat support
- Email support
- Phone support
- Help center with detailed guides

Welcome to the LocalPro community!`,
      category: 'Getting Started',
      tags: ['getting-started', 'onboarding', 'basics', 'welcome'],
      role: 'all',
      difficulty: 'Beginner',
      readTime: 8,
      featured: true,
      popular: true,
      status: 'published',
      authorId: '1',
      seoTitle: 'Welcome to LocalPro - Complete Getting Started Guide',
      seoDescription: 'Everything you need to know to get started with LocalPro. Learn how to create an account, find services, and make your first booking.',
      featuredImage: 'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800&h=400&fit=crop',
      viewCount: 15420,
      likeCount: 245,
      shareCount: 89,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    },
    {
      id: '2',
      title: 'How to Create and Verify Your LocalPro Account',
      slug: 'create-verify-localpro-account',
      description: 'Step-by-step guide to creating your LocalPro account and completing the verification process.',
      content: `# How to Create and Verify Your LocalPro Account

Creating your LocalPro account is quick and easy. This guide will walk you through the entire process.

## Creating Your Account

### Step 1: Choose Your Sign-Up Method
You can create your account using:
- Email address
- Phone number
- Google account
- Apple ID

### Step 2: Provide Basic Information
- Full name
- Email address or phone number
- Create a secure password
- Accept terms of service and privacy policy

### Step 3: Verify Your Contact Information
- Check your email for a verification link
- Or enter the SMS code sent to your phone
- Click the verification link or enter the code

## Account Verification

### Why Verification Matters
Account verification helps us:
- Protect your account from unauthorized access
- Ensure you receive important notifications
- Comply with security regulations
- Provide better customer support

### Verification Methods
1. **Email Verification**: Click the link in your welcome email
2. **Phone Verification**: Enter the SMS code
3. **Identity Verification**: Upload a government-issued ID (for providers)

## Setting Up Your Profile

### Basic Profile Information
- Profile photo (optional but recommended)
- Bio or description
- Service preferences
- Notification preferences

### Privacy Settings
- Control who can see your profile
- Manage data sharing preferences
- Set communication preferences

## Security Best Practices

### Password Security
- Use a strong, unique password
- Enable two-factor authentication
- Never share your login credentials

### Account Protection
- Log out from shared devices
- Monitor your account activity
- Report suspicious activity immediately

## Troubleshooting

### Common Issues
- **Didn't receive verification email**: Check spam folder, request resend
- **SMS code not received**: Check phone number, request new code
- **Can't log in**: Reset password, check email/phone number

### Getting Help
If you encounter any issues:
1. Check our troubleshooting guide
2. Contact support via live chat
3. Email support@localpro.com
4. Call our support hotline

## Next Steps

Once your account is verified:
1. Complete your profile
2. Set your location preferences
3. Browse available services
4. Make your first booking

Your LocalPro account is now ready to use!`,
      category: 'Getting Started',
      tags: ['account', 'verification', 'setup', 'security'],
      role: 'all',
      difficulty: 'Beginner',
      readTime: 6,
      featured: true,
      popular: true,
      status: 'published',
      authorId: '1',
      seoTitle: 'How to Create and Verify Your LocalPro Account - Step by Step',
      seoDescription: 'Complete guide to creating and verifying your LocalPro account. Learn about security best practices and troubleshooting common issues.',
      viewCount: 12850,
      likeCount: 198,
      shareCount: 67,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    },
    {
      id: '3',
      title: 'Understanding LocalPro Service Categories and Types',
      slug: 'localpro-service-categories-types',
      description: 'Complete overview of all service categories and types available on LocalPro platform.',
      content: `# Understanding LocalPro Service Categories and Types

LocalPro offers a wide range of service categories to meet all your local service needs. This guide will help you understand what's available and how to find the right service for you.

## Home & Garden Services

### Cleaning Services
- **House Cleaning**: Regular and deep cleaning services
- **Office Cleaning**: Commercial cleaning solutions
- **Carpet Cleaning**: Professional carpet and upholstery cleaning
- **Window Cleaning**: Interior and exterior window cleaning
- **Post-Construction Cleanup**: Specialized cleaning after renovations

### Maintenance & Repairs
- **Handyman Services**: General home repairs and maintenance
- **Plumbing**: Leak repairs, fixture installation, drain cleaning
- **Electrical Work**: Wiring, outlet installation, lighting
- **HVAC Services**: Heating, ventilation, and air conditioning
- **Appliance Repair**: Refrigerator, washer, dryer, and other appliance repairs

### Landscaping & Outdoor
- **Lawn Care**: Mowing, edging, fertilizing, weed control
- **Garden Maintenance**: Planting, pruning, seasonal cleanup
- **Tree Services**: Tree trimming, removal, stump grinding
- **Pest Control**: Indoor and outdoor pest management
- **Pool Maintenance**: Cleaning, chemical balancing, equipment repair

## Personal Care Services

### Health & Wellness
- **Massage Therapy**: Relaxation and therapeutic massage
- **Personal Training**: Fitness coaching and workout plans
- **Nutrition Counseling**: Dietary planning and health coaching
- **Mental Health Support**: Counseling and therapy services
- **Physical Therapy**: Rehabilitation and injury recovery

### Beauty & Grooming
- **Hair Services**: Cutting, styling, coloring, treatments
- **Nail Care**: Manicures, pedicures, nail art
- **Skincare**: Facials, treatments, consultations
- **Makeup Services**: Special event and everyday makeup
- **Barber Services**: Men's haircuts, beard trimming, styling

## Professional Services

### Business & Consulting
- **Business Consulting**: Strategy, operations, growth planning
- **Financial Services**: Accounting, tax preparation, financial planning
- **Legal Services**: Consultation, document preparation, representation
- **Marketing Services**: Digital marketing, content creation, SEO
- **IT Support**: Computer repair, network setup, cybersecurity

### Education & Training
- **Tutoring**: Academic support for all subjects and levels
- **Language Learning**: Foreign language instruction
- **Music Lessons**: Instrument and vocal training
- **Art Classes**: Drawing, painting, crafts, and creative skills
- **Professional Development**: Career coaching and skill building

## Pet Care Services

### Pet Health & Wellness
- **Veterinary Services**: Health checkups, vaccinations, treatments
- **Pet Grooming**: Bathing, brushing, nail trimming, styling
- **Pet Training**: Obedience training, behavior modification
- **Pet Sitting**: In-home pet care and companionship
- **Dog Walking**: Regular exercise and outdoor time

### Pet Services
- **Pet Transportation**: Safe transport to vet appointments
- **Pet Photography**: Professional pet portraits and events
- **Pet Boarding**: Overnight care and accommodation
- **Pet Waste Removal**: Regular yard cleanup services

## Technology Services

### Computer & Electronics
- **Computer Repair**: Hardware and software troubleshooting
- **Phone Repair**: Screen replacement, battery service, data recovery
- **Network Setup**: WiFi installation, security configuration
- **Smart Home Setup**: Device installation and automation
- **Data Recovery**: File and data restoration services

### Software & Development
- **Website Development**: Custom websites and web applications
- **App Development**: Mobile and desktop applications
- **Software Training**: Learning new programs and systems
- **Database Management**: Setup, maintenance, and optimization
- **Cloud Services**: Migration, setup, and management

## Event & Entertainment Services

### Event Planning
- **Party Planning**: Birthday parties, celebrations, special events
- **Wedding Services**: Planning, coordination, vendor management
- **Corporate Events**: Meetings, conferences, team building
- **Catering**: Food service for events of all sizes
- **Photography**: Event photography and videography

### Entertainment
- **Music Services**: DJs, live music, sound systems
- **Entertainment**: Magicians, clowns, performers
- **Decorations**: Event styling and decoration services
- **Transportation**: Party buses, limousines, special vehicles

## How to Choose the Right Service

### Consider Your Needs
- **Scope of Work**: What exactly do you need done?
- **Timeline**: When do you need the service completed?
- **Budget**: What's your price range for the service?
- **Location**: Do you need the service at your home or business?

### Research Providers
- **Read Reviews**: Check ratings and customer feedback
- **Compare Prices**: Get quotes from multiple providers
- **Check Availability**: Ensure they can meet your timeline
- **Verify Credentials**: Confirm licenses, insurance, and certifications

### Ask Questions
- **Experience**: How long have they been in business?
- **References**: Can they provide customer references?
- **Insurance**: Are they properly insured and bonded?
- **Guarantees**: What warranties or guarantees do they offer?

## Booking Tips

### Best Practices
1. **Book in Advance**: Popular services may require advance booking
2. **Be Specific**: Provide detailed information about your needs
3. **Ask Questions**: Don't hesitate to ask for clarification
4. **Read Terms**: Understand cancellation and refund policies
5. **Leave Reviews**: Help others by sharing your experience

### Communication
- **Be Clear**: Explain exactly what you need
- **Provide Access**: Ensure providers can access the work area
- **Be Available**: Be reachable during the service
- **Give Feedback**: Let providers know how they're doing

## Getting Started

Ready to find the perfect service for your needs?

1. **Browse Categories**: Explore our service categories
2. **Use Search**: Find specific services in your area
3. **Read Reviews**: Check provider ratings and feedback
4. **Book Services**: Schedule appointments that work for you
5. **Track Progress**: Monitor your bookings in real-time

LocalPro makes it easy to find and book the services you need, when you need them. Start exploring today!`,
      category: 'Getting Started',
      tags: ['services', 'categories', 'types', 'overview'],
      role: 'all',
      difficulty: 'Beginner',
      readTime: 12,
      featured: false,
      popular: true,
      status: 'published',
      authorId: '1',
      seoTitle: 'LocalPro Service Categories and Types - Complete Guide',
      seoDescription: 'Comprehensive guide to all service categories and types available on LocalPro. Learn how to find and choose the right service for your needs.',
      viewCount: 11200,
      likeCount: 156,
      shareCount: 43,
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      publishedAt: new Date().toISOString()
    }
  ]
};

async function main() {
  console.log('🚀 Starting Learning Hub seed process (Mock Mode)...');
  
  try {
    // Create data directory if it doesn't exist
    const dataDir = join(process.cwd(), 'src', 'data');
    if (!existsSync(dataDir)) {
      mkdirSync(dataDir, { recursive: true });
    }

    // Write seed data to JSON files
    writeFileSync(
      join(dataDir, 'learning-hub-seed.json'),
      JSON.stringify(seedData, null, 2)
    );

    console.log('');
    console.log('✅ Learning Hub seed data created successfully!');
    console.log('📁 Seed data saved to: src/data/learning-hub-seed.json');
    console.log('');
    console.log('📊 Seed data includes:');
    console.log(`   - ${seedData.authors.length} authors`);
    console.log(`   - ${seedData.categories.length} categories`);
    console.log(`   - ${seedData.articles.length} articles`);
    console.log('');
    console.log('🎯 Essential articles created:');
    seedData.articles.forEach((article, index) => {
      console.log(`   ${index + 1}. ${article.title}`);
    });
    console.log('');
    console.log('🚀 You can now use the admin dashboard to manage content!');
    console.log('   Visit: /admin/learning-hub');
    console.log('');
    console.log('📝 Note: This is mock data. To use with Firebase:');
    console.log('   1. Configure Firebase environment variables');
    console.log('   2. Run: npm run seed:learning-hub');
    
  } catch (error) {
    console.error('❌ Error creating seed data:', error);
    process.exit(1);
  }
}

main();
