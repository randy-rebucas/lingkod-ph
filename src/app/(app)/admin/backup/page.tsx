
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { PlusCircle, Loader2, Download, DatabaseBackup } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { createBackup } from "@/ai/flows/create-backup";

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
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const backupsQuery = query(collection(getDb(), "backups"), orderBy("createdAt", "desc"));
        
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
        } catch (e: unknown) {
            console.error('Error creating backup: ', e);
            toast({
                title: 'Backup Failed',
                description: e instanceof Error ? e.message : 'An unknown error occurred',
                variant: 'destructive',
            });
        } finally {
            setIsCreatingBackup(false);
        }
    }

    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
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
                 <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Data Backup & Recovery</h1>
                    <p className="text-muted-foreground">Manage and download backups of your platform&apos;s data.</p>
                </div>
                <div className=" mx-auto">
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
        <div className="container space-y-8">
            <div className=" mx-auto flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Data Backup & Recovery</h1>
                    <p className="text-muted-foreground">
                        Manage and download backups of your platform&apos;s data.
                    </p>
                </div>
                <Button onClick={handleCreateBackup} disabled={isCreatingBackup} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                    {isCreatingBackup ? <Loader2 className="mr-2 animate-spin"/> : <PlusCircle className="mr-2"/>}
                     {isCreatingBackup ? 'Creating Backup...' : 'Create New Backup'}
                </Button>
            </div>
            <div className=" mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Backup History</CardTitle>
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
            </div>
        </div>
    )
}
