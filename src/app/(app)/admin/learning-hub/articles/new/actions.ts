'use server';

import { getDb } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const CreateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']).default('draft'),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  authorNotes: z.string().optional(),
});

export type CreateArticleInput = z.infer<typeof CreateArticleSchema>;

// Create new article
export async function createArticle(articleData: CreateArticleInput, authorId: string) {
  try {
    const validatedData = CreateArticleSchema.parse(articleData);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const articlesRef = collection(getDb(), 'learningHubArticles');
    const docRef = await addDoc(articlesRef, {
      ...validatedData,
      authorId,
      views: 0,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Article created successfully',
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error creating article:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to create article' 
    };
  }
}

// Get article categories
export async function getArticleCategories() {
  try {
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    // For now, return static categories
    // In a real implementation, you'd fetch from a categories collection
    const categories = [
      'Technology',
      'Business',
      'Marketing',
      'Design',
      'Development',
      'Productivity',
      'Career',
      'Finance',
      'Health',
      'Lifestyle',
    ];

    return { success: true, data: categories };
  } catch (error) {
    console.error('Error getting article categories:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get categories' 
    };
  }
}

// Get popular tags
export async function getPopularTags() {
  try {
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    // For now, return static popular tags
    // In a real implementation, you'd analyze existing articles to get popular tags
    const popularTags = [
      'React',
      'JavaScript',
      'TypeScript',
      'Node.js',
      'Python',
      'AI',
      'Machine Learning',
      'Web Development',
      'Mobile Development',
      'UI/UX',
      'Design',
      'Marketing',
      'SEO',
      'Analytics',
      'Productivity',
      'Remote Work',
      'Freelancing',
      'Business',
      'Startup',
      'Finance',
    ];

    return { success: true, data: popularTags };
  } catch (error) {
    console.error('Error getting popular tags:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get popular tags' 
    };
  }
}

// Save draft
export async function saveDraft(articleData: CreateArticleInput, authorId: string) {
  try {
    const validatedData = CreateArticleSchema.parse({
      ...articleData,
      status: 'draft',
    });
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const articlesRef = collection(getDb(), 'learningHubArticles');
    const docRef = await addDoc(articlesRef, {
      ...validatedData,
      authorId,
      views: 0,
      likes: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    return { 
      success: true, 
      message: 'Draft saved successfully',
      data: { id: docRef.id }
    };
  } catch (error) {
    console.error('Error saving draft:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to save draft' 
    };
  }
}

// Validate article content
export async function validateArticleContent(content: string) {
  try {
    const issues = [];
    
    // Basic content validation
    if (content.length < 100) {
      issues.push('Content should be at least 100 characters long');
    }
    
    if (content.length > 50000) {
      issues.push('Content should not exceed 50,000 characters');
    }
    
    // Check for common issues
    if (!content.includes('.')) {
      issues.push('Content should contain proper sentences');
    }
    
    if (content.split(' ').length < 20) {
      issues.push('Content should have at least 20 words');
    }
    
    return { 
      success: true, 
      data: { 
        isValid: issues.length === 0,
        issues,
        wordCount: content.split(' ').length,
        characterCount: content.length
      }
    };
  } catch (error) {
    console.error('Error validating article content:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to validate content' 
    };
  }
}
