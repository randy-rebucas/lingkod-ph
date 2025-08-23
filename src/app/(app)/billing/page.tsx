
"use client";

import { useState, useEffect } from "react";
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
        return (
             <div className="space-y-6">
                 <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('subtitle')}</p>
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
        <Dialog onOpenChange={(open) => !open && setSelectedInvoice(null)}>
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
             <Card>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>{t('invoiceNumber')}</TableHead>
                                <TableHead>{t('dateIssued')}</TableHead>
                                <TableHead>{t('dueDate')}</TableHead>
                                <TableHead>{t('amount')}</TableHead>
                                <TableHead>{t('status')}</TableHead>
                                <TableHead className="text-right">{t('actions')}</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {invoices.length > 0 ? invoices.map(invoice => (
                                <TableRow key={invoice.id}>
                                    <TableCell className="font-medium">{invoice.invoiceNumber}</TableCell>
                                    <TableCell>{format(invoice.issueDate.toDate(), 'PP')}</TableCell>
                                    <TableCell>{format(invoice.dueDate.toDate(), 'PP')}</TableCell>
                                    <TableCell>₱{invoice.amount.toFixed(2)}</TableCell>
                                    <TableCell>
                                        <Badge variant={getStatusVariant(invoice.status)}>{t(invoice.status.toLowerCase())}</Badge>
                                    </TableCell>
                                     <TableCell className="text-right">
                                        <DialogTrigger asChild>
                                            <Button variant="ghost" size="icon" onClick={() => handleViewDetails(invoice)}>
                                                <Eye className="h-4 w-4" />
                                            </Button>
                                        </DialogTrigger>
                                    </TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={6} className="text-center h-24">
                                        <Receipt className="mx-auto h-12 w-12 text-muted-foreground mb-2"/>
                                        {t('noInvoicesFound')}
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            {selectedInvoice && (
                 <DialogContent className="max-w-4xl">
                    <DialogHeader>
                        <DialogTitle>{t('invoiceDetails', { invoiceNumber: selectedInvoice.invoiceNumber })}</DialogTitle>
                    </DialogHeader>
                    <InvoicePreview invoice={selectedInvoice as any} />
                 </DialogContent>
            )}
        </div>
        </Dialog>
    )
}
