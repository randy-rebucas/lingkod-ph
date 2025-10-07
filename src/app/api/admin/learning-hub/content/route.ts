import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { DocumentSnapshot } from 'firebase-admin/firestore';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const status = searchParams.get('status') || 'all';
    const role = searchParams.get('role') || 'all';
    const search = searchParams.get('search') || '';

    console.log('Fetching learning hub content from Firebase...');

    // Check if Firebase is available
    if (!adminDb) {
      console.error('Firebase admin database not available');
      return NextResponse.json(
        { success: false, error: 'Database not available' },
        { status: 503 }
      );
    }

    // Fetch all content types from Firestore
    const [articlesSnapshot, tutorialsSnapshot, topicsSnapshot, resourcesSnapshot] = await Promise.all([
      adminDb.collection('articles').get(),
      adminDb.collection('tutorials').get(),
      adminDb.collection('topics').get(),
      adminDb.collection('resources').get()
    ]);

    console.log('Successfully fetched from Firebase:', {
      articles: articlesSnapshot.docs.length,
      tutorials: tutorialsSnapshot.docs.length,
      topics: topicsSnapshot.docs.length,
      resources: resourcesSnapshot.docs.length
    });

    // Transform articles
    const articles = articlesSnapshot.docs.map((doc: DocumentSnapshot) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        type: 'article' as const,
        category: data.category || 'Uncategorized',
        role: data.role || 'all',
        status: data.status || 'draft',
        featured: data.featured || false,
        popular: data.popular || false,
        author: data.author || 'Unknown',
        createdAt: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        viewCount: data.viewCount || 0,
        rating: data.likeCount > 0 ? (data.likeCount / Math.max(data.viewCount || 1, 1)) * 5 : 0
      };
    });

    // Transform tutorials
    const tutorials = tutorialsSnapshot.docs.map((doc: DocumentSnapshot) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        type: 'tutorial' as const,
        category: data.category || 'Uncategorized',
        role: data.role || 'all',
        status: data.status || 'draft',
        featured: data.featured || false,
        popular: data.popular || false,
        author: data.author || 'Unknown',
        createdAt: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        viewCount: data.viewCount || 0,
        rating: data.likeCount > 0 ? (data.likeCount / Math.max(data.viewCount || 1, 1)) * 5 : 0
      };
    });

    // Transform topics
    const topics = topicsSnapshot.docs.map((doc: DocumentSnapshot) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        type: 'topic' as const,
        category: data.category || 'Uncategorized',
        role: data.role || 'all',
        status: data.status || 'draft',
        featured: data.featured || false,
        popular: data.popular || false,
        author: data.author || 'Unknown',
        createdAt: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        viewCount: data.viewCount || 0,
        rating: data.likeCount > 0 ? (data.likeCount / Math.max(data.viewCount || 1, 1)) * 5 : 0
      };
    });

    // Transform resources
    const resources = resourcesSnapshot.docs.map((doc: DocumentSnapshot) => {
      const data = doc.data() || {};
      return {
        id: doc.id,
        title: data.title || 'Untitled',
        type: 'resource' as const,
        category: data.category || 'Uncategorized',
        role: data.role || 'all',
        status: data.status || 'draft',
        featured: data.featured || false,
        popular: data.popular || false,
        author: data.author || 'Unknown',
        createdAt: data.createdAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        updatedAt: data.updatedAt?.toDate?.()?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        downloadCount: data.downloadCount || 0,
        rating: data.likeCount > 0 ? (data.likeCount / Math.max(data.downloadCount || 1, 1)) * 5 : 0
      };
    });

    // Combine all content
    let allContent = [...articles, ...tutorials, ...topics, ...resources];

    // Filter by type if specified
    if (type !== 'all') {
      allContent = allContent.filter(item => item.type === type);
    }

    // Filter by status if specified
    if (status !== 'all') {
      allContent = allContent.filter(item => item.status === status);
    }

    // Filter by role if specified
    if (role !== 'all') {
      allContent = allContent.filter(item => item.role === role);
    }

    // Filter by search query if provided
    if (search) {
      const searchLower = search.toLowerCase();
      allContent = allContent.filter(item =>
        item.title.toLowerCase().includes(searchLower) ||
        item.category.toLowerCase().includes(searchLower) ||
        item.author.toLowerCase().includes(searchLower)
      );
    }

    // Sort by featured, popular, then by updated date
    allContent.sort((a, b) => {
      if (a.featured && !b.featured) return -1;
      if (!a.featured && b.featured) return 1;
      if (a.popular && !b.popular) return -1;
      if (!a.popular && b.popular) return 1;
      return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    });

    return NextResponse.json({
      success: true,
      data: allContent,
      total: allContent.length
    });

  } catch (error) {
    console.error('Error fetching learning hub content:', error);
    
    // Provide more specific error information
    let errorMessage = 'Failed to fetch content';
    let statusCode = 500;
    
    if (error instanceof Error) {
      if (error.message.includes('credentials')) {
        errorMessage = 'Firebase credentials not configured';
        statusCode = 503;
      } else if (error.message.includes('permission')) {
        errorMessage = 'Insufficient permissions to access database';
        statusCode = 403;
      } else if (error.message.includes('network') || error.message.includes('timeout')) {
        errorMessage = 'Database connection timeout';
        statusCode = 504;
      } else {
        errorMessage = `Database error: ${error.message}`;
      }
    }
    
    return NextResponse.json(
      { success: false, error: errorMessage },
      { status: statusCode }
    );
  }
}
