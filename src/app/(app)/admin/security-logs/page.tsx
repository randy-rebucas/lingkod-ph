
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
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
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const logsQuery = query(collection(db, "auditLogs"), orderBy("timestamp", "desc"));
        
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
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is for administrators only.</CardDescription>
                </CardHeader>
            </Card>
        );
    }
    
    if (loading) {
        return (
             <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">Security & Access Logs</h1>
                    <p className="text-muted-foreground">Monitor important actions performed on the platform.</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-64 w-full" />
                    </CardContent>
                </Card>
             </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Security & Access Logs</h1>
                <p className="text-muted-foreground">
                    Monitor important actions performed on the platform.
                </p>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Admin Action Log</CardTitle>
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
    )
}
