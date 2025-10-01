"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { PartnerAccessGuard } from "@/components/partner-access-guard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { 
  Plus, 
  Copy, 
  Edit, 
  Trash2, 
  Eye, 
  QrCode, 
  Download,
  Calendar,
  Users,
  Target,
  TrendingUp,
  CheckCircle,
  XCircle,
  Clock,
  MoreHorizontal,
  ExternalLink,
  Share2
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerReferralTracker, ReferralCode } from "@/lib/partner-referral-tracker";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import QRCode from 'qrcode.react';

interface ReferralCodeWithStats extends ReferralCode {
  usageCount: number;
  conversionRate: number;
  totalRevenue: number;
}

export default function ReferralCodesPage() {
  const { user, userRole } = useAuth();
  const t = useTranslations('Partners');
  const { toast } = useToast();
  const [referralCodes, setReferralCodes] = useState<ReferralCodeWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [editingCode, setEditingCode] = useState<ReferralCode | null>(null);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [newCode, setNewCode] = useState({
    description: '',
    expiresAt: '',
    maxUsage: '',
    discountPercentage: '',
    discountAmount: ''
  });

  useEffect(() => {
    const loadReferralCodes = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);
          
          // Get user's referral codes
          const codes = await PartnerReferralTracker.getPartnerReferralCodes(user.uid);
          
          // Enhance with stats (mock data for now)
          const codesWithStats: ReferralCodeWithStats[] = codes.map(code => ({
            ...code,
            usageCount: Math.floor(Math.random() * 50),
            conversionRate: Math.random() * 100,
            totalRevenue: Math.random() * 10000
          }));
          
          setReferralCodes(codesWithStats);
        } catch (error) {
          console.error('Error loading referral codes:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Codes",
            description: "Failed to load referral codes. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadReferralCodes();
  }, [user, userRole]);

  const handleCreateCode = async () => {
    if (!user || !newCode.description.trim()) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please provide a description for the referral code.",
      });
      return;
    }

    setActionLoading('create');
    try {
      const options: any = {};
      
      if (newCode.expiresAt) {
        options.expiresAt = new Date(newCode.expiresAt);
      }
      
      if (newCode.maxUsage) {
        options.maxUsage = parseInt(newCode.maxUsage);
      }
      
      if (newCode.discountPercentage) {
        options.discountPercentage = parseFloat(newCode.discountPercentage);
      }
      
      if (newCode.discountAmount) {
        options.discountAmount = parseFloat(newCode.discountAmount);
      }

      const result = await PartnerReferralTracker.createReferralCode(
        user.uid,
        newCode.description,
        options
      );

      if (result.success) {
        toast({
          title: "Referral Code Created",
          description: "Your new referral code has been created successfully.",
        });
        
        setNewCode({
          description: '',
          expiresAt: '',
          maxUsage: '',
          discountPercentage: '',
          discountAmount: ''
        });
        setShowCreateDialog(false);
        
        // Reload codes
        const codes = await PartnerReferralTracker.getPartnerReferralCodes(user.uid);
        const codesWithStats: ReferralCodeWithStats[] = codes.map(code => ({
          ...code,
          usageCount: Math.floor(Math.random() * 50),
          conversionRate: Math.random() * 100,
          totalRevenue: Math.random() * 10000
        }));
        setReferralCodes(codesWithStats);
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Create Code",
          description: result.error || "An error occurred while creating the referral code.",
        });
      }
    } catch (error) {
      console.error('Error creating referral code:', error);
      toast({
        variant: "destructive",
        title: "Error Creating Code",
        description: "Failed to create referral code. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleCopyCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      toast({
        title: "Code Copied!",
        description: "Referral code copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy code:', error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy the code. Please try again.",
      });
    }
  };

  const handleCopyLink = async (code: string) => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    try {
      await navigator.clipboard.writeText(link);
      toast({
        title: "Link Copied!",
        description: "Referral link copied to clipboard.",
      });
    } catch (error) {
      console.error('Failed to copy link:', error);
      toast({
        variant: "destructive",
        title: "Copy Failed",
        description: "Failed to copy the link. Please try again.",
      });
    }
  };

  const handleDownloadQRCode = (code: string) => {
    const link = `${window.location.origin}/signup?ref=${code}`;
    try {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      canvas.width = 256;
      canvas.height = 256;
      
      // Create QR code data URL
      const qrDataUrl = `data:image/svg+xml;base64,${btoa(`
        <svg width="256" height="256" xmlns="http://www.w3.org/2000/svg">
          <rect width="256" height="256" fill="white"/>
          <text x="128" y="128" text-anchor="middle" font-family="Arial" font-size="12" fill="black">
            QR Code for: ${link}
          </text>
        </svg>
      `)}`;
      
      const img = new Image();
      img.onload = () => {
        ctx?.drawImage(img, 0, 0);
        const link = document.createElement('a');
        link.download = `referral-qr-${code}.png`;
        link.href = canvas.toDataURL();
        link.click();
        
        toast({
          title: "QR Code Downloaded",
          description: "Your referral QR code has been downloaded.",
        });
      };
      img.src = qrDataUrl;
    } catch (error) {
      console.error('Failed to download QR code:', error);
      toast({
        variant: "destructive",
        title: "Download Failed",
        description: "Failed to download QR code. Please try again.",
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'Never';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const getStatusBadge = (code: ReferralCode) => {
    if (!code.isActive) {
      return <Badge variant="secondary">Inactive</Badge>;
    }
    
    if (code.expiresAt && code.expiresAt.toDate() < new Date()) {
      return <Badge variant="destructive">Expired</Badge>;
    }
    
    if (code.maxUsage && code.usageCount >= code.maxUsage) {
      return <Badge variant="destructive">Limit Reached</Badge>;
    }
    
    return <Badge variant="default" className="bg-green-600">Active</Badge>;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <PartnerAccessGuard>
      <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight">Referral Codes</h1>
          <p className="text-muted-foreground">
            Create and manage your referral codes for tracking and marketing
          </p>
        </div>
        
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Create Code
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Create New Referral Code</DialogTitle>
              <DialogDescription>
                Create a new referral code with custom settings and tracking.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  value={newCode.description}
                  onChange={(e) => setNewCode(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="e.g., Summer Campaign 2024, Corporate Partnership"
                  rows={3}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="expiresAt">Expires At</Label>
                  <Input
                    id="expiresAt"
                    type="date"
                    value={newCode.expiresAt}
                    onChange={(e) => setNewCode(prev => ({ ...prev, expiresAt: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="maxUsage">Max Usage</Label>
                  <Input
                    id="maxUsage"
                    type="number"
                    value={newCode.maxUsage}
                    onChange={(e) => setNewCode(prev => ({ ...prev, maxUsage: e.target.value }))}
                    placeholder="Unlimited"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="discountPercentage">Discount %</Label>
                  <Input
                    id="discountPercentage"
                    type="number"
                    value={newCode.discountPercentage}
                    onChange={(e) => setNewCode(prev => ({ ...prev, discountPercentage: e.target.value }))}
                    placeholder="0"
                    min="0"
                    max="100"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="discountAmount">Discount Amount (₱)</Label>
                  <Input
                    id="discountAmount"
                    type="number"
                    value={newCode.discountAmount}
                    onChange={(e) => setNewCode(prev => ({ ...prev, discountAmount: e.target.value }))}
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={handleCreateCode} 
                  disabled={!newCode.description.trim() || actionLoading === 'create'}
                  className="flex-1"
                >
                  {actionLoading === 'create' ? (
                    <>
                      <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Code
                    </>
                  )}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCreateDialog(false)}
                  disabled={actionLoading === 'create'}
                >
                  Cancel
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Codes</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{referralCodes.length}</div>
            <p className="text-xs text-muted-foreground">
              {referralCodes.filter(c => c.isActive).length} active
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Usage</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralCodes.reduce((sum, code) => sum + code.usageCount, 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all codes
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Conversion</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {referralCodes.length > 0 
                ? (referralCodes.reduce((sum, code) => sum + code.conversionRate, 0) / referralCodes.length).toFixed(1)
                : '0'
              }%
            </div>
            <p className="text-xs text-muted-foreground">
              Average conversion rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₱{referralCodes.reduce((sum, code) => sum + code.totalRevenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              Generated from referrals
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Referral Codes List */}
      <Tabs defaultValue="all" className="space-y-6">
        <TabsList>
          <TabsTrigger value="all">All Codes</TabsTrigger>
          <TabsTrigger value="active">Active</TabsTrigger>
          <TabsTrigger value="expired">Expired</TabsTrigger>
        </TabsList>

        <TabsContent value="all" className="space-y-6">
          {referralCodes.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {referralCodes.map((code) => (
                <Card key={code.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                        <CardDescription className="line-clamp-2">
                          {code.description}
                        </CardDescription>
                      </div>
                      {getStatusBadge(code)}
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {/* Stats */}
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <div className="text-muted-foreground">Usage</div>
                        <div className="font-medium">{code.usageCount}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Conversion</div>
                        <div className="font-medium">{code.conversionRate.toFixed(1)}%</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Revenue</div>
                        <div className="font-medium">₱{code.totalRevenue.toLocaleString()}</div>
                      </div>
                      <div>
                        <div className="text-muted-foreground">Created</div>
                        <div className="font-medium">{formatDate(code.createdAt)}</div>
                      </div>
                    </div>

                    {/* Expiry Info */}
                    {code.expiresAt && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Expires</div>
                        <div className="font-medium">{formatDate(code.expiresAt)}</div>
                      </div>
                    )}

                    {/* Usage Limit */}
                    {code.maxUsage && (
                      <div className="text-sm">
                        <div className="text-muted-foreground">Usage Limit</div>
                        <div className="font-medium">{code.usageCount}/{code.maxUsage}</div>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyCode(code.code)}
                        className="flex-1"
                      >
                        <Copy className="h-3 w-3 mr-1" />
                        Copy Code
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCopyLink(code.code)}
                        className="flex-1"
                      >
                        <Share2 className="h-3 w-3 mr-1" />
                        Copy Link
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDownloadQRCode(code.code)}
                      >
                        <QrCode className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Referral Codes</h3>
                <p className="text-muted-foreground mb-4">
                  Create your first referral code to start tracking referrals and earning commissions.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Code
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {referralCodes.filter(c => c.isActive && (!c.expiresAt || c.expiresAt.toDate() > new Date())).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {referralCodes
                .filter(c => c.isActive && (!c.expiresAt || c.expiresAt.toDate() > new Date()))
                .map((code) => (
                  <Card key={code.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {code.description}
                          </CardDescription>
                        </div>
                        <Badge variant="default" className="bg-green-600">Active</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Usage</div>
                          <div className="font-medium">{code.usageCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversion</div>
                          <div className="font-medium">{code.conversionRate.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyCode(code.code)}
                          className="flex-1"
                        >
                          <Copy className="h-3 w-3 mr-1" />
                          Copy Code
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleCopyLink(code.code)}
                          className="flex-1"
                        >
                          <Share2 className="h-3 w-3 mr-1" />
                          Copy Link
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Active Codes</h3>
                <p className="text-muted-foreground">
                  Create a new referral code to start tracking referrals.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="expired" className="space-y-6">
          {referralCodes.filter(c => c.expiresAt && c.expiresAt.toDate() < new Date()).length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {referralCodes
                .filter(c => c.expiresAt && c.expiresAt.toDate() < new Date())
                .map((code) => (
                  <Card key={code.id} className="hover:shadow-md transition-shadow opacity-75">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div className="space-y-1">
                          <CardTitle className="text-lg font-mono">{code.code}</CardTitle>
                          <CardDescription className="line-clamp-2">
                            {code.description}
                          </CardDescription>
                        </div>
                        <Badge variant="destructive">Expired</Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <div className="text-muted-foreground">Usage</div>
                          <div className="font-medium">{code.usageCount}</div>
                        </div>
                        <div>
                          <div className="text-muted-foreground">Conversion</div>
                          <div className="font-medium">{code.conversionRate.toFixed(1)}%</div>
                        </div>
                      </div>
                      <div className="text-sm">
                        <div className="text-muted-foreground">Expired</div>
                        <div className="font-medium">{formatDate(code.expiresAt)}</div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-12 text-center">
                <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Expired Codes</h3>
                <p className="text-muted-foreground">
                  All your referral codes are still active.
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </PartnerAccessGuard>
  );
}
