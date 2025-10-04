
"use client";

import { useRef, useCallback, useMemo } from 'react';
import { useAuth } from "@/shared/auth";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import type { Timestamp } from "firebase/firestore";
import { Button } from './ui/button';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { Logo } from './logo';
import { Invoice } from '@/app/(app)/invoices/page';
import { useTranslations } from 'next-intl';

const toDate = (date: Date | Timestamp): Date => {
    if (date instanceof Date) {
        return date;
    }
    return date.toDate();
}

export function InvoicePreview({ invoice }: { invoice: Invoice }) {
    const { user } = useAuth();
    const t = useTranslations('InvoicePreview');
    const invoiceRef = useRef<HTMLDivElement>(null);

    // Memoize calculations
    const { subtotal, taxAmount, total, issueDate, dueDate } = useMemo(() => {
        const subtotal = invoice.lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
        const taxAmount = subtotal * ((Number(invoice.taxRate) || 0) / 100);
        const total = subtotal + taxAmount;
        const issueDate = toDate(invoice.issueDate);
        const dueDate = toDate(invoice.dueDate);
        
        return { subtotal, taxAmount, total, issueDate, dueDate };
    }, [invoice.lineItems, invoice.taxRate, invoice.issueDate, invoice.dueDate]);

    const handleDownload = useCallback(() => {
        const input = invoiceRef.current;
        if (!input) return;

        html2canvas(input, { scale: 2 }).then((canvas) => {
            const imgData = canvas.toDataURL('image/png');
            const pdf = new jsPDF('p', 'mm', 'a4');
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const canvasWidth = canvas.width;
            const canvasHeight = canvas.height;
            const ratio = canvasWidth / canvasHeight;
            const width = pdfWidth;
            const height = width / ratio;

            // If height is bigger than a page, split it. For simplicity, we assume it fits.
            pdf.addImage(imgData, 'PNG', 0, 0, width, height > pdfHeight ? pdfHeight : height);
            pdf.save(`Invoice-${invoice.invoiceNumber}.pdf`);
        });
    }, [invoice.invoiceNumber]);

    return (
        <div>
            <div ref={invoiceRef} className="p-8 bg-background text-foreground text-sm">
                <div className="flex justify-between items-start mb-8">
                    <div>
                        <Logo />
                        <p className="font-bold mt-4">{user?.displayName}</p>
                        <p>{user?.email}</p>
                    </div>
                    <div className="text-right">
                        <h2 className="text-3xl font-bold text-muted-foreground mb-2">{t('invoice').toUpperCase()}</h2>
                        <p><span className="font-semibold">{t('invoice')} #:</span> {invoice.invoiceNumber}</p>
                        <p><span className="font-semibold">{t('date')}:</span> {format(issueDate, "PPP")}</p>
                    </div>
                </div>

                <div className="mb-8">
                    <h3 className="font-bold mb-2">{t('billTo')}:</h3>
                    <p>{invoice.clientName}</p>
                    <p>{invoice.clientAddress}</p>
                    <p>{invoice.clientEmail}</p>
                </div>
                
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">{t('description')}</TableHead>
                            <TableHead className="text-center">{t('quantity')}</TableHead>
                            <TableHead className="text-right">{t('unitPrice')}</TableHead>
                            <TableHead className="text-right">{t('total')}</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {invoice.lineItems.map((item, index) => (
                            <TableRow key={index}>
                                <TableCell>{item.description}</TableCell>
                                <TableCell className="text-center">{item.quantity}</TableCell>
                                <TableCell className="text-right">₱{Number(item.price).toFixed(2)}</TableCell>
                                <TableCell className="text-right">₱{(Number(item.quantity) * Number(item.price)).toFixed(2)}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>

                <div className="flex justify-end mt-4">
                    <div className="w-full max-w-sm space-y-2">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('subtotal')}:</span>
                            <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                        </div>
                         <div className="flex justify-between">
                            <span className="text-muted-foreground">{t('tax')} ({invoice.taxRate}%):</span>
                            <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                        </div>
                        <Separator />
                         <div className="flex justify-between text-lg font-bold">
                            <span>{t('totalDue')}:</span>
                            <span>₱{total.toFixed(2)}</span>
                        </div>
                    </div>
                </div>

                <div className="mt-12 text-center text-xs text-muted-foreground">
                    <p>{t('paymentDueBy')}: {format(dueDate, "PPP")}</p>
                    <p className="mt-2">{t('thankYouForBusiness')}</p>
                </div>
            </div>
            <div className="p-4 bg-secondary flex justify-end">
                <Button onClick={handleDownload}>{t('downloadAsPDF')}</Button>
            </div>
        </div>
    );
}
