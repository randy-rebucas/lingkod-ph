# Learning Hub Admin System

This admin system allows you to manage all content for the LocalPro Learning Hub, including articles, tutorials, topics, and resources.

## Features

### 📊 Dashboard Overview
- **Content Statistics**: View total content, published items, drafts, and metrics
- **Performance Metrics**: Track views, downloads, and engagement
- **Quick Actions**: Easy access to create new content

### 📝 Content Management
- **Articles**: Create and manage educational articles
- **Tutorials**: Manage video tutorials and step-by-step guides
- **Topics**: Organize content into comprehensive topic pages
- **Resources**: Upload and manage downloadable resources

### 🔍 Advanced Search & Filtering
- **Search**: Find content by title, description, or tags
- **Filters**: Filter by type, category, role, status, and difficulty
- **Bulk Actions**: Manage multiple items at once

### 👥 Role-Based Content
- **Clients**: Content for service clients
- **Providers**: Resources for service providers
- **Agencies**: Management tools for agencies
- **Partners**: Partnership information and resources
- **All Users**: General content for everyone

## Getting Started

### 1. Access the Admin Dashboard
Navigate to `/admin/learning-hub` to access the main dashboard.

### 2. Create Your First Article
1. Click "New Article" button
2. Fill in the basic information:
   - Title and slug
   - Description and excerpt
   - Category and target role
   - Difficulty level and read time
3. Write your content using Markdown
4. Add relevant tags
5. Configure SEO settings
6. Set featured/popular status
7. Choose publication status
8. Save your article

### 3. Manage Existing Content
- Use the search and filters to find content
- Click the actions menu (⋮) for each item
- Edit, view, publish/unpublish, or delete content
- Toggle featured and popular status

## Content Types

### Articles
Educational content that provides information and guidance:
- **Getting Started**: Basic guides for new users
- **Features & Functionality**: How-to guides for platform features
- **Troubleshooting**: Solutions to common problems
- **Security & Privacy**: Best practices and guidelines

### Tutorials
Step-by-step video guides and walkthroughs:
- **Video Content**: Embedded or linked video tutorials
- **Duration**: Estimated completion time
- **Difficulty**: Beginner, Intermediate, or Advanced
- **Learning Objectives**: What users will learn

### Topics
Comprehensive topic pages with multiple resources:
- **Related Content**: Links to articles, tutorials, and resources
- **FAQ Section**: Frequently asked questions
- **Pro Tips**: Helpful tips and best practices
- **Navigation**: Easy access to related topics

### Resources
Downloadable files and documents:
- **File Types**: PDF, DOC, XLSX, images, videos, archives
- **Categories**: Documentation, templates, guides, videos
- **Download Tracking**: Monitor usage and popularity
- **Version Control**: Track file versions and updates

## Content Guidelines

### Writing Best Practices
1. **Clear Structure**: Use headings, bullet points, and numbered lists
2. **Concise Language**: Write clearly and avoid jargon
3. **Visual Elements**: Include images, diagrams, and examples
4. **Actionable Content**: Provide specific steps and instructions
5. **User-Focused**: Write from the user's perspective

### SEO Optimization
1. **Title Tags**: Keep under 60 characters
2. **Meta Descriptions**: Keep under 160 characters
3. **Keywords**: Use relevant keywords naturally
4. **Internal Links**: Link to related content
5. **Images**: Include alt text and proper sizing

### Content Organization
1. **Categories**: Use consistent category names
2. **Tags**: Add relevant tags for better discoverability
3. **Role Targeting**: Specify the target audience
4. **Difficulty Levels**: Set appropriate difficulty
5. **Reading Time**: Provide accurate time estimates

## Admin Features

### Content Status
- **Draft**: Work in progress, not visible to users
- **Published**: Live and visible to users
- **Archived**: Hidden from users but preserved

### Content Flags
- **Featured**: Highlighted on main pages
- **Popular**: Shown in popular content sections
- **New**: Recently created content

### Analytics & Metrics
- **View Counts**: Track article and tutorial views
- **Download Counts**: Monitor resource downloads
- **User Engagement**: Track likes, shares, and comments
- **Performance**: Identify top-performing content

## API Endpoints

### Articles
- `GET /api/admin/learning-hub/articles` - List articles
- `POST /api/admin/learning-hub/articles` - Create article
- `GET /api/admin/learning-hub/articles/[id]` - Get article
- `PUT /api/admin/learning-hub/articles/[id]` - Update article
- `DELETE /api/admin/learning-hub/articles/[id]` - Delete article

### Tutorials
- `GET /api/admin/learning-hub/tutorials` - List tutorials
- `POST /api/admin/learning-hub/tutorials` - Create tutorial
- `GET /api/admin/learning-hub/tutorials/[id]` - Get tutorial
- `PUT /api/admin/learning-hub/tutorials/[id]` - Update tutorial
- `DELETE /api/admin/learning-hub/tutorials/[id]` - Delete tutorial

### Topics
- `GET /api/admin/learning-hub/topics` - List topics
- `POST /api/admin/learning-hub/topics` - Create topic
- `GET /api/admin/learning-hub/topics/[id]` - Get topic
- `PUT /api/admin/learning-hub/topics/[id]` - Update topic
- `DELETE /api/admin/learning-hub/topics/[id]` - Delete topic

### Resources
- `GET /api/admin/learning-hub/resources` - List resources
- `POST /api/admin/learning-hub/resources` - Create resource
- `GET /api/admin/learning-hub/resources/[id]` - Get resource
- `PUT /api/admin/learning-hub/resources/[id]` - Update resource
- `DELETE /api/admin/learning-hub/resources/[id]` - Delete resource

## Database Schema

### Articles Table
```sql
- id: UUID (Primary Key)
- title: String
- slug: String (Unique)
- description: String
- content: Text
- excerpt: String (Optional)
- category: String
- tags: String[]
- role: Enum (clients, providers, agencies, partners, all)
- difficulty: Enum (Beginner, Intermediate, Advanced)
- readTime: Integer (minutes)
- featured: Boolean
- popular: Boolean
- status: Enum (draft, published, archived)
- authorId: UUID (Foreign Key)
- publishedAt: DateTime (Optional)
- createdAt: DateTime
- updatedAt: DateTime
- viewCount: Integer
- likeCount: Integer
- shareCount: Integer
- seoTitle: String (Optional)
- seoDescription: String (Optional)
- featuredImage: String (Optional)
- attachments: String[]
```

## Seed Data

The system includes essential seed articles to get started:

1. **Welcome to LocalPro**: Complete getting started guide
2. **Account Creation & Verification**: Step-by-step account setup
3. **Service Categories**: Overview of available services
4. **Client Onboarding**: Guide for new clients
5. **Provider Verification**: Process for service providers
6. **Agency Setup**: Guide for agency management
7. **Partnership Application**: Information for partners

## Running Seed Data

To populate the database with essential articles:

```bash
# Run the seed script
npm run seed:learning-hub

# Or using tsx directly
npx tsx src/scripts/seed-learning-hub.ts
```

## Best Practices

### Content Creation
1. **Start with User Needs**: Understand what users need to know
2. **Use Clear Structure**: Organize content logically
3. **Include Examples**: Provide real-world examples
4. **Test Instructions**: Verify all steps work correctly
5. **Update Regularly**: Keep content current and accurate

### Content Management
1. **Review Before Publishing**: Check for accuracy and clarity
2. **Monitor Performance**: Track views and user feedback
3. **Update Outdated Content**: Keep information current
4. **Archive Old Content**: Remove or update obsolete information
5. **Cross-Reference**: Link related content together

### User Experience
1. **Mobile-Friendly**: Ensure content works on all devices
2. **Fast Loading**: Optimize images and content
3. **Easy Navigation**: Provide clear paths to related content
4. **Search Optimization**: Make content easy to find
5. **Accessibility**: Follow accessibility guidelines

## Support

For technical support or questions about the admin system:

- **Documentation**: Check this README and inline help
- **API Documentation**: Review endpoint documentation
- **Database Schema**: Reference the schema definitions
- **Seed Data**: Use the provided seed articles as examples

## Future Enhancements

Planned features for the admin system:

- **Bulk Import**: Import content from external sources
- **Content Templates**: Pre-built templates for common content types
- **Advanced Analytics**: Detailed performance metrics
- **Content Scheduling**: Schedule content publication
- **Multi-language Support**: Manage content in multiple languages
- **Content Collaboration**: Multi-user editing and review
- **Automated Testing**: Content validation and testing tools
