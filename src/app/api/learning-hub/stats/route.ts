import { NextRequest, NextResponse } from 'next/server';
import { ArticleModel, TutorialModel, TopicModel, ResourceModel } from '@/lib/firebase/learning-hub';

export async function GET(_request: NextRequest) {
  try {
    console.log('Fetching learning hub statistics...');

    // Fetch counts for each content type (only published content)
    const [articles, tutorials, topics, resources] = await Promise.allSettled([
      ArticleModel.findMany({ status: 'published', limit: 1000 }),
      TutorialModel.findMany({ status: 'published', limit: 1000 }),
      TopicModel.findMany({ status: 'published', limit: 1000 }),
      ResourceModel.findMany({ status: 'published', limit: 1000 })
    ]);

    // Extract successful results or use empty arrays
    const articlesData = articles.status === 'fulfilled' ? articles.value : [];
    const tutorialsData = tutorials.status === 'fulfilled' ? tutorials.value : [];
    const topicsData = topics.status === 'fulfilled' ? topics.value : [];
    const resourcesData = resources.status === 'fulfilled' ? resources.value : [];

    // Calculate statistics
    const totalArticles = articlesData.length;
    const totalTutorials = tutorialsData.length;
    const totalTopics = topicsData.length;
    const totalResources = resourcesData.length;
    const totalContent = totalArticles + totalTutorials + totalTopics + totalResources;

    // Get unique categories
    const allCategories = new Set([
      ...articlesData.map(a => a.category),
      ...tutorialsData.map(t => t.category),
      ...topicsData.map(t => t.category),
      ...resourcesData.map(r => r.category)
    ]);

    // Count by role
    const roleCounts = {
      clients: 0,
      providers: 0,
      agencies: 0,
      partners: 0,
      all: 0
    };

    [...articlesData, ...tutorialsData, ...topicsData, ...resourcesData].forEach(item => {
      if (item.role in roleCounts) {
        roleCounts[item.role as keyof typeof roleCounts]++;
      }
    });

    // Get featured and popular content counts
    const featuredCount = [...articlesData, ...tutorialsData, ...topicsData, ...resourcesData].filter(item => item.featured).length;
    const popularCount = [...articlesData, ...tutorialsData, ...topicsData, ...resourcesData].filter(item => item.popular).length;

    // Calculate total views (articles, tutorials, topics have viewCount, resources have downloadCount)
    const totalViews = [
      ...articlesData.map(item => item.viewCount || 0),
      ...tutorialsData.map(item => item.viewCount || 0),
      ...topicsData.map(item => item.viewCount || 0),
      ...resourcesData.map(item => (item as any).downloadCount || 0)
    ].reduce((sum, count) => sum + count, 0);

    const stats = {
      totalContent,
      totalArticles,
      totalTutorials,
      totalTopics,
      totalResources,
      totalCategories: allCategories.size,
      totalViews,
      featuredCount,
      popularCount,
      roleCounts,
      categories: Array.from(allCategories)
    };

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Error fetching learning hub statistics:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch statistics' },
      { status: 500 }
    );
  }
}
