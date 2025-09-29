
"use client";

import { useState, useEffect } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Eye, Receipt, Search } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { InvoicePreview } from "@/components/invoice-preview";
import { Input } from "@/components/ui/input";

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
    const [searchQuery, setSearchQuery] = useState("");

    useEffect(() => {
        if (!user || !getDb()) {
            setLoading(false);
            return;
        }

        const invoicesQuery = query(collection(getDb(), "invoices"), where("clientEmail", "==", user.email), orderBy("issueDate", "desc"));

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

    // Simple search filter
    const filteredInvoices = invoices.filter(invoice => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
            invoice.invoiceNumber.toLowerCase().includes(query) ||
            invoice.clientName.toLowerCase().includes(query) ||
            invoice.clientEmail.toLowerCase().includes(query)
        );
    });

    const handleViewDetails = (invoice: Invoice) => {
        setSelectedInvoice(invoice);
    };

    if (loading) {
        return (
            <div className="container space-y-8">
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
        <Dialog onOpenChange={(open) => !open && setSelectedInvoice(null)}>

            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                {/* Search */}
                <div className="max-w-6xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-4">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder={t('searchInvoices')}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-10"
                                />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Invoice Table */}
                <div className="max-w-6xl mx-auto">

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
                            {filteredInvoices.length > 0 ? filteredInvoices.map(invoice => (
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
                                            <Receipt className="h-16 w-16 text-primary opacity-60" />
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

                </div>
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
            </div>
        </Dialog>
    )
}
