import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    const role = searchParams.get('role') || 'all';
    const category = searchParams.get('category') || 'all';
    const featured = searchParams.get('featured') === 'true';
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const search = searchParams.get('search') || '';

    console.log('Fetching public learning hub content...');

    // For now, return mock data to test the frontend
    // TODO: Fix Firebase connection and use real data
    const mockArticles = [
      {
        id: '1',
        title: 'How to Find and Book Services as a Client',
        slug: 'how-to-find-and-book-services-as-a-client',
        description: 'Complete guide to finding and booking the best local services on LocalPro',
        category: 'For Clients',
        role: 'clients',
        status: 'published',
        featured: true,
        popular: true,
        readTime: 8,
        tags: ['booking', 'client', 'services', 'tutorial'],
        viewCount: 15420,
        likeCount: 1542,
        shareCount: 771,
        createdAt: '2024-01-15T00:00:00.000Z',
        updatedAt: '2024-01-15T00:00:00.000Z',
        type: 'article',
        href: '/learning-hub/articles/how-to-find-and-book-services-as-a-client'
      },
      {
        id: '2',
        title: 'Provider Verification Process',
        slug: 'provider-verification-process',
        description: 'Complete guide to becoming a verified service provider on LocalPro',
        category: 'For Providers',
        role: 'providers',
        status: 'published',
        featured: true,
        popular: true,
        readTime: 10,
        tags: ['verification', 'provider', 'setup', 'process'],
        viewCount: 12850,
        likeCount: 1285,
        shareCount: 642,
        createdAt: '2024-01-16T00:00:00.000Z',
        updatedAt: '2024-01-16T00:00:00.000Z',
        type: 'article',
        href: '/learning-hub/articles/provider-verification-process'
      },
      {
        id: '3',
        title: 'Agency Setup and Registration',
        slug: 'agency-setup-and-registration',
        description: 'How to register and set up your agency on LocalPro',
        category: 'For Agencies',
        role: 'agencies',
        status: 'published',
        featured: true,
        popular: false,
        readTime: 12,
        tags: ['agency', 'setup', 'registration', 'business'],
        viewCount: 8900,
        likeCount: 890,
        shareCount: 445,
        createdAt: '2024-01-17T00:00:00.000Z',
        updatedAt: '2024-01-17T00:00:00.000Z',
        type: 'article',
        href: '/learning-hub/articles/agency-setup-and-registration'
      }
    ];

    // Filter mock data based on parameters
    let content = mockArticles.filter(article => {
      if (type !== 'all' && type !== 'articles') return false;
      if (role !== 'all' && article.role !== role) return false;
      if (category !== 'all' && article.category !== category) return false;
      if (featured && !article.featured) return false;
      if (popular && !article.popular) return false;
      return true;
    });

    // Apply search filter
    if (search) {
      const searchLower = search.toLowerCase();
      content = content.filter(article =>
        article.title.toLowerCase().includes(searchLower) ||
        article.description.toLowerCase().includes(searchLower) ||
        article.tags.some(tag => tag.toLowerCase().includes(searchLower))
      );
    }

    // Apply limit
    content = content.slice(0, limit);

    return NextResponse.json({
      success: true,
      data: content,
      total: content.length
    });

  } catch (error) {
    console.error('Error fetching learning hub content:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch content' },
      { status: 500 }
    );
  }
}
