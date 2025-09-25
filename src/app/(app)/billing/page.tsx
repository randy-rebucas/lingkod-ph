
"use client";

import React, { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, Receipt } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice-preview";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";

type InvoiceStatus = "Draft" | "Sent" | "Paid" | "Overdue";

type LineItem = {
    description: string;
    quantity: number;
    price: number;
};

export type Invoice = {
  id: string;
  invoiceNumber: string;
  clientName: string;
  clientEmail: string;
  clientAddress: string;
  amount: number;
  status: InvoiceStatus;
  issueDate: Timestamp;
  dueDate: Timestamp;
  lineItems: LineItem[];
  taxRate: number;
  providerId: string;
};

const getStatusVariant = (status: InvoiceStatus) => {
  switch (status) {
    case "Paid": return "secondary";
    case "Sent": return "default";
    case "Overdue": return "destructive";
    case "Draft": return "outline";
    default: return "outline";
  }
};


export default function BillingPage() {
    const { user } = useAuth();
    const t = useTranslations('Billing');
    const [invoices, setInvoices] = useState<Invoice[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);

    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const invoicesQuery = query(collection(db, "invoices"), where("clientEmail", "==", user.email), orderBy("issueDate", "desc"));
        
        const unsubscribe = onSnapshot(invoicesQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invoice));
            setInvoices(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching invoices:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user]);

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };

    if (loading) {
        return <LoadingState 
            title="Invoice History" 
            description="View and manage your billing invoices" 
        />;
    }

    return (
        <Dialog onOpenChange={(open) => !open && setSelectedInvoice(null)}>
            <PageLayout 
                title="Invoice History" 
                description="View and manage your billing invoices"
            >
                <Card>
                    <CardHeader>
                        <CardTitle>{t('invoiceHistory')}</CardTitle>
                        <CardDescription>{t('invoiceHistoryDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="border-b border-border/50">
                                <TableHead className="font-semibold">{t('invoiceNumber')}</TableHead>
                                <TableHead className="font-semibold">{t('dateIssued')}</TableHead>
                                <TableHead className="font-semibold">{t('dueDate')}</TableHead>
                                <TableHead className="font-semibold">{t('amount')}</TableHead>
                                <TableHead className="font-semibold">{t('status')}</TableHead>
                                <TableHead className="text-right font-semibold">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id} className="hover:bg-muted/30 transition-colors border-b border-border/30">
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{format(invoice.issueDate.toDate(), 'PP')}</TableCell>
                                    <TableCell>{format(invoice.dueDate.toDate(), 'PP')}</TableCell>
                                    <TableCell className="font-semibold text-lg bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">₱{invoice.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(invoice.status)} className="shadow-soft">{t(invoice.status.toLowerCase())}</Badge>
                                    </TableCell>
                                     <TableCell className="text-right">
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(invoice)} className="hover:bg-primary/10 transition-colors">
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-32">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <Receipt className="h-16 w-16 text-primary opacity-60"/>
                                            <div className="space-y-1">
                                                <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">No Invoices Found</h3>
                                                <p className="text-muted-foreground">{t('noInvoicesFound')}</p>
                                            </div>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                    </CardContent>
                </Card>
                {selectedInvoice && (
                     <DialogContent className="max-w-4xl shadow-glow border-0 bg-background/95 backdrop-blur-md">
                        <DialogHeader className="border-b border-border/50 pb-4">
                            <DialogTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {t('invoiceDetails', { invoiceNumber: selectedInvoice.invoiceNumber })}
                            </DialogTitle>
                        </DialogHeader>
                        <InvoicePreview invoice={selectedInvoice as any} />
                     </DialogContent>
                )}
            </PageLayout>
        </Dialog>
    )
}
