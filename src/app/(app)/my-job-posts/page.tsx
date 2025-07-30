
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { MoreHorizontal, Loader2, Briefcase, Trash2, Edit, Eye } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";

type JobStatus = "Open" | "In Progress" | "Completed" | "Closed";

export type Job = {
    id: string;
    title: string;
    status: JobStatus;
    budget: number;
    applications: string[]; // Array of provider IDs
};

const getStatusVariant = (status: JobStatus) => {
    switch (status) {
        case "Open": return "default";
        case "In Progress": return "secondary";
        case "Completed": return "secondary";
        case "Closed": return "outline";
        default: return "outline";
    }
};

export default function MyJobPostsPage() {
    const { user, userRole } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!user || (userRole !== 'client' && userRole !== 'agency')) {
            setLoading(false);
            if (user) router.push('/dashboard'); // Redirect if not a client/agency
            return;
        };

        const jobsQuery = query(collection(db, "jobs"), where("clientId", "==", user.uid));
        
        const unsubscribe = onSnapshot(jobsQuery, (snapshot) => {
            const jobsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Job));
            setJobs(jobsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching jobs:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch your job posts." });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole, router, toast]);
    
    const handleUpdateStatus = async (jobId: string, status: JobStatus) => {
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, { status });
            toast({ title: "Success", description: `Job has been marked as ${status}.` });
        } catch(e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to update job status." });
        }
    }

    const handleDeleteJob = async (jobId: string) => {
         try {
            await deleteDoc(doc(db, "jobs", jobId));
            toast({ title: "Success", description: "Job post has been deleted." });
        } catch(e) {
            toast({ variant: "destructive", title: "Error", description: "Failed to delete job post." });
        }
    }

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">My Job Posts</h1>
                    <p className="text-muted-foreground">View and manage all your posted jobs here.</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-48 w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">My Job Posts</h1>
                <p className="text-muted-foreground">
                    View and manage all your posted jobs here.
                </p>
            </div>

            <Card>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Title</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Applicants</TableHead>
                                <TableHead className="text-right">Budget</TableHead>
                                <TableHead><span className="sr-only">Actions</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length > 0 ? jobs.map((job) => (
                                <TableRow key={job.id}>
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(job.status)}>{job.status}</Badge></TableCell>
                                    <TableCell>{job.applications?.length || 0}</TableCell>
                                    <TableCell className="text-right">₱{job.budget.toFixed(2)}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">Toggle menu</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end">
                                                    <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/my-job-posts/${job.id}/applicants`}><Eye className="mr-2 h-4 w-4" /> View Applicants</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/post-a-job?edit=${job.id}`}><Edit className="mr-2 h-4 w-4" /> Edit Post</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onClick={() => handleUpdateStatus(job.id, "Closed")}>Close Post</DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive"><Trash2 className="mr-2 h-4 w-4" /> Delete</DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>This will permanently delete this job post. This action cannot be undone.</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-24 text-center">
                                        <Briefcase className="mx-auto h-12 w-12 text-muted-foreground mb-2" />
                                        You haven't posted any jobs yet.
                                        <Button variant="link" asChild><Link href="/post-a-job">Post a Job</Link></Button>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
