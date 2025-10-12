'use server';

import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { z } from 'zod';

// Validation schemas
const ArticleIdSchema = z.string().min(1, 'Article ID is required');

const UpdateArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  excerpt: z.string().optional(),
  category: z.string().min(1, 'Category is required'),
  tags: z.array(z.string()).optional(),
  featuredImage: z.string().url().optional().or(z.literal('')),
  status: z.enum(['draft', 'published', 'archived']),
  seoTitle: z.string().optional(),
  seoDescription: z.string().optional(),
  authorNotes: z.string().optional(),
});

export type UpdateArticleInput = z.infer<typeof UpdateArticleSchema>;

// Get article for editing
export async function getArticleForEdit(articleId: string) {
  try {
    const validatedArticleId = ArticleIdSchema.parse(articleId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const articleRef = doc(getDb(), 'learningHubArticles', validatedArticleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      return { success: false, error: 'Article not found' };
    }

    const articleData = articleSnap.data();
    const article = {
      id: articleSnap.id,
      title: articleData.title || '',
      content: articleData.content || '',
      excerpt: articleData.excerpt || '',
      category: articleData.category || '',
      tags: articleData.tags || [],
      featuredImage: articleData.featuredImage || '',
      status: articleData.status || 'draft',
      seoTitle: articleData.seoTitle || '',
      seoDescription: articleData.seoDescription || '',
      authorNotes: articleData.authorNotes || '',
      createdAt: articleData.createdAt,
      updatedAt: articleData.updatedAt,
      authorId: articleData.authorId,
      views: articleData.views || 0,
      likes: articleData.likes || 0,
    };

    return { success: true, data: article };
  } catch (error) {
    console.error('Error getting article for edit:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to get article' 
    };
  }
}

// Update article
export async function updateArticle(articleId: string, articleData: UpdateArticleInput) {
  try {
    const validatedArticleId = ArticleIdSchema.parse(articleId);
    const validatedData = UpdateArticleSchema.parse(articleData);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const articleRef = doc(getDb(), 'learningHubArticles', validatedArticleId);
    await updateDoc(articleRef, {
      ...validatedData,
      updatedAt: serverTimestamp(),
    });

    return { success: true, message: 'Article updated successfully' };
  } catch (error) {
    console.error('Error updating article:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to update article' 
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

// Preview article
export async function previewArticle(articleId: string) {
  try {
    const validatedArticleId = ArticleIdSchema.parse(articleId);
    
    if (!getDb()) {
      return { success: false, error: 'Database not available' };
    }

    const articleRef = doc(getDb(), 'learningHubArticles', validatedArticleId);
    const articleSnap = await getDoc(articleRef);

    if (!articleSnap.exists()) {
      return { success: false, error: 'Article not found' };
    }

    const articleData = articleSnap.data();
    const preview = {
      id: articleSnap.id,
      title: articleData.title,
      content: articleData.content,
      excerpt: articleData.excerpt,
      category: articleData.category,
      tags: articleData.tags,
      featuredImage: articleData.featuredImage,
      status: articleData.status,
      authorId: articleData.authorId,
      createdAt: articleData.createdAt,
      updatedAt: articleData.updatedAt,
    };

    return { success: true, data: preview };
  } catch (error) {
    console.error('Error previewing article:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Failed to preview article' 
    };
  }
}
