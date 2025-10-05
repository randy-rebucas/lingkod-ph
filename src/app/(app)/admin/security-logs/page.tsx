
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDbSafe } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Shield, AlertCircle } from "lucide-react";
import { useErrorHandler } from "@/hooks/use-error-handler";

type AuditLog = {
    id: string;
    actor: {
        id: string;
        name: string;
        role: string;
    };
    action: string;
    details: Record<string, any>;
    timestamp: Timestamp;
};

const formatAction = (action: string) => {
    return action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
};

export default function SecurityLogsPage() {
    const { userRole, loading: authLoading } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { handleError } = useErrorHandler();

    useEffect(() => {
        // Wait for auth to finish loading before proceeding
        if (authLoading) {
            return;
        }

        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const db = getDbSafe();
        if (!db) {
            const errorMsg = "Firebase database not initialized";
            console.error(errorMsg);
            setError(errorMsg);
            setLoading(false);
            return;
        }

        try {
            const logsQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
            
            const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
                try {
                    const data = snapshot.docs.map(doc => {
                        const docData = doc.data();
                        return { 
                            id: doc.id, 
                            ...docData,
                            // Ensure timestamp is properly handled
                            timestamp: docData.timestamp || null
                        } as AuditLog;
                    });
                    setLogs(data);
                    setError(null);
                    setLoading(false);
                } catch (parseError) {
                    console.error("Error parsing audit logs:", parseError);
                    handleError(parseError, 'parse audit logs');
                    setError("Failed to parse audit logs");
                    setLoading(false);
                }
            }, (error) => {
                console.error("Error fetching audit logs:", error);
                handleError(error, 'fetch audit logs');
                setError("Failed to fetch audit logs");
                setLoading(false);
            });

            return () => unsubscribe();
        } catch (queryError) {
            console.error("Error setting up audit logs query:", queryError);
            handleError(queryError, 'setup audit logs query');
            setError("Failed to setup audit logs query");
            setLoading(false);
        }
    }, [userRole, authLoading, handleError]);


    // Show loading while auth is loading
    if (authLoading) {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
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
    
    // Show error state if there's an error
    if (error) {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                    <p className="text-muted-foreground">Monitor important actions performed on the platform.</p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent flex items-center gap-2">
                                <AlertCircle className="h-5 w-5 text-destructive" />
                                Error Loading Logs
                            </CardTitle>
                            <CardDescription>{error}</CardDescription>
                        </CardHeader>
                        <CardContent className="p-6">
                            <p className="text-muted-foreground">Please try refreshing the page or contact support if the issue persists.</p>
                        </CardContent>
                    </Card>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
             <div className="container space-y-8">
                 <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                    <p className="text-muted-foreground">Monitor important actions performed on the platform.</p>
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
            <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                <p className="text-muted-foreground">
                    Monitor important actions performed on the platform.
                </p>
            </div>
            <div className=" mx-auto">
                 <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Admin Action Log</CardTitle>
                        <CardDescription>A chronological record of significant events.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Timestamp</TableHead>
                                    <TableHead>Actor</TableHead>
                                    <TableHead>Action</TableHead>
                                    <TableHead>Details</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {logs.length > 0 ? logs.map(log => (
                                    <TableRow key={log.id}>
                                        <TableCell className="text-xs">
                                            {log.timestamp && typeof log.timestamp.toDate === 'function' ? 
                                                format(log.timestamp.toDate(), 'PPpp') : 
                                                log.timestamp && typeof log.timestamp === 'object' && 'seconds' in log.timestamp ?
                                                    format(new Date(log.timestamp.seconds * 1000), 'PPpp') :
                                                    'N/A'
                                            }
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {log.actor?.name || 'Unknown'} ({log.actor?.role || 'Unknown'})
                                        </TableCell>
                                        <TableCell>{log.action ? formatAction(log.action) : 'Unknown Action'}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-sm truncate">
                                            {log.details ? JSON.stringify(log.details) : 'No details'}
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="text-center h-24">
                                            <Shield className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                            No logs found.
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
