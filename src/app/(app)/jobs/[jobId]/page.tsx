
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, updateDoc, arrayUnion, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, ArrowLeft, MapPin, UserCircle, Briefcase, DollarSign, Clock, ShieldCheck, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";

type Job = {
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
    applications?: string[];
    additionalDetails?: { question: string, answer: string }[];
};


export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, subscription } = useAuth();
    const { toast } = useToast();
    const jobId = params.jobId as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);

    const isSubscribed = subscription?.status === 'active';
    const hasApplied = job?.applications?.includes(user?.uid || '');

    useEffect(() => {
        if (!jobId) return;

        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                const jobRef = doc(db, "jobs", jobId);
                const jobSnap = await getDoc(jobRef);

                if (jobSnap.exists()) {
                    setJob({ id: jobSnap.id, ...jobSnap.data() } as Job);
                } else {
                    toast({ variant: "destructive", title: "Error", description: "Job not found." });
                    router.push("/jobs");
                }
            } catch (error) {
                console.error("Error fetching job details:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to fetch job details." });
            } finally {
                setLoading(false);
            }
        };

        fetchJobDetails();
    }, [jobId, router, toast]);

     const handleApply = async () => {
        if (!user || !job) return;
        try {
            const jobRef = doc(db, "jobs", job.id);
            await updateDoc(jobRef, {
                applications: arrayUnion(user.uid)
            });
            // Optimistically update the state
            setJob(prev => prev ? {...prev, applications: [...(prev.applications || []), user.uid] } : null);
            toast({ title: 'Success!', description: 'You have successfully applied for the job.' });
        } catch (error) {
            console.error("Error applying for job:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to apply for the job.' });
        }
    };


    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                 <Card>
                    <CardHeader><Skeleton className="h-8 w-3/4" /></CardHeader>
                    <CardContent className="space-y-4">
                        <Skeleton className="h-24 w-full" />
                        <Skeleton className="h-10 w-1/4" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    if (!job) {
        return null;
    }


    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">{job.title}</h1>
                    <p className="text-muted-foreground">
                       Posted by {job.clientName}
                    </p>
                </div>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Job Details</CardTitle>
                    <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm text-muted-foreground pt-2">
                         <div className="flex items-center gap-2"><Briefcase className="h-4 w-4" /> <Badge variant="secondary">{job.categoryName}</Badge></div>
                         <div className="flex items-center gap-2"><MapPin className="h-4 w-4" /> {job.location}</div>
                         <div className="flex items-center gap-2"><Clock className="h-4 w-4" /> {formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}</div>
                         <div className="flex items-center gap-2"><Users className="h-4 w-4" /> {job.applications?.length || 0} Applicants</div>
                         {job.clientIsVerified && (
                            <div className="flex items-center gap-1 text-green-600 font-medium">
                                <ShieldCheck className="h-4 w-4" /> Verified Client
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    <Separator />
                    <div>
                        <h3 className="font-semibold mb-2">Description</h3>
                        <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
                    </div>

                    {job.additionalDetails && job.additionalDetails.length > 0 && (
                        <div>
                            <h3 className="font-semibold mb-2">Additional Details</h3>
                            <div className="space-y-3">
                            {job.additionalDetails.map((detail, index) => (
                                <div key={index}>
                                    <p className="font-medium text-sm">{detail.question}</p>
                                    <p className="text-muted-foreground text-sm pl-4 border-l-2 ml-2 mt-1">{detail.answer || "No answer provided."}</p>
                                </div>
                            ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-4 bg-secondary/50 p-6">
                    <div>
                        <p className="text-sm text-muted-foreground">Budget</p>
                        <p className="text-3xl font-bold text-primary">₱{job.budget.toFixed(2)}</p>
                    </div>
                    <Button
                        size="lg"
                        className="w-full"
                        onClick={handleApply}
                        disabled={!isSubscribed || !!hasApplied}
                        title={!isSubscribed ? "You need an active subscription to apply" : (hasApplied ? "You have already applied" : "Apply for this job")}
                    >
                        {hasApplied ? 'Applied' : (isSubscribed ? 'Apply Now' : <><Star className="mr-2 h-4 w-4" /> Upgrade to Apply</>)}
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}

