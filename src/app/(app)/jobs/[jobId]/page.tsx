
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
// import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { doc, getDoc, updateDoc, arrayUnion, Timestamp, addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, MapPin, Briefcase, Clock, ShieldCheck, Users, Flag } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { formatBudget } from "@/lib/utils";


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
    applications?: string[];
    additionalDetails?: { question: string, answer: string }[];
};


export default function JobDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const { user, userRole: _userRole } = useAuth();
    const { toast } = useToast();
    const jobId = params.jobId as string;

    const [job, setJob] = useState<Job | null>(null);
    const [loading, setLoading] = useState(true);
    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    const hasApplied = job?.applications?.includes(user?.uid || '');

    useEffect(() => {
        if (!jobId) return;

        const fetchJobDetails = async () => {
            setLoading(true);
            try {
                const jobRef = doc(getDb(), "jobs", jobId);
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
        if (!user || !job || !getDb()) return;
        try {
            const jobRef = doc(getDb(), "jobs", job.id);
            await updateDoc(jobRef, {
                applications: arrayUnion(user.uid)
            });
            // Optimistically update the state
            setJob(prev => prev ? { ...prev, applications: [...(prev.applications || []), user.uid] } : null);
            toast({ title: 'Success!', description: 'You have successfully applied for the job.' });
        } catch (error) {
            console.error("Error applying for job:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to apply for the job.' });
        }
    };

    const handleReportJob = async () => {
        if (!user || !job || !reportReason || !getDb()) {
            toast({ variant: "destructive", title: "Error", description: "Please provide a reason for your report." });
            return;
        }
        setIsReporting(true);
        try {
            await addDoc(collection(getDb(), "reports"), {
                reportedBy: user.uid,
                reportedItemType: 'job',
                reportedItemId: job.id,
                reason: reportReason,
                status: 'New',
                createdAt: serverTimestamp(),
            });
            toast({ title: 'Report Submitted', description: 'Thank you for your feedback. An admin will review your report shortly.' });
            setReportReason("");
        } catch (error) {
            console.error("Error submitting report:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to submit your report." });
        } finally {
            setIsReporting(false);
        }
    }


    if (loading) {
        return (
            <div className="container mx-auto space-y-8 w-full max-w-7xl px-4">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-soft">
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
        <div className="container mx-auto space-y-8 w-full max-w-7xl px-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {job.title}
                        </h1>
                        <p className="text-muted-foreground mt-1">
                            Posted by {job.clientName}
                        </p>
                    </div>
                </div>
                <Dialog>
                    <DialogTrigger asChild>
                        <Button variant="outline" size="sm" className="text-muted-foreground">
                            <Flag className="mr-2 h-4 w-4" /> Report Job
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Report Job Post</DialogTitle>
                            <DialogDescription>
                                Please provide a reason for reporting this job. Your feedback is important for maintaining a safe community.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-2">
                            <Label htmlFor="report-reason">Reason</Label>
                            <Textarea
                                id="report-reason"
                                value={reportReason}
                                onChange={(e) => setReportReason(e.target.value)}
                                placeholder="e.g., This job seems like a scam, the description is inappropriate..."
                                className="min-h-[100px]"
                            />
                        </div>
                        <DialogFooter>
                            <DialogClose asChild><Button variant="ghost">Cancel</Button></DialogClose>
                            <Button onClick={handleReportJob} disabled={isReporting}>
                                {isReporting ? 'Submitting...' : 'Submit Report'}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>

            <Card className="bg-background/60 backdrop-blur-sm border-0 shadow-soft">
                <CardHeader>
                    <CardTitle className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Job Details</CardTitle>
                    <div className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-muted-foreground pt-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="h-4 w-4 text-primary" />
                            <Badge variant="secondary" className="shadow-soft">{job.categoryName}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                            <MapPin className="h-4 w-4 text-primary" />
                            <span className="font-medium">{job.location}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-primary" />
                            <span>{formatDistanceToNow(job.createdAt.toDate(), { addSuffix: true })}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-primary" />
                            <span className="font-medium">{job.applications?.length || 0} Applicants</span>
                        </div>
                        {job.clientIsVerified && (
                            <div className="flex items-center gap-2 text-green-600 font-semibold">
                                <ShieldCheck className="h-4 w-4" />
                                <span>Verified Client</span>
                            </div>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="space-y-8">
                    <Separator className="bg-border/50" />
                    <div className="space-y-4">
                        <h3 className="text-xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Description</h3>
                        <div className="p-6 rounded-xl bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                            <p className="text-muted-foreground whitespace-pre-wrap leading-relaxed">{job.description}</p>
                        </div>
                    </div>

                    {job.additionalDetails && job.additionalDetails.length > 0 && (
                        <div className="space-y-4">
                            <h3 className="text-xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Additional Details</h3>
                            <div className="space-y-4">
                                {job.additionalDetails.map((detail, index) => (
                                    <div key={index} className="p-4 rounded-lg bg-gradient-to-r from-muted/20 to-muted/10 border border-border/30 shadow-soft">
                                        <p className="font-semibold text-sm mb-2 text-foreground">{detail.question}</p>
                                        <p className="text-muted-foreground text-sm leading-relaxed pl-4 border-l-2 border-primary/30">{detail.answer || "No answer provided."}</p>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </CardContent>
                <CardFooter className="flex-col items-start gap-6 bg-gradient-to-r from-muted/40 to-muted/20 p-8 border-t border-border/50">
                    <div className="text-center w-full">
                        <p className="text-sm text-muted-foreground font-medium mb-2">Total Budget</p>
                        <p className="text-4xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{formatBudget(job.budget)}</p>
                        {job.budget.negotiable && (
                            <p className="text-xs text-muted-foreground mt-2">Budget is negotiable</p>
                        )}
                    </div>
                    <Button
                        size="lg"
                        className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300"
                        onClick={handleApply}
                        disabled={!!hasApplied}
                        title={hasApplied ? "You have already applied" : "Apply for this job"}
                    >
                        {hasApplied ? 'Applied' : 'Apply Now'}
                    </Button>
                </CardFooter>
            </Card>

        </div>
    );
}
