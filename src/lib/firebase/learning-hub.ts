import { 
  collection, 
  doc, 
  getDocs, 
  getDoc, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  increment,
  serverTimestamp
} from 'firebase/firestore';
import { getDb } from '../firebase';

// Types
export interface Author {
  id: string;
  name: string;
  email: string;
  bio?: string;
  avatar?: string;
  role: string;
  status: 'active' | 'inactive';
  createdAt: Date;
  updatedAt: Date;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  parentId?: string;
  sortOrder: number;
  status: 'published' | 'draft' | 'archived';
  createdAt: Date;
  updatedAt: Date;
}

export interface Article {
  id: string;
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
  authorId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
  attachments: string[];
}

export interface Tutorial {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: number;
  videoUrl?: string;
  videoThumbnail?: string;
  featured: boolean;
  popular: boolean;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  instructor: string;
  rating: number;
  seoTitle?: string;
  seoDescription?: string;
  prerequisites: string[];
  learningObjectives: string[];
}

export interface Topic {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  tags: string[];
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  estimatedTime: number;
  featured: boolean;
  popular: boolean;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  viewCount: number;
  likeCount: number;
  shareCount: number;
  relatedTopics: string[];
  relatedArticles: string[];
  relatedTutorials: string[];
  faq: Array<{ question: string; answer: string }>;
  tips: Array<{ title: string; description: string; icon?: string }>;
  seoTitle?: string;
  seoDescription?: string;
  featuredImage?: string;
}

export interface Resource {
  id: string;
  title: string;
  description: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'image' | 'video' | 'zip' | 'link';
  category: string;
  tags: string[];
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  fileUrl: string;
  fileSize: number;
  fileName: string;
  featured: boolean;
  popular: boolean;
  status: 'draft' | 'published' | 'archived';
  authorId: string;
  publishedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
  downloadCount: number;
  likeCount: number;
  shareCount: number;
  version: string;
  language: string;
  seoTitle?: string;
  seoDescription?: string;
  thumbnail?: string;
}

// Author Model
export class AuthorModel {
  static async create(data: Omit<Author, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'authors'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'authors', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Author;
    }
    return null;
  }

  static async findByEmail(email: string) {
    const q = query(collection(getDb(), 'authors'), where('email', '==', email));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Author;
    }
    return null;
  }

  static async findMany(filters: {
    status?: 'active' | 'inactive';
    role?: string;
    limit?: number;
  } = {}) {
    const { status, role, limit: limitCount = 50 } = filters;
    
    let q = query(collection(getDb(), 'authors'), orderBy('name', 'asc'));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Author));
  }

  static async update(id: string, data: Partial<Author>) {
    const docRef = doc(getDb(), 'authors', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'authors', id);
    await deleteDoc(docRef);
    return true;
  }
}

// Category Model
export class CategoryModel {
  static async create(data: Omit<Category, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'categories'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'categories', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Category;
    }
    return null;
  }

  static async findBySlug(slug: string) {
    const q = query(collection(getDb(), 'categories'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Category;
    }
    return null;
  }

  static async findMany(filters: {
    status?: 'published' | 'draft' | 'archived';
    parentId?: string;
    limit?: number;
  } = {}) {
    const { status, parentId, limit: limitCount = 50 } = filters;
    
    let q = query(collection(getDb(), 'categories'), orderBy('sortOrder', 'asc'));
    
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (parentId) {
      q = query(q, where('parentId', '==', parentId));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Category));
  }

  static async update(id: string, data: Partial<Category>) {
    const docRef = doc(getDb(), 'categories', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'categories', id);
    await deleteDoc(docRef);
    return true;
  }
}

// Article Model
export class ArticleModel {
  static async create(data: Omit<Article, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'articles'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'articles', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Article;
    }
    return null;
  }

  static async findBySlug(slug: string) {
    const q = query(collection(getDb(), 'articles'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Article;
    }
    return null;
  }

  static async findMany(filters: {
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    category?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    popular?: boolean;
    limit?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit: limitCount = 20 } = filters;
    
    let q = query(collection(getDb(), 'articles'), orderBy('createdAt', 'desc'));
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (featured !== undefined) {
      q = query(q, where('featured', '==', featured));
    }
    if (popular !== undefined) {
      q = query(q, where('popular', '==', popular));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
  }

  static async search(queryText: string, filters: {
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    category?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    limit?: number;
  } = {}) {
    // Note: Firebase doesn't support full-text search natively
    // This is a simplified implementation - in production, you'd use Algolia or similar
    const { role, category, difficulty, limit: limitCount = 20 } = filters;
    
    let q = query(collection(getDb(), 'articles'), where('status', '==', 'published'));
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    const articles = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Article));
    
    // Simple client-side filtering (not ideal for large datasets)
    return articles.filter(article => 
      article.title.toLowerCase().includes(queryText.toLowerCase()) ||
      article.description.toLowerCase().includes(queryText.toLowerCase()) ||
      article.tags.some(tag => tag.toLowerCase().includes(queryText.toLowerCase()))
    );
  }

  static async update(id: string, data: Partial<Article>) {
    const docRef = doc(getDb(), 'articles', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'articles', id);
    await deleteDoc(docRef);
    return true;
  }

  static async incrementViewCount(id: string) {
    const docRef = doc(getDb(), 'articles', id);
    await updateDoc(docRef, {
      viewCount: increment(1),
      updatedAt: serverTimestamp()
    });
    return true;
  }
}

// Tutorial Model
export class TutorialModel {
  static async create(data: Omit<Tutorial, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'tutorials'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'tutorials', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Tutorial;
    }
    return null;
  }

  static async findBySlug(slug: string) {
    const q = query(collection(getDb(), 'tutorials'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Tutorial;
    }
    return null;
  }

  static async findMany(filters: {
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    category?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    popular?: boolean;
    limit?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit: limitCount = 20 } = filters;
    
    let q = query(collection(getDb(), 'tutorials'), orderBy('createdAt', 'desc'));
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (featured !== undefined) {
      q = query(q, where('featured', '==', featured));
    }
    if (popular !== undefined) {
      q = query(q, where('popular', '==', popular));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Tutorial));
  }

  static async update(id: string, data: Partial<Tutorial>) {
    const docRef = doc(getDb(), 'tutorials', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'tutorials', id);
    await deleteDoc(docRef);
    return true;
  }
}

// Topic Model
export class TopicModel {
  static async create(data: Omit<Topic, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'topics'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'topics', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Topic;
    }
    return null;
  }

  static async findBySlug(slug: string) {
    const q = query(collection(getDb(), 'topics'), where('slug', '==', slug));
    const querySnapshot = await getDocs(q);
    
    if (!querySnapshot.empty) {
      const doc = querySnapshot.docs[0];
      return { id: doc.id, ...doc.data() } as Topic;
    }
    return null;
  }

  static async findMany(filters: {
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    category?: string;
    difficulty?: 'Beginner' | 'Intermediate' | 'Advanced';
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    popular?: boolean;
    limit?: number;
  } = {}) {
    const { role, category, difficulty, status, featured, popular, limit: limitCount = 20 } = filters;
    
    let q = query(collection(getDb(), 'topics'), orderBy('createdAt', 'desc'));
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (difficulty) {
      q = query(q, where('difficulty', '==', difficulty));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (featured !== undefined) {
      q = query(q, where('featured', '==', featured));
    }
    if (popular !== undefined) {
      q = query(q, where('popular', '==', popular));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Topic));
  }

  static async update(id: string, data: Partial<Topic>) {
    const docRef = doc(getDb(), 'topics', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'topics', id);
    await deleteDoc(docRef);
    return true;
  }
}

// Resource Model
export class ResourceModel {
  static async create(data: Omit<Resource, 'id' | 'createdAt' | 'updatedAt'>) {
    const docRef = await addDoc(collection(getDb(), 'resources'), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp()
    });
    return { id: docRef.id, ...data };
  }

  static async findById(id: string) {
    const docRef = doc(getDb(), 'resources', id);
    const docSnap = await getDoc(docRef);
    
    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as Resource;
    }
    return null;
  }

  static async findMany(filters: {
    role?: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
    category?: string;
    type?: 'pdf' | 'doc' | 'xlsx' | 'image' | 'video' | 'zip' | 'link';
    status?: 'draft' | 'published' | 'archived';
    featured?: boolean;
    popular?: boolean;
    limit?: number;
  } = {}) {
    const { role, category, type, status, featured, popular, limit: limitCount = 20 } = filters;
    
    let q = query(collection(getDb(), 'resources'), orderBy('createdAt', 'desc'));
    
    if (role) {
      q = query(q, where('role', '==', role));
    }
    if (category) {
      q = query(q, where('category', '==', category));
    }
    if (type) {
      q = query(q, where('type', '==', type));
    }
    if (status) {
      q = query(q, where('status', '==', status));
    }
    if (featured !== undefined) {
      q = query(q, where('featured', '==', featured));
    }
    if (popular !== undefined) {
      q = query(q, where('popular', '==', popular));
    }
    if (limitCount) {
      q = query(q, limit(limitCount));
    }
    
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Resource));
  }

  static async update(id: string, data: Partial<Resource>) {
    const docRef = doc(getDb(), 'resources', id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp()
    });
    return { id, ...data };
  }

  static async delete(id: string) {
    const docRef = doc(getDb(), 'resources', id);
    await deleteDoc(docRef);
    return true;
  }

  static async incrementDownloadCount(id: string) {
    const docRef = doc(getDb(), 'resources', id);
    await updateDoc(docRef, {
      downloadCount: increment(1),
      updatedAt: serverTimestamp()
    });
    return true;
  }
}
