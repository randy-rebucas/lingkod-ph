"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, Timestamp } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { Briefcase, CheckSquare } from "lucide-react";
import { Job } from "../jobs/page"; // Reusing the Job type
import { formatBudget } from "@/lib/utils";

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
                    <h1 className="text-3xl font-bold font-headline">Applied Jobs</h1>
                    <p className="text-muted-foreground">Track the status of your job applications.</p>
                </div>
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-48" />)}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Applied Jobs</h1>
                <p className="text-muted-foreground">Track the status of your job applications.</p>
            </div>
            
            {appliedJobs.length > 0 ? (
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {appliedJobs.map(job => (
                        <Link key={job.id} href={`/jobs/${job.id}`}>
                            <Card className="hover:shadow-lg transition-shadow h-full">
                                <CardHeader>
                                    <CardTitle className="hover:text-primary transition-colors">{job.title}</CardTitle>
                                    <CardDescription>
                                        Posted by {job.clientName}
                                    </CardDescription>
                                </CardHeader>
                                <CardContent>
                                    <div className="flex justify-between items-center">
                                        <p className="font-bold text-lg text-primary">{formatBudget(job.budget)}</p>
                                        <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
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
                        <h3 className="text-xl font-semibold">No Applied Jobs</h3>
                        <p>You haven't applied to any jobs yet. Go to the "Find Work" page to get started.</p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
