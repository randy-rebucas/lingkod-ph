
"use client";

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { getDb } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { CalendarIcon, Loader2, PlusCircle, Trash2, Wand2 } from 'lucide-react';
import { Invoice } from '@/app/(app)/invoices/page';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Separator } from './ui/separator';
import { generateQuoteDescription } from '@/ai/flows/generate-quote-description';
import { useTranslations } from 'next-intl';

const lineItemSchema = z.object({
    description: z.string().min(1, "Description is required."),
    quantity: z.coerce.number().min(0.1, "Quantity must be at least 0.1."),
    price: z.coerce.number().min(0, "Price cannot be negative."),
});

const _invoiceSchema = z.object({
    clientName: z.string().min(1, "Client name is required."),
    clientEmail: z.string().email("Invalid email address."),
    clientAddress: z.string().min(1, "Client address is required."),
    invoiceNumber: z.string().min(1, "Invoice number is required."),
    issueDate: z.date({ required_error: "Issue date is required." }),
    dueDate: z.date({ required_error: "Due date is required." }),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
    taxRate: z.coerce.number().min(0, "Tax rate cannot be negative.").optional().default(0),
    status: z.enum(["Draft", "Sent", "Paid", "Overdue"]).default("Draft"),
});

type InvoiceFormValues = z.infer<typeof _invoiceSchema>;

type AddEditInvoiceDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    invoice: Invoice | null;
    onInvoiceSaved: () => void;
};

export function AddEditInvoiceDialog({ isOpen, setIsOpen, invoice, onInvoiceSaved }: AddEditInvoiceDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('Components');
    const [isSaving, setIsSaving] = useState(false);
    const [generatingIndex, setGeneratingIndex] = useState<number | null>(null);

    const form = useForm<InvoiceFormValues>({
        resolver: zodResolver(z.object({
            clientName: z.string().min(1, t('clientNameRequired')),
            clientEmail: z.string().email(t('invalidEmail')),
            clientAddress: z.string().min(1, t('clientAddressRequired')),
            invoiceNumber: z.string().min(1, t('invoiceNumberRequired')),
            issueDate: z.date({ required_error: t('issueDateRequired') }),
            dueDate: z.date({ required_error: t('dueDateRequired') }),
            lineItems: z.array(z.object({
                description: z.string().min(1, t('descriptionRequired')),
                quantity: z.coerce.number().min(0.1, t('quantityMin')),
                price: z.coerce.number().min(0, t('priceCannotBeNegative')),
            })).min(1, t('atLeastOneLineItem')),
            taxRate: z.coerce.number().min(0, t('taxRateCannotBeNegative')).optional().default(0),
            status: z.enum(["Draft", "Sent", "Paid", "Overdue"]).default("Draft"),
        })),
        defaultValues: {
            clientName: "",
            clientEmail: "",
            clientAddress: "",
            invoiceNumber: `INV-${Date.now()}`,
            issueDate: new Date(),
            dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
            lineItems: [{ description: "", quantity: 1, price: 0 }],
            taxRate: 12,
            status: "Draft",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    useEffect(() => {
        if (invoice) {
            form.reset({
                ...invoice,
                issueDate: invoice.issueDate.toDate(),
                dueDate: invoice.dueDate.toDate(),
            });
        } else {
            form.reset({
                clientName: "",
                clientEmail: "",
                clientAddress: "",
                invoiceNumber: `INV-${Date.now()}`,
                issueDate: new Date(),
                dueDate: new Date(new Date().setDate(new Date().getDate() + 30)),
                lineItems: [{ description: "", quantity: 1, price: 0 }],
                taxRate: 12,
                status: "Draft",
            });
        }
    }, [invoice, form, isOpen]);

    const watchedLineItems = form.watch("lineItems");
    const watchedTaxRate = form.watch("taxRate");
    
    // Memoize calculations to prevent unnecessary recalculations
    const { subtotal, taxAmount, total } = useMemo(() => {
        const subtotal = watchedLineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
        const taxAmount = subtotal * ((watchedTaxRate || 0) / 100);
        const total = subtotal + taxAmount;
        return { subtotal, taxAmount, total };
    }, [watchedLineItems, watchedTaxRate]);

    const handleGenerateDescription = useCallback(async (index: number) => {
        setGeneratingIndex(index);
        const itemName = form.getValues(`lineItems.${index}.description`);
        if (!itemName || itemName.trim().length < 3) {
            toast({
                variant: 'destructive',
                title: t('itemNameRequired'),
                description: t('enterItemName'),
            });
            setGeneratingIndex(null);
            return;
        }

        try {
            const result = await generateQuoteDescription({ itemName });
            if (result.description) {
                form.setValue(`lineItems.${index}.description`, result.description, { shouldValidate: true });
                toast({
                    title: t('success'),
                    description: t('aiDescriptionGenerated'),
                });
            }
        } catch (error) {
            handleError(error, 'generate invoice description');
        } finally {
            setGeneratingIndex(null);
        }
    }, [form, toast, t, handleError]);


    const onSubmit = useCallback(async (data: InvoiceFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        try {
            const finalData = {
                ...data,
                providerId: user.uid,
                amount: total,
                issueDate: Timestamp.fromDate(data.issueDate),
                dueDate: Timestamp.fromDate(data.dueDate),
            };

            if (invoice?.id) {
                const invoiceRef = doc(getDb(), 'invoices', invoice.id);
                await updateDoc(invoiceRef, finalData);
                toast({ title: t('success'), description: t('invoiceUpdated') });
            } else {
                await addDoc(collection(getDb(), 'invoices'), {
                    ...finalData,
                    createdAt: serverTimestamp(),
                });
                toast({ title: t('success'), description: t('invoiceCreated') });
            }
            onInvoiceSaved();
        } catch (error) {
            handleError(error, 'save invoice');
        } finally {
            setIsSaving(false);
        }
    }, [user, total, invoice, onInvoiceSaved, toast, t, handleError]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="max-w-4xl">
                <DialogHeader>
                    <DialogTitle>{invoice ? t('editInvoice') : t('createNewInvoice')}</DialogTitle>
                    <DialogDescription>
                        {invoice ? t('updateInvoiceDetails') : t('createInvoiceDetails')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="max-h-[80vh] overflow-y-auto pr-4 pl-1">
                       <div className="space-y-4">
                            {/* Client Info */}
                            <div className="p-4 border rounded-lg">
                                <h3 className="text-lg font-medium mb-4">Client Information</h3>
                                <div className="grid md:grid-cols-2 gap-4 mb-4">
                                    <FormField control={form.control} name="clientName" render={({ field }) => (
                                        <FormItem><FormLabel>Client Name</FormLabel><FormControl><Input placeholder="Juan Dela Cruz" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="clientEmail" render={({ field }) => (
                                        <FormItem><FormLabel>Client Email</FormLabel><FormControl><Input type="email" placeholder="juan@example.com" {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                </div>
                                <FormField control={form.control} name="clientAddress" render={({ field }) => (
                                    <FormItem><FormLabel>Client Address</FormLabel><FormControl><Textarea placeholder="123 Rizal St, Brgy. Poblacion, Quezon City" {...field} rows={2} /></FormControl><FormMessage /></FormItem>
                                )} />
                            </div>

                            {/* Invoice Details */}
                             <div className="p-4 border rounded-lg">
                                <h3 className="text-lg font-medium mb-4">Invoice Details</h3>
                                <div className="grid md:grid-cols-3 gap-4">
                                    <FormField control={form.control} name="invoiceNumber" render={({ field }) => (
                                        <FormItem><FormLabel>Invoice Number</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                                    )} />
                                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="mb-1">Issue Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent></Popover><FormMessage />
                                    </FormItem>
                                    )} />
                                     <FormField control={form.control} name="dueDate" render={({ field }) => (
                                        <FormItem className="flex flex-col"><FormLabel className="mb-1">Due Date</FormLabel><Popover><PopoverTrigger asChild><FormControl>
                                            <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}<CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                            </Button>
                                        </FormControl></PopoverTrigger><PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                        </PopoverContent></Popover><FormMessage />
                                    </FormItem>
                                    )} />
                                </div>
                            </div>
                            
                            {/* Line Items */}
                            <div className="p-4 border rounded-lg">
                                <h3 className="text-lg font-medium mb-4">Line Items</h3>
                                <div className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="grid grid-cols-12 gap-2 items-start relative border-b pb-4">
                                            <div className="col-span-6">
                                                <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                                                    <FormItem>
                                                        <div className="flex justify-between items-center">
                                                            <FormLabel>Description</FormLabel>
                                                            <Button type="button" variant="ghost" size="sm" onClick={() => handleGenerateDescription(index)} disabled={generatingIndex === index}>
                                                                {generatingIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4 text-accent" />}
                                                                <span className="ml-2 text-xs">{generatingIndex === index ? 'Generating...' : 'AI'}</span>
                                                            </Button>
                                                        </div>
                                                        <FormControl><Textarea placeholder="e.g., Deep House Cleaning" {...field} rows={1} /></FormControl>
                                                        <FormMessage />
                                                    </FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-2">
                                                <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                                                    <FormItem><FormLabel>Qty</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-2">
                                                <FormField control={form.control} name={`lineItems.${index}.price`} render={({ field }) => (
                                                    <FormItem><FormLabel>Unit Price</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem>
                                                )} />
                                            </div>
                                            <div className="col-span-1">
                                                <FormLabel>Total</FormLabel>
                                                <div className="font-medium h-10 flex items-center">
                                                    ₱{((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.price || 0)).toFixed(2)}
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex items-end h-full">
                                                 <Button type="button" size="icon" variant="ghost" className="text-destructive hover:text-destructive h-10 w-10" onClick={() => remove(index)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" onClick={() => append({ description: "", quantity: 1, price: 0 })}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                                    </Button>
                                </div>
                                <Separator className="my-4" />
                                 {/* Totals */}
                                <div className="flex justify-end">
                                    <div className="w-full max-w-xs space-y-2">
                                        <div className="flex justify-between items-center">
                                            <span className="text-muted-foreground">Subtotal</span>
                                            <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                                        </div>
                                         <div className="flex items-center justify-between">
                                            <FormField control={form.control} name="taxRate" render={({ field }) => (
                                                <FormItem className="flex items-center gap-2">
                                                    <FormLabel className="text-muted-foreground m-0">Tax (%)</FormLabel>
                                                    <FormControl><Input type="number" className="w-20 h-8" {...field} /></FormControl>
                                                </FormItem>
                                            )} />
                                            <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                                        </div>
                                        <Separator />
                                         <div className="flex justify-between font-bold text-lg">
                                            <span>Total</span>
                                            <span>₱{total.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                         <DialogFooter className="mt-6">
                             <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? 'Saving...' : (invoice ? 'Save Changes' : 'Create Invoice')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
