"use client";

import React from "react";

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
import { MoreHorizontal, Loader2, Briefcase, Trash2, Edit, Eye, CircleSlash } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { useRouter } from "next/navigation";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import Link from "next/link";
import { formatBudget } from "@/lib/utils";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";

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
            toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchJobs') });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole, router, toast, t]);
    
    const handleUpdateStatus = async (jobId: string, status: JobStatus) => {
        try {
            const jobRef = doc(db, "jobs", jobId);
            await updateDoc(jobRef, { status });
            toast({ title: t('success'), description: t('jobMarkedAs', { status }) });
        } catch(e) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToUpdateStatus') });
        }
    }

    const handleDeleteJob = async (jobId: string) => {
         try {
            await deleteDoc(doc(db, "jobs", jobId));
            toast({ title: t('success'), description: t('jobDeleted') });
        } catch(e) {
            toast({ variant: "destructive", title: t('error'), description: t('failedToDeleteJob') });
        }
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

            <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                    <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Job Posts</CardTitle>
                    <CardDescription className="text-base">Manage your posted jobs and track applications</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50">
                                <TableHead className="font-semibold">{t('title')}</TableHead>
                                <TableHead className="font-semibold">{t('status')}</TableHead>
                                <TableHead className="font-semibold">{t('applicants')}</TableHead>
                                <TableHead className="text-right font-semibold">{t('budget')}</TableHead>
                                <TableHead><span className="sr-only">{t('actions')}</span></TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {jobs.length > 0 ? jobs.map((job) => (
                                <TableRow key={job.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                                    <TableCell className="font-medium">{job.title}</TableCell>
                                    <TableCell><Badge variant={getStatusVariant(job.status)} className="shadow-soft">{job.status}</Badge></TableCell>
                                    <TableCell className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{job.applications?.length || 0}</TableCell>
                                    <TableCell className="text-right font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{formatBudget(job.budget)}</TableCell>
                                    <TableCell className="text-right">
                                        <AlertDialog>
                                            <DropdownMenu>
                                                <DropdownMenuTrigger asChild>
                                                    <Button aria-haspopup="true" size="icon" variant="ghost" className="hover:bg-primary/10 transition-colors">
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">{t('toggleMenu')}</span>
                                                    </Button>
                                                </DropdownMenuTrigger>
                                                <DropdownMenuContent align="end" className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                    <DropdownMenuLabel className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('actions')}</DropdownMenuLabel>
                                                     <DropdownMenuItem asChild>
                                                        <Link href={`/my-job-posts/${job.id}/applicants`}><Eye className="mr-2 h-4 w-4" /> {t('viewApplicants')}</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem asChild>
                                                        <Link href={`/post-a-job?edit=${job.id}`}><Edit className="mr-2 h-4 w-4" /> {t('editPost')}</Link>
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem onSelect={() => handleUpdateStatus(job.id, "Closed")}>
                                                        <CircleSlash className="mr-2 h-4 w-4" /> {t('closePost')}
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator className="bg-border/50" />
                                                    <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem className="text-destructive" onSelect={(e) => e.preventDefault()}>
                                                            <Trash2 className="mr-2 h-4 w-4" /> {t('delete')}
                                                        </DropdownMenuItem>
                                                    </AlertDialogTrigger>
                                                </DropdownMenuContent>
                                            </DropdownMenu>
                                            <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('areYouSure')}</AlertDialogTitle>
                                                    <AlertDialogDescription>{t('deleteJobDescription')}</AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">{t('cancel')}</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteJob(job.id)} className="bg-destructive hover:bg-destructive/80 shadow-glow hover:shadow-glow/50 transition-all duration-300">{t('delete')}</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="h-32 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Briefcase className="h-16 w-16 text-primary opacity-60" />
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">No Jobs Posted Yet</h3>
                                                <p className="text-muted-foreground">{t('noJobsYet')}</p>
                                            </div>
                                            <Button variant="link" asChild className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                                <Link href="/post-a-job">{t('postAJob')}</Link>
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </PageLayout>
    );
}
