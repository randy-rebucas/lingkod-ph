import { NextRequest, NextResponse } from 'next/server';
import { ArticleModel } from '@/lib/firebase/learning-hub';

// GET /api/admin/learning-hub/articles - Get all articles
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const role = searchParams.get('role') as any;
    const category = searchParams.get('category');
    const difficulty = searchParams.get('difficulty') as any;
    const status = searchParams.get('status') as any;
    const featured = searchParams.get('featured') === 'true';
    const popular = searchParams.get('popular') === 'true';
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    const articles = await ArticleModel.findMany({
      role: role || undefined,
      category: category || undefined,
      difficulty: difficulty || undefined,
      status: status || undefined,
      featured,
      popular,
      limit
    });

    return NextResponse.json({
      success: true,
      data: articles,
      pagination: {
        limit,
        offset,
        total: articles.length
      }
    });
  } catch (error) {
    console.error('Error fetching articles:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch articles' },
      { status: 500 }
    );
  }
}

// POST /api/admin/learning-hub/articles - Create new article
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Basic validation
    if (!body.title || !body.slug || !body.description || !body.content) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: title, slug, description, content' },
        { status: 400 }
      );
    }

    const article = await ArticleModel.create(body);

    return NextResponse.json({
      success: true,
      data: article,
      message: 'Article created successfully'
    }, { status: 201 });
  } catch (error) {
    console.error('Error creating article:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create article' },
      { status: 500 }
    );
  }
}
