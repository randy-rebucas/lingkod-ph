'use server';

import { getDb } from '@/lib/firebase';
import { collection, serverTimestamp, doc, updateDoc, deleteDoc, query, orderBy, getDocs } from 'firebase/firestore';
import { createArticle } from '@/app/learning-hub/actions';

// Create new article (admin function)
export async function createArticleAction(data: {
  title: string;
  slug: string;
  description: string;
  content: string;
  excerpt?: string;
  category: string;
  tags: string[];
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime: number;
  featured: boolean;
  popular: boolean;
  status: 'draft' | 'published' | 'archived';
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  authorId: string;
}): Promise<{ success: boolean; data?: { id: string }; error?: string }> {
  try {
    // Use the createArticle function from learning-hub actions
    const result = await createArticle(data);
    return result;
  } catch (error) {
    console.error('Error creating article:', error);
    return { success: false, error: 'Failed to create article' };
  }
}

// Update article (admin function)
export async function updateArticleAction(
  articleId: string,
  data: {
    title?: string;
    slug?: string;
    description?: string;
    content?: string;
    excerpt?: string;
    category?: string;
    tags?: string[];
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    readTime?: number;
    featured?: boolean;
    popular?: boolean;
    status?: 'draft' | 'published' | 'archived';
    seoTitle?: string;
    seoDescription?: string;
    featuredImage?: string;
  }
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const articleRef = doc(db, 'learning-hub-content', articleId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      publishedAt: data.status === 'published' ? serverTimestamp() : undefined,
    };
    
    // Remove undefined values
    Object.keys(updateData).forEach(key => {
      if ((updateData as any)[key] === undefined) {
        delete (updateData as any)[key];
      }
    });
    
    await updateDoc(articleRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating article:', error);
    return { success: false, error: 'Failed to update article' };
  }
}

// Delete article (admin function)
export async function deleteArticleAction(articleId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const articleRef = doc(db, 'learning-hub-content', articleId);
    
    await deleteDoc(articleRef);
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting article:', error);
    return { success: false, error: 'Failed to delete article' };
  }
}

// Get all articles for admin
export async function getAdminArticles(): Promise<{ success: boolean; data?: any[]; error?: string }> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    const q = query(contentRef, orderBy('createdAt', 'desc'));
    const snapshot = await getDocs(q);
    
    const articles: any[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      articles.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
      });
    });
    
    return { success: true, data: articles };
  } catch (error) {
    console.error('Error fetching admin articles:', error);
    return { success: false, error: 'Failed to fetch articles' };
  }
}
