
"use client";

import { useAuth } from "@/context/auth-context";
import { QuoteFormValues } from "./quote-builder-client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import type { Timestamp } from "firebase/firestore";
import { Logo } from "./logo";
import { useTranslations } from 'next-intl';

const toDate = (date: Date | Timestamp): Date => {
    if (date instanceof Date) {
        return date;
    }
    return date.toDate();
}


export function QuotePreview({ data }: { data: QuoteFormValues }) {
    const { user } = useAuth();
    const t = useTranslations('QuotePreview');

    const subtotal = data.lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    
    // Calculate discount
    let discountAmount = 0;
    if (data.discountType === 'percentage') {
        discountAmount = subtotal * ((Number(data.discountValue) || 0) / 100);
    } else if (data.discountType === 'fixed') {
        discountAmount = Number(data.discountValue) || 0;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * ((Number(data.taxRate) || 0) / 100);
    const total = afterDiscount + taxAmount;
    
    const issueDate = toDate(data.issueDate);
    const validUntil = toDate(data.validUntil);

    return (
        <div className="p-8 bg-background text-foreground text-sm max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-8">
                <div>
                    <Logo />
                    <p className="font-bold mt-4">{user?.displayName}</p>
                    <p>{user?.email}</p>
                </div>
                <div className="text-right">
                    <h2 className="text-3xl font-bold text-muted-foreground mb-2">{t('quote').toUpperCase()}</h2>
                    <p><span className="font-semibold">{t('quoteNumber')}:</span> {data.quoteNumber}</p>
                    <p><span className="font-semibold">{t('date')}:</span> {format(issueDate, "PPP")}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold mb-2">{t('quoteFor')}:</h3>
                <p>{data.clientName}</p>
                <p>{data.clientAddress}</p>
                <p>{data.clientEmail}</p>
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
                    {data.lineItems.map((item, index) => (
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
                    {discountAmount > 0 && (
                        <div className="flex justify-between text-green-600">
                            <span className="text-muted-foreground">Discount:</span>
                            <span className="font-medium">-₱{discountAmount.toFixed(2)}</span>
                        </div>
                    )}
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('tax')} ({data.taxRate}%):</span>
                        <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>{t('total')}:</span>
                        <span>₱{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            {data.notes && (
                <div className="mt-8">
                    <h3 className="font-bold mb-2">Notes:</h3>
                    <p className="text-sm text-muted-foreground">{data.notes}</p>
                </div>
            )}

            {data.terms && (
                <div className="mt-6">
                    <h3 className="font-bold mb-2">Terms & Conditions:</h3>
                    <p className="text-sm text-muted-foreground">{data.terms}</p>
                </div>
            )}

            <div className="mt-12 text-center text-xs text-muted-foreground">
                <p>{t('quoteValidUntil')}: {format(validUntil, "PPP")}</p>
                <p className="mt-2">{t('thankYouForBusiness')}</p>
            </div>
        </div>
    );
}

    