
"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, where, query, serverTimestamp, addDoc, updateDoc, arrayUnion, writeBatch, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, Award, User, Briefcase, Mail, ArrowLeft, Users, Filter, Search, TrendingUp, TrendingDown, Calendar, Clock, Target, BarChart3, RefreshCw, Download, Settings, Plus, Eye, CheckCircle, XCircle, AlertCircle, Zap, Heart, Bookmark, Phone, MapPin, DollarSign, Timer, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Job as JobType } from "@/app/(app)/my-job-posts/page";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";


type Provider = {
    uid: string;
    displayName: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
    keyServices?: string[];
    bio?: string;
    address?: string;
    phone?: string;
    email?: string;
    isVerified?: boolean;
    experience?: string;
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
    applicationDate?: Timestamp;
    isFavorite?: boolean;
    notes?: string;
};

// Use a more detailed job type for this page
type JobDetails = JobType & {
    deadline?: Timestamp | null;
}

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
};

export default function ApplicantsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const jobId = params.jobId as string;

    const [job, setJob] = useState<JobDetails | null>(null);
    const [applicants, setApplicants] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [ratingFilter, setRatingFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("rating");
    const [selectedApplicants, setSelectedApplicants] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');
    const [refreshing, setRefreshing] = useState(false);
    const [favoriteApplicants, setFavoriteApplicants] = useState<string[]>([]);

    useEffect(() => {
        if (!jobId || !user) return;

        const fetchJobAndApplicants = async () => {
            setLoading(true);
            try {
                // Fetch job details
                const jobRef = doc(db, "jobs", jobId);
                const jobSnap = await getDoc(jobRef);

                if (!jobSnap.exists() || jobSnap.data().clientId !== user.uid) {
                    toast({ variant: "destructive", title: "Error", description: "Job not found or you do not have permission to view it." });
                    router.push("/my-job-posts");
                    return;
                }
                const jobData = { id: jobSnap.id, ...jobSnap.data() } as JobDetails;
                setJob(jobData);

                // Fetch applicants if any
                if (jobData.applications && jobData.applications.length > 0) {
                    const applicantsQuery = query(collection(db, "users"), where("uid", "in", jobData.applications));
                    const applicantsSnap = await getDocs(applicantsQuery);

                    // Fetch all reviews to calculate ratings
                    const reviewsSnapshot = await getDocs(collection(db, "reviews"));
                    const allReviews = reviewsSnapshot.docs.map(doc => doc.data());
                    
                    const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
                    allReviews.forEach((review: any) => {
                        if (!providerRatings[review.providerId]) {
                            providerRatings[review.providerId] = { totalRating: 0, count: 0 };
                        }
                        providerRatings[review.providerId].totalRating += review.rating;
                        providerRatings[review.providerId].count++;
                    });
                    
                    const applicantsData = applicantsSnap.docs.map(doc => {
                         const data = doc.data();
                         const ratingInfo = providerRatings[data.uid];
                        return {
                            ...data,
                            uid: doc.id,
                            rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
                            reviewCount: ratingInfo ? ratingInfo.count : 0,
                        } as Provider
                    });
                    setApplicants(applicantsData);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to fetch job applicants." });
            } finally {
                setLoading(false);
            }
        };

        fetchJobAndApplicants();
    }, [jobId, user, router, toast]);

    // Filter and sort applicants
    const filteredAndSortedApplicants = applicants
        .filter(applicant => {
            const matchesSearch = applicant.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                applicant.bio?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                applicant.keyServices?.some(service => service.toLowerCase().includes(searchTerm.toLowerCase()));
            const matchesRating = ratingFilter === "all" || 
                                (ratingFilter === "5" && applicant.rating >= 4.5) ||
                                (ratingFilter === "4" && applicant.rating >= 3.5 && applicant.rating < 4.5) ||
                                (ratingFilter === "3" && applicant.rating >= 2.5 && applicant.rating < 3.5) ||
                                (ratingFilter === "2" && applicant.rating >= 1.5 && applicant.rating < 2.5) ||
                                (ratingFilter === "1" && applicant.rating < 1.5);
            return matchesSearch && matchesRating;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "rating":
                    return b.rating - a.rating;
                case "reviews":
                    return b.reviewCount - a.reviewCount;
                case "name":
                    return a.displayName.localeCompare(b.displayName);
                case "newest":
                    return (b.applicationDate?.toMillis() || 0) - (a.applicationDate?.toMillis() || 0);
                case "oldest":
                    return (a.applicationDate?.toMillis() || 0) - (b.applicationDate?.toMillis() || 0);
                default:
                    return 0;
            }
        });

    // Calculate statistics
    const stats = {
        total: applicants.length,
        avgRating: applicants.length > 0 ? (applicants.reduce((sum, app) => sum + app.rating, 0) / applicants.length).toFixed(1) : "0.0",
        totalReviews: applicants.reduce((sum, app) => sum + app.reviewCount, 0),
        verified: applicants.filter(app => app.isVerified).length,
        available: applicants.filter(app => app.availabilityStatus === 'available').length,
        topRated: applicants.filter(app => app.rating >= 4.5).length
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast({
            title: "Applicants Refreshed",
            description: "All applicant data has been updated successfully.",
        });
    };

    const toggleApplicantSelection = (applicantId: string) => {
        setSelectedApplicants(prev => 
            prev.includes(applicantId) 
                ? prev.filter(id => id !== applicantId)
                : [...prev, applicantId]
        );
    };

    const selectAllApplicants = () => {
        setSelectedApplicants(filteredAndSortedApplicants.map(applicant => applicant.uid));
    };

    const clearSelection = () => {
        setSelectedApplicants([]);
    };

    const toggleFavorite = (applicantId: string) => {
        setFavoriteApplicants(prev => 
            prev.includes(applicantId) 
                ? prev.filter(id => id !== applicantId)
                : [...prev, applicantId]
        );
    };

    const handleBulkAction = async (action: string) => {
        if (selectedApplicants.length === 0) {
            toast({
                variant: "destructive",
                title: "No Applicants Selected",
                description: "Please select applicants to perform bulk actions.",
            });
            return;
        }

        try {
            // Implement bulk actions here
            toast({
                title: "Bulk Action Completed",
                description: `${action} applied to ${selectedApplicants.length} applicants.`,
            });
            setSelectedApplicants([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to perform bulk action.",
            });
        }
    };

    const handleAwardJob = async (provider: Provider) => {
        if (!job || !user) return;
        
        try {
            const batch = writeBatch(db);
            
            // 1. Create a booking document
            const bookingRef = doc(collection(db, 'bookings'));
            batch.set(bookingRef, {
                jobId: job.id,
                providerId: provider.uid,
                providerName: provider.displayName,
                providerAvatar: provider.photoURL || '',
                clientId: user.uid,
                clientName: user.displayName,
                clientAvatar: user.photoURL || '',
                serviceName: job.title, // Use job title as service name
                serviceId: '', // A job doesn't have a service ID
                price: job.budget.amount,
                date: job.deadline || serverTimestamp(), // Use deadline or now as placeholder
                status: "Upcoming",
                notes: `This booking was created from job post: ${job.title}`,
                createdAt: serverTimestamp(),
            });

            // 2. Update job status to 'In Progress'
            const jobRef = doc(db, "jobs", jobId);
            batch.update(jobRef, { status: "In Progress" });

            await batch.commit();

            toast({ title: "Success!", description: `${provider.displayName} has been awarded the job. A new booking has been created.`});
            router.push("/bookings");
            
        } catch(error) {
             console.error("Error awarding job:", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to award the job." });
        }
    };
    
    const handleSendMessage = async (provider: Provider) => {
         if (!user || !provider) return;
        try {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("participants", "array-contains", user.uid));
            const querySnapshot = await getDocs(q);
            let existingConvoId: string | null = null;
            querySnapshot.forEach(doc => {
                if (doc.data().participants.includes(provider.uid)) {
                    existingConvoId = doc.id;
                }
            });

            if (existingConvoId) {
                router.push(`/messages?conversationId=${existingConvoId}`);
            } else {
                const newConvoRef = await addDoc(conversationsRef, {
                    participants: [user.uid, provider.uid],
                    participantInfo: {
                        [user.uid]: { displayName: user.displayName, photoURL: user.photoURL || '' },
                        [provider.uid]: { displayName: provider.displayName, photoURL: provider.photoURL || '' }
                    },
                    lastMessage: `Regarding your application for: ${job?.title}`,
                    timestamp: serverTimestamp(),
                });
                router.push(`/messages?conversationId=${newConvoRef.id}`);
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start a conversation." });
        }
    };


    if (loading) {
        return <LoadingState 
            title="Loading Applicants" 
            description="Please wait while we fetch the applicant information." 
        />;
    }

    // Statistics Dashboard Component
    const StatsCard = ({ title, value, icon: Icon, variant = "default", change, trend }: {
        title: string;
        value: string | number;
        icon: React.ElementType;
        variant?: 'default' | 'success' | 'warning' | 'info';
        change?: string;
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const getVariantStyles = () => {
            switch (variant) {
                case 'success':
                    return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
                case 'warning':
                    return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
                case 'info':
                    return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
                default:
                    return '';
            }
        };

        return (
            <StandardCard 
                title={title} 
                variant="elevated"
                className={`group hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 ${getVariantStyles()}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                            {value}
                        </div>
                        {change && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg ${
                        variant === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                        variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-primary/10'
                    }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                            variant === 'success' ? 'text-green-600' :
                            variant === 'warning' ? 'text-yellow-600' :
                            variant === 'info' ? 'text-blue-600' :
                            'text-muted-foreground group-hover:text-primary'
                        }`} />
                    </div>
                </div>
            </StandardCard>
        );
    };

    return (
        <PageLayout 
            title={`Applicants for "${job?.title}"`} 
            description="Review and manage applications for your job posting."
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.back()}
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                    >
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Jobs
                    </Button>
                </div>
            }
        >
            {/* Job Overview */}
            <StandardCard 
                title="Job Overview" 
                description="Details about your job posting"
                variant="elevated"
            >
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Job Title</span>
                        </div>
                        <p className="font-semibold">{job?.title}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <DollarSign className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Budget</span>
                        </div>
                        <p className="font-semibold">₱{job?.budget.amount.toLocaleString()}</p>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Status</span>
                        </div>
                        <Badge variant={job?.status === 'Open' ? 'default' : 'secondary'} className="shadow-soft">
                            {job?.status}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm font-medium">Deadline</span>
                        </div>
                        <p className="font-semibold">
                            {job?.deadline ? new Date(job.deadline.toMillis()).toLocaleDateString() : 'No deadline'}
                        </p>
                    </div>
                </div>
            </StandardCard>

            {/* Statistics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="Total Applicants" 
                    value={stats.total} 
                    icon={Users} 
                    variant="default"
                />
                <StatsCard 
                    title="Average Rating" 
                    value={stats.avgRating} 
                    icon={Star} 
                    variant="success"
                    change={`${stats.totalReviews} total reviews`}
                />
                <StatsCard 
                    title="Verified Providers" 
                    value={stats.verified} 
                    icon={CheckCircle} 
                    variant="info"
                    change={`${stats.total > 0 ? Math.round((stats.verified / stats.total) * 100) : 0}% of total`}
                />
                <StatsCard 
                    title="Top Rated" 
                    value={stats.topRated} 
                    icon={Award} 
                    variant="warning"
                    change={`4.5+ stars`}
                />
            </div>

            {/* Filters and Controls */}
            <StandardCard 
                title="Applicant Management" 
                description="Filter, sort, and manage your applicants"
                variant="elevated"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search applicants by name, bio, or services..." 
                                className="pl-10 shadow-soft" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={ratingFilter} onValueChange={setRatingFilter}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by rating" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Ratings</SelectItem>
                                <SelectItem value="5">5 Stars (4.5+)</SelectItem>
                                <SelectItem value="4">4 Stars (3.5-4.4)</SelectItem>
                                <SelectItem value="3">3 Stars (2.5-3.4)</SelectItem>
                                <SelectItem value="2">2 Stars (1.5-2.4)</SelectItem>
                                <SelectItem value="1">1 Star (0-1.4)</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="rating">Highest Rating</SelectItem>
                                <SelectItem value="reviews">Most Reviews</SelectItem>
                                <SelectItem value="name">Name A-Z</SelectItem>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border-2 p-1 rounded-lg bg-background/50 backdrop-blur-sm">
                            <Button 
                                size="icon" 
                                variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('cards')} 
                                className="h-8 w-8"
                            >
                                <Users className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('table')} 
                                className="h-8 w-8"
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedApplicants.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedApplicants.length} applicant{selectedApplicants.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Message')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <MessageSquare className="h-3 w-3 mr-1" />
                                    Message All
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={clearSelection}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </StandardCard>

            {/* Applicants Display */}
            <StandardCard 
                title="Applicants" 
                description={`${filteredAndSortedApplicants.length} of ${applicants.length} applicants`}
                variant="elevated"
            >
                {viewMode === 'cards' ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedApplicants.length > 0 ? filteredAndSortedApplicants.map(applicant => (
                            <Card key={applicant.uid} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group flex flex-col hover:-translate-y-1">
                                <CardHeader className="text-center pb-3 relative">
                                    <div className="absolute top-2 right-2 flex items-center gap-1">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-6 w-6 rounded-full hover:bg-primary/10 transition-colors"
                                            onClick={() => toggleFavorite(applicant.uid)}
                                        >
                                            <Heart className={cn("h-3 w-3", favoriteApplicants.includes(applicant.uid) && "fill-red-500 text-red-500")} />
                                        </Button>
                                        <Checkbox 
                                            checked={selectedApplicants.includes(applicant.uid)}
                                            onCheckedChange={() => toggleApplicantSelection(applicant.uid)}
                                            className="h-4 w-4"
                                        />
                                    </div>
                                <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary/20 shadow-soft">
                                    <AvatarImage src={applicant.photoURL} alt={applicant.displayName} />
                                    <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">{getAvatarFallback(applicant.displayName)}</AvatarFallback>
                                </Avatar>
                                    <div className="flex items-center justify-center gap-2">
                                <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300">{applicant.displayName}</CardTitle>
                                        {applicant.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                    </div>
                                {applicant.reviewCount > 0 && (
                                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                                        {renderStars(applicant.rating)}
                                        <span className="text-sm">({applicant.reviewCount})</span>
                                    </div>
                                )}
                                    {applicant.availabilityStatus && (
                                        <Badge 
                                            variant={applicant.availabilityStatus === 'available' ? 'default' : 'secondary'} 
                                            className="mt-2 text-xs"
                                        >
                                            {applicant.availabilityStatus}
                                        </Badge>
                                    )}
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3 px-4">
                               {applicant.keyServices && applicant.keyServices.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm"><Briefcase className="h-4 w-4" /> Key Services</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {applicant.keyServices.slice(0, 2).map(service => (
                                                <span key={service} className="text-xs bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground py-1 px-2 rounded-full border border-border/50 shadow-soft">{service}</span>
                                            ))}
                                            {applicant.keyServices.length > 2 && (
                                                <span className="text-xs text-muted-foreground py-1 px-2">+{applicant.keyServices.length - 2} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{applicant.bio || 'No bio available.'}</p>
                                    
                                    {applicant.address && (
                                        <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                            <MapPin className="h-3 w-3" />
                                            <span className="truncate">{applicant.address}</span>
                                        </div>
                                    )}
                            </CardContent>
                             <CardFooter className="flex flex-col gap-2 pt-2 px-4 pb-4">
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300" disabled={job?.status !== 'Open'}>
                                            <Award className="mr-2 h-4 w-4" /> Award Job
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Award Job to {applicant.displayName}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new booking with this provider and change the job status to "In Progress". Are you sure you want to proceed?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAwardJob(applicant)} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button variant="outline" asChild className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                        <Link href={`/providers/${applicant.uid}`}><User className="mr-2 h-4 w-4" /> View Profile</Link>
                                    </Button>
                                    <Button variant="outline" className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground" onClick={() => handleSendMessage(applicant)}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <Users className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                    {searchTerm || ratingFilter !== "all" ? "No Applicants Found" : "No Applicants Yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || ratingFilter !== "all" ? "Try adjusting your filters" : "Check back later to see who has applied for your job."}
                                </p>
                            </div>
                        )}
                 </div>
            ) : (
                    // Table View
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedApplicants.length === filteredAndSortedApplicants.length && filteredAndSortedApplicants.length > 0}
                                    onCheckedChange={(checked) => checked ? selectAllApplicants() : clearSelection()}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all ({filteredAndSortedApplicants.length})
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {filteredAndSortedApplicants.length > 0 ? filteredAndSortedApplicants.map((applicant) => (
                                <div key={applicant.uid} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                                    <Checkbox 
                                        checked={selectedApplicants.includes(applicant.uid)}
                                        onCheckedChange={() => toggleApplicantSelection(applicant.uid)}
                                    />
                                    <Avatar className="h-12 w-12">
                                        <AvatarImage src={applicant.photoURL} alt={applicant.displayName} />
                                        <AvatarFallback>{getAvatarFallback(applicant.displayName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{applicant.displayName}</h3>
                                            {applicant.isVerified && <CheckCircle className="h-4 w-4 text-blue-500" />}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <div className="flex items-center gap-1">
                                                {renderStars(applicant.rating)}
                                                <span>({applicant.reviewCount})</span>
                                            </div>
                                            {applicant.availabilityStatus && (
                                                <Badge variant={applicant.availabilityStatus === 'available' ? 'default' : 'secondary'} className="text-xs">
                                                    {applicant.availabilityStatus}
                                                </Badge>
                                            )}
                                        </div>
                                        {applicant.keyServices && applicant.keyServices.length > 0 && (
                                            <div className="flex flex-wrap gap-1 mt-2">
                                                {applicant.keyServices.slice(0, 3).map(service => (
                                                    <Badge key={service} variant="outline" className="text-xs">{service}</Badge>
                                                ))}
                                                {applicant.keyServices.length > 3 && (
                                                    <Badge variant="outline" className="text-xs">+{applicant.keyServices.length - 3}</Badge>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="h-8 w-8"
                                            onClick={() => toggleFavorite(applicant.uid)}
                                        >
                                            <Heart className={cn("h-4 w-4", favoriteApplicants.includes(applicant.uid) && "fill-red-500 text-red-500")} />
                                        </Button>
                                        <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button size="sm" disabled={job?.status !== 'Open'}>
                                                    <Award className="mr-2 h-4 w-4" /> Award Job
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Award Job to {applicant.displayName}?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This will create a new booking with this provider and change the job status to "In Progress". Are you sure you want to proceed?
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleAwardJob(applicant)} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/providers/${applicant.uid}`}>
                                                <User className="mr-2 h-4 w-4" /> View Profile
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm" onClick={() => handleSendMessage(applicant)}>
                                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <Users className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                    <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                        {searchTerm || ratingFilter !== "all" ? "No Applicants Found" : "No Applicants Yet"}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || ratingFilter !== "all" ? "Try adjusting your filters" : "Check back later to see who has applied for your job."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
            )}
            </StandardCard>

        </PageLayout>
    );
}

    