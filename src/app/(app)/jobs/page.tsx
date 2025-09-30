
"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Users, ShieldCheck, Clock, Search, Filter, Grid3X3, List, Eye } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatBudget } from '@/lib/utils';
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Switch } from "@/components/ui/switch";


export type Job = {
    id: string;
    title: string;
    description: string;
    categoryName: string;
    budget: {
      amount: number;
      type: 'Fixed' | 'Daily' | 'Monthly';
      negotiable: boolean;
    };
    location: string;
    clientName: string;
    clientId: string;
    clientIsVerified?: boolean;
    createdAt: Timestamp;
    applications?: string[]; // Array of provider IDs
};

export default function JobsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Jobs');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [displayMode, setDisplayMode] = useState<'grid' | 'list'>('grid');
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState<'date' | 'budget' | 'applicants' | 'title'>('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [filterBudget, setFilterBudget] = useState<string>('all');


    useEffect(() => {
        if (userRole !== 'provider' || !getDb()) {
            setLoading(false);
            return;
        }

        const jobsQuery = query(collection(getDb(), "jobs"), where("status", "==", "Open"), orderBy("createdAt", "desc"));
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('couldNotFetchJobs') });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole, toast, t]);

    const handleApply = async (jobId: string, providerId: string) => {
        if (!getDb()) return;
        try {
            const jobRef = doc(getDb(), "jobs", jobId);
            await updateDoc(jobRef, {
                applications: arrayUnion(providerId)
            });
            toast({ title: t('success'), description: t('successfullyApplied') });
        } catch (error) {
            console.error("Error applying for job:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToApply') });
        }
    };

    const _handleSort = (column: 'date' | 'budget' | 'applicants' | 'title') => {
        if (sortBy === column) {
            setSortOrder(sortOrder === "asc" ? "desc" : "asc");
        } else {
            setSortBy(column);
            setSortOrder("asc");
        }
    };

    // Filter and sort jobs
    const filteredAndSortedJobs = useMemo(() => {
        let filtered = jobs;

        // Apply search filter
        if (searchTerm) {
            filtered = filtered.filter(job => 
                job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.categoryName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                job.location.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(job => job.categoryName === filterCategory);
        }

        // Apply budget filter
        if (filterBudget !== 'all') {
            filtered = filtered.filter(job => {
                const amount = job.budget.amount;
                switch (filterBudget) {
                    case 'under-1000':
                        return amount < 1000;
                    case '1000-5000':
                        return amount >= 1000 && amount <= 5000;
                    case '5000-10000':
                        return amount > 5000 && amount <= 10000;
                    case 'over-10000':
                        return amount > 10000;
                    default:
                        return true;
                }
            });
        }

        // Sort jobs
        return filtered.sort((a, b) => {
            let comparison = 0;
            switch (sortBy) {
                case "date":
                    comparison = a.createdAt.toMillis() - b.createdAt.toMillis();
                    break;
                case "budget":
                    comparison = a.budget.amount - b.budget.amount;
                    break;
                case "applicants":
                    comparison = (a.applications?.length || 0) - (b.applications?.length || 0);
                    break;
                case "title":
                    comparison = a.title.localeCompare(b.title);
                    break;
            }
            return sortOrder === "asc" ? comparison : -comparison;
        });
    }, [jobs, searchTerm, filterCategory, filterBudget, sortBy, sortOrder]);

    // Get unique categories for filter
    const categories = useMemo(() => {
        const uniqueCategories = [...new Set(jobs.map(job => job.categoryName))];
        return uniqueCategories.sort();
    }, [jobs]);

    const getAvatarFallback = (name: string | null | undefined) => {
        if (!name) return "C";
        const parts = name.split(" ");
        if (parts.length > 1 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const JobCard = ({ job, hasApplied }: { job: Job; hasApplied: boolean }) => (
        <Card className="flex flex-col shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
            <Link href={`/jobs/${job.id}`} className="flex flex-col flex-1">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="hover:text-primary transition-colors font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent">{job.title}</CardTitle>
                    <CardDescription>
                        <Badge variant="secondary" className="shadow-soft">{job.categoryName}</Badge>
                    </CardDescription>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                    <p className="text-muted-foreground text-sm h-12 line-clamp-3">{job.description}</p>
                    <div className="text-sm space-y-2 text-muted-foreground">
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4" /> <span>{t('posted')} {job.createdAt ? formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true }) : '...'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4" /> <span>{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            {job.clientIsVerified && (
                                <div className="flex items-center gap-1 text-green-600">
                                    <ShieldCheck className="h-4 w-4" /> <span>{t('verifiedClient')}</span>
                                </div>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4" /> <span>{job.applications?.length || 0} {t('applicants')}</span>
                        </div>
                    </div>
                </CardContent>
            </Link>
            <CardFooter className="flex justify-between items-center bg-gradient-to-r from-muted/30 to-muted/20 border-t border-border/50 p-4">
                <div className="font-semibold text-base text-primary">{formatBudget(job.budget)}</div>
                <Button
                    onClick={(e) => {
                        e.stopPropagation();
                        handleApply(job.id, user!.uid);
                    }}
                    disabled={hasApplied}
                    title={hasApplied ? t('alreadyApplied') : t('applyForThisJob')}
                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground"
                >
                    <div className="flex items-center gap-2">
                        {hasApplied ? t('applied') : t('applyNow')}
                    </div>
                </Button>
            </CardFooter>
        </Card>
    );

    const JobListItem = ({ job, hasApplied }: { job: Job; hasApplied: boolean }) => (
        <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group">
            <CardContent className="p-4 md:p-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div className="flex items-start space-x-4 flex-1 min-w-0">
                        <Avatar className="h-10 w-10 md:h-12 md:w-12 border border-primary/20">
                            <AvatarFallback className="text-sm bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">
                                {getAvatarFallback(job.clientName)}
                            </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
                                <div className="flex-1 min-w-0">
                                    <Link href={`/jobs/${job.id}`} className="block">
                                        <h3 className="text-base md:text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300 truncate">
                                            {job.title}
                                        </h3>
                                    </Link>
                                    <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{job.description}</p>
                                </div>
                                <Badge variant="secondary" className="shadow-soft w-fit">{job.categoryName}</Badge>
                            </div>
                            
                            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}
                                </span>
                                <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {job.location}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Users className="h-3 w-3" />
                                    {job.applications?.length || 0} {t('applicants')}
                                </span>
                                {job.clientIsVerified && (
                                    <span className="flex items-center gap-1 text-green-600">
                                        <ShieldCheck className="h-3 w-3" />
                                        {t('verifiedClient')}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row lg:flex-col xl:flex-row items-start sm:items-center lg:items-end xl:items-center gap-3 lg:gap-4 lg:ml-4">
                        <div className="text-left sm:text-right">
                            <div className="font-semibold text-base text-primary">
                                {formatBudget(job.budget)}
                            </div>
                        </div>
                        <div className="flex items-center gap-2 w-full sm:w-auto">
                            <Button asChild size="sm" variant="outline" className="h-8 px-3 flex-1 sm:flex-none">
                                <Link href={`/jobs/${job.id}`}>
                                    <Eye className="h-3 w-3 mr-1" />
                                    <span className="hidden sm:inline">View</span>
                                </Link>
                            </Button>
                            <Button
                                onClick={() => handleApply(job.id, user!.uid)}
                                disabled={hasApplied}
                                size="sm"
                                className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground flex-1 sm:flex-none"
                            >
                                {hasApplied ? t('applied') : t('applyNow')}
                            </Button>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );

    if (userRole !== 'provider') {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <Card>
                        <CardHeader>
                            <CardTitle>{t('accessDenied')}</CardTitle>
                            <CardDescription>{t('providersOnly')}</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }
    
    if (loading) {
        return (
            <div className="container space-y-8">
                 <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72" />)}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                        <p className="text-muted-foreground mt-1">{t('subtitle')}</p>
                    </div>
                    <div className="flex items-center gap-3">
                        <Badge variant="outline" className="flex items-center gap-1 px-3 py-1">
                            <Briefcase className="h-3 w-3" />
                            {filteredAndSortedJobs.length} {t('jobs')}
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                            {searchTerm && `"${searchTerm}" • `}
                            {filterCategory !== 'all' && `${filterCategory} • `}
                            {filterBudget !== 'all' && `${filterBudget.replace('-', ' ')} • `}
                            {sortBy !== 'date' && `${sortBy} • `}
                            {displayMode === 'list' ? 'List view' : 'Grid view'}
                        </div>
                    </div>
                </div>
            </div>

            {/* Filters and Controls */}
            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="pb-4">
                        <CardTitle className="flex items-center gap-2 text-lg">
                            <Filter className="h-5 w-5 text-primary" />
                            Filters & Search
                        </CardTitle>
                        <CardDescription className="text-sm">Find the perfect job for you</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search" className="text-sm font-medium">Search Jobs</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                                    <Input 
                                        placeholder="Search by title, description, or location..."
                                        className="pl-10 h-9"
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                                <Select value={filterCategory} onValueChange={setFilterCategory}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Categories" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Categories</SelectItem>
                                        {categories.map(category => (
                                            <SelectItem key={category} value={category}>{category}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="budget" className="text-sm font-medium">Budget Range</Label>
                                <Select value={filterBudget} onValueChange={setFilterBudget}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Budgets" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Budgets</SelectItem>
                                        <SelectItem value="under-1000">Under ₱1,000</SelectItem>
                                        <SelectItem value="1000-5000">₱1,000 - ₱5,000</SelectItem>
                                        <SelectItem value="5000-10000">₱5,000 - ₱10,000</SelectItem>
                                        <SelectItem value="over-10000">Over ₱10,000</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="sort" className="text-sm font-medium">Sort By</Label>
                                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                                    const [column, order] = value.split('-');
                                    setSortBy(column as any);
                                    setSortOrder(order as any);
                                }}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="Sort by" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-desc">Newest First</SelectItem>
                                        <SelectItem value="date-asc">Oldest First</SelectItem>
                                        <SelectItem value="budget-desc">Highest Budget</SelectItem>
                                        <SelectItem value="budget-asc">Lowest Budget</SelectItem>
                                        <SelectItem value="applicants-desc">Most Applicants</SelectItem>
                                        <SelectItem value="applicants-asc">Least Applicants</SelectItem>
                                        <SelectItem value="title-asc">Title A-Z</SelectItem>
                                        <SelectItem value="title-desc">Title Z-A</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Display Mode</Label>
                                <div className="flex items-center justify-between p-2 border border-border rounded-md bg-muted/30">
                                    <div className="flex items-center gap-2">
                                        <Grid3X3 className="h-4 w-4 text-muted-foreground" />
                                        <span className="text-sm font-medium">Grid</span>
                                    </div>
                                    <Switch
                                        checked={displayMode === 'list'}
                                        onCheckedChange={(checked) => setDisplayMode(checked ? 'list' : 'grid')}
                                        className="data-[state=checked]:bg-primary"
                                    />
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">List</span>
                                        <List className="h-4 w-4 text-muted-foreground" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Jobs Display */}
            {filteredAndSortedJobs.length > 0 ? (
                <div className="max-w-6xl mx-auto">
                    {displayMode === 'grid' ? (
                        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                            {filteredAndSortedJobs.map(job => {
                                const hasApplied = job.applications?.includes(user?.uid || '') || false;
                                return <JobCard key={job.id} job={job} hasApplied={hasApplied} />;
                            })}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {filteredAndSortedJobs.map(job => {
                                const hasApplied = job.applications?.includes(user?.uid || '') || false;
                                return <JobListItem key={job.id} job={job} hasApplied={hasApplied} />;
                            })}
                        </div>
                    )}
                </div>
            ) : (
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                            <div className="mb-6 p-4 rounded-full bg-muted/50">
                                <Briefcase className="h-12 w-12 text-primary opacity-60" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                {searchTerm || filterCategory !== 'all' || filterBudget !== 'all' 
                                    ? 'No jobs match your criteria' 
                                    : t('noOpenJobs')
                                }
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                                {searchTerm || filterCategory !== 'all' || filterBudget !== 'all'
                                    ? 'Try adjusting your search or filter criteria to find more jobs.'
                                    : t('noOpenJobsDescription')
                                }
                            </p>
                            {(searchTerm || filterCategory !== 'all' || filterBudget !== 'all') && (
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterCategory('all');
                                        setFilterBudget('all');
                                    }}
                                >
                                    Clear Filters
                                </Button>
                            )}
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
