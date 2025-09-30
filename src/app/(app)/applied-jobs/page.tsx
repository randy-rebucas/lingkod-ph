"use client";

import { useState, useEffect, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { CheckSquare, Search, Filter, MapPin, Clock, ShieldCheck, Eye } from "lucide-react";
import { formatBudget } from "@/lib/utils";
import { formatDistanceToNow } from "date-fns";

// Define the Job type locally to avoid import issues
type Job = {
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
    status?: string;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Open": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Closed": return "outline";
        default: return "outline";
    }
};

export default function AppliedJobsPage() {
    const { user, userRole } = useAuth();
    const t = useTranslations('AppliedJobs');
    const [appliedJobs, setAppliedJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('date');
    const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
    const [filterStatus, setFilterStatus] = useState('all');

    useEffect(() => {
        if (!user || userRole !== 'provider' || !getDb()) {
            setLoading(false);
            return;
        }

        const jobsQuery = query(collection(getDb(), "jobs"), where("applications", "array-contains", user.uid));
        
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setAppliedJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching applied jobs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const _handleSort = (field: string) => {
        if (sortBy === field) {
            setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
        } else {
            setSortBy(field);
            setSortOrder('desc');
        }
    };

    const filteredAndSortedJobs = useMemo(() => {
        const filtered = appliedJobs.filter(job => {
            const matchesSearch = job.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                                job.clientName.toLowerCase().includes(searchTerm.toLowerCase());
            
            const matchesStatus = filterStatus === 'all' || job.status === filterStatus;
            
            return matchesSearch && matchesStatus;
        });

        return filtered.sort((a, b) => {
            let aValue: any, bValue: any;
            
            switch (sortBy) {
                case 'title':
                    aValue = a.title.toLowerCase();
                    bValue = b.title.toLowerCase();
                    break;
                case 'budget':
                    aValue = a.budget.amount;
                    bValue = b.budget.amount;
                    break;
                case 'date':
                default:
                    aValue = a.createdAt.toDate();
                    bValue = b.createdAt.toDate();
                    break;
            }
            
            if (sortOrder === 'asc') {
                return aValue > bValue ? 1 : -1;
            } else {
                return aValue < bValue ? 1 : -1;
            }
        });
    }, [appliedJobs, searchTerm, sortBy, sortOrder, filterStatus]);

    const _getAvatarFallback = (name: string) => {
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    if (userRole !== 'provider') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{t('accessDenied')}</CardTitle>
                    <CardDescription>{t('providersOnly')}</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
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
                            <CheckSquare className="h-3 w-3" />
                            {filteredAndSortedJobs.length} Applied Jobs
                        </Badge>
                        <div className="text-sm text-muted-foreground">
                            {searchTerm && `"${searchTerm}" • `}
                            {filterStatus !== 'all' && `${filterStatus} • `}
                            {sortBy !== 'date' && `${sortBy} • `}
                            {sortOrder === 'asc' ? 'Ascending' : 'Descending'}
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
                        <CardDescription className="text-sm">Find your applied jobs</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                            <div className="space-y-2 sm:col-span-2 lg:col-span-1">
                                <Label htmlFor="search" className="text-sm font-medium">Search Jobs</Label>
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
                                    <Input
                                        id="search"
                                        placeholder="Search by title, description, or client..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10 h-9"
                                    />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Status</Label>
                                <Select value={filterStatus} onValueChange={setFilterStatus}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue placeholder="All Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Status</SelectItem>
                                        <SelectItem value="Open">Open</SelectItem>
                                        <SelectItem value="In Progress">In Progress</SelectItem>
                                        <SelectItem value="Completed">Completed</SelectItem>
                                        <SelectItem value="Closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="space-y-2">
                                <Label className="text-sm font-medium">Sort By</Label>
                                <Select value={`${sortBy}-${sortOrder}`} onValueChange={(value) => {
                                    const [field, order] = value.split('-');
                                    setSortBy(field);
                                    setSortOrder(order as 'asc' | 'desc');
                                }}>
                                    <SelectTrigger className="h-9">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="date-desc">Newest First</SelectItem>
                                        <SelectItem value="date-asc">Oldest First</SelectItem>
                                        <SelectItem value="title-asc">Title A-Z</SelectItem>
                                        <SelectItem value="title-desc">Title Z-A</SelectItem>
                                        <SelectItem value="budget-desc">Highest Budget</SelectItem>
                                        <SelectItem value="budget-asc">Lowest Budget</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
            
            {filteredAndSortedJobs.length > 0 ? (
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {filteredAndSortedJobs.map(job => (
                            <Card key={job.id} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group h-full">
                                <Link href={`/jobs/${job.id}`} className="block h-full">
                                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="flex-1 min-w-0">
                                                <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent line-clamp-2">
                                                    {job.title}
                                                </CardTitle>
                                                <CardDescription className="mt-1">
                                                    {t('postedBy', { clientName: job.clientName })}
                                                </CardDescription>
                                            </div>
                                            <Badge variant={getStatusVariant(job.status || 'Open')} className="shadow-soft shrink-0">
                                                {job.status || 'Open'}
                                            </Badge>
                                        </div>
                                    </CardHeader>
                                    <CardContent className="p-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">{job.description}</p>
                                        
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <span className="font-semibold text-base text-primary">{formatBudget(job.budget)}</span>
                                                <Badge variant="secondary" className="text-xs">{job.categoryName}</Badge>
                                            </div>
                                            
                                            <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <MapPin className="h-3 w-3" />
                                                    {job.location}
                                                </span>
                                                {job.clientIsVerified && (
                                                    <span className="flex items-center gap-1 text-green-600">
                                                        <ShieldCheck className="h-3 w-3" />
                                                        Verified
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                                <div className="p-4 pt-0">
                                    <Button asChild className="w-full" variant="outline">
                                        <Link href={`/jobs/${job.id}`}>
                                            <Eye className="h-4 w-4 mr-2" />
                                            View Details
                                        </Link>
                                    </Button>
                                </div>
                            </Card>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                            <div className="mb-6 p-4 rounded-full bg-muted/50">
                                <CheckSquare className="h-12 w-12 text-primary opacity-60" />
                            </div>
                            <h3 className="text-xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                {searchTerm || filterStatus !== 'all' 
                                    ? 'No applied jobs match your criteria' 
                                    : t('noAppliedJobs')
                                }
                            </h3>
                            <p className="text-muted-foreground max-w-md">
                                {searchTerm || filterStatus !== 'all'
                                    ? 'Try adjusting your search or filter criteria to find more applied jobs.'
                                    : t('noAppliedJobsDescription')
                                }
                            </p>
                            {(searchTerm || filterStatus !== 'all') && (
                                <Button 
                                    variant="outline" 
                                    className="mt-4"
                                    onClick={() => {
                                        setSearchTerm('');
                                        setFilterStatus('all');
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
