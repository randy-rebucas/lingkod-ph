'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Users,
  FileText,
  Video,
  BookOpen,
  Download,
  Settings,
  BarChart3,
  Calendar,
  Clock,
  ChevronRight,
  MoreHorizontal,
  Target,
  Building2,
  UserCheck
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';

interface ContentItem {
  id: string;
  title: string;
  type: 'article' | 'tutorial' | 'topic' | 'resource';
  category: string;
  role: 'clients' | 'providers' | 'agencies' | 'partners' | 'all';
  status: 'draft' | 'published' | 'archived';
  featured: boolean;
  popular: boolean;
  author: string;
  createdAt: string;
  updatedAt: string;
  viewCount?: number;
  downloadCount?: number;
  rating?: number;
}

const AdminLearningHubPage = () => {
  const [content, setContent] = useState<ContentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedRole, setSelectedRole] = useState('all');

  // Mock data - in a real app, this would come from an API
  useEffect(() => {
    const mockContent: ContentItem[] = [
      {
        id: '1',
        title: 'Welcome to LocalPro: Your Complete Getting Started Guide',
        type: 'article',
        category: 'Getting Started',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'Sarah Johnson',
        createdAt: '2024-01-15',
        updatedAt: '2024-01-15',
        viewCount: 15420,
        rating: 4.8
      },
      {
        id: '2',
        title: 'How to Create and Verify Your LocalPro Account',
        type: 'article',
        category: 'Getting Started',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'Sarah Johnson',
        createdAt: '2024-01-14',
        updatedAt: '2024-01-14',
        viewCount: 12850,
        rating: 4.7
      },
      {
        id: '3',
        title: 'Complete Client Onboarding Tutorial',
        type: 'tutorial',
        category: 'For Clients',
        role: 'clients',
        status: 'published',
        featured: true,
        popular: true,
        author: 'Sarah Johnson',
        createdAt: '2024-01-13',
        updatedAt: '2024-01-13',
        viewCount: 11200,
        rating: 4.6
      },
      {
        id: '4',
        title: 'Provider Verification Process',
        type: 'tutorial',
        category: 'For Providers',
        role: 'providers',
        status: 'published',
        featured: true,
        popular: false,
        author: 'Mike Chen',
        createdAt: '2024-01-12',
        updatedAt: '2024-01-12',
        viewCount: 8900,
        rating: 4.5
      },
      {
        id: '5',
        title: 'Account Setup',
        type: 'topic',
        category: 'Getting Started',
        role: 'clients',
        status: 'published',
        featured: true,
        popular: true,
        author: 'Sarah Johnson',
        createdAt: '2024-01-11',
        updatedAt: '2024-01-11',
        viewCount: 18900,
        rating: 4.8
      },
      {
        id: '6',
        title: 'LocalPro User Guide',
        type: 'resource',
        category: 'Documentation',
        role: 'all',
        status: 'published',
        featured: true,
        popular: true,
        author: 'Sarah Johnson',
        createdAt: '2024-01-10',
        updatedAt: '2024-01-10',
        downloadCount: 15420,
        rating: 4.8
      },
      {
        id: '7',
        title: 'Payment Issues Troubleshooting',
        type: 'article',
        category: 'Troubleshooting',
        role: 'all',
        status: 'draft',
        featured: false,
        popular: false,
        author: 'Mike Chen',
        createdAt: '2024-01-09',
        updatedAt: '2024-01-09',
        viewCount: 0
      },
      {
        id: '8',
        title: 'Agency Setup Complete Guide',
        type: 'tutorial',
        category: 'For Agencies',
        role: 'agencies',
        status: 'published',
        featured: false,
        popular: false,
        author: 'David Rodriguez',
        createdAt: '2024-01-08',
        updatedAt: '2024-01-08',
        viewCount: 3200,
        rating: 4.9
      }
    ];

    setTimeout(() => {
      setContent(mockContent);
      setLoading(false);
    }, 1000);
  }, []);

  const filteredContent = content.filter(item => {
    const matchesSearch = searchQuery === '' || 
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.author.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    const matchesRole = selectedRole === 'all' || item.role === selectedRole;

    return matchesSearch && matchesType && matchesStatus && matchesRole;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'article':
        return <FileText className="h-4 w-4" />;
      case 'tutorial':
        return <Video className="h-4 w-4" />;
      case 'topic':
        return <BookOpen className="h-4 w-4" />;
      case 'resource':
        return <Download className="h-4 w-4" />;
      default:
        return <FileText className="h-4 w-4" />;
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'published':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'draft':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'archived':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const stats = {
    total: content.length,
    published: content.filter(item => item.status === 'published').length,
    draft: content.filter(item => item.status === 'draft').length,
    featured: content.filter(item => item.featured).length,
    popular: content.filter(item => item.popular).length,
    totalViews: content.reduce((sum, item) => sum + (item.viewCount || 0), 0),
    totalDownloads: content.reduce((sum, item) => sum + (item.downloadCount || 0), 0)
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto py-20 px-4">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading content...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                  Learning Hub Management
                </h1>
                <p className="text-xl text-muted-foreground">
                  Manage articles, tutorials, topics, and resources for the learning hub
                </p>
              </div>
              <div className="flex space-x-3">
                <Button asChild>
                  <Link href="/admin/learning-hub/articles/new" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Article</span>
                  </Link>
                </Button>
                <Button variant="outline" asChild>
                  <Link href="/admin/learning-hub/tutorials/new" className="flex items-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span>New Tutorial</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Content</CardTitle>
                  <FileText className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.total}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.published} published, {stats.draft} drafts
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Featured Content</CardTitle>
                  <Star className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.featured}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.popular} popular items
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalViews.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Across all content
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Downloads</CardTitle>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.totalDownloads.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    Resources downloaded
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search content..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <select
                value={selectedType}
                onChange={(e) => setSelectedType(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Types</option>
                <option value="article">Articles</option>
                <option value="tutorial">Tutorials</option>
                <option value="topic">Topics</option>
                <option value="resource">Resources</option>
              </select>
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Status</option>
                <option value="published">Published</option>
                <option value="draft">Draft</option>
                <option value="archived">Archived</option>
              </select>
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-3 py-2 border rounded-md bg-background"
              >
                <option value="all">All Roles</option>
                <option value="clients">Clients</option>
                <option value="providers">Providers</option>
                <option value="agencies">Agencies</option>
                <option value="partners">Partners</option>
                <option value="all">All Users</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Content Table */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="max-w-7xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle>Content Library</CardTitle>
                <CardDescription>
                  Manage all learning hub content including articles, tutorials, topics, and resources
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Title</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Author</TableHead>
                      <TableHead>Metrics</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredContent.map((item) => (
                      <TableRow key={item.id}>
                        <TableCell>
                          <div className="flex items-center space-x-3">
                            {getTypeIcon(item.type)}
                            <div>
                              <div className="font-medium">{item.title}</div>
                              <div className="flex items-center space-x-2 mt-1">
                                {item.featured && (
                                  <Badge variant="default" className="text-xs bg-orange-100 text-orange-800 border-orange-200">
                                    <Star className="h-3 w-3 mr-1" />
                                    Featured
                                  </Badge>
                                )}
                                {item.popular && (
                                  <Badge variant="default" className="text-xs bg-green-100 text-green-800 border-green-200">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Popular
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="capitalize">
                            {item.type}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.category}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {getRoleIcon(item.role)}
                            <span className="capitalize">{item.role}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className={getStatusColor(item.status)}>
                            {item.status}
                          </Badge>
                        </TableCell>
                        <TableCell>{item.author}</TableCell>
                        <TableCell>
                          <div className="text-sm text-muted-foreground">
                            {item.viewCount && (
                              <div className="flex items-center space-x-1">
                                <Eye className="h-3 w-3" />
                                <span>{item.viewCount.toLocaleString()}</span>
                              </div>
                            )}
                            {item.downloadCount && (
                              <div className="flex items-center space-x-1">
                                <Download className="h-3 w-3" />
                                <span>{item.downloadCount.toLocaleString()}</span>
                              </div>
                            )}
                            {item.rating && (
                              <div className="flex items-center space-x-1">
                                <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                                <span>{item.rating}</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem asChild>
                                <Link href={`/admin/learning-hub/${item.type}s/${item.id}/edit`}>
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuItem asChild>
                                <Link href={`/learning-hub/${item.type}s/${item.id}`}>
                                  <Eye className="h-4 w-4 mr-2" />
                                  View
                                </Link>
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem>
                                {item.status === 'published' ? (
                                  <>
                                    <EyeOff className="h-4 w-4 mr-2" />
                                    Unpublish
                                  </>
                                ) : (
                                  <>
                                    <Eye className="h-4 w-4 mr-2" />
                                    Publish
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuItem>
                                {item.featured ? (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Remove from Featured
                                  </>
                                ) : (
                                  <>
                                    <Star className="h-4 w-4 mr-2" />
                                    Add to Featured
                                  </>
                                )}
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem className="text-red-600">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AdminLearningHubPage;
