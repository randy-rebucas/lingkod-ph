
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Download, DatabaseBackup, ListTree } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createBackup } from "@/ai/flows/create-backup";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";

type Backup = {
    id: string;
    fileName: string;
    downloadUrl: string;
    documentCount: number;
    collections: string[];
    createdAt: Timestamp;
};

export default function AdminBackupPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [isCreatingBackup, setIsCreatingBackup] = useState(false);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const backupsQuery = query(collection(db, "backups"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(backupsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Backup));
            setBackups(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching backups:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleCreateBackup = async () => {
        if (!user) {
            toast({
                title: 'Authentication Error',
                description: 'You must be logged in to create backups.',
                variant: 'destructive',
            });
            return;
        }

        setIsCreatingBackup(true);
        toast({
            title: 'Backup In Progress...',
            description: 'This may take a few moments depending on the size of your database.',
        });
        try {
            const actor = {
                id: user.uid,
                name: user.displayName,
                role: userRole || 'client'
            };
            const result = await createBackup(actor);
            if (result.success) {
                toast({
                    title: 'Backup Successful',
                    description: result.message,
                });
            } else {
                 toast({
                    title: 'Backup Failed',
                    description: result.message,
                    variant: 'destructive',
                });
            }
        } catch (e: any) {
            console.error('Error creating backup: ', e);
            toast({
                title: 'Backup Failed',
                description: e.message,
                variant: 'destructive',
            });
        } finally {
            setIsCreatingBackup(false);
        }
    }

    if (userRole !== 'admin') {
        return <AccessDenied 
            title="Access Denied" 
            description="This page is for administrators only." 
        />;
    }
    
    if (loading) {
        return <LoadingState 
            title="Data Backup & Recovery" 
            description="Manage and download backups of your platform's data." 
        />;
    }

    return (
        <PageLayout 
            title="Data Backup & Recovery" 
            description="Manage and download backups of your platform's data."
            action={
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup}>
                    {isCreatingBackup ? <Loader2 className="mr-2 animate-spin"/> : <PlusCircle className="mr-2"/>}
                     {isCreatingBackup ? 'Creating Backup...' : 'Create New Backup'}
                </Button>
            }
        >
             <Card>
                <CardHeader>
                    <CardTitle>Backup History</CardTitle>
                    <CardDescription>Backups are stored as JSON files in your Firebase Storage.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date Created</TableHead>
                                <TableHead>File Name</TableHead>
                                <TableHead>Document Count</TableHead>
                                <TableHead className="text-right">Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {backups.length > 0 ? backups.map(backup => (
                                <TableRow key={backup.id}>
                                    <TableCell>{backup.createdAt ? format(backup.createdAt.toDate(), 'PPpp') : 'N/A'}</TableCell>
                                    <TableCell className="font-mono text-xs">{backup.fileName}</TableCell>
                                    <TableCell>{backup.documentCount.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        <Button asChild variant="outline" size="sm">
                                            <a href={backup.downloadUrl} target="_blank" rel="noopener noreferrer">
                                                <Download className="mr-2 h-4 w-4"/> Download
                                            </a>
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center h-24">
                                        <DatabaseBackup className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                        No backups found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </PageLayout>
    )
}
