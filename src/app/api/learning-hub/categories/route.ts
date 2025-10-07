import { NextRequest, NextResponse } from 'next/server';
import { CategoryModel } from '@/lib/firebase/learning-hub';

export async function GET(request: NextRequest) {
  try {
    console.log('Fetching learning hub categories...');

    const categories = await CategoryModel.findMany({
      status: 'published'
    });

    // Transform categories for public use
    const publicCategories = categories.map(category => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      icon: category.icon,
      color: category.color,
      sortOrder: category.sortOrder
    }));

    return NextResponse.json({
      success: true,
      data: publicCategories
    });

  } catch (error) {
    console.error('Error fetching learning hub categories:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch categories' },
      { status: 500 }
    );
  }
}
