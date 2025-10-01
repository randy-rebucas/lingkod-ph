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
  ExternalLink
} from "lucide-react";
import { 
  collection, 
  query, 
  getDocs, 
  doc, 
  updateDoc, 
  orderBy, 
  where,
  serverTimestamp 
} from "firebase/firestore";
import { getDb } from "@/lib/firebase";

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
  rejected: "bg-red-100 text-red-800"
};

export default function PartnerApplicationsPage() {
  const { user, userRole } = useAuth();
  const { toast } = useToast();
  const t = useTranslations('AdminPartnerApplications');
  
  const [applications, setApplications] = useState<PartnerApplication[]>([]);
  const [filteredApplications, setFilteredApplications] = useState<PartnerApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApplication, setSelectedApplication] = useState<PartnerApplication | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [reviewNotes, setReviewNotes] = useState("");
  const [reviewLoading, setReviewLoading] = useState(false);

  useEffect(() => {
    if (userRole !== 'admin') {
      return;
    }
    loadApplications();
  }, [userRole]);

  useEffect(() => {
    filterApplications();
  }, [applications, searchTerm, statusFilter]);

  const loadApplications = async () => {
    try {
      const applicationsQuery = query(
        collection(getDb(), "partnerApplications"),
        orderBy("submittedAt", "desc")
      );
      
      const snapshot = await getDocs(applicationsQuery);
      const apps = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      } as PartnerApplication));
      
      setApplications(apps);
    } catch (error) {
      console.error('Error loading applications:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load partner applications"
      });
    } finally {
      setLoading(false);
    }
  };

  const filterApplications = () => {
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
  };

  const handleReview = async (applicationId: string, status: 'approved' | 'rejected') => {
    if (!user) return;

    setReviewLoading(true);
    try {
      await updateDoc(doc(getDb(), "partnerApplications", applicationId), {
        status,
        reviewedAt: serverTimestamp(),
        reviewedBy: user.uid,
        reviewNotes: reviewNotes.trim() || null
      });

      // If approved, update user role
      if (status === 'approved') {
        await updateDoc(doc(getDb(), "users", selectedApplication?.applicantId || ""), {
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
      loadApplications();
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

  const formatDate = (timestamp: any) => {
    if (!timestamp) return "N/A";
    const date = timestamp.toDate ? timestamp.toDate() : new Date(timestamp);
    return date.toLocaleDateString() + " " + date.toLocaleTimeString();
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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Partner Applications</h1>
            <p className="text-muted-foreground">Review and manage partner applications</p>
          </div>
          <Badge variant="outline" className="text-sm">
            {filteredApplications.length} applications
          </Badge>
        </div>

        {/* Filters */}
        <Card className="mb-6">
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

        {/* Applications List */}
        <div className="grid gap-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground mt-2">Loading applications...</p>
            </div>
          ) : filteredApplications.length === 0 ? (
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
            filteredApplications.map((application) => (
              <Card key={application.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
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
            ))
          )}
        </div>

        {/* Review Modal */}
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
      </div>
    </div>
  );
}
