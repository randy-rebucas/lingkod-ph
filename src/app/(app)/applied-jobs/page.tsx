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
        if (!user || userRole !== 'provider' || !db) {
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
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            
            {appliedJobs.length > 0 ? (
                <div className="max-w-6xl mx-auto">
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                        {appliedJobs.map(job => (
                            <Link key={job.id} href={`/jobs/${job.id}`}>
                                <Card className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-0 bg-background/80 backdrop-blur-sm group h-full">
                                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent">{job.title}</CardTitle>
                                        <CardDescription>
                                            {t('postedBy', { clientName: job.clientName })}
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <div className="flex justify-between items-center">
                                            <p className="font-bold text-lg text-primary font-headline bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{formatBudget(job.budget)}</p>
                                            <Badge variant={getStatusVariant(job.status || 'Open')} className="shadow-soft">{job.status || 'Open'}</Badge>
                                        </div>
                                    </CardContent>
                                </Card>
                            </Link>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="max-w-6xl mx-auto">
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                            <CheckSquare className="h-16 w-16 mb-4 text-primary opacity-60" />
                            <h3 className="text-xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('noAppliedJobs')}</h3>
                            <p>{t('noAppliedJobsDescription')}</p>
                        </CardContent>
                    </Card>
                </div>
            )}
        </div>
    );
}
