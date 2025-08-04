
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, Timestamp, doc, updateDoc } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

type ReportStatus = "New" | "In Progress" | "Resolved";

type Report = {
    id: string;
    reportedBy: string;
    reportedItemType: 'user' | 'job' | 'booking';
    reportedItemId: string;
    reason: string;
    status: ReportStatus;
    createdAt: Timestamp;
};

const getStatusVariant = (status: ReportStatus) => {
    switch (status) {
        case "New": return "destructive";
        case "In Progress": return "secondary";
        case "Resolved": return "default";
        default: return "outline";
    }
};

const getItemLink = (itemType: string, itemId: string) => {
    switch(itemType) {
        case 'user': return `/providers/${itemId}`;
        case 'job': return `/jobs/${itemId}`;
        case 'booking': return `/bookings`; // Bookings don't have individual pages, link to list
        default: return '#';
    }
}


export default function AdminReportsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const reportsQuery = query(collection(db, "reports"), orderBy("createdAt", "desc"));
        
        const unsubscribe = onSnapshot(reportsQuery, (snapshot) => {
            const reportsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Report));
            setReports(reportsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);

    const handleStatusUpdate = async (reportId: string, status: ReportStatus) => {
        const reportRef = doc(db, "reports", reportId);
        try {
            await updateDoc(reportRef, { status });
            toast({ title: "Status Updated", description: `Report marked as ${status}.`});
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not update report status."});
        }
    }


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
                    <h1 className="text-3xl font-bold font-headline">Admin Reports</h1>
                    <p className="text-muted-foreground">
                        Review and manage user-submitted reports.
                    </p>
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
                <h1 className="text-3xl font-bold font-headline">Admin Reports</h1>
                <p className="text-muted-foreground">
                    Review and manage user-submitted reports.
                </p>
            </div>
             <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Date</TableHead>
                                <TableHead>Reported Item</TableHead>
                                <TableHead>Reason</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reports.length > 0 ? reports.map(report => (
                                <TableRow key={report.id}>
                                    <TableCell className="text-xs text-muted-foreground">
                                        {formatDistanceToNow(report.createdAt.toDate(), { addSuffix: true })}
                                    </TableCell>
                                    <TableCell>
                                        <Button variant="link" asChild className="p-0 h-auto">
                                            <Link href={getItemLink(report.reportedItemType, report.reportedItemId)} target="_blank">
                                                View {report.reportedItemType}
                                            </Link>
                                        </Button>
                                    </TableCell>
                                    <TableCell className="max-w-sm truncate">{report.reason}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                                    </TableCell>
                                     <TableCell>
                                        <DropdownMenu>
                                            <DropdownMenuTrigger asChild>
                                                <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                            </DropdownMenuTrigger>
                                            <DropdownMenuContent>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, "In Progress")}>Mark In Progress</DropdownMenuItem>
                                                <DropdownMenuItem onClick={() => handleStatusUpdate(report.id, "Resolved")}>Mark Resolved</DropdownMenuItem>
                                            </DropdownMenuContent>
                                        </DropdownMenu>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={5} className="text-center h-24">No reports found.</TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    )
}
