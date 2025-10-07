'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Calendar, Clock, User, Eye, Heart, Share2, Tag } from 'lucide-react';

interface Article {
  id: string;
  title: string;
  slug: string;
  description: string;
  content: string;
  category: string;
  role: string;
  status: string;
  featured: boolean;
  popular: boolean;
  readTime: number;
  tags: string[];
  viewCount: number;
  likeCount: number;
  shareCount: number;
  author: string;
  authorId: string;
  createdAt: string;
  updatedAt: string;
  publishedAt: string;
  seoTitle?: string;
  seoDescription?: string;
  type: string;
  href: string;
}

export default function ArticlePage() {
  const params = useParams();
  const slug = params.slug as string;
  
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArticle = async () => {
      try {
        setLoading(true);
        setError(null);

        // For now, we'll use mock data since we don't have a specific article endpoint
        // TODO: Create /api/learning-hub/articles/[slug] endpoint
        const mockArticles: Article[] = [
          {
            id: '13',
            title: 'Advanced Client Management Strategies',
            slug: 'advanced-client-management-strategies',
            description: 'Learn advanced techniques for managing client relationships and maximizing satisfaction',
            content: `
              <h2>Introduction</h2>
              <p>Client management is a critical aspect of running a successful service business. This comprehensive guide will walk you through advanced strategies that can help you build stronger relationships, increase client satisfaction, and grow your business.</p>
              
              <h2>Understanding Client Needs</h2>
              <p>The foundation of effective client management lies in understanding your clients' unique needs and expectations. This involves active listening, regular communication, and proactive problem-solving.</p>
              
              <h3>Key Strategies:</h3>
              <ul>
                <li>Regular check-ins and feedback sessions</li>
                <li>Personalized service delivery</li>
                <li>Proactive issue resolution</li>
                <li>Value-added recommendations</li>
              </ul>
              
              <h2>Communication Best Practices</h2>
              <p>Clear, consistent communication is essential for maintaining strong client relationships. Establish regular touchpoints and use multiple communication channels to ensure your clients feel heard and valued.</p>
              
              <h2>Building Long-term Relationships</h2>
              <p>Focus on building trust and demonstrating value over time. This includes delivering consistent quality, being transparent about processes, and going above and beyond when possible.</p>
              
              <h2>Conclusion</h2>
              <p>Effective client management requires ongoing effort and attention to detail. By implementing these strategies, you can create lasting relationships that benefit both your business and your clients.</p>
            `,
            category: 'For Providers',
            role: 'providers',
            status: 'published',
            featured: true,
            popular: true,
            readTime: 12,
            tags: ['client management', 'business strategy', 'customer service', 'relationships'],
            viewCount: 8750,
            likeCount: 875,
            shareCount: 437,
            author: 'Sarah Johnson',
            authorId: 'author-1',
            createdAt: '2024-01-20T00:00:00.000Z',
            updatedAt: '2024-01-20T00:00:00.000Z',
            publishedAt: '2024-01-20T00:00:00.000Z',
            seoTitle: 'Advanced Client Management Strategies for Service Providers',
            seoDescription: 'Learn proven techniques for managing client relationships and maximizing satisfaction in your service business.',
            type: 'article',
            href: '/learning-hub/articles/advanced-client-management-strategies'
          }
        ];

        // Find article by slug
        const foundArticle = mockArticles.find(art => art.slug === slug);
        
        if (foundArticle) {
          setArticle(foundArticle);
        } else {
          setError('Article not found');
        }
      } catch (err) {
        console.error('Error fetching article:', err);
        setError('Failed to load article');
      } finally {
        setLoading(false);
      }
    };

    if (slug) {
      fetchArticle();
    }
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="space-y-4">
              <div className="h-4 bg-gray-200 rounded"></div>
              <div className="h-4 bg-gray-200 rounded w-5/6"></div>
              <div className="h-4 bg-gray-200 rounded w-4/6"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Article Not Found</h1>
          <p className="text-gray-600 mb-8">The article you're looking for doesn't exist or has been moved.</p>
          <Link 
            href="/learning-hub/all-articles"
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Articles
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Back Button */}
        <Link 
          href="/learning-hub/all-articles"
          className="inline-flex items-center text-blue-600 hover:text-blue-700 mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Articles
        </Link>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex items-center gap-2 mb-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
              {article.category}
            </span>
            {article.featured && (
              <span className="px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                Featured
              </span>
            )}
            {article.popular && (
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                Popular
              </span>
            )}
          </div>
          
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            {article.title}
          </h1>
          
          <p className="text-xl text-gray-600 mb-6">
            {article.description}
          </p>

          {/* Article Meta */}
          <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500 mb-6">
            <div className="flex items-center gap-2">
              <User className="w-4 h-4" />
              <span>{article.author}</span>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span>{article.readTime} min read</span>
            </div>
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4" />
              <span>{article.viewCount.toLocaleString()} views</span>
            </div>
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-8">
            {article.tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center px-3 py-1 bg-gray-100 text-gray-700 text-sm rounded-full"
              >
                <Tag className="w-3 h-3 mr-1" />
                {tag}
              </span>
            ))}
          </div>
        </header>

        {/* Article Content */}
        <article className="prose prose-lg max-w-none mb-8">
          <div 
            dangerouslySetInnerHTML={{ __html: article.content }}
            className="text-gray-800 leading-relaxed"
          />
        </article>

        {/* Article Actions */}
        <div className="flex items-center justify-between pt-8 border-t border-gray-200">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
              <Heart className="w-4 h-4" />
              <span>{article.likeCount}</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
              <Share2 className="w-4 h-4" />
              <span>{article.shareCount}</span>
            </button>
          </div>
          
          <div className="text-sm text-gray-500">
            Last updated: {new Date(article.updatedAt).toLocaleDateString()}
          </div>
        </div>
      </div>
    </div>
  );
}
