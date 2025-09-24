
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { useProSubscription } from "@/hooks/use-subscription";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, Timestamp, orderBy } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Users, Star, ShieldCheck, Clock, Zap, Crown, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";
import { formatBudget } from '@/lib/utils';
import { JobPriorityService, JobWithPriority } from '@/lib/job-priority-service';
import { PriorityJobGuard } from '@/components/feature-guard';
import { VerifiedProBadge } from '@/components/pro-badge';


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
    const { isPro, isActive } = useProSubscription();
    const { toast } = useToast();
    const t = useTranslations('Jobs');
    const [jobs, setJobs] = useState<JobWithPriority[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'all' | 'priority' | 'high-value' | 'urgent'>('all');

    useEffect(() => {
        if (userRole !== 'provider' || !user) {
            setLoading(false);
            return;
        }

        const fetchJobs = async () => {
            try {
                const jobsWithPriority = await JobPriorityService.getJobsWithPriority(user.uid);
                setJobs(jobsWithPriority);
            } catch (error) {
                console.error("Error fetching jobs:", error);
                toast({ variant: 'destructive', title: t('error'), description: t('couldNotFetchJobs') });
            } finally {
                setLoading(false);
            }
        };

        fetchJobs();
    }, [userRole, user, toast, t]);

    const handleApply = async (jobId: string, providerId: string, job: JobWithPriority) => {
        try {
            if (!db) {
                throw new Error('Database not initialized');
            }
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, {
                applications: arrayUnion(providerId)
            });

            // Record priority job access if applicable
            if (job.isPriorityAccess) {
                await JobPriorityService.recordPriorityJobAccess(
                    providerId,
                    jobId,
                    job.isHighValue ? 'high_value' : job.isUrgent ? 'urgent' : 'priority'
                );
            }

            toast({ title: t('success'), description: t('successfullyApplied') });
        } catch (error) {
            console.error("Error applying for job:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToApply') });
        }
    };

    const getFilteredJobs = () => {
        switch (activeTab) {
            case 'priority':
                return jobs.filter(job => job.isPriorityAccess && job.canAccess);
            case 'high-value':
                return jobs.filter(job => job.isHighValue && job.canAccess);
            case 'urgent':
                return jobs.filter(job => job.isUrgent && job.canAccess);
            default:
                return jobs;
        }
    };

    const getJobPriorityBadge = (job: JobWithPriority) => {
        if (job.isHighValue && job.canAccess) {
            return <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white"><Crown className="h-3 w-3 mr-1" />High Value</Badge>;
        }
        if (job.isUrgent && job.canAccess) {
            return <Badge className="bg-gradient-to-r from-red-400 to-pink-500 text-white"><AlertTriangle className="h-3 w-3 mr-1" />Urgent</Badge>;
        }
        if (job.isPriorityAccess && !job.canAccess) {
            return <Badge variant="outline" className="border-yellow-400 text-yellow-600"><Zap className="h-3 w-3 mr-1" />Pro Only</Badge>;
        }
        return null;
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
            <div className="max-w-6xl mx-auto space-y-8">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-72" />)}
                </div>
            </div>
        )
    }

    const filteredJobs = getFilteredJobs();

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t('title')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('subtitle')}
                    </p>
                </div>
                {isPro && isActive && (
                    <VerifiedProBadge variant="large" />
                )}
            </div>

            {/* Job Filter Tabs */}
            <div className="flex flex-wrap gap-2">
                <Button
                    variant={activeTab === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setActiveTab('all')}
                >
                    All Jobs ({jobs.length})
                </Button>
                {isPro && isActive && (
                    <>
                        <Button
                            variant={activeTab === 'priority' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTab('priority')}
                            className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                        >
                            <Crown className="h-4 w-4 mr-1" />
                            Priority ({jobs.filter(job => job.isPriorityAccess && job.canAccess).length})
                        </Button>
                        <Button
                            variant={activeTab === 'high-value' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTab('high-value')}
                        >
                            <Star className="h-4 w-4 mr-1" />
                            High Value ({jobs.filter(job => job.isHighValue && job.canAccess).length})
                        </Button>
                        <Button
                            variant={activeTab === 'urgent' ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setActiveTab('urgent')}
                        >
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Urgent ({jobs.filter(job => job.isUrgent && job.canAccess).length})
                        </Button>
                    </>
                )}
            </div>

            {filteredJobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {filteredJobs.map(job => {
                        const hasApplied = job.applications?.includes(user?.uid || '');
                        const canApply = job.canAccess || !job.isPriorityAccess;
                        
                        return (
                            <Card key={job.id} className={`flex flex-col hover:shadow-lg transition-shadow ${
                                job.isPriorityAccess && job.canAccess ? 'ring-2 ring-primary/20' : ''
                            }`}>
                                <Link href={`/jobs/${job.id}`} className="flex flex-col flex-1">
                                    <CardHeader>
                                        <div className="flex items-start justify-between gap-2">
                                            <CardTitle className="hover:text-primary transition-colors text-lg">
                                                {job.title}
                                            </CardTitle>
                                            {getJobPriorityBadge(job)}
                                        </div>
                                        <CardDescription>
                                            <Badge variant="secondary">{job.categoryName}</Badge>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <p className="text-sm text-muted-foreground line-clamp-3">{job.description}</p>
                                        
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2 text-sm">
                                                <MapPin className="h-4 w-4 text-muted-foreground" />
                                                <span>{job.location}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Users className="h-4 w-4 text-muted-foreground" />
                                                <span>{job.clientName}</span>
                                                {job.clientIsVerified && (
                                                    <ShieldCheck className="h-4 w-4 text-green-500" />
                                                )}
                                            </div>
                                            <div className="flex items-center gap-2 text-sm">
                                                <Clock className="h-4 w-4 text-muted-foreground" />
                                                <span>{formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}</span>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center justify-between">
                                            <div className="text-lg font-bold text-primary">
                                                {formatBudget(job.budget)}
                                            </div>
                                            {job.budget.negotiable && (
                                                <Badge variant="outline" className="text-xs">Negotiable</Badge>
                                            )}
                                        </div>

                                        {job.isPriorityAccess && !job.canAccess && (
                                            <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                                                <p className="text-sm text-yellow-800 font-medium">
                                                    Pro subscription required for this job
                                                </p>
                                            </div>
                                        )}
                                    </CardContent>
                                </Link>
                                <CardFooter>
                                    {canApply ? (
                                        <Button 
                                            className="w-full" 
                                            disabled={hasApplied}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                if (user?.uid) {
                                                    handleApply(job.id, user.uid, job);
                                                }
                                            }}
                                        >
                                            {hasApplied ? t('applied') : t('apply')}
                                        </Button>
                                    ) : (
                                        <PriorityJobGuard>
                                            <Button className="w-full" disabled>
                                                {t('apply')}
                                            </Button>
                                        </PriorityJobGuard>
                                    )}
                                </CardFooter>
                            </Card>
                        );
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="text-center py-12">
                        <Briefcase className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-lg font-semibold mb-2">
                            {activeTab === 'all' ? t('noJobsFound') : `No ${activeTab} jobs found`}
                        </h3>
                        <p className="text-muted-foreground">
                            {activeTab === 'all' ? t('noJobsDescription') : 
                             `No ${activeTab.replace('-', ' ')} jobs available at the moment.`}
                        </p>
                        {activeTab !== 'all' && !isPro && (
                            <div className="mt-4">
                                <Button onClick={() => setActiveTab('all')}>
                                    View All Jobs
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
