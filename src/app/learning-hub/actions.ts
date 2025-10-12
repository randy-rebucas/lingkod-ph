'use server';

import { getDb } from '@/lib/firebase';
import { collection, query, where, orderBy, limit, getDocs, doc, addDoc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Types for learning hub content
export interface ContentItem {
  id: string;
  title: string;
  description: string;
  category: string;
  role: string;
  type: 'article' | 'tutorial' | 'topic' | 'resource';
  featured: boolean;
  popular: boolean;
  href: string;
  readTime: string;
  viewCount?: number;
  createdAt: string;
  updatedAt: string;
  slug?: string;
  tags?: string[];
  status?: 'draft' | 'published' | 'archived';
  content?: string;
  excerpt?: string;
  difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  authorId?: string;
  publishedAt?: string;
}

export interface Stats {
  totalContent: number;
  totalArticles: number;
  totalTutorials: number;
  totalTopics: number;
  totalResources: number;
  totalCategories: number;
  totalViews: number;
  featuredCount: number;
  popularCount: number;
  roleCounts: {
    clients: number;
    providers: number;
    agencies: number;
    partners: number;
    all: number;
  };
  categories: string[];
}

// Get learning hub content with filters
export async function getLearningHubContent(params: {
  type?: string;
  role?: string;
  category?: string;
  featured?: boolean;
  popular?: boolean;
  limit?: number;
  search?: string;
  status?: string;
}): Promise<{ success: boolean; data?: ContentItem[]; error?: string }> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    let q = query(contentRef);
    
    // Apply filters
    if (params.type && params.type !== 'all') {
      q = query(q, where('type', '==', params.type));
    }
    
    if (params.role && params.role !== 'all') {
      q = query(q, where('role', 'in', [params.role, 'all']));
    }
    
    if (params.category && params.category !== 'all') {
      q = query(q, where('category', '==', params.category));
    }
    
    if (params.featured !== undefined) {
      q = query(q, where('featured', '==', params.featured));
    }
    
    if (params.popular !== undefined) {
      q = query(q, where('popular', '==', params.popular));
    }
    
    if (params.status) {
      q = query(q, where('status', '==', params.status));
    }
    
    // Order by creation date (newest first)
    q = query(q, orderBy('createdAt', 'desc'));
    
    // Apply limit
    if (params.limit) {
      q = query(q, limit(params.limit));
    }
    
    const snapshot = await getDocs(q);
    let content: ContentItem[] = [];
    
    snapshot.forEach((doc) => {
      const data = doc.data();
      content.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
        publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
      } as ContentItem);
    });
    
    // Apply search filter if provided
    if (params.search) {
      const searchTerm = params.search.toLowerCase();
      content = content.filter(item =>
        item.title.toLowerCase().includes(searchTerm) ||
        item.description.toLowerCase().includes(searchTerm) ||
        item.tags?.some(tag => tag.toLowerCase().includes(searchTerm))
      );
    }
    
    return { success: true, data: content };
  } catch (error) {
    console.error('Error fetching learning hub content:', error);
    return { success: false, error: 'Failed to fetch content' };
  }
}

// Get learning hub statistics
export async function getLearningHubStats(): Promise<{ success: boolean; data?: Stats; error?: string }> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    // Get all published content
    const q = query(contentRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    const content: ContentItem[] = [];
    snapshot.forEach((doc) => {
      const data = doc.data();
      content.push({
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
        updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      } as ContentItem);
    });
    
    // Calculate statistics
    const stats: Stats = {
      totalContent: content.length,
      totalArticles: content.filter(item => item.type === 'article').length,
      totalTutorials: content.filter(item => item.type === 'tutorial').length,
      totalTopics: content.filter(item => item.type === 'topic').length,
      totalResources: content.filter(item => item.type === 'resource').length,
      totalCategories: new Set(content.map(item => item.category)).size,
      totalViews: content.reduce((sum, item) => sum + (item.viewCount || 0), 0),
      featuredCount: content.filter(item => item.featured).length,
      popularCount: content.filter(item => item.popular).length,
      roleCounts: {
        clients: content.filter(item => item.role === 'clients' || item.role === 'all').length,
        providers: content.filter(item => item.role === 'providers' || item.role === 'all').length,
        agencies: content.filter(item => item.role === 'agencies' || item.role === 'all').length,
        partners: content.filter(item => item.role === 'partners' || item.role === 'all').length,
        all: content.filter(item => item.role === 'all').length,
      },
      categories: Array.from(new Set(content.map(item => item.category))),
    };
    
    return { success: true, data: stats };
  } catch (error) {
    console.error('Error fetching learning hub stats:', error);
    return { success: false, error: 'Failed to fetch statistics' };
  }
}

// Get learning hub categories
export async function getLearningHubCategories(): Promise<{ success: boolean; data?: string[]; error?: string }> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    const q = query(contentRef, where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    const categories = new Set<string>();
    snapshot.forEach((doc) => {
      const data = doc.data();
      if (data.category) {
        categories.add(data.category);
      }
    });
    
    return { success: true, data: Array.from(categories) };
  } catch (error) {
    console.error('Error fetching learning hub categories:', error);
    return { success: false, error: 'Failed to fetch categories' };
  }
}

// Create new article (admin function)
export async function createArticle(data: {
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
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    const articleData = {
      ...data,
      type: 'article',
      href: `/learning-hub/articles/${data.slug}`,
      viewCount: 0,
      likeCount: 0,
      shareCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
      publishedAt: data.status === 'published' ? serverTimestamp() : null,
    };
    
    const docRef = await addDoc(contentRef, articleData);
    
    return { success: true, data: { id: docRef.id } };
  } catch (error) {
    console.error('Error creating article:', error);
    return { success: false, error: 'Failed to create article' };
  }
}

// Update article (admin function)
export async function updateArticle(
  articleId: string,
  data: Partial<ContentItem>
): Promise<{ success: boolean; error?: string }> {
  try {
    const db = getDb();
    const articleRef = doc(db, 'learning-hub-content', articleId);
    
    const updateData = {
      ...data,
      updatedAt: serverTimestamp(),
      publishedAt: data.status === 'published' ? serverTimestamp() : data.publishedAt,
    };
    
    await updateDoc(articleRef, updateData);
    
    return { success: true };
  } catch (error) {
    console.error('Error updating article:', error);
    return { success: false, error: 'Failed to update article' };
  }
}

// Delete article (admin function)
export async function deleteArticle(articleId: string): Promise<{ success: boolean; error?: string }> {
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

// Get single article by slug
export async function getArticleBySlug(slug: string): Promise<{ success: boolean; data?: ContentItem; error?: string }> {
  try {
    const db = getDb();
    const contentRef = collection(db, 'learning-hub-content');
    
    const q = query(contentRef, where('slug', '==', slug), where('status', '==', 'published'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return { success: false, error: 'Article not found' };
    }
    
    const doc = snapshot.docs[0];
    const data = doc.data();
    
    const article: ContentItem = {
      id: doc.id,
      ...data,
      createdAt: data.createdAt?.toDate?.()?.toISOString() || data.createdAt,
      updatedAt: data.updatedAt?.toDate?.()?.toISOString() || data.updatedAt,
      publishedAt: data.publishedAt?.toDate?.()?.toISOString() || data.publishedAt,
    } as ContentItem;
    
    return { success: true, data: article };
  } catch (error) {
    console.error('Error fetching article by slug:', error);
    return { success: false, error: 'Failed to fetch article' };
  }
}
