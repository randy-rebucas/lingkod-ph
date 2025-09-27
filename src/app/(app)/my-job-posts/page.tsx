"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, updateDoc, deleteDoc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  MoreHorizontal, 
  Loader2, 
  Briefcase, 
  Trash2, 
  Edit, 
  Eye, 
  CircleSlash,
  Search
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { Input } from "@/components/ui/input";

type JobStatus = "Open" | "In Progress" | "Completed" | "Closed";

export type Job = {
    id: string;
    title: string;
    status: JobStatus;
    budget: {
        amount: number;
        type: 'Fixed' | 'Daily' | 'Monthly';
        negotiable: boolean;
    };
    applications: string[]; // Array of provider IDs
    description?: string;
    category?: string;
    location?: string;
    clientId: string;
    createdAt?: Date;
    updatedAt?: Date;
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
    const t = useTranslations('MyJobPosts');
    const [jobs, setJobs] = useState<Job[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!user || (userRole !== 'client' && userRole !== 'agency') || !db) {
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
            toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchJobs') });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole, router, toast, t]);

    // Simple search filter
    const filteredJobs = jobs.filter(job => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            job.title.toLowerCase().includes(query) ||
            (job.description && job.description.toLowerCase().includes(query)) ||
            (job.category && job.category.toLowerCase().includes(query)) ||
            (job.location && job.location.toLowerCase().includes(query))
        );
    });

    const handleUpdateStatus = async (jobId: string, newStatus: JobStatus) => {
        if (!db) return;
        
        try {
            await updateDoc(doc(db, "jobs", jobId), {
                status: newStatus,
                updatedAt: new Date()
            });
            toast({ title: t('success'), description: t('jobStatusUpdated') });
        } catch (error) {
            console.error("Error updating job status:", error);
            toast({ variant: "destructive", title: t('error'), description: t('couldNotUpdateJob') });
        }
    };

    const handleDeleteJob = async (jobId: string) => {
        if (!db) return;
        
        try {
            await deleteDoc(doc(db, "jobs", jobId));
            toast({ title: t('success'), description: t('jobDeleted') });
        } catch (error) {
            console.error("Error deleting job:", error);
            toast({ variant: "destructive", title: t('error'), description: t('couldNotDeleteJob') });
        }
    };

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-48 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold">My Job Posts</h1>
                    <p className="text-muted-foreground">Manage your job posts and track applications</p>
                </div>
            </div>

            {/* Search */}
            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                placeholder="Search jobs..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Job Posts Table */}
            <div className="max-w-6xl mx-auto">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50">
                                <TableHead className="font-semibold">Title</TableHead>
                                <TableHead className="font-semibold">Category</TableHead>
                                <TableHead className="font-semibold">Budget</TableHead>
                                <TableHead className="font-semibold">Applications</TableHead>
                                <TableHead className="font-semibold">Status</TableHead>
                                <TableHead className="text-right font-semibold">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredJobs.length > 0 ? filteredJobs.map(job => (
                                <TableRow key={job.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell>{job.category || 'N/A'}</TableCell>
                                    <TableCell className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                                        ₱{job.budget.amount.toLocaleString()} {job.budget.type}
                                    </TableCell>
                                    <TableCell>{job.applications?.length || 0}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(job.status)} className="shadow-soft">
                                            {job.status}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon" className="hover:bg-primary/10 transition-colors">
                                                    <MoreHorizontal className="h-4 w-4" />
                                                </Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent align="end">
                                                <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                <DropdownMenuSeparator />
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/jobs/${job.id}`}>
                                                        <Eye className="h-4 w-4 mr-2" />
                                                        View
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem asChild>
                                                    <Link href={`/post-a-job?edit=${job.id}`}>
                                                        <Edit className="h-4 w-4 mr-2" />
                                                        Edit
                                                    </Link>
                                                </DropdownMenuItem>
                                                <DropdownMenuItem 
                                                    onClick={() => handleUpdateStatus(job.id, job.status === 'Open' ? 'Closed' : 'Open')}
                                                >
                                                    <CircleSlash className="h-4 w-4 mr-2" />
                                                    {job.status === 'Open' ? 'Close' : 'Reopen'}
                                                </DropdownMenuItem>
                                                <DropdownMenuSeparator />
                                                <AlertDialog>
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="h-4 w-4 mr-2" />
                                                            Delete
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                    <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                            <AlertDialogTitle>Delete Job Post</AlertDialogTitle>
                                                            <AlertDialogDescription>
                                                                Are you sure you want to delete "{job.title}"? This action cannot be undone.
                                                            </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                            <AlertDialogAction 
                                                                onClick={() => handleDeleteJob(job.id)}
                                                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                                            >
                                                                Delete
                                                            </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                    </AlertDialogContent>
                                                </AlertDialog>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Briefcase className="h-16 w-16 text-primary opacity-60"/>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                                    No Jobs Found
                                                </h3>
                                                <p className="text-muted-foreground">No jobs match your current search</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
            </div>
            
        </div>
    );
}