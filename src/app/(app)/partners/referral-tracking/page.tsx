"use client";

import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter,
  Mail,
  TrendingUp,
  Target,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Copy,
  Share2,
  QrCode,
  Download,
  FileSpreadsheet,
  BarChart3,
  MoreHorizontal,
  ChevronDown,
  Activity
} from "lucide-react";
import { useEffect, useState } from "react";
import { PartnerAnalyticsService, ReferralData } from "@/lib/partner-analytics";
import { Skeleton } from "@/components/ui/skeleton";
import { getDb } from '@/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { useToast } from "@/hooks/use-toast";
import QRCode from 'qrcode.react';

interface ReferralStats {
  totalReferrals: number;
  activeReferrals: number;
  completedReferrals: number;
  pendingReferrals: number;
  conversionRate: number;
  totalRevenue: number;
  totalCommission: number;
}

export default function ReferralTrackingPage() {
  const { user, userRole } = useAuth();
  const _t = useTranslations('PartnersDashboard');
  const { toast } = useToast();
  const [referrals, setReferrals] = useState<ReferralData[]>([]);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, _setFilter] = useState<'all' | 'pending' | 'active' | 'completed' | 'cancelled'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddReferral, setShowAddReferral] = useState(false);
  const [referralCode, setReferralCode] = useState<string>('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showQRCode, setShowQRCode] = useState(false);
  const [selectedReferrals, setSelectedReferrals] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<'date' | 'name' | 'revenue' | 'status'>('date');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
  const [dateRange, setDateRange] = useState<{from: string; to: string}>({from: '', to: ''});
  const [revenueRange, setRevenueRange] = useState<{min: string; max: string}>({min: '', max: ''});
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [newReferral, setNewReferral] = useState({
    name: '',
    email: '',
    role: 'provider' as 'provider' | 'client' | 'agency',
    notes: ''
  });

  useEffect(() => {
    const loadReferralData = async () => {
      if (user && userRole === 'partner' && getDb()) {
        try {
          setLoading(true);

           // Fetch user's referral code
           const userDocRef = doc(getDb(), 'users', user.uid);
           const userDoc = await getDoc(userDocRef);
           if (userDoc.exists()) {
             const userData = userDoc.data();
             let code = userData.referralCode;
             
             // Generate referral code if it doesn't exist
             if (!code) {
               code = `REF${user.uid.slice(-8).toUpperCase()}`;
               // Note: In a real app, you'd want to update the user document with this code
               console.log('Generated referral code:', code);
             }
             
             setReferralCode(code);
           }

          // Load all referrals
          const allReferrals = await PartnerAnalyticsService.getPartnerReferrals(user.uid, 100);
          setReferrals(allReferrals);

          // Calculate stats
          const totalReferrals = allReferrals.length;
          const activeReferrals = allReferrals.filter(r => r.status === 'active').length;
          const completedReferrals = allReferrals.filter(r => r.status === 'completed').length;
          const pendingReferrals = allReferrals.filter(r => r.status === 'pending').length;
          const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
          const totalRevenue = allReferrals.reduce((sum, r) => sum + r.totalRevenue, 0);
          const totalCommission = allReferrals.reduce((sum, r) => sum + r.commissionEarned, 0);

          setStats({
            totalReferrals,
            activeReferrals,
            completedReferrals,
            pendingReferrals,
            conversionRate,
            totalRevenue,
            totalCommission
          });

        } catch (error) {
          console.error('Error loading referral data:', error);
          toast({
            variant: "destructive",
            title: "Error Loading Data",
            description: "Failed to load referral data. Please try again.",
          });
        } finally {
          setLoading(false);
        }
      }
    };

    loadReferralData();
  }, [user, userRole]);

  const handleAddReferral = async () => {
    if (!user || !newReferral.name || !newReferral.email) {
      toast({
        variant: "destructive",
        title: "Missing Information",
        description: "Please fill in all required fields.",
      });
      return;
    }

    setActionLoading('add-referral');
    try {
      const result = await PartnerAnalyticsService.createReferral(
        user.uid,
        'temp-user-id', // This would need to be handled differently in a real app
        {
          name: newReferral.name,
          email: newReferral.email,
          role: newReferral.role
        }
      );

      if (result.success) {
        // Refresh data
        const allReferrals = await PartnerAnalyticsService.getPartnerReferrals(user.uid, 100);
        setReferrals(allReferrals);
        setShowAddReferral(false);
        setNewReferral({ name: '', email: '', role: 'provider', notes: '' });
        toast({
          title: "Referral Added",
          description: "The referral has been successfully added to your tracking system.",
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Add Referral",
          description: result.error || "An error occurred while adding the referral.",
        });
      }
    } catch (error) {
      console.error('Error adding referral:', error);
      toast({
        variant: "destructive",
        title: "Error Adding Referral",
        description: "Failed to add referral. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  const handleStatusUpdate = async (referralId: string, newStatus: 'pending' | 'active' | 'completed' | 'cancelled') => {
    setActionLoading(referralId);
    try {
      const result = await PartnerAnalyticsService.updateReferralStatus(referralId, newStatus);
      if (result.success) {
        // Refresh data
        const allReferrals = await PartnerAnalyticsService.getPartnerReferrals(user!.uid, 100);
        setReferrals(allReferrals);
        toast({
          title: "Status Updated",
          description: `Referral status has been updated to ${newStatus}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Failed to Update Status",
          description: result.error || "An error occurred while updating the status.",
        });
      }
    } catch (error) {
      console.error('Error updating referral status:', error);
      toast({
        variant: "destructive",
        title: "Error Updating Status",
        description: "Failed to update referral status. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (userRole !== 'partner') {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-muted-foreground">You don't have permission to access referral tracking.</p>
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP'
    }).format(amount);
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return 'N/A';
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'completed': return <CheckCircle className="h-4 w-4" />;
      case 'pending': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const filteredReferrals = referrals
    .filter(referral => {
      const matchesFilter = filter === 'all' || referral.status === filter;
      const matchesSearch = searchTerm === '' || 
        referral.referredUserName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        referral.referredUserEmail.toLowerCase().includes(searchTerm.toLowerCase());
      
      // Advanced filters
      const matchesDateRange = !dateRange.from || !dateRange.to || 
        (referral.referralDate && 
         referral.referralDate.toDate && 
         referral.referralDate.toDate() >= new Date(dateRange.from) &&
         referral.referralDate.toDate() <= new Date(dateRange.to));
      
      const matchesRevenueRange = !revenueRange.min || !revenueRange.max ||
        (referral.totalRevenue >= parseFloat(revenueRange.min) &&
         referral.totalRevenue <= parseFloat(revenueRange.max));
      
      const matchesStatusFilter = statusFilter === 'all' || referral.status === statusFilter;
      
      return matchesFilter && matchesSearch && matchesDateRange && matchesRevenueRange && matchesStatusFilter;
    })
    .sort((a, b) => {
      let comparison = 0;
      
      switch (sortBy) {
        case 'date':
          const dateA = a.referralDate?.toDate ? a.referralDate.toDate() : new Date(0);
          const dateB = b.referralDate?.toDate ? b.referralDate.toDate() : new Date(0);
          comparison = dateA.getTime() - dateB.getTime();
          break;
        case 'name':
          comparison = a.referredUserName.localeCompare(b.referredUserName);
          break;
        case 'revenue':
          comparison = a.totalRevenue - b.totalRevenue;
          break;
        case 'status':
          comparison = a.status.localeCompare(b.status);
          break;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

  const referralLink = referralCode ? `https://lingkod-ph.com/signup?ref=${referralCode}` : '';

   const handleCopyReferralLink = async () => {
     if (!referralLink) {
       toast({
         variant: "destructive",
         title: "No Referral Link",
         description: "Referral link is not available. Please try again later.",
       });
       return;
     }

     try {
       await navigator.clipboard.writeText(referralLink);
       toast({
         title: "Link Copied!",
         description: "Your referral link has been copied to clipboard.",
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

   const handleDownloadQRCode = () => {
     if (!referralLink) {
       toast({
         variant: "destructive",
         title: "No Referral Link",
         description: "Referral link is not available. Please try again later.",
       });
       return;
     }

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
             QR Code for: ${referralLink}
           </text>
         </svg>
       `)}`;
       
       const img = new Image();
       img.onload = () => {
         ctx?.drawImage(img, 0, 0);
         const link = document.createElement('a');
         link.download = `referral-qr-${referralCode || 'code'}.png`;
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

   const handleShareReferralLink = async () => {
     if (!referralLink) {
       toast({
         variant: "destructive",
         title: "No Referral Link",
         description: "Referral link is not available. Please try again later.",
       });
       return;
     }

     const shareData = {
       title: 'Join LocalPro - Professional Services Platform',
       text: 'Join me on LocalPro, the best platform for professional services! Use my referral link to get started.',
       url: referralLink,
     };

     try {
       if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
         await navigator.share(shareData);
         toast({
           title: "Shared Successfully",
           description: "Your referral link has been shared.",
         });
       } else {
         // Fallback to copying to clipboard
         await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
         toast({
           title: "Link Copied!",
           description: "Your referral message has been copied to clipboard.",
         });
       }
     } catch (error) {
       console.error('Failed to share:', error);
       // Fallback to copying to clipboard
       try {
         await navigator.clipboard.writeText(`${shareData.text}\n\n${shareData.url}`);
         toast({
           title: "Link Copied!",
           description: "Your referral message has been copied to clipboard.",
         });
       } catch {
         toast({
           variant: "destructive",
           title: "Share Failed",
           description: "Failed to share the referral link. Please try copying manually.",
         });
       }
     }
   };

  const handleExportReferrals = (format: 'csv' | 'excel') => {
    if (filteredReferrals.length === 0) {
      toast({
        variant: "destructive",
        title: "No Data to Export",
        description: "There are no referrals to export.",
      });
      return;
    }

    try {
      const headers = [
        'Name',
        'Email',
        'Role',
        'Status',
        'Referral Date',
        'Last Activity',
        'Total Jobs',
        'Completed Jobs',
        'Total Revenue',
        'Commission Earned'
      ];

      const csvData = [
        headers.join(','),
        ...filteredReferrals.map(referral => [
          `"${referral.referredUserName}"`,
          `"${referral.referredUserEmail}"`,
          `"${referral.referredUserRole}"`,
          `"${referral.status}"`,
          `"${formatDate(referral.referralDate)}"`,
          `"${formatDate(referral.lastActivity)}"`,
          referral.totalJobs,
          referral.completedJobs,
          referral.totalRevenue,
          referral.commissionEarned
        ].join(','))
      ].join('\n');

      const blob = new Blob([csvData], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `referrals-${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast({
        title: "Export Successful",
        description: `Referrals exported as ${format.toUpperCase()} successfully.`,
      });
    } catch (error) {
      console.error('Export failed:', error);
      toast({
        variant: "destructive",
        title: "Export Failed",
        description: "Failed to export referrals. Please try again.",
      });
    }
  };

  const handleBulkStatusUpdate = async (newStatus: 'pending' | 'active' | 'completed' | 'cancelled') => {
    if (selectedReferrals.length === 0) {
      toast({
        variant: "destructive",
        title: "No Referrals Selected",
        description: "Please select referrals to update.",
      });
      return;
    }

    setActionLoading('bulk-update');
    try {
      const promises = selectedReferrals.map(id => 
        PartnerAnalyticsService.updateReferralStatus(id, newStatus)
      );
      
      const results = await Promise.all(promises);
      const successCount = results.filter(r => r.success).length;
      
      if (successCount > 0) {
        // Refresh data
        const allReferrals = await PartnerAnalyticsService.getPartnerReferrals(user!.uid, 100);
        setReferrals(allReferrals);
        setSelectedReferrals([]);
        
        toast({
          title: "Bulk Update Successful",
          description: `Updated ${successCount} of ${selectedReferrals.length} referrals to ${newStatus}.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Bulk Update Failed",
          description: "Failed to update any referrals. Please try again.",
        });
      }
    } catch (error) {
      console.error('Bulk update failed:', error);
      toast({
        variant: "destructive",
        title: "Bulk Update Failed",
        description: "Failed to update referrals. Please try again.",
      });
    } finally {
      setActionLoading(null);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6 space-y-6">
        <div className="space-y-2">
          <Skeleton className="h-8 w-64" />
          <Skeleton className="h-4 w-96" />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">Referral Tracking</h1>
        <p className="text-muted-foreground">
          Track and manage your referral network and performance
        </p>
      </div>

      {/* Summary Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Referrals</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.pendingReferrals} pending
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Referrals</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{stats.activeReferrals}</div>
              <p className="text-xs text-muted-foreground">
                {stats.conversionRate.toFixed(1)}% conversion rate
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed</CardTitle>
              <CheckCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.completedReferrals}</div>
              <p className="text-xs text-muted-foreground">
                Successful referrals
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <p className="text-xs text-muted-foreground">
                {formatCurrency(stats.totalCommission)} commission earned
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Analytics Chart */}
      {stats && stats.totalReferrals > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Referral Analytics
            </CardTitle>
            <CardDescription>
              Visual breakdown of your referral performance
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {/* Status Distribution */}
              <div>
                <h4 className="text-sm font-medium mb-3">Status Distribution</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                      <span className="text-sm">Pending</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.pendingReferrals}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-yellow-500 h-2 rounded-full" 
                          style={{ width: `${(stats.pendingReferrals / stats.totalReferrals) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-sm">Active</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.activeReferrals}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${(stats.activeReferrals / stats.totalReferrals) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{stats.completedReferrals}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${(stats.completedReferrals / stats.totalReferrals) * 100}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

               {/* Performance Metrics */}
               <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div>
                   <h4 className="text-sm font-medium mb-3">Conversion Rate</h4>
                   <div className="text-3xl font-bold text-green-600">
                     {stats.conversionRate.toFixed(1)}%
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Active referrals / Total referrals
                   </p>
                   <div className="mt-2">
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-green-500 h-2 rounded-full transition-all duration-300" 
                         style={{ width: `${Math.min(100, stats.conversionRate)}%` }}
                       ></div>
                     </div>
                   </div>
                 </div>
                 <div>
                   <h4 className="text-sm font-medium mb-3">Average Revenue per Referral</h4>
                   <div className="text-3xl font-bold text-blue-600">
                     {formatCurrency(stats.totalReferrals > 0 ? stats.totalRevenue / stats.totalReferrals : 0)}
                   </div>
                   <p className="text-xs text-muted-foreground">
                     Total revenue / Total referrals
                   </p>
                   <div className="mt-2">
                     <div className="w-full bg-gray-200 rounded-full h-2">
                       <div 
                         className="bg-blue-500 h-2 rounded-full transition-all duration-300" 
                         style={{ width: `${Math.min(100, (stats.totalReferrals > 0 ? (stats.totalRevenue / stats.totalReferrals) / 1000 : 0) * 100)}%` }}
                       ></div>
                     </div>
                   </div>
                 </div>
               </div>
            </div>
          </CardContent>
        </Card>
       )}

       {/* Recent Activity */}
       {referrals.length > 0 && (
         <Card>
           <CardHeader>
             <CardTitle className="flex items-center gap-2">
               <Activity className="h-5 w-5" />
               Recent Referral Activity
             </CardTitle>
             <CardDescription>
               Latest referral activities and updates
             </CardDescription>
           </CardHeader>
           <CardContent>
             <div className="space-y-3">
               {referrals.slice(0, 5).map((referral) => (
                 <div key={referral.id} className="flex items-center justify-between p-3 border rounded-lg">
                   <div className="flex items-center gap-3">
                     <div className={`w-2 h-2 rounded-full ${
                       referral.status === 'active' ? 'bg-green-500' :
                       referral.status === 'completed' ? 'bg-blue-500' :
                       referral.status === 'pending' ? 'bg-yellow-500' : 'bg-red-500'
                     }`}></div>
                     <div>
                       <div className="font-medium text-sm">{referral.referredUserName}</div>
                       <div className="text-xs text-muted-foreground">
                         {referral.referredUserRole} • {formatDate(referral.referralDate)}
                       </div>
                     </div>
                   </div>
                   <div className="text-right">
                     <Badge className={getStatusColor(referral.status)}>
                       {referral.status}
                     </Badge>
                     <div className="text-xs text-muted-foreground mt-1">
                       {formatCurrency(referral.totalRevenue)} revenue
                     </div>
                   </div>
                 </div>
               ))}
             </div>
           </CardContent>
         </Card>
       )}

       {/* Referral Link Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Share2 className="h-5 w-5" />
            Your Referral Link
          </CardTitle>
          <CardDescription>
            Share this link to refer new users to the platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Input
                value={referralLink}
                readOnly
                className="w-full"
                placeholder="Loading referral link..."
                aria-label="Your referral link"
              />
              <div className="flex flex-wrap items-center gap-2">
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleCopyReferralLink}
                   disabled={!referralLink}
                   className="flex-1 sm:flex-none"
                   aria-label="Copy referral link to clipboard"
                 >
                   <Copy className="h-4 w-4 mr-2" />
                   Copy
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={handleShareReferralLink}
                   disabled={!referralLink}
                   className="flex-1 sm:flex-none"
                   aria-label="Share referral link"
                 >
                   <Share2 className="h-4 w-4 mr-2" />
                   Share
                 </Button>
                 <Button
                   variant="outline"
                   size="sm"
                   onClick={() => setShowQRCode(!showQRCode)}
                   disabled={!referralLink}
                   className="flex-1 sm:flex-none"
                   aria-label={showQRCode ? "Hide QR code" : "Show QR code"}
                 >
                   <QrCode className="h-4 w-4 mr-2" />
                   QR Code
                 </Button>
                 {showQRCode && (
                   <Button
                     variant="outline"
                     size="sm"
                     onClick={handleDownloadQRCode}
                     disabled={!referralLink}
                     className="flex-1 sm:flex-none"
                     aria-label="Download QR code"
                   >
                     <Download className="h-4 w-4 mr-2" />
                     Download QR
                   </Button>
                 )}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowAddReferral(true)}
                  className="flex-1 sm:flex-none"
                  aria-label="Add new referral manually"
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Add Referral
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1 sm:flex-none"
                      aria-label="Export referrals"
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => handleExportReferrals('csv')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as CSV
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExportReferrals('excel')}>
                      <FileSpreadsheet className="h-4 w-4 mr-2" />
                      Export as Excel
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
            
             {showQRCode && referralLink && (
               <div className="flex justify-center p-4 bg-muted/50 rounded-lg">
                 <div className="text-center space-y-2">
                   <div className="w-32 h-32 bg-white border-2 border-gray-300 rounded-lg flex items-center justify-center p-2">
                     <QRCode
                       value={referralLink}
                       size={120}
                       level="M"
                       includeMargin={false}
                       renderAs="svg"
                     />
                   </div>
                   <p className="text-sm text-muted-foreground">
                     QR Code for your referral link
                   </p>
                   <p className="text-xs text-muted-foreground break-all">
                     {referralLink}
                   </p>
                 </div>
               </div>
             )}
          </div>
        </CardContent>
      </Card>

      {/* Add Referral Modal */}
      {showAddReferral && (
        <Card>
          <CardHeader>
            <CardTitle>Add New Referral</CardTitle>
            <CardDescription>
              Manually add a referral to your tracking system
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={newReferral.name}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, name: e.target.value }))}
                  placeholder="Enter full name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={newReferral.email}
                  onChange={(e) => setNewReferral(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Enter email address"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <select
                id="role"
                value={newReferral.role}
                onChange={(e) => setNewReferral(prev => ({ ...prev, role: e.target.value as any }))}
                className="w-full p-2 border rounded-md"
              >
                <option value="provider">Service Provider</option>
                <option value="client">Client</option>
                <option value="agency">Agency</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={newReferral.notes}
                onChange={(e) => setNewReferral(prev => ({ ...prev, notes: e.target.value }))}
                placeholder="Additional notes about this referral"
                rows={3}
              />
            </div>
            <div className="flex gap-2">
              <Button 
                onClick={handleAddReferral} 
                disabled={!newReferral.name || !newReferral.email || actionLoading === 'add-referral'}
              >
                {actionLoading === 'add-referral' ? (
                  <>
                    <div className="h-4 w-4 mr-2 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    Adding...
                  </>
                ) : (
                  <>
                    <UserPlus className="h-4 w-4 mr-2" />
                    Add Referral
                  </>
                )}
              </Button>
              <Button 
                variant="outline" 
                onClick={() => setShowAddReferral(false)}
                disabled={actionLoading === 'add-referral'}
              >
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Referral Management Tabs */}
      <Tabs defaultValue="all" className="space-y-6">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="all">All Referrals</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="active">Active</TabsTrigger>
              <TabsTrigger value="completed">Completed</TabsTrigger>
              <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
            </TabsList>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search referrals..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8 w-64"
                />
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filters
              </Button>
            </div>
          </div>

          {/* Advanced Filters */}
          {showAdvancedFilters && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Advanced Filters</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <Label>Sort By</Label>
                    <Select value={sortBy} onValueChange={(value: any) => setSortBy(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="date">Date</SelectItem>
                        <SelectItem value="name">Name</SelectItem>
                        <SelectItem value="revenue">Revenue</SelectItem>
                        <SelectItem value="status">Status</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Sort Order</Label>
                    <Select value={sortOrder} onValueChange={(value: any) => setSortOrder(value)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="desc">Descending</SelectItem>
                        <SelectItem value="asc">Ascending</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Date From</Label>
                    <Input
                      type="date"
                      value={dateRange.from}
                      onChange={(e) => setDateRange(prev => ({ ...prev, from: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Date To</Label>
                    <Input
                      type="date"
                      value={dateRange.to}
                      onChange={(e) => setDateRange(prev => ({ ...prev, to: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                  <div className="space-y-2">
                    <Label>Min Revenue (₱)</Label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={revenueRange.min}
                      onChange={(e) => setRevenueRange(prev => ({ ...prev, min: e.target.value }))}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Max Revenue (₱)</Label>
                    <Input
                      type="number"
                      placeholder="10000"
                      value={revenueRange.max}
                      onChange={(e) => setRevenueRange(prev => ({ ...prev, max: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setDateRange({ from: '', to: '' });
                      setRevenueRange({ min: '', max: '' });
                      setStatusFilter('all');
                      setSortBy('date');
                      setSortOrder('desc');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Bulk Actions */}
          {selectedReferrals.length > 0 && (
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium">
                      {selectedReferrals.length} referral{selectedReferrals.length > 1 ? 's' : ''} selected
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={actionLoading === 'bulk-update'}
                        >
                          {actionLoading === 'bulk-update' ? (
                            <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent mr-2" />
                          ) : (
                            <MoreHorizontal className="h-4 w-4 mr-2" />
                          )}
                          Bulk Actions
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('active')}>
                          Mark as Active
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('completed')}>
                          Mark as Completed
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleBulkStatusUpdate('cancelled')}>
                          Mark as Cancelled
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setSelectedReferrals([])}
                    >
                      Clear Selection
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* All Referrals Tab */}
        <TabsContent value="all" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    All Referrals ({filteredReferrals.length})
                  </CardTitle>
                  <CardDescription>
                    Complete list of your referrals and their status
                  </CardDescription>
                </div>
                {filteredReferrals.length > 0 && (
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedReferrals.length === filteredReferrals.length}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedReferrals(filteredReferrals.map(r => r.id));
                        } else {
                          setSelectedReferrals([]);
                        }
                      }}
                      aria-label="Select all referrals"
                    />
                    <span className="text-sm text-muted-foreground">Select All</span>
                  </div>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {filteredReferrals.length > 0 ? (
                <div className="space-y-4">
                  {filteredReferrals.map((referral) => (
                    <div key={referral.id} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors gap-4">
                      <div className="flex items-start gap-3 flex-1">
                        <Checkbox
                          checked={selectedReferrals.includes(referral.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedReferrals(prev => [...prev, referral.id]);
                            } else {
                              setSelectedReferrals(prev => prev.filter(id => id !== referral.id));
                            }
                          }}
                          aria-label={`Select ${referral.referredUserName}`}
                        />
                        <div className="space-y-1 flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                            <span className="font-medium">{referral.referredUserName}</span>
                            <Badge className={getStatusColor(referral.status)}>
                              {getStatusIcon(referral.status)}
                              <span className="ml-1">{referral.status}</span>
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Mail className="h-3 w-3 inline mr-1" />
                            {referral.referredUserEmail}
                          </div>
                          <div className="text-sm text-muted-foreground">
                            <Users className="h-3 w-3 inline mr-1" />
                            {referral.referredUserRole} • Referred: {formatDate(referral.referralDate)}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last activity: {formatDate(referral.lastActivity)}
                          </div>
                        </div>
                      </div>
                      <div className="flex flex-col sm:text-right space-y-1">
                        <div className="font-medium">
                          {referral.completedJobs}/{referral.totalJobs} jobs
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatCurrency(referral.totalRevenue)} revenue
                        </div>
                        <div className="text-sm font-medium text-green-600">
                          {formatCurrency(referral.commissionEarned)} commission
                        </div>
                        <div className="flex gap-1 mt-2">
                          {referral.status === 'pending' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(referral.id, 'active')}
                              disabled={actionLoading === referral.id}
                              className="w-full sm:w-auto"
                            >
                              {actionLoading === referral.id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                'Activate'
                              )}
                            </Button>
                          )}
                          {referral.status === 'active' && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleStatusUpdate(referral.id, 'completed')}
                              disabled={actionLoading === referral.id}
                              className="w-full sm:w-auto"
                            >
                              {actionLoading === referral.id ? (
                                <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                              ) : (
                                'Complete'
                              )}
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No referrals found</p>
                  <p className="text-sm text-muted-foreground">
                    Start referring users to see them appear here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pending Tab */}
        <TabsContent value="pending" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Pending Referrals
              </CardTitle>
              <CardDescription>
                Referrals awaiting activation or first activity
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.filter(r => r.status === 'pending').length > 0 ? (
                <div className="space-y-4">
                  {referrals
                    .filter(r => r.status === 'pending')
                    .map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg bg-yellow-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{referral.referredUserName}</span>
                            <Badge className="bg-yellow-100 text-yellow-800">
                              <Clock className="h-3 w-3 mr-1" />
                              Pending
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.referredUserEmail} • {referral.referredUserRole}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Referred: {formatDate(referral.referralDate)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <Button
                            size="sm"
                            onClick={() => handleStatusUpdate(referral.id, 'active')}
                            disabled={actionLoading === referral.id}
                          >
                            {actionLoading === referral.id ? (
                              <div className="h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            ) : (
                              'Activate'
                            )}
                          </Button>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No pending referrals</p>
                  <p className="text-sm text-muted-foreground">
                    All your referrals are active or completed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Active Tab */}
        <TabsContent value="active" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Active Referrals
              </CardTitle>
              <CardDescription>
                Referrals that are actively using the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.filter(r => r.status === 'active').length > 0 ? (
                <div className="space-y-4">
                  {referrals
                    .filter(r => r.status === 'active')
                    .map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg bg-green-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{referral.referredUserName}</span>
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Active
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.referredUserEmail} • {referral.referredUserRole}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Last activity: {formatDate(referral.lastActivity)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">
                            {referral.completedJobs}/{referral.totalJobs} jobs
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(referral.totalRevenue)} revenue
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(referral.commissionEarned)} commission
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No active referrals</p>
                  <p className="text-sm text-muted-foreground">
                    Activate pending referrals to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Tab */}
        <TabsContent value="completed" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                Completed Referrals
              </CardTitle>
              <CardDescription>
                Referrals that have completed their journey
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.filter(r => r.status === 'completed').length > 0 ? (
                <div className="space-y-4">
                  {referrals
                    .filter(r => r.status === 'completed')
                    .map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg bg-blue-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{referral.referredUserName}</span>
                            <Badge className="bg-blue-100 text-blue-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.referredUserEmail} • {referral.referredUserRole}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Completed: {formatDate(referral.lastActivity)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">
                            {referral.completedJobs} completed jobs
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(referral.totalRevenue)} total revenue
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(referral.commissionEarned)} commission earned
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                  <p className="text-muted-foreground">No completed referrals yet</p>
                  <p className="text-sm text-muted-foreground">
                    Complete active referrals to see them here
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Cancelled Tab */}
        <TabsContent value="cancelled" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <XCircle className="h-5 w-5" />
                Cancelled Referrals
              </CardTitle>
              <CardDescription>
                Referrals that were cancelled or discontinued
              </CardDescription>
            </CardHeader>
            <CardContent>
              {referrals.filter(r => r.status === 'cancelled').length > 0 ? (
                <div className="space-y-4">
                  {referrals
                    .filter(r => r.status === 'cancelled')
                    .map((referral) => (
                      <div key={referral.id} className="flex items-center justify-between p-4 border rounded-lg bg-red-50/50">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{referral.referredUserName}</span>
                            <Badge className="bg-red-100 text-red-800">
                              <XCircle className="h-3 w-3 mr-1" />
                              Cancelled
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {referral.referredUserEmail} • {referral.referredUserRole}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Cancelled: {formatDate(referral.lastActivity)}
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <div className="font-medium">
                            {referral.completedJobs} jobs before cancellation
                          </div>
                          <div className="text-sm text-muted-foreground">
                            {formatCurrency(referral.totalRevenue)} revenue
                          </div>
                          <div className="text-sm font-medium text-green-600">
                            {formatCurrency(referral.commissionEarned)} commission
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <p className="text-muted-foreground">No cancelled referrals</p>
                  <p className="text-sm text-muted-foreground">
                    Great! All your referrals are in good standing
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
