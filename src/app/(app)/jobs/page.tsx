
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, MapPin, Users, Star, ShieldCheck, Clock } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { formatDistanceToNow } from "date-fns";


export type Job = {
    id: string;
    title: string;
    description: string;
    categoryName: string;
    budget: number;
    location: string;
    clientName: string;
    clientId: string;
    clientIsVerified?: boolean;
    createdAt: Timestamp;
    applications?: string[]; // Array of provider IDs
};

export default function JobsPage() {
    const { user, subscription, userRole } = useAuth();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    const isSubscribed = subscription?.status === 'active';

    useEffect(() => {
        if (userRole !== 'provider') {
            setLoading(false);
            return;
        }

        const jobsQuery = query(collection(db, "jobs"), where("status", "==", "Open"));
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch job listings.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole, toast]);

    const handleApply = async (jobId: string, providerId: string) => {
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, {
                applications: arrayUnion(providerId)
            });
            toast({ title: 'Success!', description: 'You have successfully applied for the job.' });
        } catch (error) {
            console.error("Error applying for job:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to apply for the job.' });
        }
    };

    if (userRole !== 'provider') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is only available to service providers.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (loading) {
        return (
            <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Find Work</h1>
                    <p className="text-muted-foreground">Browse and apply for available jobs.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-64" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Find Work</h1>
                <p className="text-muted-foreground">Browse and apply for available jobs.</p>
            </div>
            {jobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {jobs.map(job => {
                        const hasApplied = job.applications?.includes(user?.uid || '');
                        return (
                            <Card key={job.id} className="flex flex-col hover:shadow-lg transition-shadow">
                               <Link href={`/jobs/${job.id}`} className="flex flex-col flex-1">
                                    <CardHeader>
                                        <CardTitle className="hover:text-primary transition-colors">{job.title}</CardTitle>
                                        <CardDescription>
                                            <Badge variant="secondary">{job.categoryName}</Badge>
                                        </CardDescription>
                                    </CardHeader>
                                    <CardContent className="flex-1 space-y-4">
                                        <p className="text-muted-foreground text-sm h-12 line-clamp-3">{job.description}</p>
                                        <div className="text-sm space-y-2 text-muted-foreground">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> <span>Posted {formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> <span>{job.location}</span></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {job.clientIsVerified && (
                                                    <div className="flex items-center gap-1 text-green-600">
                                                        <ShieldCheck className="h-4 w-4" /> <span>Verified Client</span>
                                                    </div>
                                                )}
                                            </div>
                                             <div className="flex items-center gap-2">
                                                <Users className="h-4 w-4" /> <span>{job.applications?.length || 0} Applicants</span>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Link>
                                <CardFooter className="flex justify-between items-center bg-secondary/50 p-4">
                                    <div className="font-bold text-lg text-primary">₱{job.budget.toFixed(2)}</div>
                                    <Button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleApply(job.id, user!.uid)
                                        }}
                                        disabled={!isSubscribed || hasApplied}
                                        title={!isSubscribed ? "You need an active subscription to apply" : (hasApplied ? "You have already applied" : "Apply for this job")}
                                    >
                                        {hasApplied ? 'Applied' : (isSubscribed ? 'Apply Now' : <><Star className="mr-2 h-4 w-4" /> Upgrade to Apply</>)}
                                    </Button>
                                </CardFooter>
                            </Card>
                        )
                    })}
                </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Briefcase className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">No Open Jobs</h3>
                        <p>There are currently no open jobs available. Please check back later!</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
