# Learning Hub Data Seeders

This directory contains scripts to seed the Learning Hub with mock and real data for development and testing purposes.

## Available Seeders

### 1. `seed-mock-learning-hub-data.ts`
Seeds basic mock data for the Learning Hub including:
- 3 sample articles
- 2 sample tutorials  
- 1 sample topic
- 1 sample resource

**Usage:**
```bash
npx tsx src/scripts/seed-mock-learning-hub-data.ts
```

### 2. `seed-articles-data.ts`
Seeds comprehensive articles data from the all-articles page including:
- 31 detailed articles across 8 categories
- Client, Provider, Agency, Partner, Getting Started, Features & Functionality, Troubleshooting, and Security & Privacy articles
- Proper role-based categorization
- Realistic content and metadata

**Usage:**
```bash
npx tsx src/scripts/seed-articles-data.ts
```

### 3. `seed-all-learning-hub-data.ts`
Runs both seeders in sequence to create a complete Learning Hub dataset:
- Executes mock data seeder first
- Then executes articles data seeder
- Provides comprehensive summary

**Usage:**
```bash
npx tsx src/scripts/seed-all-learning-hub-data.ts
```

## Prerequisites

1. **Firebase Configuration**: Ensure your `.env.local` file contains the required Firebase environment variables:
   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
   ```

2. **Firestore Database**: Ensure Firestore is enabled in your Firebase project

3. **Security Rules**: For development, ensure your Firestore security rules allow writes:
   ```javascript
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```

## Data Structure

### Articles Collection
Each article document contains:
- `title`: Article title
- `slug`: URL-friendly slug
- `description`: Article description
- `content`: Full article content
- `excerpt`: Short excerpt
- `category`: Article category
- `tags`: Array of tags
- `role`: Target user role (clients, providers, agencies, partners, all)
- `difficulty`: Difficulty level (Beginner, Intermediate, Advanced)
- `readTime`: Estimated read time in minutes
- `featured`: Whether article is featured
- `popular`: Whether article is popular
- `status`: Publication status (draft, published, archived)
- `authorId`: Author user ID
- `publishedAt`: Publication timestamp
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `viewCount`: Number of views
- `likeCount`: Number of likes
- `shareCount`: Number of shares
- `attachments`: Array of attachment URLs
- `seoTitle`: SEO title
- `seoDescription`: SEO description
- `featuredImage`: Featured image URL

### Tutorials Collection
Each tutorial document contains:
- All article fields plus:
- `duration`: Tutorial duration in minutes
- `videoUrl`: Video URL
- `thumbnailUrl`: Thumbnail URL
- `steps`: Array of tutorial steps
- `prerequisites`: Array of prerequisites
- `learningObjectives`: Array of learning objectives

### Topics Collection
Each topic document contains:
- All article fields plus:
- `estimatedTime`: Estimated time to complete
- `relatedTopics`: Array of related topic IDs
- `relatedArticles`: Array of related article IDs
- `relatedTutorials`: Array of related tutorial IDs
- `faq`: Array of FAQ objects
- `tips`: Array of tip objects

### Resources Collection
Each resource document contains:
- `title`: Resource title
- `description`: Resource description
- `type`: Resource type (pdf, doc, xlsx, image, video, zip, link)
- `category`: Resource category
- `tags`: Array of tags
- `role`: Target user role
- `fileUrl`: File download URL
- `fileSize`: File size in bytes
- `fileName`: Original file name
- `featured`: Whether resource is featured
- `popular`: Whether resource is popular
- `status`: Publication status
- `authorId`: Author user ID
- `publishedAt`: Publication timestamp
- `createdAt`: Creation timestamp
- `updatedAt`: Last update timestamp
- `downloadCount`: Number of downloads
- `likeCount`: Number of likes
- `shareCount`: Number of shares
- `version`: Resource version
- `language`: Resource language
- `seoTitle`: SEO title
- `seoDescription`: SEO description
- `featuredImage`: Featured image URL

## Troubleshooting

### Environment Variables Not Loading
If you get "Firebase environment variables are not configured" error:
1. Ensure `.env.local` exists in project root
2. Check that all required Firebase variables are set
3. Verify no typos in variable names

### Firebase Connection Issues
If you get Firebase connection errors:
1. Check your internet connection
2. Verify Firebase project is active
3. Ensure Firestore is enabled
4. Check Firebase security rules allow writes

### Permission Errors
If you get permission denied errors:
1. Check Firestore security rules
2. Verify Firebase project permissions
3. Ensure you're using the correct project ID

## Development Notes

- All seeders use `serverTimestamp()` for consistent timestamps
- Data is structured to match the Learning Hub API expectations
- Slug generation ensures URL-friendly article paths
- Role-based categorization supports the Learning Hub's user role system
- Random view/like/share counts provide realistic engagement metrics

## Running Seeders in Production

⚠️ **Warning**: These seeders are designed for development and testing. For production:
1. Review all data before seeding
2. Ensure proper backup procedures
3. Consider using Firebase Admin SDK for server-side seeding
4. Implement proper error handling and rollback procedures
