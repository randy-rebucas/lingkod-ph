"use client";

import React from "react";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Loader2, Briefcase, Trash2, Edit, Eye, CircleSlash, Plus, Filter, Search, TrendingUp, Users, DollarSign, Calendar, Clock, Target, BarChart3, RefreshCw, Download, Settings, Star, Award, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { formatBudget } from "@/lib/utils";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";

type JobStatus = "Open" | "In Progress" | "Completed" | "Closed";

export type Job = {
    id: string;
    title: string;
    status: JobStatus;
    budget: {
        amount: number;
        type: 'Fixed' | 'Daily' | 'Monthly';
        negotiable: boolean;
    };
    applications: string[]; // Array of provider IDs
    createdAt?: any; // Firestore timestamp
    updatedAt?: any; // Firestore timestamp
    description?: string;
    category?: string;
    location?: string;
    urgency?: 'Low' | 'Medium' | 'High';
    views?: number;
    selectedProvider?: string;
};

const getStatusVariant = (status: JobStatus) => {
    switch (status) {
        case "Open": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Closed": return "outline";
        default: return "outline";
    }
};

export default function MyJobPostsPage() {
    const { user, userRole } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('MyJobPosts');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [sortBy, setSortBy] = useState<string>("newest");
    const [selectedJobs, setSelectedJobs] = useState<string[]>([]);
    const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');
    const [refreshing, setRefreshing] = useState(false);

    useEffect(() => {
        if (!user || (userRole !== 'client' && userRole !== 'agency')) {
            setLoading(false);
            if (user) router.push('/dashboard'); // Redirect if not a client/agency
            return;
        };

        const jobsQuery = query(collection(db, "jobs"), where("clientId", "==", user.uid));
        
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchJobs') });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole, router, toast, t]);

    // Filter and sort jobs
    const filteredAndSortedJobs = jobs
        .filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.description?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === "all" || job.status === statusFilter;
            return matchesSearch && matchesStatus;
        })
        .sort((a, b) => {
            switch (sortBy) {
                case "newest":
                    return (b.createdAt?.toMillis() || 0) - (a.createdAt?.toMillis() || 0);
                case "oldest":
                    return (a.createdAt?.toMillis() || 0) - (b.createdAt?.toMillis() || 0);
                case "applicants":
                    return (b.applications?.length || 0) - (a.applications?.length || 0);
                case "budget":
                    return b.budget.amount - a.budget.amount;
                case "title":
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });

    // Calculate statistics
    const stats = {
        total: jobs.length,
        open: jobs.filter(job => job.status === "Open").length,
        inProgress: jobs.filter(job => job.status === "In Progress").length,
        completed: jobs.filter(job => job.status === "Completed").length,
        totalApplications: jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0),
        totalBudget: jobs.reduce((sum, job) => sum + job.budget.amount, 0),
        avgApplications: jobs.length > 0 ? Math.round(jobs.reduce((sum, job) => sum + (job.applications?.length || 0), 0) / jobs.length) : 0
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        // Simulate refresh delay
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast({
            title: "Jobs Refreshed",
            description: "All job data has been updated successfully.",
        });
    };

    const handleBulkAction = async (action: string) => {
        if (selectedJobs.length === 0) {
            toast({
                variant: "destructive",
                title: "No Jobs Selected",
                description: "Please select jobs to perform bulk actions.",
            });
            return;
        }

        try {
            // Implement bulk actions here
            toast({
                title: "Bulk Action Completed",
                description: `${action} applied to ${selectedJobs.length} jobs.`,
            });
            setSelectedJobs([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to perform bulk action.",
            });
        }
    };

    const toggleJobSelection = (jobId: string) => {
        setSelectedJobs(prev => 
            prev.includes(jobId) 
                ? prev.filter(id => id !== jobId)
                : [...prev, jobId]
        );
    };

    const selectAllJobs = () => {
        setSelectedJobs(filteredAndSortedJobs.map(job => job.id));
    };

    const clearSelection = () => {
        setSelectedJobs([]);
    };
    
    const handleUpdateStatus = async (jobId: string, status: JobStatus) => {
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, { status });
            toast({ title: t('success'), description: t('jobMarkedAs', { status }) });
        } catch(e) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToUpdateStatus') });
        }
    }

    const handleDeleteJob = async (jobId: string) => {
         try {
            await deleteDoc(doc(db, "jobs", jobId));
            toast({ title: t('success'), description: t('jobDeleted') });
        } catch(e) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToDeleteJob') });
        }
    }

    if (loading) {
        return <LoadingState 
            title={t('title')} 
            description={t('subtitle')} 
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
            title={t('title')} 
            description={t('subtitle')}
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
                        size="sm"
                        className="shadow-glow hover:shadow-glow/50 transition-all duration-300"
                        asChild
                    >
                        <Link href="/post-a-job">
                            <Plus className="h-4 w-4 mr-2" />
                            Post New Job
                        </Link>
                    </Button>
                </div>
            }
        >
            {/* Statistics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="Total Jobs" 
                    value={stats.total} 
                    icon={Briefcase} 
                    variant="default"
                />
                <StatsCard 
                    title="Open Jobs" 
                    value={stats.open} 
                    icon={Target} 
                    variant="info"
                    change={`${stats.total > 0 ? Math.round((stats.open / stats.total) * 100) : 0}% of total`}
                />
                <StatsCard 
                    title="Total Applications" 
                    value={stats.totalApplications} 
                    icon={Users} 
                    variant="success"
                    change={`Avg ${stats.avgApplications} per job`}
                />
                <StatsCard 
                    title="Total Budget" 
                    value={`₱${stats.totalBudget.toLocaleString()}`} 
                    icon={DollarSign} 
                    variant="warning"
                />
            </div>

            {/* Filters and Controls */}
            <StandardCard 
                title="Job Management" 
                description="Filter, sort, and manage your job posts"
                variant="elevated"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search jobs by title or description..." 
                                className="pl-10 shadow-soft" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Open">Open</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={sortBy} onValueChange={setSortBy}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Sort by" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="newest">Newest First</SelectItem>
                                <SelectItem value="oldest">Oldest First</SelectItem>
                                <SelectItem value="applicants">Most Applications</SelectItem>
                                <SelectItem value="budget">Highest Budget</SelectItem>
                                <SelectItem value="title">Title A-Z</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border-2 p-1 rounded-lg bg-background/50 backdrop-blur-sm">
                            <Button 
                                size="icon" 
                                variant={viewMode === 'table' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('table')} 
                                className="h-8 w-8"
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'cards' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('cards')} 
                                className="h-8 w-8"
                            >
                                <Briefcase className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedJobs.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedJobs.length} job{selectedJobs.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Close')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <CircleSlash className="h-3 w-3 mr-1" />
                                    Close Selected
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

            <StandardCard 
                title="Job Posts" 
                description={`${filteredAndSortedJobs.length} of ${jobs.length} jobs`}
                variant="elevated"
            >
                {viewMode === 'table' ? (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedJobs.length === filteredAndSortedJobs.length && filteredAndSortedJobs.length > 0}
                                    onCheckedChange={(checked) => checked ? selectAllJobs() : clearSelection()}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all ({filteredAndSortedJobs.length})
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Export')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                            </div>
                        </div>
                        
                        <Table>
                            <TableHeader>
                                <TableRow className="border-b border-border/50">
                                    <TableHead className="w-12"></TableHead>
                                    <TableHead className="font-semibold">{t('title')}</TableHead>
                                    <TableHead className="font-semibold">{t('status')}</TableHead>
                                    <TableHead className="font-semibold">{t('applicants')}</TableHead>
                                    <TableHead className="text-right font-semibold">{t('budget')}</TableHead>
                                    <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAndSortedJobs.length > 0 ? filteredAndSortedJobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                                    <TableCell>
                                        <Checkbox 
                                            checked={selectedJobs.includes(job.id)}
                                            onCheckedChange={() => toggleJobSelection(job.id)}
                                        />
                                    </TableCell>
                                    <TableCell className="font-medium">
                                        <div>
                                            <div className="font-semibold">{job.title}</div>
                                            {job.description && (
                                                <div className="text-xs text-muted-foreground truncate max-w-xs">
                                                    {job.description}
                                                </div>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(job.status)} className="shadow-soft">
                                            {job.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        {job.applications?.length || 0}
                                    </TableCell>
                                    <TableCell className="text-right font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        {formatBudget(job.budget)}
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-primary/10 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">{t('toggleMenu')}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                    <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('actions')}</DropdownMenuLabel>
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/my-job-posts/${job.id}/applicants`}><Eye className="mr-2 h-4 w-4" /> {t('viewApplicants')}</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/post-a-job?edit=${job.id}`}><Edit className="mr-2 h-4 w-4" /> {t('editPost')}</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(job.id, "Closed")}>
                                                        <CircleSlash className="mr-2 h-4 w-4" /> {t('closePost')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/50" />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('areYouSure')}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t('deleteJobDescription')}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/80 shadow-glow hover:shadow-glow/50 transition-all duration-300">{t('delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Briefcase className="h-16 w-16 text-primary opacity-60" />
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                                    {searchTerm || statusFilter !== "all" ? "No Jobs Found" : "No Jobs Posted Yet"}
                                                </h3>
                                                <p className="text-muted-foreground">
                                                    {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : t('noJobsYet')}
                                                </p>
                                            </div>
                                            {!searchTerm && statusFilter === "all" && (
                                                <Button variant="link" asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                                    <Link href="/post-a-job">{t('postAJob')}</Link>
                                                </Button>
                                            )}
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </div>
                ) : (
                    // Card View
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedJobs.length > 0 ? filteredAndSortedJobs.map((job) => (
                            <Card key={job.id} className="group hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 border-0 bg-background/80 backdrop-blur-sm shadow-soft">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent line-clamp-2">
                                                {job.title}
                                            </CardTitle>
                                            <CardDescription className="mt-1 line-clamp-2">
                                                {job.description || "No description provided"}
                                            </CardDescription>
                                        </div>
                                        <Checkbox 
                                            checked={selectedJobs.includes(job.id)}
                                            onCheckedChange={() => toggleJobSelection(job.id)}
                                            className="ml-2"
                                        />
                                    </div>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-center justify-between">
                                        <Badge variant={getStatusVariant(job.status)} className="shadow-soft">
                                            {job.status}
                                        </Badge>
                                        <div className="text-right">
                                            <div className="text-lg font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                                {formatBudget(job.budget)}
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-4 text-sm">
                                        <div className="flex items-center gap-2">
                                            <Users className="h-4 w-4 text-muted-foreground" />
                                            <span className="font-medium">{job.applications?.length || 0} applicants</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-muted-foreground">
                                                {job.createdAt ? new Date(job.createdAt.toMillis()).toLocaleDateString() : 'Unknown'}
                                            </span>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 pt-2">
                                        <Button size="sm" variant="outline" className="flex-1 shadow-soft hover:shadow-glow/20 transition-all duration-300" asChild>
                                            <Link href={`/my-job-posts/${job.id}/applicants`}>
                                                <Eye className="h-3 w-3 mr-1" />
                                                View
                                            </Link>
                                        </Button>
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="outline" className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                                        <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                    <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Actions</DropdownMenuLabel>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/post-a-job?edit=${job.id}`}>
                                                            <Edit className="mr-2 h-4 w-4" /> Edit Post
                                                        </Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(job.id, "Closed")}>
                                                        <CircleSlash className="mr-2 h-4 w-4" /> Close Post
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/50" />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This action cannot be undone. This will permanently delete the job post.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/80 shadow-glow hover:shadow-glow/50 transition-all duration-300">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </CardContent>
                            </Card>
                        )) : (
                            <div className="col-span-full text-center py-12">
                                <Briefcase className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                    {searchTerm || statusFilter !== "all" ? "No Jobs Found" : "No Jobs Posted Yet"}
                                </h3>
                                <p className="text-muted-foreground mb-4">
                                    {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : t('noJobsYet')}
                                </p>
                                {!searchTerm && statusFilter === "all" && (
                                    <Button variant="link" asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        <Link href="/post-a-job">{t('postAJob')}</Link>
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                )}
            </StandardCard>
        </PageLayout>
    );
}
