'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { 
  Save,
  ArrowLeft,
  Eye,
  EyeOff,
  Star,
  TrendingUp,
  Plus,
  X,
  AlertCircle,
  FileText,
  Monitor,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const NewTutorialPage = () => {
  const router = useRouter();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    description: '',
    content: '',
    excerpt: '',
    category: '',
    tags: [] as string[],
    role: 'all' as 'clients' | 'providers' | 'agencies' | 'partners' | 'all',
    difficulty: 'Beginner' as 'Beginner' | 'Intermediate' | 'Advanced',
    duration: 5,
    featured: false,
    popular: false,
    status: 'draft' as 'draft' | 'published' | 'archived',
    seoTitle: '',
    seoDescription: '',
    featuredImage: '',
    videoUrl: '',
    prerequisites: [] as string[],
    learningObjectives: [] as string[]
  });
  const [newTag, setNewTag] = useState('');
  const [newPrerequisite, setNewPrerequisite] = useState('');
  const [newObjective, setNewObjective] = useState('');

  const categories = [
    'Getting Started',
    'For Clients',
    'For Providers',
    'For Agencies',
    'For Partners',
    'Features & Functionality',
    'Troubleshooting',
    'Security & Privacy'
  ];

  const handleInputChange = (field: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Auto-generate slug from title
    if (field === 'title') {
      const slug = value
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim();
      setFormData(prev => ({
        ...prev,
        slug: slug
      }));
    }
  };

  const handleAddTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const handleAddPrerequisite = () => {
    if (newPrerequisite.trim() && !formData.prerequisites.includes(newPrerequisite.trim())) {
      setFormData(prev => ({
        ...prev,
        prerequisites: [...prev.prerequisites, newPrerequisite.trim()]
      }));
      setNewPrerequisite('');
    }
  };

  const handleAddObjective = () => {
    if (newObjective.trim() && !formData.learningObjectives.includes(newObjective.trim())) {
      setFormData(prev => ({
        ...prev,
        learningObjectives: [...prev.learningObjectives, newObjective.trim()]
      }));
      setNewObjective('');
    }
  };

  // Simple markdown renderer for preview
  const renderMarkdown = (text: string) => {
    return text
      .replace(/^# (.*$)/gim, '<h1 class="text-3xl font-bold mb-4">$1</h1>')
      .replace(/^## (.*$)/gim, '<h2 class="text-2xl font-bold mb-3">$1</h2>')
      .replace(/^### (.*$)/gim, '<h3 class="text-xl font-bold mb-2">$1</h3>')
      .replace(/^#### (.*$)/gim, '<h4 class="text-lg font-bold mb-2">$1</h4>')
      .replace(/\*\*(.*)\*\*/gim, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*)\*/gim, '<em class="italic">$1</em>')
      .replace(/`(.*)`/gim, '<code class="bg-gray-100 px-1 py-0.5 rounded text-sm font-mono">$1</code>')
      .replace(/```([\s\S]*?)```/gim, '<pre class="bg-gray-100 p-4 rounded-lg overflow-x-auto"><code class="text-sm font-mono">$1</code></pre>')
      .replace(/^\* (.*$)/gim, '<li class="ml-4">• $1</li>')
      .replace(/^\d+\. (.*$)/gim, '<li class="ml-4">$1</li>')
      .replace(/\n\n/gim, '</p><p class="mb-4">')
      .replace(/\n/gim, '<br>')
      .replace(/^(?!<[h|l|p|d])/gim, '<p class="mb-4">')
      .replace(/(<li.*<\/li>)/gim, '<ul class="list-disc ml-6 mb-4">$1</ul>');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(tag => tag !== tagToRemove)
    }));
  };

  const handleRemovePrerequisite = (prerequisiteToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      prerequisites: prev.prerequisites.filter(prerequisite => prerequisite !== prerequisiteToRemove)
    }));
  };

  const handleRemoveObjective = (objectiveToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      learningObjectives: prev.learningObjectives.filter(objective => objective !== objectiveToRemove)
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      toast({ title: 'Success', description: 'Tutorial created successfully!' });
      router.push('/admin/learning-hub');
    } catch (error) {
      console.error('Error creating tutorial:', error);
      toast({ 
        variant: 'destructive', 
        title: 'Error', 
        description: 'Failed to create tutorial' 
      });
    } finally {
      setLoading(false);
    }
  };


  return (
    <div className="container space-y-8">
      <div className="mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" onClick={() => router.back()} className="hover:bg-primary/10">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                  Create New Tutorial
                </h1>
                <Badge 
                  variant="outline" 
                  className={`${
                    formData.status === 'published' 
                      ? 'bg-green-100 text-green-800 border-green-200' 
                      : formData.status === 'draft'
                      ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                      : 'bg-gray-100 text-gray-800 border-gray-200'
                  }`}
                >
                  {formData.status === 'published' && <Eye className="h-3 w-3 mr-1" />}
                  {formData.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                  {formData.status === 'archived' && <EyeOff className="h-3 w-3 mr-1" />}
                  {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                </Badge>
              </div>
              <p className="text-muted-foreground">
                Create a new tutorial for the learning hub
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Form */}
      <div className="max-w-4xl mx-auto">
        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Basic Information */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Basic Information</CardTitle>
              <CardDescription>
                Provide the basic details for your tutorial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Title *</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) => handleInputChange('title', e.target.value)}
                    placeholder="Enter tutorial title"
                    className="shadow-soft border-2 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={formData.slug}
                    onChange={(e) => handleInputChange('slug', e.target.value)}
                    placeholder="tutorial-slug"
                    className="shadow-soft border-2 focus:border-primary"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Brief description of the tutorial"
                  rows={3}
                  className="shadow-soft border-2 focus:border-primary"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="excerpt">Excerpt</Label>
                <Textarea
                  id="excerpt"
                  value={formData.excerpt}
                  onChange={(e) => handleInputChange('excerpt', e.target.value)}
                  placeholder="Short excerpt for previews"
                  rows={2}
                  className="shadow-soft border-2 focus:border-primary"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <select
                    id="category"
                    value={formData.category}
                    onChange={(e) => handleInputChange('category', e.target.value)}
                    className="w-full p-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
                    required
                  >
                    <option value="">Select category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Target Role *</Label>
                  <select
                    id="role"
                    value={formData.role}
                    onChange={(e) => handleInputChange('role', e.target.value)}
                    className="w-full p-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
                    required
                  >
                    <option value="all">All Users</option>
                    <option value="clients">Clients</option>
                    <option value="providers">Providers</option>
                    <option value="agencies">Agencies</option>
                    <option value="partners">Partners</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty *</Label>
                  <select
                    id="difficulty"
                    value={formData.difficulty}
                    onChange={(e) => handleInputChange('difficulty', e.target.value)}
                    className="w-full p-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
                    required
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Intermediate">Intermediate</option>
                    <option value="Advanced">Advanced</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="duration">Duration (minutes) *</Label>
                  <Input
                    id="duration"
                    type="number"
                    min="1"
                    max="180"
                    value={formData.duration}
                    onChange={(e) => handleInputChange('duration', parseInt(e.target.value))}
                    className="shadow-soft border-2 focus:border-primary"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Status *</Label>
                  <div className="space-y-3">
                    <select
                      id="status"
                      value={formData.status}
                      onChange={(e) => handleInputChange('status', e.target.value)}
                      className="w-full p-2 border-2 rounded-md bg-background shadow-soft focus:border-primary"
                      required
                    >
                      <option value="draft">Draft</option>
                      <option value="published">Published</option>
                      <option value="archived">Archived</option>
                    </select>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm text-muted-foreground">Current status:</span>
                      <Badge 
                        variant="outline" 
                        className={`${
                          formData.status === 'published' 
                            ? 'bg-green-100 text-green-800 border-green-200' 
                            : formData.status === 'draft'
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-gray-100 text-gray-800 border-gray-200'
                        }`}
                      >
                        {formData.status === 'published' && <Eye className="h-3 w-3 mr-1" />}
                        {formData.status === 'draft' && <FileText className="h-3 w-3 mr-1" />}
                        {formData.status === 'archived' && <EyeOff className="h-3 w-3 mr-1" />}
                        {formData.status.charAt(0).toUpperCase() + formData.status.slice(1)}
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tutorial Content */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Tutorial Content</CardTitle>
                  <CardDescription>
                    Write the main content of your tutorial using Markdown
                  </CardDescription>
                </div>
                <div className="flex space-x-2">
                  <Button
                    type="button"
                    variant={!showPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPreview(false)}
                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    type="button"
                    variant={showPreview ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPreview(true)}
                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                  >
                    <Monitor className="h-4 w-4 mr-2" />
                    Preview
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Label htmlFor="content">Content *</Label>
                {!showPreview ? (
                  <div className="space-y-2">
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => handleInputChange('content', e.target.value)}
                      placeholder="Write your tutorial content here using Markdown..."
                      rows={20}
                      className="font-mono text-sm border-2 focus:border-primary"
                      required
                    />
                    <div className="text-xs text-muted-foreground">
                      <p className="font-medium mb-1">Markdown Tips:</p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Use # for headings (## for subheadings)</li>
                        <li>Use **text** for bold and *text* for italic</li>
                        <li>Use `code` for inline code and ``` for code blocks</li>
                        <li>Use - or * for bullet lists and 1. for numbered lists</li>
                        <li>Use [text](url) for links</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div className="border-2 border-gray-200 rounded-md p-4 min-h-[500px] bg-white">
                    <div className="mb-4 pb-2 border-b">
                      <h3 className="font-medium text-gray-700">Preview</h3>
                    </div>
                    <div 
                      className="prose prose-sm max-w-none"
                      dangerouslySetInnerHTML={{ 
                        __html: formData.content ? renderMarkdown(formData.content) : '<p class="text-gray-500 italic">No content to preview. Start writing in the editor!</p>' 
                      }}
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Video & Media */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Video & Media</CardTitle>
              <CardDescription>
                Add video content and media to your tutorial
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="videoUrl">Video URL</Label>
                <Input
                  id="videoUrl"
                  value={formData.videoUrl}
                  onChange={(e) => handleInputChange('videoUrl', e.target.value)}
                  placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
                  type="url"
                  className="shadow-soft border-2 focus:border-primary"
                />
                <p className="text-xs text-muted-foreground">
                  Supports YouTube, Vimeo, and other video platforms
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="featuredImage">Featured Image URL</Label>
                <Input
                  id="featuredImage"
                  value={formData.featuredImage}
                  onChange={(e) => handleInputChange('featuredImage', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                  type="url"
                  className="shadow-soft border-2 focus:border-primary"
                />
              </div>
            </CardContent>
          </Card>

          {/* Learning Objectives */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Learning Objectives</CardTitle>
              <CardDescription>
                Define what users will learn from this tutorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newObjective}
                    onChange={(e) => setNewObjective(e.target.value)}
                    placeholder="Add a learning objective"
                    className="shadow-soft border-2 focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddObjective())}
                  />
                  <Button type="button" onClick={handleAddObjective} variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.learningObjectives.map((objective, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                      <span className="text-sm font-medium text-primary">{index + 1}.</span>
                      <span className="flex-1 text-sm">{objective}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveObjective(objective)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Prerequisites */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Prerequisites</CardTitle>
              <CardDescription>
                List any prerequisites users should have before taking this tutorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newPrerequisite}
                    onChange={(e) => setNewPrerequisite(e.target.value)}
                    placeholder="Add a prerequisite"
                    className="shadow-soft border-2 focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddPrerequisite())}
                  />
                  <Button type="button" onClick={handleAddPrerequisite} variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="space-y-2">
                  {formData.prerequisites.map((prerequisite, index) => (
                    <div key={index} className="flex items-center space-x-2 p-2 bg-muted/50 rounded-md">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      <span className="flex-1 text-sm">{prerequisite}</span>
                      <button
                        type="button"
                        onClick={() => handleRemovePrerequisite(prerequisite)}
                        className="text-muted-foreground hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Tags */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Tags</CardTitle>
              <CardDescription>
                Add relevant tags to help users find your tutorial
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    className="shadow-soft border-2 focus:border-primary"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddTag())}
                  />
                  <Button type="button" onClick={handleAddTag} variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center space-x-1">
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => handleRemoveTag(tag)}
                        className="ml-1 hover:text-red-500"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* SEO & Settings */}
          <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
              <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">SEO & Settings</CardTitle>
              <CardDescription>
                Configure SEO settings and tutorial features
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  placeholder="SEO optimized title (max 60 characters)"
                  maxLength={60}
                  className="shadow-soft border-2 focus:border-primary"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  placeholder="SEO optimized description (max 160 characters)"
                  rows={3}
                  maxLength={160}
                  className="shadow-soft border-2 focus:border-primary"
                />
              </div>
              <div className="flex space-x-4">
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.featured}
                    onChange={(e) => handleInputChange('featured', e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-1">
                    <Star className="h-4 w-4" />
                    <span>Featured</span>
                  </div>
                </label>
                <label className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    checked={formData.popular}
                    onChange={(e) => handleInputChange('popular', e.target.checked)}
                    className="rounded"
                  />
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="h-4 w-4" />
                    <span>Popular</span>
                  </div>
                </label>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-muted-foreground">Quick Status:</span>
                <div className="flex space-x-1">
                  <Button
                    type="button"
                    variant={formData.status === 'draft' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('status', 'draft')}
                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                  >
                    <FileText className="h-3 w-3 mr-1" />
                    Draft
                  </Button>
                  <Button
                    type="button"
                    variant={formData.status === 'published' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => handleInputChange('status', 'published')}
                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                  >
                    <Eye className="h-3 w-3 mr-1" />
                    Publish
                  </Button>
                </div>
              </div>
            </div>
            <div className="flex space-x-4">
              <Button type="button" variant="outline" onClick={() => router.back()} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2">
                Cancel
              </Button>
              <Button type="submit" disabled={loading} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                {loading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    {formData.status === 'published' ? 'Create & Publish' : 'Create Tutorial'}
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewTutorialPage;
