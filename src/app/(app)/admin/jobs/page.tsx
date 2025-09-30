
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp, getDoc, doc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Trash2, Eye, CircleSlash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { handleUpdateJobStatus, handleDeleteJob } from "./actions";
// import Link from "next/link";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { formatBudget } from "@/lib/utils";
import { Separator } from "@/components/ui/separator";

type JobStatus = "Open" | "In Progress" | "Completed" | "Closed";

// Extended Job type for details dialog
type Job = {
    id: string;
    title: string;
    clientName: string;
    budget: {
      amount: number;
      type: 'Fixed' | 'Daily' | 'Monthly';
      negotiable: boolean;
    };
    status: JobStatus;
    createdAt: Timestamp;
    description?: string;
    location?: string;
    categoryName?: string;
    additionalDetails?: { question: string, answer: string }[];
};

const getStatusVariant = (status: JobStatus) => {
    switch (status) {
        case "Open": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Closed": return "outline";
        default: return "default";
    }
};

export default function AdminJobsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedJob, setSelectedJob] = useState<Job | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

     useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const jobsQuery = query(collection(getDb(), "jobs"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const onUpdateStatus = async (jobId: string, status: JobStatus) => {
        if (!user) return;
        const result = await handleUpdateJobStatus(jobId, status, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

    const onDeleteJob = async (jobId: string) => {
        if (!user) return;
        const result = await handleDeleteJob(jobId, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    }

    const handleViewDetails = async (jobId: string) => {
        const jobRef = doc(getDb(), 'jobs', jobId);
        const jobSnap = await getDoc(jobRef);
        if (jobSnap.exists()) {
            setSelectedJob({ id: jobSnap.id, ...jobSnap.data()} as Job);
            setIsDetailsOpen(true);
        } else {
            toast({ variant: 'destructive', title: 'Error', description: 'Job details could not be found.' });
        }
    }


    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
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
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Job Post Management</h1>
                    <p className="text-muted-foreground">
                        Monitor and manage all job posts on the platform.
                    </p>
                </div>
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
             </div>
        )
    }

    return (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
        <div className="container space-y-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Job Post Management</h1>
                <p className="text-muted-foreground">
                     Monitor and manage all job posts on the platform.
                </p>
            </div>
            <div className="max-w-6xl mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date Posted</TableHead>
                                    <TableHead>Job Title</TableHead>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Budget</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead className="text-right">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {jobs.length > 0 ? jobs.map(job => (
                                    <TableRow key={job.id}>
                                        <TableCell className="text-xs text-muted-foreground">
                                            {format(job.createdAt.toDate(), 'PP')}
                                        </TableCell>
                                        <TableCell className="font-medium">{job.title}</TableCell>
                                        <TableCell>{job.clientName}</TableCell>
                                        <TableCell>{formatBudget(job.budget)}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(job.status)}>{job.status}</Badge>
                                        </TableCell>
                                         <TableCell className="text-right">
                                            <AlertDialog>
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => handleViewDetails(job.id)}><Eye className="mr-2 h-4 w-4" />View Job Details</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuItem onClick={() => onUpdateStatus(job.id, "Closed")}><CircleSlash className="mr-2 h-4 w-4" />Mark as Closed</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <AlertDialogTrigger asChild>
                                                            <DropdownMenuItem className="text-destructive focus:text-destructive focus:bg-destructive/10" onSelect={(e) => e.preventDefault()}>
                                                                <Trash2 className="mr-2 h-4 w-4" />Delete Job
                                                            </DropdownMenuItem>
                                                        </AlertDialogTrigger>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>This action cannot be undone. This will permanently delete the job post &quot;{job.title}&quot;.</AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction className="bg-destructive hover:bg-destructive/80" onClick={() => onDeleteJob(job.id)}>
                                                            Confirm Deletion
                                                        </AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center h-24">
                                            No jobs found.
                                        </TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
             {selectedJob && (
                <DialogContent className="max-w-2xl">
                    <DialogHeader>
                        <DialogTitle>{selectedJob.title}</DialogTitle>
                        <DialogDescription>
                            Posted by {selectedJob.clientName}
                             <span className="text-muted-foreground mx-2">•</span> 
                             {formatDistanceToNow(selectedJob.createdAt.toDate(), { addSuffix: true })}
                        </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 max-h-[70vh] overflow-y-auto p-1">
                        <div>
                            <h3 className="font-semibold mb-2 text-sm">Description</h3>
                            <p className="text-sm text-muted-foreground whitespace-pre-wrap">{selectedJob.description}</p>
                        </div>
                        <Separator />
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <h4 className="font-semibold">Category</h4>
                                <p className="text-muted-foreground">{selectedJob.categoryName || 'N/A'}</p>
                            </div>
                            <div>
                                <h4 className="font-semibold">Location</h4>
                                <p className="text-muted-foreground">{selectedJob.location || 'N/A'}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Budget</h4>
                                <p className="text-muted-foreground">{formatBudget(selectedJob.budget)}</p>
                            </div>
                             <div>
                                <h4 className="font-semibold">Status</h4>
                                <p className="text-muted-foreground">{selectedJob.status}</p>
                            </div>
                        </div>
                         {selectedJob.additionalDetails && selectedJob.additionalDetails.length > 0 && (
                            <>
                                <Separator />
                                <div>
                                    <h3 className="font-semibold mb-2 text-sm">Additional Details</h3>
                                    <div className="space-y-3">
                                    {selectedJob.additionalDetails.map((detail, index) => (
                                        <div key={index}>
                                            <p className="font-medium text-xs">{detail.question}</p>
                                            <p className="text-muted-foreground text-xs pl-4 border-l-2 ml-2 mt-1">{detail.answer || "No answer provided."}</p>
                                        </div>
                                    ))}
                                    </div>
                                </div>
                            </>
                        )}
                    </div>
                </DialogContent>
            )}
        </div>
        </Dialog>
    )
}
