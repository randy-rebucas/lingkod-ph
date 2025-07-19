
"use client";

import { useAuth } from "@/context/auth-context";
import { QuoteFormValues } from "./quote-builder-client";
import { format } from "date-fns";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table";
import { Separator } from "./ui/separator";
import type { Timestamp } from "firebase/firestore";

const Logo = () => (
  <h1 className="text-2xl font-bold font-headline text-primary">
    Lingkod<span className="text-accent">PH</span>
  </h1>
);

const toDate = (date: Date | Timestamp): Date => {
    if (date instanceof Date) {
        return date;
    }
    return date.toDate();
}


export function QuotePreview({ data }: { data: QuoteFormValues }) {
    const { user } = useAuth();

    const subtotal = data.lineItems.reduce((acc, item) => acc + (Number(item.quantity) || 0) * (Number(item.price) || 0), 0);
    const taxAmount = subtotal * ((Number(data.taxRate) || 0) / 100);
    const total = subtotal + taxAmount;
    
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
                    <h2 className="text-3xl font-bold text-muted-foreground mb-2">QUOTE</h2>
                    <p><span className="font-semibold">Quote #:</span> {data.quoteNumber}</p>
                    <p><span className="font-semibold">Date:</span> {format(issueDate, "PPP")}</p>
                </div>
            </div>

            <div className="mb-8">
                <h3 className="font-bold mb-2">Quote for:</h3>
                <p>{data.clientName}</p>
                <p>{data.clientAddress}</p>
                <p>{data.clientEmail}</p>
            </div>
            
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead className="w-[60%]">Description</TableHead>
                        <TableHead className="text-center">Quantity</TableHead>
                        <TableHead className="text-right">Unit Price</TableHead>
                        <TableHead className="text-right">Total</TableHead>
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
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                    </div>
                     <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax ({data.taxRate}%):</span>
                        <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                        <span>Total:</span>
                        <span>₱{total.toFixed(2)}</span>
                    </div>
                </div>
            </div>

            <div className="mt-12 text-center text-xs text-muted-foreground">
                <p>Quote valid until: {format(validUntil, "PPP")}</p>
                <p className="mt-2">Thank you for your business!</p>
            </div>
        </div>
    );
}
