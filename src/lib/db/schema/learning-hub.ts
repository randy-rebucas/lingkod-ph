import { z } from 'zod';

// Base schemas
export const UserRoleSchema = z.enum(['clients', 'providers', 'agencies', 'partners', 'all']);
export const DifficultySchema = z.enum(['Beginner', 'Intermediate', 'Advanced']);
export const ContentTypeSchema = z.enum(['article', 'tutorial', 'topic', 'guide', 'video', 'resource']);
export const ResourceTypeSchema = z.enum(['pdf', 'doc', 'xlsx', 'image', 'video', 'zip', 'link']);
export const StatusSchema = z.enum(['draft', 'published', 'archived']);

// Article schema
export const ArticleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).max(500),
  content: z.string().min(1),
  excerpt: z.string().max(300).optional(),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  role: UserRoleSchema,
  difficulty: DifficultySchema,
  readTime: z.number().min(1).max(60), // in minutes
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  status: StatusSchema.default('draft'),
  authorId: z.string().uuid(),
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  viewCount: z.number().default(0),
  likeCount: z.number().default(0),
  shareCount: z.number().default(0),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  featuredImage: z.string().url().optional(),
  attachments: z.array(z.string().url()).default([])
});

// Tutorial schema
export const TutorialSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  role: UserRoleSchema,
  difficulty: DifficultySchema,
  duration: z.number().min(1).max(300), // in minutes
  videoUrl: z.string().url().optional(),
  videoThumbnail: z.string().url().optional(),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  status: StatusSchema.default('draft'),
  authorId: z.string().uuid(),
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  viewCount: z.number().default(0),
  likeCount: z.number().default(0),
  shareCount: z.number().default(0),
  instructor: z.string().min(1).max(100),
  rating: z.number().min(0).max(5).default(0),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  prerequisites: z.array(z.string()).default([]),
  learningObjectives: z.array(z.string()).default([])
});

// Topic schema
export const TopicSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().min(1).max(500),
  content: z.string().min(1),
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  role: UserRoleSchema,
  difficulty: DifficultySchema,
  estimatedTime: z.number().min(1).max(120), // in minutes
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  status: StatusSchema.default('draft'),
  authorId: z.string().uuid(),
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  viewCount: z.number().default(0),
  likeCount: z.number().default(0),
  shareCount: z.number().default(0),
  relatedTopics: z.array(z.string().uuid()).default([]),
  relatedArticles: z.array(z.string().uuid()).default([]),
  relatedTutorials: z.array(z.string().uuid()).default([]),
  faq: z.array(z.object({
    question: z.string().min(1),
    answer: z.string().min(1)
  })).default([]),
  tips: z.array(z.object({
    title: z.string().min(1),
    description: z.string().min(1),
    icon: z.string().optional()
  })).default([]),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  featuredImage: z.string().url().optional()
});

// Resource schema
export const ResourceSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(200),
  description: z.string().min(1).max(500),
  type: ResourceTypeSchema,
  category: z.string().min(1).max(100),
  tags: z.array(z.string()).default([]),
  role: UserRoleSchema,
  fileUrl: z.string().url(),
  fileSize: z.number().min(0), // in bytes
  fileName: z.string().min(1),
  featured: z.boolean().default(false),
  popular: z.boolean().default(false),
  status: StatusSchema.default('draft'),
  authorId: z.string().uuid(),
  publishedAt: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
  downloadCount: z.number().default(0),
  likeCount: z.number().default(0),
  shareCount: z.number().default(0),
  version: z.string().default('1.0'),
  language: z.string().default('en'),
  seoTitle: z.string().max(60).optional(),
  seoDescription: z.string().max(160).optional(),
  thumbnail: z.string().url().optional()
});

// Category schema
export const CategorySchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
  description: z.string().max(300).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
  parentId: z.string().uuid().optional(),
  sortOrder: z.number().default(0),
  status: StatusSchema.default('published'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Author schema
export const AuthorSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(100),
  email: z.string().email(),
  bio: z.string().max(500).optional(),
  avatar: z.string().url().optional(),
  role: z.string().default('author'),
  status: StatusSchema.default('active'),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date())
});

// Type exports
export type UserRole = z.infer<typeof UserRoleSchema>;
export type Difficulty = z.infer<typeof DifficultySchema>;
export type ContentType = z.infer<typeof ContentTypeSchema>;
export type ResourceType = z.infer<typeof ResourceTypeSchema>;
export type Status = z.infer<typeof StatusSchema>;
export type Article = z.infer<typeof ArticleSchema>;
export type Tutorial = z.infer<typeof TutorialSchema>;
export type Topic = z.infer<typeof TopicSchema>;
export type Resource = z.infer<typeof ResourceSchema>;
export type Category = z.infer<typeof CategorySchema>;
export type Author = z.infer<typeof AuthorSchema>;
