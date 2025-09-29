
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { format } from "date-fns";
import { Shield } from "lucide-react";

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
    const { userRole } = useAuth();
    const [logs, setLogs] = useState<AuditLog[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const logsQuery = query(collection(getDb(), "auditLogs"), orderBy("timestamp", "desc"));
        
        const unsubscribe = onSnapshot(logsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as AuditLog));
            setLogs(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching audit logs:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);


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
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                    <p className="text-muted-foreground">Monitor important actions performed on the platform.</p>
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
        <div className="container space-y-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Security & Access Logs</h1>
                <p className="text-muted-foreground">
                    Monitor important actions performed on the platform.
                </p>
            </div>
            <div className="max-w-6xl mx-auto">
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
                                        <TableCell className="text-xs">{log.timestamp ? format(log.timestamp.toDate(), 'PPpp') : 'N/A'}</TableCell>
                                        <TableCell className="font-medium">{log.actor.name} ({log.actor.role})</TableCell>
                                        <TableCell>{formatAction(log.action)}</TableCell>
                                        <TableCell className="font-mono text-xs max-w-sm truncate">{JSON.stringify(log.details)}</TableCell>
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
