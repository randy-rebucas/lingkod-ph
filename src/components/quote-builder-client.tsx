
"use client";

import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CalendarIcon, PlusCircle, Sparkles, Trash2, Loader2, Eye, Percent, Copy, Save, Send, Download, Calculator } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useErrorHandler } from "@/hooks/use-error-handler";
import { useState, useCallback } from "react";
import { generateQuoteDescription } from "@/ai/flows/generate-quote-description";
import { Separator } from "./ui/separator";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { QuotePreview } from "./quote-preview";
import { useTranslations } from 'next-intl';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

// Define schemas and types outside component for export
const createLineItemSchema = (t: (key: string) => string) => z.object({
    description: z.string().min(1, t('descriptionRequired')),
    quantity: z.coerce.number().min(0.1, t('quantityMin')),
    price: z.coerce.number().min(0, t('priceCannotBeNegative')),
});

const createQuoteSchema = (t: (key: string) => string, lineItemSchema: z.ZodSchema) => z.object({
    clientName: z.string().min(1, t('clientNameRequired')),
    clientEmail: z.string().email(t('invalidEmail')),
    clientAddress: z.string().min(1, t('clientAddressRequired')),
    quoteNumber: z.string().min(1, t('quoteNumberRequired')),
    issueDate: z.date({ required_error: t('issueDateRequired') }),
    validUntil: z.date({ required_error: t('validUntilRequired') }),
    lineItems: z.array(lineItemSchema).min(1, t('atLeastOneLineItem')),
    taxRate: z.coerce.number().min(0, t('taxRateCannotBeNegative')).optional().default(0),
    discountType: z.enum(['none', 'percentage', 'fixed']).optional().default('none'),
    discountValue: z.coerce.number().min(0).optional().default(0),
    notes: z.string().optional(),
    terms: z.string().optional(),
});

// Export type using a basic schema for TypeScript inference
const baseLineItemSchema = z.object({
    description: z.string(),
    quantity: z.coerce.number(),
    price: z.coerce.number(),
});

const _baseQuoteSchema = z.object({
    clientName: z.string(),
    clientEmail: z.string(),
    clientAddress: z.string(),
    quoteNumber: z.string(),
    issueDate: z.date(),
    validUntil: z.date(),
    lineItems: z.array(baseLineItemSchema),
    taxRate: z.coerce.number().optional().default(0),
    discountType: z.enum(['none', 'percentage', 'fixed']).optional().default('none'),
    discountValue: z.coerce.number().min(0).optional().default(0),
    notes: z.string().optional(),
    terms: z.string().optional(),
});

export type QuoteFormValues = z.infer<typeof baseQuoteSchema>;
export type LineItem = z.infer<typeof baseLineItemSchema>;

export default function QuoteBuilderClient() {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('QuoteBuilder');
    const [generatingDescriptionIndex, setGeneratingDescriptionIndex] = useState<number | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [previewData, setPreviewData] = useState<QuoteFormValues | null>(null);

    const lineItemSchema = createLineItemSchema(t);
    const quoteSchema = createQuoteSchema(t, lineItemSchema);

    const form = useForm<QuoteFormValues>({
        resolver: zodResolver(quoteSchema),
        defaultValues: {
            clientName: "",
            clientEmail: "",
            clientAddress: "",
            quoteNumber: `Q-${Date.now()}`,
            issueDate: new Date(),
            validUntil: new Date(new Date().setDate(new Date().getDate() + 30)),
            lineItems: [{ description: "", quantity: 1, price: 0 }],
            taxRate: 12,
            discountType: 'none',
            discountValue: 0,
            notes: "",
            terms: "Payment terms: 50% upfront, 50% upon completion. Valid for 30 days from issue date.",
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    const watchedLineItems = form.watch("lineItems");
    const subtotal = watchedLineItems.reduce((sum, item) => sum + (item.quantity || 0) * (item.price || 0), 0);
    const taxRate = form.watch("taxRate") || 0;
    const discountType = form.watch("discountType") || 'none';
    const discountValue = form.watch("discountValue") || 0;
    
    // Calculate discount
    let discountAmount = 0;
    if (discountType === 'percentage') {
        discountAmount = subtotal * (discountValue / 100);
    } else if (discountType === 'fixed') {
        discountAmount = discountValue;
    }
    
    const afterDiscount = subtotal - discountAmount;
    const taxAmount = afterDiscount * (taxRate / 100);
    const total = afterDiscount + taxAmount;

    const handleGenerateDescription = useCallback(async (index: number) => {
        setGeneratingDescriptionIndex(index);
        try {
            const result = await generateQuoteDescription({ itemName: "Service Item" });
            form.setValue(`lineItems.${index}.description`, result.description);
            toast({ title: t('success'), description: t('descriptionGenerated') });
        } catch (error) {
            handleError(error, 'generate quote description');
        } finally {
            setGeneratingDescriptionIndex(null);
        }
    }, [form, toast, t, handleError]);

    const handlePreview = useCallback(() => {
        const formData = form.getValues();
        setPreviewData(formData);
    }, [form]);

    const onSubmit = useCallback(async (data: QuoteFormValues) => {
        if (!user) return;
        
        setIsSaving(true);
        try {
            await addDoc(collection(getDb(), "quotes"), {
                ...data,
                userId: user.uid,
                createdAt: serverTimestamp(),
                issueDate: data.issueDate.toISOString(),
                validUntil: data.validUntil.toISOString(),
            });
            
            toast({ title: t('success'), description: t('quoteSaved') });
            form.reset();
        } catch (error) {
            handleError(error, 'save quote');
        } finally {
            setIsSaving(false);
        }
    }, [user, toast, t, form, handleError]);

    return (
        <Dialog>
            <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid gap-6 lg:grid-cols-3">
                        <div className="lg:col-span-1 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('clientInformation')}</CardTitle>
                                    <CardDescription>{t('clientInformationDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="clientName" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('clientName')}</FormLabel>
                                            <FormControl><Input placeholder={t('clientNamePlaceholder')} {...field} className="bg-background" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="clientEmail" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('clientEmail')}</FormLabel>
                                            <FormControl><Input type="email" placeholder={t('clientEmailPlaceholder')} {...field} className="bg-background" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="clientAddress" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('clientAddress')}</FormLabel>
                                            <FormControl><Textarea placeholder={t('clientAddressPlaceholder')} {...field} className="bg-background" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('quoteDetails')}</CardTitle>
                                    <CardDescription>{t('quoteDetailsDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                                        <FormItem>
                                            <FormLabel>{t('quoteNumber')}</FormLabel>
                                            <FormControl><Input placeholder={t('quoteNumberPlaceholder')} {...field} className="bg-background" /></FormControl>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="issueDate" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('issueDate')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>
                                                            {field.value ? (format(field.value, "PPP")) : (<span>{t('pickADate')}</span>)}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                    <FormField control={form.control} name="validUntil" render={({ field }) => (
                                        <FormItem className="flex flex-col">
                                            <FormLabel>{t('validUntil')}</FormLabel>
                                            <Popover>
                                                <PopoverTrigger asChild>
                                                    <FormControl>
                                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal bg-background", !field.value && "text-muted-foreground")}>
                                                            {field.value ? (format(field.value, "PPP")) : (<span>{t('pickADate')}</span>)}
                                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                        </Button>
                                                    </FormControl>
                                                </PopoverTrigger>
                                                <PopoverContent className="w-auto p-0" align="start">
                                                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date < new Date() || date < new Date("1900-01-01")} initialFocus />
                                                </PopoverContent>
                                            </Popover>
                                            <FormMessage />
                                        </FormItem>
                                    )} />
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>{t('lineItems')}</CardTitle>
                                    <CardDescription>{t('lineItemsDescription')}</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {fields.map((field, index) => (
                                        <div key={field.id} className="p-4 rounded-lg border bg-secondary/50 space-y-4 relative">
                                            <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                                                <FormItem>
                                                    <FormLabel>{t('description')}</FormLabel>
                                                    <div className="flex gap-2 items-start">
                                                        <FormControl><Textarea placeholder={t('descriptionPlaceholder')} {...field} rows={2} className="bg-background" /></FormControl>
                                                         <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => handleGenerateDescription(index)} disabled={generatingDescriptionIndex === index}>
                                                            {generatingDescriptionIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                                                            <span className="sr-only">{t('generateDescription')}</span>
                                                        </Button>
                                                    </div>
                                                    <FormMessage />
                                                </FormItem>
                                            )} />
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                                                    <FormItem><FormLabel>{t('quantity')}</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormField control={form.control} name={`lineItems.${index}.price`} render={({ field }) => (
                                                    <FormItem><FormLabel>{t('unitPrice')}</FormLabel><FormControl><Input type="number" {...field} className="bg-background" /></FormControl><FormMessage /></FormItem>
                                                )} />
                                                <FormItem>
                                                    <FormLabel>{t('total')}</FormLabel>
                                                    <div className="font-medium h-10 flex items-center px-3">
                                                        ₱{((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.price || 0)).toFixed(2)}
                                                    </div>
                                                </FormItem>
                                            </div>
                                            <Button type="button" size="icon" variant="destructive" className="absolute top-2 right-2 h-7 w-7" onClick={() => remove(index)}>
                                                <Trash2 className="h-4 w-4" />
                                                <span className="sr-only">{t('removeItem')}</span>
                                            </Button>
                                        </div>
                                    ))}
                                    <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: "", quantity: 1, price: 0 })}>
                                        <PlusCircle className="mr-2 h-4 w-4" /> {t('addLineItem')}
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>

                        <div className="lg:col-span-2">
                             <Card className="sticky top-20">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2">
                                        <Calculator className="h-5 w-5" />
                                        {t('quoteSummary')}
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex justify-between">
                                        <span className="text-muted-foreground">{t('subtotal')}</span>
                                        <span className="font-medium">₱{subtotal.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Discount Section */}
                                    <div className="space-y-3 p-3 rounded-lg bg-muted/20">
                                        <div className="flex items-center gap-2">
                                            <Percent className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm font-medium">Discount</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2">
                                            <FormField control={form.control} name="discountType" render={({ field }) => (
                                                <FormItem>
                                                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                                                        <FormControl>
                                                            <SelectTrigger className="h-8">
                                                                <SelectValue placeholder="Type" />
                                                            </SelectTrigger>
                                                        </FormControl>
                                                        <SelectContent>
                                                            <SelectItem value="none">No Discount</SelectItem>
                                                            <SelectItem value="percentage">Percentage</SelectItem>
                                                            <SelectItem value="fixed">Fixed Amount</SelectItem>
                                                        </SelectContent>
                                                    </Select>
                                                </FormItem>
                                            )} />
                                            <FormField control={form.control} name="discountValue" render={({ field }) => (
                                                <FormItem>
                                                    <FormControl>
                                                        <Input 
                                                            type="number" 
                                                            className="h-8" 
                                                            placeholder={discountType === 'percentage' ? '%' : '₱'}
                                                            disabled={discountType === 'none'}
                                                            {...field} 
                                                        />
                                                    </FormControl>
                                                </FormItem>
                                            )} />
                                        </div>
                                        {discountAmount > 0 && (
                                            <div className="flex justify-between text-sm">
                                                <span className="text-muted-foreground">Discount Amount</span>
                                                <span className="font-medium text-green-600">-₱{discountAmount.toFixed(2)}</span>
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="flex items-center justify-between">
                                        <FormField control={form.control} name="taxRate" render={({ field }) => (
                                            <FormItem className="flex items-center gap-2">
                                                <FormLabel className="text-muted-foreground m-0">{t('tax')} (%)</FormLabel>
                                                <FormControl><Input type="number" className="w-20 h-8" {...field} /></FormControl>
                                            </FormItem>
                                        )} />
                                        <span className="font-medium">₱{taxAmount.toFixed(2)}</span>
                                    </div>
                                    <Separator />
                                    <div className="flex justify-between font-bold text-lg">
                                        <span>{t('total')}</span>
                                        <span>₱{total.toFixed(2)}</span>
                                    </div>
                                    
                                    {/* Additional Options */}
                                    <div className="space-y-3 pt-4 border-t">
                                        <FormField control={form.control} name="notes" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">Notes</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder="Additional notes for the client..." 
                                                        className="bg-background text-sm" 
                                                        rows={2}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                        
                                        <FormField control={form.control} name="terms" render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-sm">Terms & Conditions</FormLabel>
                                                <FormControl>
                                                    <Textarea 
                                                        placeholder="Payment terms and conditions..." 
                                                        className="bg-background text-sm" 
                                                        rows={2}
                                                        {...field} 
                                                    />
                                                </FormControl>
                                            </FormItem>
                                        )} />
                                    </div>
                                </CardContent>
                                <CardFooter className="flex flex-col gap-2">
                                    <div className="grid grid-cols-2 gap-2">
                                        <Button type="submit" className="w-full" disabled={isSaving}>
                                            {isSaving ? <Loader2 className="mr-2 animate-spin" /> : <Save className="mr-2" />}
                                            {isSaving ? t('saving') : 'Save Draft'}
                                        </Button>
                                        <Button type="button" variant="outline" className="w-full">
                                            <Send className="mr-2" />
                                            Send Quote
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <DialogTrigger asChild>
                                            <Button type="button" variant="outline" className="w-full" onClick={handlePreview}>
                                                <Eye className="mr-2" />
                                                {t('preview')}
                                            </Button>
                                        </DialogTrigger>
                                        <Button type="button" variant="outline" className="w-full">
                                            <Download className="mr-2" />
                                            Export PDF
                                        </Button>
                                    </div>
                                    <Button type="button" variant="ghost" className="w-full">
                                        <Copy className="mr-2" />
                                        Duplicate Quote
                                    </Button>
                                </CardFooter>
                            </Card>
                        </div>
                    </div>
                </form>
            </Form>

            <DialogContent className="max-w-4xl">
                 <DialogHeader>
                    <DialogTitle>{t('quotePreview')}</DialogTitle>
                </DialogHeader>
                {previewData && <QuotePreview data={previewData} />}
            </DialogContent>
        </Dialog>
    );
}


