'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Video,
  Play,
  Clock,
  Star,
  Users,
  UserCheck,
  Building2,
  Target,
  Search,
  Download,
  BookOpen,
  TrendingUp,
  ChevronRight,
} from 'lucide-react';

interface VideoTutorial {
  id: number;
  title: string;
  description: string;
  duration: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  category: string;
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  thumbnail: string;
  videoUrl: string;
  isPopular: boolean;
  isNew: boolean;
  tags: string[];
  instructor: string;
  views: number;
  rating: number;
  lastUpdated: string;
}

const VideoTutorialsPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');

  const videoTutorials: VideoTutorial[] = [
    {
      id: 1,
      title: 'Complete Client Onboarding Tutorial',
      description: 'Step-by-step video guide to setting up your client account, profile, and preferences on LocalPro.',
      duration: '12:30',
      difficulty: 'Beginner',
      category: 'Getting Started',
      role: 'clients',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/client-onboarding',
      isPopular: true,
      isNew: false,
      tags: ['onboarding', 'setup', 'profile', 'clients'],
      instructor: 'Sarah Johnson',
      views: 15420,
      rating: 4.8,
      lastUpdated: '2024-01-15'
    },
    {
      id: 2,
      title: 'Provider Verification Process',
      description: 'Complete walkthrough of the provider verification process, including document submission and approval.',
      duration: '18:45',
      difficulty: 'Beginner',
      category: 'For Providers',
      role: 'providers',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/provider-verification',
      isPopular: true,
      isNew: false,
      tags: ['verification', 'documents', 'providers', 'approval'],
      instructor: 'Mike Chen',
      views: 12850,
      rating: 4.7,
      lastUpdated: '2024-01-14'
    },
    {
      id: 3,
      title: 'Agency Setup and Management',
      description: 'Learn how to set up your agency, manage multiple providers, and scale your operations effectively.',
      duration: '25:20',
      difficulty: 'Intermediate',
      category: 'For Agencies',
      role: 'agencies',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/agency-setup',
      isPopular: false,
      isNew: true,
      tags: ['agency', 'management', 'providers', 'scaling'],
      instructor: 'David Rodriguez',
      views: 8750,
      rating: 4.9,
      lastUpdated: '2024-01-13'
    },
    {
      id: 4,
      title: 'Partnership Application Guide',
      description: 'Complete guide to applying for LocalPro partnerships and understanding the benefits.',
      duration: '15:10',
      difficulty: 'Beginner',
      category: 'For Partners',
      role: 'partners',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/partnership-application',
      isPopular: false,
      isNew: false,
      tags: ['partnership', 'application', 'benefits', 'business'],
      instructor: 'Lisa Wang',
      views: 6200,
      rating: 4.6,
      lastUpdated: '2024-01-12'
    },
    {
      id: 5,
      title: 'Advanced Search Techniques',
      description: 'Master the search functionality to find exactly the services and providers you need.',
      duration: '10:25',
      difficulty: 'Intermediate',
      category: 'Features & Functionality',
      role: 'clients',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/advanced-search',
      isPopular: true,
      isNew: false,
      tags: ['search', 'filters', 'clients', 'discovery'],
      instructor: 'Sarah Johnson',
      views: 11200,
      rating: 4.5,
      lastUpdated: '2024-01-11'
    },
    {
      id: 6,
      title: 'Profile Optimization Masterclass',
      description: 'Learn how to create compelling profiles that attract more clients and bookings.',
      duration: '22:15',
      difficulty: 'Intermediate',
      category: 'For Providers',
      role: 'providers',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/profile-optimization',
      isPopular: true,
      isNew: false,
      tags: ['profile', 'optimization', 'marketing', 'attraction'],
      instructor: 'Mike Chen',
      views: 18900,
      rating: 4.8,
      lastUpdated: '2024-01-10'
    },
    {
      id: 7,
      title: 'Booking Management System',
      description: 'Complete guide to managing bookings, scheduling, and client communications.',
      duration: '16:40',
      difficulty: 'Beginner',
      category: 'Features & Functionality',
      role: 'providers',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/booking-management',
      isPopular: false,
      isNew: false,
      tags: ['booking', 'management', 'scheduling', 'communication'],
      instructor: 'David Rodriguez',
      views: 9800,
      rating: 4.7,
      lastUpdated: '2024-01-09'
    },
    {
      id: 8,
      title: 'Team Management Best Practices',
      description: 'Learn how to effectively manage and coordinate your service provider team.',
      duration: '20:30',
      difficulty: 'Intermediate',
      category: 'For Agencies',
      role: 'agencies',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/team-management',
      isPopular: false,
      isNew: true,
      tags: ['team', 'management', 'coordination', 'leadership'],
      instructor: 'Lisa Wang',
      views: 7500,
      rating: 4.9,
      lastUpdated: '2024-01-08'
    },
    {
      id: 9,
      title: 'Payment Security and Protection',
      description: 'Understanding LocalPro\'s payment security features and fraud protection.',
      duration: '14:20',
      difficulty: 'Beginner',
      category: 'Security & Privacy',
      role: 'all',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/payment-security',
      isPopular: true,
      isNew: false,
      tags: ['payment', 'security', 'protection', 'fraud'],
      instructor: 'Sarah Johnson',
      views: 13500,
      rating: 4.6,
      lastUpdated: '2024-01-07'
    },
    {
      id: 10,
      title: 'Mobile App Features Guide',
      description: 'Complete overview of LocalPro mobile app features and functionality.',
      duration: '13:50',
      difficulty: 'Beginner',
      category: 'Features & Functionality',
      role: 'all',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/mobile-app',
      isPopular: false,
      isNew: false,
      tags: ['mobile', 'app', 'features', 'functionality'],
      instructor: 'Mike Chen',
      views: 8900,
      rating: 4.4,
      lastUpdated: '2024-01-06'
    },
    {
      id: 11,
      title: 'Quality Control Systems',
      description: 'Establish and maintain high service quality standards across your agency.',
      duration: '19:15',
      difficulty: 'Advanced',
      category: 'For Agencies',
      role: 'agencies',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/quality-control',
      isPopular: false,
      isNew: true,
      tags: ['quality', 'control', 'standards', 'monitoring'],
      instructor: 'David Rodriguez',
      views: 4200,
      rating: 4.8,
      lastUpdated: '2024-01-05'
    },
    {
      id: 12,
      title: 'Partnership Success Strategies',
      description: 'Proven strategies for building successful partnerships with LocalPro.',
      duration: '17:30',
      difficulty: 'Advanced',
      category: 'For Partners',
      role: 'partners',
      thumbnail: '/api/placeholder/400/225',
      videoUrl: '/videos/partnership-strategies',
      isPopular: false,
      isNew: false,
      tags: ['partnership', 'strategies', 'success', 'growth'],
      instructor: 'Lisa Wang',
      views: 5800,
      rating: 4.7,
      lastUpdated: '2024-01-04'
    }
  ];

  const categories = ['All', 'Getting Started', 'For Clients', 'For Providers', 'For Agencies', 'For Partners', 'Features & Functionality', 'Security & Privacy'];
  const difficulties = ['All', 'Beginner', 'Intermediate', 'Advanced'];
  const roles = ['All', 'Clients', 'Providers', 'Agencies', 'Partners'];

  const filteredTutorials = videoTutorials.filter(tutorial => {
    const matchesSearch = searchQuery === '' || 
      tutorial.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tutorial.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || tutorial.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'All' || tutorial.difficulty === selectedDifficulty;
    const matchesRole = selectedRole === 'All' || tutorial.role === selectedRole.toLowerCase() || tutorial.role === 'all';

    return matchesSearch && matchesCategory && matchesDifficulty && matchesRole;
  });

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'clients':
        return <Users className="h-4 w-4" />;
      case 'providers':
        return <UserCheck className="h-4 w-4" />;
      case 'agencies':
        return <Building2 className="h-4 w-4" />;
      case 'partners':
        return <Target className="h-4 w-4" />;
      case 'all':
        return <BookOpen className="h-4 w-4" />;
      default:
        return null;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'Beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'Intermediate':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'Advanced':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Video Tutorials
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Learn LocalPro through comprehensive video tutorials designed for all user roles
            </p>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search video tutorials..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-4 py-3 text-lg"
              />
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="p-3 border rounded-lg bg-background"
              >
                {categories.map((category) => (
                  <option key={category} value={category}>{category}</option>
                ))}
              </select>
              <select
                value={selectedDifficulty}
                onChange={(e) => setSelectedDifficulty(e.target.value)}
                className="p-3 border rounded-lg bg-background"
              >
                {difficulties.map((difficulty) => (
                  <option key={difficulty} value={difficulty}>{difficulty}</option>
                ))}
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="p-3 border rounded-lg bg-background"
              >
                {roles.map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
              <div className="flex items-center justify-center">
                <Badge variant="secondary">
                  {filteredTutorials.length} videos
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Tutorials */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Featured Tutorials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {videoTutorials.filter(t => t.isPopular).slice(0, 3).map((tutorial) => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Play className="h-8 w-8 text-primary ml-1" />
                      </div>
                    </div>
                    {tutorial.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white">
                        New
                      </Badge>
                    )}
                    {tutorial.isPopular && (
                      <Badge className="absolute top-2 right-2 bg-orange-500 text-white">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      <Link href={tutorial.videoUrl} className="hover:underline">
                        {tutorial.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {getRoleIcon(tutorial.role)}
                        <span>{tutorial.instructor}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{tutorial.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {tutorial.views.toLocaleString()} views
                      </div>
                      <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10">
                        <Link href={tutorial.videoUrl} className="flex items-center space-x-1">
                          <span>Watch Now</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Tutorials */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">All Video Tutorials</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredTutorials.map((tutorial) => (
                <Card key={tutorial.id} className="hover:shadow-lg transition-all duration-300 group">
                  <div className="relative">
                    <div className="aspect-video bg-muted rounded-t-lg flex items-center justify-center">
                      <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                        <Play className="h-6 w-6 text-primary ml-0.5" />
                      </div>
                    </div>
                    {tutorial.isNew && (
                      <Badge className="absolute top-2 left-2 bg-green-500 text-white text-xs">
                        New
                      </Badge>
                    )}
                    {tutorial.isPopular && (
                      <Badge className="absolute top-2 right-2 bg-orange-500 text-white text-xs">
                        <Star className="h-3 w-3 mr-1" />
                        Popular
                      </Badge>
                    )}
                  </div>
                  <CardHeader>
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline" className={`text-xs ${getDifficultyColor(tutorial.difficulty)}`}>
                        {tutorial.difficulty}
                      </Badge>
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Clock className="h-4 w-4 mr-1" />
                        {tutorial.duration}
                      </div>
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      <Link href={tutorial.videoUrl} className="hover:underline">
                        {tutorial.title}
                      </Link>
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {tutorial.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        {getRoleIcon(tutorial.role)}
                        <span>{tutorial.instructor}</span>
                      </div>
                      <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span>{tutorial.rating}</span>
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <TrendingUp className="h-4 w-4 mr-1" />
                        {tutorial.views.toLocaleString()} views
                      </div>
                      <Button variant="ghost" size="sm" asChild className="group-hover:bg-primary/10">
                        <Link href={tutorial.videoUrl} className="flex items-center space-x-1">
                          <span>Watch</span>
                          <ChevronRight className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Learning Paths */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Learning Paths</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[
                {
                  title: 'Client Success Path',
                  description: 'Complete learning path for clients to master LocalPro',
                  duration: '2 hours',
                  videos: 8,
                  role: 'clients',
                  icon: <Users className="h-6 w-6" />,
                  color: 'bg-blue-50 text-blue-600 border-blue-200'
                },
                {
                  title: 'Provider Mastery Path',
                  description: 'Comprehensive guide for service providers to grow their business',
                  duration: '3 hours',
                  videos: 12,
                  role: 'providers',
                  icon: <UserCheck className="h-6 w-6" />,
                  color: 'bg-green-50 text-green-600 border-green-200'
                },
                {
                  title: 'Agency Leadership Path',
                  description: 'Advanced strategies for agency owners and managers',
                  duration: '4 hours',
                  videos: 15,
                  role: 'agencies',
                  icon: <Building2 className="h-6 w-6" />,
                  color: 'bg-purple-50 text-purple-600 border-purple-200'
                },
                {
                  title: 'Partnership Growth Path',
                  description: 'Strategic partnership development and growth strategies',
                  duration: '2.5 hours',
                  videos: 10,
                  role: 'partners',
                  icon: <Target className="h-6 w-6" />,
                  color: 'bg-orange-50 text-orange-600 border-orange-200'
                }
              ].map((path) => (
                <Card key={path.title} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className={`mx-auto w-12 h-12 ${path.color} rounded-lg flex items-center justify-center mb-4`}>
                      {path.icon}
                    </div>
                    <CardTitle className="text-xl text-center">{path.title}</CardTitle>
                    <CardDescription className="text-center">
                      {path.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="text-center space-y-4">
                    <div className="flex items-center justify-center space-x-4 text-sm text-muted-foreground">
                      <div className="flex items-center space-x-1">
                        <Clock className="h-4 w-4" />
                        <span>{path.duration}</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Video className="h-4 w-4" />
                        <span>{path.videos} videos</span>
                      </div>
                    </div>
                    <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                      <Link href={`/learning-hub/learning-paths/${path.role}`} className="flex items-center justify-center space-x-2">
                        <span>Start Learning Path</span>
                        <ChevronRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 px-4 bg-gradient-to-r from-primary to-primary/80 text-white">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Learn?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Start your LocalPro journey with our comprehensive video tutorials and learning paths.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/learning-hub" className="flex items-center space-x-2">
                <BookOpen className="h-4 w-4" />
                <span>Explore Learning Hub</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/learning-hub/resources" className="flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Download Resources</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default VideoTutorialsPage;
