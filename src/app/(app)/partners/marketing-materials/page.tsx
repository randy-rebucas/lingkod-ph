"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Download, 
  Eye, 
  Share2, 
  Copy, 
  ExternalLink,
  FileText,
  Image,
  Video,
  FileSpreadsheet,
  Presentation,
  Mail,
  MessageSquare,
  Calendar,
  Users,
  Target,
  TrendingUp,
  Award,
  Star,
  CheckCircle,
  Clock,
  AlertCircle
} from "lucide-react";
import { useEffect, useState } from "react";
import { Skeleton } from "@/components/ui/skeleton";

interface MarketingMaterial {
  id: string;
  title: string;
  description: string;
  type: 'email' | 'social' | 'print' | 'video' | 'presentation' | 'banner' | 'template';
  category: 'general' | 'campaign' | 'seasonal' | 'product' | 'partnership';
  format: 'pdf' | 'png' | 'jpg' | 'mp4' | 'pptx' | 'docx' | 'html';
  size: string;
  downloadUrl: string;
  previewUrl?: string;
  tags: string[];
  isCoBranded: boolean;
  isCustomizable: boolean;
  lastUpdated: string;
  downloadCount: number;
  isNew?: boolean;
  isFeatured?: boolean;
}

const mockMaterials: MarketingMaterial[] = [
  {
    id: '1',
    title: 'LocalPro Partnership Banner - Standard',
    description: 'High-quality banner for website headers and social media profiles',
    type: 'banner',
    category: 'partnership',
    format: 'png',
    size: '1200x600px',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['banner', 'partnership', 'header', 'social'],
    isCoBranded: true,
    isCustomizable: true,
    lastUpdated: '2024-01-15',
    downloadCount: 245,
    isFeatured: true
  },
  {
    id: '2',
    title: 'Email Template - Welcome Series',
    description: 'Professional email templates for welcoming new users',
    type: 'email',
    category: 'general',
    format: 'html',
    size: '600x800px',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['email', 'welcome', 'template', 'professional'],
    isCoBranded: false,
    isCustomizable: true,
    lastUpdated: '2024-01-10',
    downloadCount: 189,
    isNew: true
  },
  {
    id: '3',
    title: 'Social Media Post Templates',
    description: 'Ready-to-use social media post templates for various platforms',
    type: 'social',
    category: 'campaign',
    format: 'png',
    size: '1080x1080px',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['social', 'instagram', 'facebook', 'posts'],
    isCoBranded: true,
    isCustomizable: true,
    lastUpdated: '2024-01-12',
    downloadCount: 156
  },
  {
    id: '4',
    title: 'Partnership Presentation Deck',
    description: 'Comprehensive presentation about LocalPro partnership benefits',
    type: 'presentation',
    category: 'partnership',
    format: 'pptx',
    size: '16:9',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['presentation', 'partnership', 'benefits', 'business'],
    isCoBranded: true,
    isCustomizable: true,
    lastUpdated: '2024-01-08',
    downloadCount: 98
  },
  {
    id: '5',
    title: 'Print Flyer - Service Overview',
    description: 'Professional flyer for offline marketing and events',
    type: 'print',
    category: 'general',
    format: 'pdf',
    size: 'A4',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['print', 'flyer', 'offline', 'events'],
    isCoBranded: false,
    isCustomizable: true,
    lastUpdated: '2024-01-05',
    downloadCount: 134
  },
  {
    id: '6',
    title: 'Video - Platform Introduction',
    description: 'Short video introducing LocalPro platform and services',
    type: 'video',
    category: 'product',
    format: 'mp4',
    size: '1920x1080px',
    downloadUrl: '#',
    previewUrl: '#',
    tags: ['video', 'introduction', 'platform', 'services'],
    isCoBranded: true,
    isCustomizable: false,
    lastUpdated: '2024-01-03',
    downloadCount: 67
  }
];

export default function MarketingMaterialsPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [materials, setMaterials] = useState<MarketingMaterial[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadMaterials = async () => {
      if (user && userRole === 'partner') {
        try {
          setLoading(true);
          // Simulate API call
          await new Promise(resolve => setTimeout(resolve, 1000));
          setMaterials(mockMaterials);
        } catch (error) {
          console.error('Error loading materials:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Materials",
            description: "Failed to load marketing materials. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadMaterials();
  }, [user, userRole]);

  const handleDownload = (material: MarketingMaterial) => {
    // Simulate download
    toast({
      title: "Download Started",
      description: `Downloading ${material.title}...`,
    });
    
    // In a real app, this would trigger the actual download
    console.log('Downloading:', material);
  };

  const handlePreview = (material: MarketingMaterial) => {
    // Simulate preview
    toast({
      title: "Opening Preview",
      description: `Previewing ${material.title}...`,
    });
    
    // In a real app, this would open a preview modal or new tab
    console.log('Previewing:', material);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'email': return <Mail className="h-4 w-4" />;
      case 'social': return <Share2 className="h-4 w-4" />;
      case 'print': return <FileText className="h-4 w-4" />;
      case 'video': return <Video className="h-4 w-4" />;
      case 'presentation': return <Presentation className="h-4 w-4" />;
      case 'banner': return <Image className="h-4 w-4" />;
      case 'template': return <FileSpreadsheet className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  const getTypeColor = (type: string) => {
    switch (type) {
      case 'email': return 'bg-blue-100 text-blue-800';
      case 'social': return 'bg-purple-100 text-purple-800';
      case 'print': return 'bg-gray-100 text-gray-800';
      case 'video': return 'bg-red-100 text-red-800';
      case 'presentation': return 'bg-orange-100 text-orange-800';
      case 'banner': return 'bg-green-100 text-green-800';
      case 'template': return 'bg-indigo-100 text-indigo-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const filteredMaterials = materials.filter(material => {
    const matchesCategory = selectedCategory === 'all' || material.category === selectedCategory;
    const matchesSearch = searchTerm === '' || 
      material.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      material.tags.some(tag => tag.toLowerCase().includes(searchTerm.toLowerCase()));
    
    return matchesCategory && matchesSearch;
  });


  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-64" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Marketing Materials</h1>
        <p className="text-muted-foreground">
          Download professional marketing materials to promote LocalPro and grow your partnership
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Materials</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{materials.length}</div>
            <p className="text-xs text-muted-foreground">
              Available for download
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Co-Branded</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.isCoBranded).length}
            </div>
            <p className="text-xs text-muted-foreground">
              With your branding
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Customizable</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.filter(m => m.isCustomizable).length}
            </div>
            <p className="text-xs text-muted-foreground">
              Editable templates
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {materials.reduce((sum, m) => sum + m.downloadCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all materials
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Featured Materials */}
      {materials.filter(m => m.isFeatured).length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="h-5 w-5 text-yellow-500" />
              Featured Materials
            </CardTitle>
            <CardDescription>
              Our most popular and effective marketing materials
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {materials
                .filter(m => m.isFeatured)
                .map((material) => (
                  <div key={material.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <Badge className={getTypeColor(material.type)}>
                          {material.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                    
                    <h3 className="font-semibold mb-2 line-clamp-2">{material.title}</h3>
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {material.description}
                    </p>
                    
                    <div className="flex items-center justify-between text-xs text-muted-foreground mb-3">
                      <span>{material.size}</span>
                      <span>{material.downloadCount} downloads</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Materials Library */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList>
            <TabsTrigger value="all">All Materials</TabsTrigger>
            <TabsTrigger value="general">General</TabsTrigger>
            <TabsTrigger value="campaign">Campaigns</TabsTrigger>
            <TabsTrigger value="partnership">Partnership</TabsTrigger>
            <TabsTrigger value="seasonal">Seasonal</TabsTrigger>
          </TabsList>
          
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Search materials..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-3 py-2 border rounded-md text-sm"
            />
          </div>
        </div>

        <TabsContent value="all" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials.map((material) => (
              <Card key={material.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(material.type)}
                      <Badge className={getTypeColor(material.type)}>
                        {material.type}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-1">
                      {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                      {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                    </div>
                  </div>
                  <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                  <CardDescription className="line-clamp-2">
                    {material.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Tags */}
                  <div className="flex flex-wrap gap-1">
                    {material.tags.slice(0, 3).map((tag) => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {material.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{material.tags.length - 3}
                      </Badge>
                    )}
                  </div>

                  {/* Features */}
                  <div className="flex items-center gap-4 text-sm">
                    {material.isCoBranded && (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle className="h-3 w-3" />
                        <span>Co-Branded</span>
                      </div>
                    )}
                    {material.isCustomizable && (
                      <div className="flex items-center gap-1 text-blue-600">
                        <Target className="h-3 w-3" />
                        <span>Customizable</span>
                      </div>
                    )}
                  </div>

                  {/* Stats */}
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{material.size}</span>
                    <span>{material.downloadCount} downloads</span>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => handleDownload(material)}
                      className="flex-1"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handlePreview(material)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(material.downloadUrl);
                        toast({
                          title: "Link Copied",
                          description: "Material link copied to clipboard.",
                        });
                      }}
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="general" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials
              .filter(m => m.category === 'general')
              .map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <Badge className={getTypeColor(material.type)}>
                          {material.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{material.size}</span>
                      <span>{material.downloadCount} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="campaign" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials
              .filter(m => m.category === 'campaign')
              .map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <Badge className={getTypeColor(material.type)}>
                          {material.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{material.size}</span>
                      <span>{material.downloadCount} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="partnership" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials
              .filter(m => m.category === 'partnership')
              .map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <Badge className={getTypeColor(material.type)}>
                          {material.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{material.size}</span>
                      <span>{material.downloadCount} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>

        <TabsContent value="seasonal" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredMaterials
              .filter(m => m.category === 'seasonal')
              .map((material) => (
                <Card key={material.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {getTypeIcon(material.type)}
                        <Badge className={getTypeColor(material.type)}>
                          {material.type}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-1">
                        {material.isNew && <Badge variant="secondary" className="text-xs">New</Badge>}
                        {material.isFeatured && <Star className="h-3 w-3 text-yellow-500" />}
                      </div>
                    </div>
                    <CardTitle className="text-lg line-clamp-2">{material.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {material.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex flex-wrap gap-1">
                      {material.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>{material.size}</span>
                      <span>{material.downloadCount} downloads</span>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleDownload(material)}
                        className="flex-1"
                      >
                        <Download className="h-3 w-3 mr-1" />
                        Download
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handlePreview(material)}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Help Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Need Help?
          </CardTitle>
          <CardDescription>
            Get support with marketing materials and customization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="font-medium">Custom Materials</h4>
              <p className="text-sm text-muted-foreground">
                Need custom marketing materials with your branding? Contact our design team.
              </p>
              <Button variant="outline" size="sm">
                Request Custom Design
              </Button>
            </div>
            <div className="space-y-2">
              <h4 className="font-medium">Usage Guidelines</h4>
              <p className="text-sm text-muted-foreground">
                Learn about proper usage guidelines and brand compliance.
              </p>
              <Button variant="outline" size="sm">
                View Guidelines
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      </div>
    </PartnerAccessGuard>
  );
}
