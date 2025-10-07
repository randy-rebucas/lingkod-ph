'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Download,
  FileText,
  File,
  Video,
  BookOpen,
  Users,
  UserCheck,
  Building2,
  Target,
  Search,
  Star,
  FileSpreadsheet,
  FileText as FilePdf,
  FileImage,
  FileVideo,
  Archive,
  Globe,
  Mail,
} from 'lucide-react';

interface Resource {
  id: number;
  title: string;
  description: string;
  type: 'pdf' | 'doc' | 'xlsx' | 'image' | 'video' | 'zip' | 'link';
  category: string;
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  size?: string;
  downloadUrl: string;
  isPopular: boolean;
  isNew: boolean;
  tags: string[];
  lastUpdated: string;
  downloads: number;
  rating?: number;
}

const ResourcesPage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedType, setSelectedType] = useState('All');
  const [selectedRole, setSelectedRole] = useState('All');

  const resources: Resource[] = [
    {
      id: 1,
      title: 'LocalPro User Guide',
      description: 'Comprehensive user guide covering all features and functionality of LocalPro platform.',
      type: 'pdf',
      category: 'Documentation',
      role: 'all',
      size: '2.4 MB',
      downloadUrl: '/downloads/localpro-user-guide.pdf',
      isPopular: true,
      isNew: false,
      tags: ['guide', 'documentation', 'features', 'overview'],
      lastUpdated: '2024-01-15',
      downloads: 15420,
      rating: 4.8
    },
    {
      id: 2,
      title: 'Client Onboarding Checklist',
      description: 'Step-by-step checklist to help clients set up their accounts and get started.',
      type: 'pdf',
      category: 'Getting Started',
      role: 'clients',
      size: '1.2 MB',
      downloadUrl: '/downloads/client-onboarding-checklist.pdf',
      isPopular: true,
      isNew: false,
      tags: ['checklist', 'onboarding', 'clients', 'setup'],
      lastUpdated: '2024-01-14',
      downloads: 12850,
      rating: 4.7
    },
    {
      id: 3,
      title: 'Provider Verification Requirements',
      description: 'Complete list of documents and requirements for provider verification.',
      type: 'pdf',
      category: 'For Providers',
      role: 'providers',
      size: '890 KB',
      downloadUrl: '/downloads/provider-verification-requirements.pdf',
      isPopular: true,
      isNew: false,
      tags: ['verification', 'requirements', 'documents', 'providers'],
      lastUpdated: '2024-01-13',
      downloads: 11200,
      rating: 4.6
    },
    {
      id: 4,
      title: 'Agency Setup Template',
      description: 'Excel template for planning and organizing your agency setup process.',
      type: 'xlsx',
      category: 'For Agencies',
      role: 'agencies',
      size: '156 KB',
      downloadUrl: '/downloads/agency-setup-template.xlsx',
      isPopular: false,
      isNew: true,
      tags: ['template', 'setup', 'planning', 'agency'],
      lastUpdated: '2024-01-12',
      downloads: 3200,
      rating: 4.9
    },
    {
      id: 5,
      title: 'Partnership Application Form',
      description: 'Official application form for LocalPro partnership programs.',
      type: 'pdf',
      category: 'For Partners',
      role: 'partners',
      size: '1.8 MB',
      downloadUrl: '/downloads/partnership-application-form.pdf',
      isPopular: false,
      isNew: false,
      tags: ['application', 'partnership', 'form', 'business'],
      lastUpdated: '2024-01-11',
      downloads: 5800,
      rating: 4.5
    },
    {
      id: 6,
      title: 'Profile Optimization Guide',
      description: 'Visual guide with examples for creating compelling profiles.',
      type: 'pdf',
      category: 'Marketing & Growth',
      role: 'providers',
      size: '3.2 MB',
      downloadUrl: '/downloads/profile-optimization-guide.pdf',
      isPopular: true,
      isNew: false,
      tags: ['profile', 'optimization', 'marketing', 'growth'],
      lastUpdated: '2024-01-10',
      downloads: 18900,
      rating: 4.8
    },
    {
      id: 7,
      title: 'Booking Management Workflow',
      description: 'Visual workflow diagram for managing bookings and scheduling.',
      type: 'image',
      category: 'Features & Functionality',
      role: 'providers',
      size: '2.1 MB',
      downloadUrl: '/downloads/booking-management-workflow.png',
      isPopular: false,
      isNew: false,
      tags: ['workflow', 'booking', 'management', 'scheduling'],
      lastUpdated: '2024-01-09',
      downloads: 8900,
      rating: 4.4
    },
    {
      id: 8,
      title: 'Team Management Best Practices',
      description: 'Comprehensive guide for managing service provider teams.',
      type: 'pdf',
      category: 'For Agencies',
      role: 'agencies',
      size: '2.8 MB',
      downloadUrl: '/downloads/team-management-best-practices.pdf',
      isPopular: false,
      isNew: true,
      tags: ['team', 'management', 'best-practices', 'leadership'],
      lastUpdated: '2024-01-08',
      downloads: 4200,
      rating: 4.7
    },
    {
      id: 9,
      title: 'Security Best Practices',
      description: 'Security guidelines and best practices for all users.',
      type: 'pdf',
      category: 'Security & Privacy',
      role: 'all',
      size: '1.5 MB',
      downloadUrl: '/downloads/security-best-practices.pdf',
      isPopular: true,
      isNew: false,
      tags: ['security', 'privacy', 'best-practices', 'guidelines'],
      lastUpdated: '2024-01-07',
      downloads: 13500,
      rating: 4.6
    },
    {
      id: 10,
      title: 'Mobile App Feature Overview',
      description: 'Visual overview of all mobile app features and functionality.',
      type: 'image',
      category: 'Features & Functionality',
      role: 'all',
      size: '1.9 MB',
      downloadUrl: '/downloads/mobile-app-feature-overview.png',
      isPopular: false,
      isNew: false,
      tags: ['mobile', 'app', 'features', 'overview'],
      lastUpdated: '2024-01-06',
      downloads: 7200,
      rating: 4.3
    },
    {
      id: 11,
      title: 'Quality Control Checklist',
      description: 'Comprehensive checklist for maintaining service quality standards.',
      type: 'pdf',
      category: 'For Agencies',
      role: 'agencies',
      size: '1.1 MB',
      downloadUrl: '/downloads/quality-control-checklist.pdf',
      isPopular: false,
      isNew: true,
      tags: ['quality', 'control', 'checklist', 'standards'],
      lastUpdated: '2024-01-05',
      downloads: 2800,
      rating: 4.8
    },
    {
      id: 12,
      title: 'Partnership Success Metrics',
      description: 'Excel template for tracking partnership performance and metrics.',
      type: 'xlsx',
      category: 'For Partners',
      role: 'partners',
      size: '234 KB',
      downloadUrl: '/downloads/partnership-success-metrics.xlsx',
      isPopular: false,
      isNew: false,
      tags: ['metrics', 'tracking', 'performance', 'partnership'],
      lastUpdated: '2024-01-04',
      downloads: 3600,
      rating: 4.5
    },
    {
      id: 13,
      title: 'Video Tutorial Collection',
      description: 'Complete collection of all video tutorials in downloadable format.',
      type: 'zip',
      category: 'Video Tutorials',
      role: 'all',
      size: '1.2 GB',
      downloadUrl: '/downloads/video-tutorial-collection.zip',
      isPopular: true,
      isNew: false,
      tags: ['videos', 'tutorials', 'collection', 'download'],
      lastUpdated: '2024-01-03',
      downloads: 8900,
      rating: 4.7
    },
    {
      id: 14,
      title: 'LocalPro Brand Guidelines',
      description: 'Official brand guidelines and assets for partners and agencies.',
      type: 'zip',
      category: 'Marketing & Growth',
      role: 'all',
      size: '45 MB',
      downloadUrl: '/downloads/localpro-brand-guidelines.zip',
      isPopular: false,
      isNew: false,
      tags: ['brand', 'guidelines', 'assets', 'marketing'],
      lastUpdated: '2024-01-02',
      downloads: 2100,
      rating: 4.4
    },
    {
      id: 15,
      title: 'API Documentation',
      description: 'Complete API documentation for developers and technical partners.',
      type: 'pdf',
      category: 'Technical Documentation',
      role: 'partners',
      size: '4.2 MB',
      downloadUrl: '/downloads/api-documentation.pdf',
      isPopular: false,
      isNew: false,
      tags: ['api', 'documentation', 'technical', 'developers'],
      lastUpdated: '2024-01-01',
      downloads: 1800,
      rating: 4.6
    }
  ];

  const categories = ['All', 'Documentation', 'Getting Started', 'For Clients', 'For Providers', 'For Agencies', 'For Partners', 'Features & Functionality', 'Security & Privacy', 'Marketing & Growth', 'Video Tutorials', 'Technical Documentation'];
  const types = ['All', 'PDF', 'DOC', 'XLSX', 'Image', 'Video', 'ZIP', 'Link'];
  const roles = ['All', 'Clients', 'Providers', 'Agencies', 'Partners'];

  const filteredResources = resources.filter(resource => {
    const matchesSearch = searchQuery === '' || 
      resource.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      resource.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'All' || resource.category === selectedCategory;
    const matchesType = selectedType === 'All' || resource.type.toUpperCase() === selectedType;
    const matchesRole = selectedRole === 'All' || resource.role === selectedRole.toLowerCase() || resource.role === 'all';

    return matchesSearch && matchesCategory && matchesType && matchesRole;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return <FilePdf className="h-5 w-5 text-red-500" />;
      case 'doc':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'xlsx':
        return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
      case 'image':
        return <FileImage className="h-5 w-5 text-purple-500" />;
      case 'video':
        return <FileVideo className="h-5 w-5 text-orange-500" />;
      case 'zip':
        return <Archive className="h-5 w-5 text-gray-500" />;
      case 'link':
        return <Globe className="h-5 w-5 text-blue-500" />;
      default:
        return <File className="h-5 w-5 text-gray-500" />;
    }
  };

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

  const formatFileSize = (size: string) => {
    return size;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
              Download Resources
            </h1>
            <p className="text-xl text-muted-foreground mb-8">
              Access comprehensive guides, templates, and resources to help you succeed with LocalPro
            </p>
            
            {/* Search Bar */}
            <div className="relative mb-6">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search resources..."
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
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="p-3 border rounded-lg bg-background"
              >
                {types.map((type) => (
                  <option key={type} value={type}>{type}</option>
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
                  {filteredResources.length} resources
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Popular Resources */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">Popular Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {resources.filter(r => r.isPopular).slice(0, 3).map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(resource.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(resource.role)}
                            <Badge variant="outline" className="text-xs">
                              {resource.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {resource.isNew && (
                        <Badge className="bg-green-500 text-white text-xs">
                          New
                        </Badge>
                      )}
                      {resource.isPopular && (
                        <Badge className="bg-orange-500 text-white text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{resource.downloads.toLocaleString()}</span>
                        </div>
                        {resource.size && (
                          <div className="flex items-center space-x-1">
                            <File className="h-4 w-4" />
                            <span>{formatFileSize(resource.size)}</span>
                          </div>
                        )}
                      </div>
                      {resource.rating && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{resource.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                      <a href={resource.downloadUrl} download className="flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* All Resources */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-8">All Resources</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredResources.map((resource) => (
                <Card key={resource.id} className="hover:shadow-lg transition-all duration-300 group">
                  <CardHeader>
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        {getTypeIcon(resource.type)}
                        <div>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(resource.role)}
                            <Badge variant="outline" className="text-xs">
                              {resource.category}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      {resource.isNew && (
                        <Badge className="bg-green-500 text-white text-xs">
                          New
                        </Badge>
                      )}
                      {resource.isPopular && (
                        <Badge className="bg-orange-500 text-white text-xs">
                          <Star className="h-3 w-3 mr-1" />
                          Popular
                        </Badge>
                      )}
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {resource.title}
                    </CardTitle>
                    <CardDescription className="text-sm">
                      {resource.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Download className="h-4 w-4" />
                          <span>{resource.downloads.toLocaleString()}</span>
                        </div>
                        {resource.size && (
                          <div className="flex items-center space-x-1">
                            <File className="h-4 w-4" />
                            <span>{formatFileSize(resource.size)}</span>
                          </div>
                        )}
                      </div>
                      {resource.rating && (
                        <div className="flex items-center space-x-1 text-sm text-muted-foreground">
                          <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                          <span>{resource.rating}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex flex-wrap gap-2 mb-4">
                      {resource.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {resource.tags.length > 3 && (
                        <Badge variant="secondary" className="text-xs">
                          +{resource.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                    <Button asChild className="w-full group-hover:bg-primary/90 transition-colors">
                      <a href={resource.downloadUrl} download className="flex items-center justify-center space-x-2">
                        <Download className="h-4 w-4" />
                        <span>Download</span>
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Resource Categories */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-2xl font-bold mb-8 text-center">Resource Categories</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { title: 'Documentation', count: 5, icon: <FileText className="h-6 w-6" />, color: 'bg-blue-50 text-blue-600 border-blue-200' },
                { title: 'Templates', count: 3, icon: <FileSpreadsheet className="h-6 w-6" />, color: 'bg-green-50 text-green-600 border-green-200' },
                { title: 'Guides', count: 4, icon: <BookOpen className="h-6 w-6" />, color: 'bg-purple-50 text-purple-600 border-purple-200' },
                { title: 'Videos', count: 2, icon: <Video className="h-6 w-6" />, color: 'bg-orange-50 text-orange-600 border-orange-200' }
              ].map((category) => (
                <Card key={category.title} className="text-center hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className={`mx-auto w-12 h-12 ${category.color} rounded-lg flex items-center justify-center mb-4`}>
                      {category.icon}
                    </div>
                    <CardTitle className="text-lg">{category.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge variant="secondary">{category.count} resources</Badge>
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
          <h2 className="text-3xl font-bold mb-4">Need More Resources?</h2>
          <p className="text-xl mb-8 opacity-90 max-w-2xl mx-auto">
            Can't find what you're looking for? Contact our support team for additional resources and assistance.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link href="/contact" className="flex items-center space-x-2">
                <Mail className="h-4 w-4" />
                <span>Contact Support</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="bg-transparent border-white text-white hover:bg-white hover:text-primary" asChild>
              <Link href="/learning-hub/video-tutorials" className="flex items-center space-x-2">
                <Video className="h-4 w-4" />
                <span>Watch Tutorials</span>
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default ResourcesPage;
