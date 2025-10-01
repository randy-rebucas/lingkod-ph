"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { 
  Search,
  Filter,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Mail,
  Phone,
  MapPin,
  Globe,
  Building2,
  Users,
  Target,
  TrendingUp,
  FileText,
  Calendar,
  User,
  MessageSquare,
  ExternalLink,
  Download,
  MoreHorizontal,
  Edit,
  Trash2,
  Send,
  AlertCircle,
  CheckCircle2,
  X,
  DollarSign,
  ChevronLeft,
  ChevronRight,
  BarChart3,
  Activity,
  Star
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  where,
  serverTimestamp,
  deleteDoc,
  limit,
  startAfter
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface PartnerApplication {
  id: string;
  applicantId: string;
  applicantName: string;
  applicantEmail: string;
  company: string;
  position: string;
  businessType: string;
  businessSize: string;
  website: string;
  location: string;
  description: string;
  partnershipType: string;
  targetAudience: string[];
  expectedReferrals: string;
  marketingChannels: string[];
  experience: string;
  motivation: string;
  goals: string;
  additionalInfo: string;
  status: 'pending_review' | 'approved' | 'rejected' | 'under_review';
  submittedAt: any;
  reviewedAt?: any;
  reviewedBy?: string;
  reviewNotes?: string;
}

interface Partner {
  id: string;
  uid: string;
  displayName: string;
  email: string;
  phone?: string;
  role: string;
  accountStatus: string;
  createdAt: any;
  lastActiveAt?: any;
  partnerData: {
    company: string;
    position: string;
    businessType: string;
    businessSize: string;
    website: string;
    location: string;
    description: string;
    partnershipType: string;
    targetAudience: string[];
    expectedReferrals: string;
    marketingChannels: string[];
    experience: string;
    motivation: string;
    goals: string;
    additionalInfo: string;
    status: 'active' | 'inactive' | 'suspended';
    totalReferrals: number;
    totalCommission: number;
    approvedAt?: any;
    approvedBy?: string;
    statusUpdatedAt?: any;
    statusUpdatedBy?: string;
  };
}

const partnershipTypes = {
  corporate: "Corporate Partnership",
  community: "Community & LGU Partnership", 
  supply: "Supply & Material Partnership",
  referral: "Referral Partnership"
};

const statusColors = {
  pending_review: "bg-yellow-100 text-yellow-800",
  under_review: "bg-blue-100 text-blue-800",
  approved: "bg-green-100 text-green-800",
  rejected: "bg-red-100 text-red-800",
  active: "bg-green-100 text-green-800",
  inactive: "bg-gray-100 text-gray-800",
  suspended: "bg-red-100 text-red-800"
};

export default function AdminPartnersPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('AdminPartners');
  
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [partners, setPartners] = useState<Partner[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<PartnerApplication[]>([]);
  const [filteredPartners, setFilteredPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [selectedPartner, setSelectedPartner] = useState<Partner | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("applications");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [selectedItems, setSelectedItems] = useState<string[]>([]);
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      return;
    }
    loadData();
  }, [userRole]);

  useEffect(() => {
    filterData();
    setCurrentPage(1); // Reset to first page when filters change
  }, [applications, partners, searchTerm, statusFilter]);

  useEffect(() => {
    setSelectedItems([]); // Clear selections when tab changes
  }, [activeTab]);

  const loadData = async () => {
    try {
      const db = getDb();
      if (!db) {
        throw new Error("Database not initialized");
      }

      // Load applications
      const applicationsQuery = query(
        collection(db, "partnerApplications"),
        orderBy("submittedAt", "desc")
      );
      
      const applicationsSnapshot = await getDocs(applicationsQuery);
      const apps = applicationsSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PartnerApplication));
      
      setApplications(apps);

      // Load partners
      const partnersQuery = query(
        collection(db, "users"),
        where("role", "==", "partner"),
        orderBy("createdAt", "desc")
      );
      
      const partnersSnapshot = await getDocs(partnersQuery);
      const partnerUsers = partnersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          uid: doc.id,
          displayName: data.displayName || data.name || 'Unknown',
          email: data.email || '',
          phone: data.phone || '',
          role: data.role || 'partner',
          accountStatus: data.accountStatus || 'active',
          createdAt: data.createdAt,
          lastActiveAt: data.lastActiveAt,
          partnerData: data.partnerData || {
            company: '',
            position: '',
            businessType: '',
            businessSize: '',
            website: '',
            location: '',
            description: '',
            partnershipType: '',
            targetAudience: [],
            expectedReferrals: '',
            marketingChannels: [],
            experience: '',
            motivation: '',
            goals: '',
            additionalInfo: '',
            status: 'active',
            totalReferrals: 0,
            totalCommission: 0
          }
        } as Partner;
      });
      
      setPartners(partnerUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load partner data"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterData = () => {
    if (activeTab === "applications") {
      let filtered = applications;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(app => 
          app.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          app.applicantEmail.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter(app => app.status === statusFilter);
      }

      setFilteredApplications(filtered);
    } else {
      let filtered = partners;

      // Filter by search term
      if (searchTerm) {
        filtered = filtered.filter(partner => 
          partner.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.partnerData.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
          partner.email.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      // Filter by status
      if (statusFilter !== "all") {
        filtered = filtered.filter(partner => partner.partnerData.status === statusFilter);
      }

      setFilteredPartners(filtered);
    }
  };

  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!user) return;

    setReviewLoading(true);
    try {
      const db = getDb();
      if (!db) {
        throw new Error("Database not initialized");
      }

      await updateDoc(doc(db, "partnerApplications", applicationId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewNotes: reviewNotes.trim() || null
      });

      // If approved, update user role
      if (status === 'approved') {
        await updateDoc(doc(db, "users", selectedApplication?.applicantId || ""), {
          role: 'partner',
          accountStatus: 'active',
          partnerData: {
            ...selectedApplication,
            status: 'active',
            approvedAt: serverTimestamp(),
            approvedBy: user.uid
          }
        });
      }

      toast({
        title: `Application ${status === 'approved' ? 'Approved' : 'Rejected'}`,
        description: `The partner application has been ${status === 'approved' ? 'approved' : 'rejected'}.`
      });

      setSelectedApplication(null);
      setReviewNotes("");
      loadData();
    } catch (error) {
      console.error('Error reviewing application:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to review application"
      });
    } finally {
      setReviewLoading(false);
    }
  };

  const handlePartnerStatusChange = async (partnerId: string, status: 'active' | 'inactive' | 'suspended') => {
    try {
      const db = getDb();
      if (!db) {
        throw new Error("Database not initialized");
      }

      await updateDoc(doc(db, "users", partnerId), {
        'partnerData.status': status,
        'partnerData.statusUpdatedAt': serverTimestamp(),
        'partnerData.statusUpdatedBy': user?.uid
      });

      toast({
        title: "Partner Status Updated",
        description: `Partner status has been updated to ${status}.`
      });

      loadData();
    } catch (error) {
      console.error('Error updating partner status:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to update partner status"
      });
    }
  };

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
  };

  // Pagination helpers
  const getPaginatedApplications = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredApplications.slice(startIndex, endIndex);
  };

  const getPaginatedPartners = () => {
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    return filteredPartners.slice(startIndex, endIndex);
  };

  const getTotalPages = () => {
    const data = activeTab === 'applications' ? filteredApplications : filteredPartners;
    return Math.ceil(data.length / itemsPerPage);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    setSelectedItems([]); // Clear selections when changing pages
  };

  // Bulk actions
  const handleBulkAction = async (action: 'approve' | 'reject' | 'activate' | 'deactivate' | 'suspend') => {
    if (selectedItems.length === 0) return;

    setBulkActionLoading(true);
    try {
      const db = getDb();
      if (!db) {
        throw new Error("Database not initialized");
      }

      const promises = selectedItems.map(async (itemId) => {
        if (activeTab === 'applications') {
          if (action === 'approve' || action === 'reject') {
            await updateDoc(doc(db, "partnerApplications", itemId), {
              status: action === 'approve' ? 'approved' : 'rejected',
              reviewedAt: serverTimestamp(),
              reviewedBy: user?.uid,
              reviewNotes: `Bulk ${action} action`
            });
          }
        } else {
          if (action === 'activate' || action === 'deactivate' || action === 'suspend') {
            const status = action === 'activate' ? 'active' : action === 'deactivate' ? 'inactive' : 'suspended';
            await updateDoc(doc(db, "users", itemId), {
              'partnerData.status': status,
              'partnerData.statusUpdatedAt': serverTimestamp(),
              'partnerData.statusUpdatedBy': user?.uid
            });
          }
        }
      });

      await Promise.all(promises);

      toast({
        title: "Bulk Action Completed",
        description: `${selectedItems.length} items have been updated successfully.`
      });

      setSelectedItems([]);
      loadData();
    } catch (error) {
      console.error('Error performing bulk action:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to perform bulk action"
      });
    } finally {
      setBulkActionLoading(false);
    }
  };

  const handleSelectAll = () => {
    if (activeTab === 'applications') {
      const data = getPaginatedApplications();
      if (selectedItems.length === data.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(data.map(item => item.id));
      }
    } else {
      const data = getPaginatedPartners();
      if (selectedItems.length === data.length) {
        setSelectedItems([]);
      } else {
        setSelectedItems(data.map(item => item.id));
      }
    }
  };

  const handleSelectItem = (itemId: string) => {
    setSelectedItems(prev => 
      prev.includes(itemId) 
        ? prev.filter(id => id !== itemId)
        : [...prev, itemId]
    );
  };

  const exportData = (type: 'applications' | 'partners') => {
    if (type === 'applications') {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,Company,Email,Partnership Type,Status,Submitted At\n" +
        filteredApplications.map(app => `${app.applicantName},${app.company},${app.applicantEmail},${partnershipTypes[app.partnershipType as keyof typeof partnershipTypes]},${app.status},${formatDate(app.submittedAt)}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "applications_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else {
      const csvContent = "data:text/csv;charset=utf-8," + 
        "Name,Company,Email,Partnership Type,Status,Total Referrals,Total Commission\n" +
        filteredPartners.map(partner => `${partner.displayName},${partner.partnerData.company},${partner.email},${partnershipTypes[partner.partnerData.partnershipType as keyof typeof partnershipTypes]},${partner.partnerData.status},${partner.partnerData.totalReferrals || 0},${partner.partnerData.totalCommission || 0}`).join("\n");
      
      const encodedUri = encodeURI(csvContent);
      const link = document.createElement("a");
      link.setAttribute("href", encodedUri);
      link.setAttribute("download", "partners_export.csv");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  if (userRole !== 'admin') {
    return (
      <div className="container space-y-8">
        <div className="max-w-6xl mx-auto">
          <Card>
            <CardHeader>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>This page is only available to administrators.</CardDescription>
            </CardHeader>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="container space-y-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">Partner Management</h1>
            <p className="text-muted-foreground">Manage partner applications and active partners</p>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => exportData(activeTab as 'applications' | 'partners')}
              className="w-full sm:w-auto"
            >
              <Download className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Export {activeTab === 'applications' ? 'Applications' : 'Partners'}</span>
              <span className="sm:hidden">Export</span>
            </Button>
          </div>
        </div>

        {/* Statistics Dashboard */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Applications</p>
                  <p className="text-xl sm:text-2xl font-bold">{applications.length}</p>
                </div>
                <FileText className="h-6 w-6 sm:h-8 sm:w-8 text-muted-foreground" />
              </div>
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <span className="text-yellow-600 font-medium">
                    {applications.filter(app => app.status === 'pending_review').length} pending
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Active Partners</p>
                  <p className="text-xl sm:text-2xl font-bold">{partners.filter(p => p.partnerData.status === 'active').length}</p>
                </div>
                <Users className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <span className="text-green-600 font-medium">
                    {partners.filter(p => p.partnerData.status === 'active').length} active
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Referrals</p>
                  <p className="text-xl sm:text-2xl font-bold">
                    {partners.reduce((sum, partner) => sum + (partner.partnerData.totalReferrals || 0), 0)}
                  </p>
                </div>
                <Target className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">This month</span>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Total Commission</p>
                  <p className="text-lg sm:text-2xl font-bold">
                    ₱{partners.reduce((sum, partner) => sum + (partner.partnerData.totalCommission || 0), 0).toLocaleString()}
                  </p>
                </div>
                <DollarSign className="h-6 w-6 sm:h-8 sm:w-8 text-green-600" />
              </div>
              <div className="mt-2">
                <div className="flex items-center text-sm">
                  <Activity className="h-4 w-4 text-green-600 mr-1" />
                  <span className="text-green-600 font-medium">Paid out</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="applications" className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              Applications ({applications.length})
            </TabsTrigger>
            <TabsTrigger value="partners" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Active Partners ({partners.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="applications" className="space-y-6">
            {/* Applications Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by name, company, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="pending_review">Pending Review</SelectItem>
                        <SelectItem value="under_review">Under Review</SelectItem>
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions */}
            {selectedItems.length > 0 && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('approve')}
                        disabled={bulkActionLoading}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkAction('reject')}
                        disabled={bulkActionLoading}
                        className="w-full sm:w-auto"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Applications List */}
            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading applications...</p>
                </div>
              ) : getPaginatedApplications().length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No applications found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No applications match your current filters." 
                        : "No partner applications have been submitted yet."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Select All Header */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === getPaginatedApplications().length && getPaginatedApplications().length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Select All</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {getPaginatedApplications().map((application) => (
                  <Card key={application.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(application.id)}
                            onChange={() => handleSelectItem(application.id)}
                            className="h-4 w-4 rounded border-gray-300 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{application.applicantName}</h3>
                              <Badge className={statusColors[application.status]}>
                                {application.status.replace('_', ' ')}
                              </Badge>
                            </div>
                          
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-3 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{application.company}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{application.applicantEmail}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <MapPin className="h-4 w-4" />
                              <span>{application.location}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Target className="h-4 w-4" />
                              <span>{partnershipTypes[application.partnershipType as keyof typeof partnershipTypes]}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Users className="h-4 w-4" />
                              <span>{application.expectedReferrals}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Calendar className="h-4 w-4" />
                              <span>{formatDate(application.submittedAt)}</span>
                            </div>
                          </div>

                            <p className="text-sm text-muted-foreground line-clamp-2">
                              {application.description}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedApplication(application)}
                          >
                            <Eye className="h-4 w-4 mr-2" />
                            Review
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                  
                  {/* Pagination Controls */}
                  {getTotalPages() > 1 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredApplications.length)} of {filteredApplications.length} applications
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Previous</span>
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(getTotalPages(), 5) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === getTotalPages()}
                            >
                              <span className="hidden sm:inline mr-1">Next</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="partners" className="space-y-6">
            {/* Partners Filters */}
            <Card>
              <CardContent className="p-6">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                      <Input
                        placeholder="Search by name, company, or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="w-full md:w-48">
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                      <SelectTrigger>
                        <SelectValue placeholder="Filter by status" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Statuses</SelectItem>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                        <SelectItem value="suspended">Suspended</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Bulk Actions for Partners */}
            {selectedItems.length > 0 && (
              <Card className="mb-4">
                <CardContent className="p-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">
                        {selectedItems.length} item{selectedItems.length > 1 ? 's' : ''} selected
                      </span>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        size="sm"
                        onClick={() => handleBulkAction('activate')}
                        disabled={bulkActionLoading}
                        className="w-full sm:w-auto"
                      >
                        <CheckCircle2 className="h-4 w-4 mr-2" />
                        Activate All
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleBulkAction('deactivate')}
                        disabled={bulkActionLoading}
                        className="w-full sm:w-auto"
                      >
                        <Clock className="h-4 w-4 mr-2" />
                        Deactivate All
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleBulkAction('suspend')}
                        disabled={bulkActionLoading}
                        className="w-full sm:w-auto"
                      >
                        <X className="h-4 w-4 mr-2" />
                        Suspend All
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Partners List */}
            <div className="grid gap-6">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
                  <p className="text-muted-foreground mt-2">Loading partners...</p>
                </div>
              ) : getPaginatedPartners().length === 0 ? (
                <Card>
                  <CardContent className="p-12 text-center">
                    <Users className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No partners found</h3>
                    <p className="text-muted-foreground">
                      {searchTerm || statusFilter !== "all" 
                        ? "No partners match your current filters." 
                        : "No active partners found."}
                    </p>
                  </CardContent>
                </Card>
              ) : (
                <>
                  {/* Select All Header for Partners */}
                  <Card>
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <input
                          type="checkbox"
                          checked={selectedItems.length === getPaginatedPartners().length && getPaginatedPartners().length > 0}
                          onChange={handleSelectAll}
                          className="h-4 w-4 rounded border-gray-300"
                        />
                        <span className="text-sm font-medium">Select All</span>
                      </div>
                    </CardContent>
                  </Card>
                  
                  {getPaginatedPartners().map((partner) => (
                  <Card key={partner.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <input
                            type="checkbox"
                            checked={selectedItems.includes(partner.id)}
                            onChange={() => handleSelectItem(partner.id)}
                            className="h-4 w-4 rounded border-gray-300 mt-1"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h3 className="text-lg font-semibold">{partner.displayName}</h3>
                              <Badge className={statusColors[partner.partnerData.status]}>
                                {partner.partnerData.status}
                              </Badge>
                            </div>
                          
                          <div className="grid gap-2 md:grid-cols-2 lg:grid-cols-4 mb-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Building2 className="h-4 w-4" />
                              <span>{partner.partnerData.company}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Mail className="h-4 w-4" />
                              <span>{partner.email}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <Target className="h-4 w-4" />
                              <span>{partnershipTypes[partner.partnerData.partnershipType as keyof typeof partnershipTypes]}</span>
                            </div>
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                              <TrendingUp className="h-4 w-4" />
                              <span>{partner.partnerData.totalReferrals || 0} referrals</span>
                            </div>
                          </div>

                            <div className="flex items-center gap-4 text-sm">
                              <div className="flex items-center gap-1">
                                <DollarSign className="h-4 w-4 text-green-600" />
                                <span className="text-green-600 font-medium">
                                  ₱{(partner.partnerData.totalCommission || 0).toLocaleString()}
                                </span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span>Joined {formatDate(partner.createdAt)}</span>
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 ml-4">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuLabel>Actions</DropdownMenuLabel>
                              <DropdownMenuItem onClick={() => setSelectedPartner(partner)}>
                                <Eye className="h-4 w-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem 
                                onClick={() => handlePartnerStatusChange(partner.uid, 'active')}
                                disabled={partner.partnerData.status === 'active'}
                              >
                                <CheckCircle2 className="h-4 w-4 mr-2" />
                                Activate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handlePartnerStatusChange(partner.uid, 'inactive')}
                                disabled={partner.partnerData.status === 'inactive'}
                              >
                                <Clock className="h-4 w-4 mr-2" />
                                Deactivate
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handlePartnerStatusChange(partner.uid, 'suspended')}
                                disabled={partner.partnerData.status === 'suspended'}
                                className="text-red-600"
                              >
                                <X className="h-4 w-4 mr-2" />
                                Suspend
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  ))}
                  
                  {/* Pagination Controls for Partners */}
                  {getTotalPages() > 1 && (
                    <Card>
                      <CardContent className="p-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="text-sm text-muted-foreground text-center sm:text-left">
                            Showing {((currentPage - 1) * itemsPerPage) + 1} to {Math.min(currentPage * itemsPerPage, filteredPartners.length)} of {filteredPartners.length} partners
                          </div>
                          <div className="flex items-center justify-center gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage - 1)}
                              disabled={currentPage === 1}
                            >
                              <ChevronLeft className="h-4 w-4" />
                              <span className="hidden sm:inline ml-1">Previous</span>
                            </Button>
                            <div className="flex items-center gap-1">
                              {Array.from({ length: Math.min(getTotalPages(), 5) }, (_, i) => {
                                const page = i + 1;
                                return (
                                  <Button
                                    key={page}
                                    variant={currentPage === page ? "default" : "outline"}
                                    size="sm"
                                    onClick={() => handlePageChange(page)}
                                    className="w-8 h-8 p-0"
                                  >
                                    {page}
                                  </Button>
                                );
                              })}
                            </div>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handlePageChange(currentPage + 1)}
                              disabled={currentPage === getTotalPages()}
                            >
                              <span className="hidden sm:inline mr-1">Next</span>
                              <ChevronRight className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </>
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Application Review Modal */}
        {selectedApplication && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Review Partner Application</CardTitle>
                    <CardDescription>
                      {selectedApplication.applicantName} - {selectedApplication.company}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedApplication(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Personal Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Personal Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.applicantName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.applicantEmail}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Position</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.position}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.company}</p>
                    </div>
                  </div>
                </div>

                {/* Business Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Business Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Business Type</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.businessType}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Business Size</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.businessSize}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Location</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.location}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Website</Label>
                      <p className="text-sm text-muted-foreground">
                        {selectedApplication.website ? (
                          <a href={selectedApplication.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                            {selectedApplication.website} <ExternalLink className="inline h-3 w-3" />
                          </a>
                        ) : "Not provided"}
                      </p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Business Description</Label>
                    <p className="text-sm text-muted-foreground mt-1">{selectedApplication.description}</p>
                  </div>
                </div>

                {/* Partnership Details */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Partnership Details</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Partnership Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {partnershipTypes[selectedApplication.partnershipType as keyof typeof partnershipTypes]}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Expected Referrals</Label>
                      <p className="text-sm text-muted-foreground">{selectedApplication.expectedReferrals}</p>
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Target Audience</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApplication.targetAudience.map((audience, index) => (
                        <Badge key={index} variant="secondary" className="text-xs">
                          {audience}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="mt-4">
                    <Label className="text-sm font-medium">Marketing Channels</Label>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {selectedApplication.marketingChannels.map((channel, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {channel}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Additional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-sm font-medium">Experience</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedApplication.experience}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Motivation</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedApplication.motivation}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Goals</Label>
                      <p className="text-sm text-muted-foreground mt-1">{selectedApplication.goals}</p>
                    </div>
                    {selectedApplication.additionalInfo && (
                      <div>
                        <Label className="text-sm font-medium">Additional Information</Label>
                        <p className="text-sm text-muted-foreground mt-1">{selectedApplication.additionalInfo}</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Review Section */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Review</h3>
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="reviewNotes">Review Notes</Label>
                      <Textarea
                        id="reviewNotes"
                        value={reviewNotes}
                        onChange={(e) => setReviewNotes(e.target.value)}
                        placeholder="Add any notes about this application..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleReview(selectedApplication.id, 'approved')}
                        disabled={reviewLoading}
                        className="flex-1"
                      >
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => handleReview(selectedApplication.id, 'rejected')}
                        disabled={reviewLoading}
                        className="flex-1"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Partner Details Modal */}
        {selectedPartner && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Partner Details</CardTitle>
                    <CardDescription>
                      {selectedPartner.displayName} - {selectedPartner.partnerData.company}
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedPartner(null)}
                  >
                    Close
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Partner Overview */}
                <div className="grid gap-4 md:grid-cols-3">
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-primary">{selectedPartner.partnerData.totalReferrals || 0}</div>
                      <div className="text-sm text-muted-foreground">Total Referrals</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-green-600">₱{(selectedPartner.partnerData.totalCommission || 0).toLocaleString()}</div>
                      <div className="text-sm text-muted-foreground">Total Commission</div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="p-4 text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedPartner.partnerData.status}</div>
                      <div className="text-sm text-muted-foreground">Status</div>
                    </CardContent>
                  </Card>
                </div>

                {/* Partner Information */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Partner Information</h3>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div>
                      <Label className="text-sm font-medium">Name</Label>
                      <p className="text-sm text-muted-foreground">{selectedPartner.displayName}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Email</Label>
                      <p className="text-sm text-muted-foreground">{selectedPartner.email}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Company</Label>
                      <p className="text-sm text-muted-foreground">{selectedPartner.partnerData.company}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Partnership Type</Label>
                      <p className="text-sm text-muted-foreground">
                        {partnershipTypes[selectedPartner.partnerData.partnershipType as keyof typeof partnershipTypes]}
                      </p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Joined Date</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedPartner.createdAt)}</p>
                    </div>
                    <div>
                      <Label className="text-sm font-medium">Last Active</Label>
                      <p className="text-sm text-muted-foreground">{formatDate(selectedPartner.lastActiveAt)}</p>
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div>
                  <h3 className="text-lg font-semibold mb-3">Actions</h3>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      onClick={() => handlePartnerStatusChange(selectedPartner.uid, 'active')}
                      disabled={selectedPartner.partnerData.status === 'active'}
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Activate
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => handlePartnerStatusChange(selectedPartner.uid, 'inactive')}
                      disabled={selectedPartner.partnerData.status === 'inactive'}
                    >
                      <Clock className="h-4 w-4 mr-2" />
                      Deactivate
                    </Button>
                    <Button
                      variant="destructive"
                      onClick={() => handlePartnerStatusChange(selectedPartner.uid, 'suspended')}
                      disabled={selectedPartner.partnerData.status === 'suspended'}
                    >
                      <X className="h-4 w-4 mr-2" />
                      Suspend
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
