'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { 
  Plus,
  Search,
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
  MoreHorizontal,
  Target,
  Building2,
  UserCheck,
  RefreshCw
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
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Fetch content from API
  const fetchContent = useCallback(async (showRefreshLoader = false) => {
    try {
      if (showRefreshLoader) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      
      // Clear previous errors
      setError(null);
      
      const params = new URLSearchParams();
      if (selectedType !== 'all') params.append('type', selectedType);
      if (selectedStatus !== 'all') params.append('status', selectedStatus);
      if (selectedRole !== 'all') params.append('role', selectedRole);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await fetch(`/api/admin/learning-hub/content?${params.toString()}`);
      const result = await response.json();
      
      if (result.success) {
        setContent(result.data);
        setError(null);
      } else {
        console.error('Failed to fetch content:', result.error);
        setContent([]);
        setError(result.error || 'Failed to fetch content');
      }
    } catch (error) {
      console.error('Error fetching content:', error);
      setContent([]);
      setError('Failed to connect to database. Please check your Firebase configuration.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [selectedType, selectedStatus, selectedRole, searchQuery]);

  useEffect(() => {
    fetchContent();
  }, [fetchContent]);

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      fetchContent();
    }, 300); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedType, selectedStatus, selectedRole, fetchContent]);

  // Content is already filtered by the API
  const filteredContent = content;

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
      <div className="container space-y-8">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Learning Hub Management
              </h1>
              <p className="text-muted-foreground">
                Manage articles, tutorials, topics, and resources for the learning hub
              </p>
            </div>
          </div>
        </div>
        <div className="text-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading content...</p>
        </div>
      </div>
    );
  }

  // Empty state when no content is available
  if (content.length === 0) {
    return (
      <div className="container space-y-8">
        <div className="mx-auto">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                Learning Hub Management
              </h1>
              <p className="text-muted-foreground">
                Manage articles, tutorials, topics, and resources for the learning hub
              </p>
            </div>
            <div className="flex space-x-3">
              <Button 
                variant="outline" 
                onClick={() => fetchContent(true)}
                disabled={refreshing}
                className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2"
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                <span>Refresh</span>
              </Button>
              <Button asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                <Link href="/admin/learning-hub/articles/new" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Article</span>
                </Link>
              </Button>
              <Button variant="outline" asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                <Link href="/admin/learning-hub/tutorials/new" className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>New Tutorial</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Empty State */}
          <div className="text-center py-20">
            <div className="mx-auto w-24 h-24 bg-muted/20 rounded-full flex items-center justify-center mb-6">
              <FileText className="h-12 w-12 text-muted-foreground" />
            </div>
            <h3 className="text-xl font-semibold mb-2">
              {error ? 'Unable to Load Content' : 'No Content Found'}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-md mx-auto">
              {error ? (
                <span className="text-red-600">
                  {error}
                </span>
              ) : searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedRole !== 'all' ? (
                "No content matches your current filters. Try adjusting your search criteria or clear the filters."
              ) : (
                "Get started by creating your first article, tutorial, topic, or resource for the learning hub."
              )}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              {error ? (
                <Button 
                  onClick={() => fetchContent(true)}
                  disabled={refreshing}
                  className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                >
                  <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                  <span>Retry</span>
                </Button>
              ) : searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedRole !== 'all' ? (
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedType('all');
                    setSelectedStatus('all');
                    setSelectedRole('all');
                  }}
                  className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2"
                >
                  Clear Filters
                </Button>
              ) : (
                <>
                  <Button asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                    <Link href="/admin/learning-hub/articles/new" className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Article</span>
                    </Link>
                  </Button>
                  <Button variant="outline" asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                    <Link href="/admin/learning-hub/tutorials/new" className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Create Tutorial</span>
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Learning Hub Management
            </h1>
            <p className="text-muted-foreground">
              Manage articles, tutorials, topics, and resources for the learning hub
            </p>
          </div>
          <div className="flex space-x-3">
            <Button 
              variant="outline" 
              onClick={() => fetchContent(true)}
              disabled={refreshing}
              className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              <span>Refresh</span>
            </Button>
            <Button asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
              <Link href="/admin/learning-hub/articles/new" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Article</span>
              </Link>
            </Button>
            <Button variant="outline" asChild className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
              <Link href="/admin/learning-hub/tutorials/new" className="flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Tutorial</span>
              </Link>
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Content</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.total}</div>
              <p className="text-xs text-muted-foreground">
                {stats.published} published, {stats.draft} drafts
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Featured Content</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.featured}</div>
              <p className="text-xs text-muted-foreground">
                {stats.popular} popular items
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Total Views</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.totalViews.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Across all content
              </p>
            </CardContent>
          </Card>
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm group">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors">Downloads</CardTitle>
              <Download className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{stats.totalDownloads.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                Resources downloaded
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder="Search content..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 shadow-soft border-2 focus:border-primary"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 py-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
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
            className="px-3 py-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
          >
            <option value="all">All Status</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
            <option value="archived">Archived</option>
          </select>
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            className="px-3 py-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
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

      {/* Content Table */}
      <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
          <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Content Library</CardTitle>
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
              {filteredContent.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={8} className="text-center py-12">
                    <div className="flex flex-col items-center space-y-4">
                      <div className="w-16 h-16 bg-muted/20 rounded-full flex items-center justify-center">
                        <Search className="h-8 w-8 text-muted-foreground" />
                      </div>
                      <div>
                        <h3 className="font-medium text-foreground mb-1">
                          {error ? 'Unable to load content' : 'No content found'}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {error ? (
                            <span className="text-red-600">{error}</span>
                          ) : searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedRole !== 'all' ? (
                            "Try adjusting your search criteria or filters to find content."
                          ) : (
                            "No content has been created yet."
                          )}
                        </p>
                      </div>
                      {error ? (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => fetchContent(true)}
                          disabled={refreshing}
                          className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2"
                        >
                          <RefreshCw className={`h-3 w-3 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                          Retry
                        </Button>
                      ) : (searchQuery || selectedType !== 'all' || selectedStatus !== 'all' || selectedRole !== 'all') && (
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => {
                            setSearchQuery('');
                            setSelectedType('all');
                            setSelectedStatus('all');
                            setSelectedRole('all');
                          }}
                          className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2"
                        >
                          Clear Filters
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                filteredContent.map((item) => (
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
                          <Button variant="ghost" size="sm" className="hover:bg-primary/10">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
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
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminLearningHubPage;
