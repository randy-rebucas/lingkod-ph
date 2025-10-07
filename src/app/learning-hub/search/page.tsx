'use client';

import { useState, useMemo } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Search,
  Clock,
  Star,
  Tag,
  BookOpen,
  Users,
  UserCheck,
  Building2,
  Target,
  FileText,
  Video,
  ChevronRight,
  X,
  SlidersHorizontal
} from 'lucide-react';

interface SearchResult {
  id: string;
  title: string;
  description: string;
  type: 'article' | 'tutorial' | 'topic' | 'guide';
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  readTime?: string;
  duration?: string;
  tags: string[];
  href: string;
  isPopular?: boolean;
  lastUpdated: string;
  role?: 'clients' | 'providers' | 'agencies' | 'partners';
}

const SearchPage = () => {
  const searchParams = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');
  const [showFilters, setShowFilters] = useState(false);

  // Mock search data - in a real app, this would come from an API
  const searchData: SearchResult[] = [
    // Articles
    {
      id: '1',
      title: 'How to Create Your LocalPro Account',
      description: 'Step-by-step guide to creating your account and completing initial setup',
      type: 'article',
      category: 'Getting Started',
      difficulty: 'Beginner',
      readTime: '5 min read',
      tags: ['account', 'setup', 'onboarding'],
      href: '/learning-hub/articles/account-creation',
      isPopular: true,
      lastUpdated: '2024-01-15',
      role: 'clients'
    },
    {
      id: '2',
      title: 'Provider Verification Process',
      description: 'Complete guide to the provider verification process and requirements',
      type: 'article',
      category: 'For Providers',
      difficulty: 'Beginner',
      readTime: '8 min read',
      tags: ['verification', 'providers', 'documents'],
      href: '/learning-hub/articles/provider-verification',
      isPopular: true,
      lastUpdated: '2024-01-14',
      role: 'providers'
    },
    {
      id: '3',
      title: 'Agency Setup Complete Guide',
      description: 'Step-by-step guide to setting up your agency on LocalPro',
      type: 'article',
      category: 'For Agencies',
      difficulty: 'Beginner',
      readTime: '12 min read',
      tags: ['agency', 'setup', 'management'],
      href: '/learning-hub/articles/agency-setup',
      isPopular: false,
      lastUpdated: '2024-01-13',
      role: 'agencies'
    },
    {
      id: '4',
      title: 'Partnership Application Guide',
      description: 'Complete guide to applying for and becoming a LocalPro partner',
      type: 'article',
      category: 'For Partners',
      difficulty: 'Beginner',
      readTime: '10 min read',
      tags: ['partnership', 'application', 'business'],
      href: '/learning-hub/articles/partnership-application',
      isPopular: false,
      lastUpdated: '2024-01-12',
      role: 'partners'
    },
    {
      id: '5',
      title: 'Payment Security Guide',
      description: 'Understanding payment protection and security features',
      type: 'article',
      category: 'Security & Privacy',
      difficulty: 'Beginner',
      readTime: '6 min read',
      tags: ['payment', 'security', 'protection'],
      href: '/learning-hub/articles/payment-security',
      isPopular: true,
      lastUpdated: '2024-01-11',
      role: 'clients'
    },
    {
      id: '6',
      title: 'Profile Optimization Masterclass',
      description: 'Learn how to create a compelling profile that attracts more clients',
      type: 'article',
      category: 'Features & Functionality',
      difficulty: 'Intermediate',
      readTime: '10 min read',
      tags: ['profile', 'optimization', 'marketing'],
      href: '/learning-hub/articles/profile-optimization',
      isPopular: true,
      lastUpdated: '2024-01-10',
      role: 'providers'
    },
    {
      id: '7',
      title: 'Booking Management System',
      description: 'Master the booking management tools and scheduling features',
      type: 'article',
      category: 'Features & Functionality',
      difficulty: 'Beginner',
      readTime: '8 min read',
      tags: ['booking', 'management', 'scheduling'],
      href: '/learning-hub/articles/booking-management',
      isPopular: false,
      lastUpdated: '2024-01-09',
      role: 'providers'
    },
    {
      id: '8',
      title: 'Team Management Best Practices',
      description: 'Learn how to effectively manage and coordinate your service provider team',
      type: 'article',
      category: 'For Agencies',
      difficulty: 'Intermediate',
      readTime: '12 min read',
      tags: ['team', 'management', 'coordination'],
      href: '/learning-hub/articles/team-management',
      isPopular: false,
      lastUpdated: '2024-01-08',
      role: 'agencies'
    },
    // Tutorials
    {
      id: '9',
      title: 'Complete Client Onboarding',
      description: 'Step-by-step guide to setting up your client account and preferences',
      type: 'tutorial',
      category: 'For Clients',
      difficulty: 'Beginner',
      duration: '5 minutes',
      tags: ['onboarding', 'setup', 'clients'],
      href: '/learning-hub/tutorials/client-onboarding',
      isPopular: true,
      lastUpdated: '2024-01-07',
      role: 'clients'
    },
    {
      id: '10',
      title: 'Provider Onboarding Complete Guide',
      description: 'Complete step-by-step guide to becoming a successful LocalPro provider',
      type: 'tutorial',
      category: 'For Providers',
      difficulty: 'Beginner',
      duration: '15 minutes',
      tags: ['onboarding', 'providers', 'verification'],
      href: '/learning-hub/tutorials/provider-onboarding',
      isPopular: true,
      lastUpdated: '2024-01-06',
      role: 'providers'
    },
    {
      id: '11',
      title: 'Agency Setup Complete Guide',
      description: 'Complete step-by-step guide to setting up your agency on LocalPro',
      type: 'tutorial',
      category: 'For Agencies',
      difficulty: 'Beginner',
      duration: '20 minutes',
      tags: ['agency', 'setup', 'management'],
      href: '/learning-hub/tutorials/agency-setup',
      isPopular: false,
      lastUpdated: '2024-01-05',
      role: 'agencies'
    },
    {
      id: '12',
      title: 'Partnership Application Guide',
      description: 'Complete guide to applying for and becoming a LocalPro partner',
      type: 'tutorial',
      category: 'For Partners',
      difficulty: 'Beginner',
      duration: '12 minutes',
      tags: ['partnership', 'application', 'business'],
      href: '/learning-hub/tutorials/partnership-application',
      isPopular: false,
      lastUpdated: '2024-01-04',
      role: 'partners'
    },
    // Topics
    {
      id: '13',
      title: 'Account Setup',
      description: 'Complete guide to setting up your LocalPro account, including profile creation, verification, and initial configuration.',
      type: 'topic',
      category: 'Getting Started',
      difficulty: 'Beginner',
      readTime: '10 min read',
      tags: ['account', 'setup', 'profile', 'verification'],
      href: '/learning-hub/topics/account-setup',
      isPopular: true,
      lastUpdated: '2024-01-03',
      role: 'clients'
    },
    {
      id: '14',
      title: 'Payment Issues',
      description: 'Troubleshooting guide for common payment problems, including failed transactions, refunds, and payment method issues.',
      type: 'topic',
      category: 'Troubleshooting',
      difficulty: 'Beginner',
      readTime: '8 min read',
      tags: ['payment', 'troubleshooting', 'refunds'],
      href: '/learning-hub/topics/payment-issues',
      isPopular: true,
      lastUpdated: '2024-01-02',
      role: 'clients'
    },
    {
      id: '15',
      title: 'Profile Management',
      description: 'Complete guide to managing your LocalPro profile, including updates, privacy settings, and optimization tips.',
      type: 'topic',
      category: 'Features & Functionality',
      difficulty: 'Intermediate',
      readTime: '12 min read',
      tags: ['profile', 'management', 'optimization'],
      href: '/learning-hub/topics/profile-management',
      isPopular: false,
      lastUpdated: '2024-01-01',
      role: 'providers'
    },
    {
      id: '16',
      title: 'Security Settings',
      description: 'Comprehensive guide to securing your LocalPro account, including password management, two-factor authentication, and privacy controls.',
      type: 'topic',
      category: 'Security & Privacy',
      difficulty: 'Intermediate',
      readTime: '10 min read',
      tags: ['security', 'privacy', 'authentication'],
      href: '/learning-hub/topics/security-settings',
      isPopular: true,
      lastUpdated: '2023-12-31',
      role: 'clients'
    }
  ];

  const categories = ['All', 'Getting Started', 'For Clients', 'For Providers', 'For Agencies', 'For Partners', 'Features & Functionality', 'Troubleshooting', 'Security & Privacy'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const types = ['All', 'Article', 'Tutorial', 'Topic', 'Guide'];
  const roles = ['All', 'Clients', 'Providers', 'Agencies', 'Partners'];

  // Filter and search logic
  const filteredResults = useMemo(() => {
    let results = searchData;

    // Search query filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      results = results.filter(item => 
        item.title.toLowerCase().includes(query) ||
        item.description.toLowerCase().includes(query) ||
        item.tags.some(tag => tag.toLowerCase().includes(query))
      );
    }

    // Category filter
    if (selectedCategory !== 'All') {
      results = results.filter(item => item.category === selectedCategory);
    }

    // Difficulty filter
    if (selectedDifficulty !== 'All') {
      results = results.filter(item => item.difficulty === selectedDifficulty);
    }

    // Type filter
    if (selectedType !== 'All') {
      results = results.filter(item => item.type === selectedType.toLowerCase());
    }

    // Role filter
    if (selectedRole !== 'All') {
      results = results.filter(item => item.role === selectedRole.toLowerCase());
    }

    return results;
  }, [searchQuery, selectedCategory, selectedDifficulty, selectedType, selectedRole]);

  const clearFilters = () => {
    setSelectedCategory('All');
    setSelectedDifficulty('All');
    setSelectedType('All');
    setSelectedRole('All');
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'tutorial':
        return <Video className="h-4 w-4" />;
      case 'topic':
        return <BookOpen className="h-4 w-4" />;
      case 'guide':
        return <Target className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
    }
  };

  const getRoleIcon = (role?: string) => {
    switch (role) {
      case 'clients':
        return <Users className="h-4 w-4" />;
      case 'providers':
        return <UserCheck className="h-4 w-4" />;
      case 'agencies':
        return <Building2 className="h-4 w-4" />;
      case 'partners':
        return <Target className="h-4 w-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                Search Learning Hub
              </h1>
              <p className="text-xl text-muted-foreground">
                Find articles, tutorials, and guides to help you succeed with LocalPro
              </p>
            </div>

            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search articles, tutorials, topics..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-4">
                <Button
                  variant="outline"
                  onClick={() => setShowFilters(!showFilters)}
                  className="flex items-center space-x-2"
                >
                  <SlidersHorizontal className="h-4 w-4" />
                  <span>Filters</span>
                </Button>
                {(selectedCategory !== 'All' || selectedDifficulty !== 'All' || selectedType !== 'All' || selectedRole !== 'All') && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="flex items-center space-x-1">
                    <X className="h-4 w-4" />
                    <span>Clear Filters</span>
                  </Button>
                )}
              </div>
              <Badge variant="secondary">
                {filteredResults.length} results
              </Badge>
            </div>

            {/* Filters */}
            {showFilters && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-background rounded-lg border">
                <div>
                  <label className="text-sm font-medium mb-2 block">Category</label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Difficulty</label>
                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {difficulties.map((difficulty) => (
                      <option key={difficulty} value={difficulty}>{difficulty}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Type</label>
                  <select
                    value={selectedType}
                    onChange={(e) => setSelectedType(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {types.map((type) => (
                      <option key={type} value={type}>{type}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Role</label>
                  <select
                    value={selectedRole}
                    onChange={(e) => setSelectedRole(e.target.value)}
                    className="w-full p-2 border rounded-md"
                  >
                    {roles.map((role) => (
                      <option key={role} value={role}>{role}</option>
                    ))}
                  </select>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Results Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            {filteredResults.length === 0 ? (
              <div className="text-center py-16">
                <Search className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-2xl font-bold mb-2">No results found</h3>
                <p className="text-muted-foreground mb-6">
                  Try adjusting your search terms or filters to find what you're looking for.
                </p>
                <Button onClick={clearFilters} variant="outline">
                  Clear all filters
                </Button>
              </div>
            ) : (
              <div className="space-y-6">
                {filteredResults.map((result) => (
                  <Card key={result.id} className="hover:shadow-lg transition-all duration-300 group">
                    <CardHeader>
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          <Badge variant="outline" className="text-xs">
                            {result.type.charAt(0).toUpperCase() + result.type.slice(1)}
                          </Badge>
                          <Badge variant="secondary" className="text-xs">
                            {result.difficulty}
                          </Badge>
                          {result.isPopular && (
                            <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                              <Star className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                          {result.role && getRoleIcon(result.role)}
                          <span className="text-xs">
                            {new Date(result.lastUpdated).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        <Link href={result.href} className="hover:underline flex items-center space-x-2">
                          {getTypeIcon(result.type)}
                          <span>{result.title}</span>
                        </Link>
                      </CardTitle>
                      <CardDescription className="text-base">
                        {result.description}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="flex items-center text-sm text-muted-foreground">
                            <Clock className="h-4 w-4 mr-1" />
                            {result.readTime || result.duration}
                          </div>
                          <div className="flex items-center space-x-1">
                            <Tag className="h-4 w-4 text-muted-foreground" />
                            <div className="flex flex-wrap gap-1">
                              {result.tags.slice(0, 3).map((tag) => (
                                <Badge key={tag} variant="secondary" className="text-xs">
                                  {tag}
                                </Badge>
                              ))}
                              {result.tags.length > 3 && (
                                <Badge variant="secondary" className="text-xs">
                                  +{result.tags.length - 3}
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10">
                          <Link href={result.href} className="flex items-center space-x-1">
                            <span>Read More</span>
                            <ChevronRight className="h-4 w-4" />
                          </Link>
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Popular Topics */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Popular Topics</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Account Setup', href: '/learning-hub/topics/account-setup', icon: <Users className="h-5 w-5" /> },
                { title: 'Payment Issues', href: '/learning-hub/topics/payment-issues', icon: <FileText className="h-5 w-5" /> },
                { title: 'Profile Management', href: '/learning-hub/topics/profile-management', icon: <UserCheck className="h-5 w-5" /> },
                { title: 'Security Settings', href: '/learning-hub/topics/security-settings', icon: <Target className="h-5 w-5" /> }
              ].map((topic) => (
                <Button key={topic.title} variant="outline" asChild className="h-auto p-4 flex flex-col items-center space-y-2">
                  <Link href={topic.href}>
                    {topic.icon}
                    <span className="text-sm">{topic.title}</span>
                  </Link>
                </Button>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SearchPage;
