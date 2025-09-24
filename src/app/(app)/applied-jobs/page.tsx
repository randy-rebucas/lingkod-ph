"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Briefcase, CheckSquare } from "lucide-react";
import { formatBudget } from "@/lib/utils";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";

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

    useEffect(() => {
        if (!user || userRole !== 'provider') {
            setLoading(false);
            return;
        }

        const jobsQuery = query(collection(db, "jobs"), where("applications", "array-contains", user.uid));
        
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

    if (userRole !== 'provider') {
        return <AccessDenied 
            title={t('accessDenied')} 
            description={t('providersOnly')} 
        />;
    }

    if (loading) {
        return <LoadingState 
            title={t('title')} 
            description={t('subtitle')} 
        />;
    }

    return (
        <PageLayout 
            title={t('title')} 
            description={t('subtitle')}
        >
            
            {appliedJobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {appliedJobs.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`}>
                            <Card className="hover:shadow-lg transition-shadow h-full">
                                <CardHeader>
                                    <CardTitle className="hover:text-primary transition-colors">{job.title}</CardTitle>
                                    <CardDescription>
                                        {t('postedBy', { clientName: job.clientName })}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg text-primary">{formatBudget(job.budget)}</p>
                                        <Badge variant={getStatusVariant(job.status || 'Open')}>{job.status || 'Open'}</Badge>
                                    </div>
                                </CardContent>
                            </Card>
                        </Link>
                    ))}
                </div>
            ) : (
                 <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <CheckSquare className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">{t('noAppliedJobs')}</h3>
                        <p>{t('noAppliedJobsDescription')}</p>
                    </CardContent>
                </Card>
            )}
        </PageLayout>
    );
}
