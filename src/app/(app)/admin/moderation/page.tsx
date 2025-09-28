
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, where, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, CheckCircle, AlertOctagon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { handleUpdateReportStatus } from "./actions";
import Link from "next/link";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";


type ReportStatus = "New" | "Action Taken" | "Dismissed";

type Report = {
    id: string;
    reportedItemId: string;
    reportedItemType: 'job' | 'user';
    reason: string;
    reportedBy: string; // UID of the reporter
    status: ReportStatus;
    createdAt: Timestamp;
};

const getStatusVariant = (status: ReportStatus) => {
    switch (status) {
        case "New": return "destructive";
        case "Action Taken": return "secondary";
        case "Dismissed": return "outline";
        default: return "default";
    }
};

export default function AdminModerationPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [reports, setReports] = useState<Report[]>([]);
    const [loading, setLoading] = useState(true);

     useEffect(() => {
        if (userRole !== 'admin' || !db) {
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

    const onUpdateStatus = async (reportId: string, status: 'Action Taken' | 'Dismissed') => {
        if (!user) return;
        const result = await handleUpdateReportStatus(reportId, status, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

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
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Content Moderation</h1>
                    <p className="text-muted-foreground">
                        Review and manage user-submitted reports.
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

    const newReports = reports.filter(r => r.status === 'New');
    const resolvedReports = reports.filter(r => r.status !== 'New');
    
    const ReportsTable = ({ data }: { data: Report[] }) => (
        <Table>
            <TableHeader>
                <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Reason</TableHead>
                    <TableHead>Reported By</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
            </TableHeader>
            <TableBody>
                {data.length > 0 ? data.map(report => (
                    <TableRow key={report.id}>
                        <TableCell className="text-xs text-muted-foreground">
                            {format(report.createdAt.toDate(), 'PP')}
                        </TableCell>
                        <TableCell className="font-medium capitalize">{report.reportedItemType}</TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-xs truncate">{report.reason}</TableCell>
                        <TableCell className="font-mono text-xs">{report.reportedBy.slice(0,10)}...</TableCell>
                        <TableCell>
                            <Badge variant={getStatusVariant(report.status)}>{report.status}</Badge>
                        </TableCell>
                            <TableCell className="text-right">
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                        <DropdownMenuItem asChild>
                                            <Link href={report.reportedItemType === 'job' ? `/jobs/${report.reportedItemId}` : `/providers/${report.reportedItemId}`} target="_blank"><Eye className="mr-2 h-4 w-4" />View Item</Link>
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem onClick={() => onUpdateStatus(report.id, "Action Taken")}><AlertOctagon className="mr-2 h-4 w-4 text-destructive" />Mark as Action Taken</DropdownMenuItem>
                                        <DropdownMenuItem onClick={() => onUpdateStatus(report.id, "Dismissed")}><CheckCircle className="mr-2 h-4 w-4 text-green-500" />Dismiss Report</DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </TableCell>
                    </TableRow>
                )) : (
                    <TableRow>
                        <TableCell colSpan={6} className="text-center h-24">
                            No reports in this category.
                        </TableCell>
                    </TableRow>
                )}
            </TableBody>
        </Table>
    );

    return (
        <div className="container space-y-8">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Content Moderation</h1>
                <p className="text-muted-foreground">
                     Review and manage user-submitted reports.
                </p>
            </div>
            <div className="max-w-6xl mx-auto">
                 <Tabs defaultValue="new">
                    <TabsList>
                        <TabsTrigger value="new">New Reports</TabsTrigger>
                        <TabsTrigger value="resolved">Resolved Reports</TabsTrigger>
                    </TabsList>
                    <TabsContent value="new">
                         <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardContent>
                                <ReportsTable data={newReports} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="resolved">
                         <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardContent>
                                <ReportsTable data={resolvedReports} />
                            </CardContent>
                        </Card>
                    </TabsContent>
                 </Tabs>
            </div>
        </div>
    )
}
