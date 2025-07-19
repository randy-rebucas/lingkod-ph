
"use client";

import { useForm, useFieldArray, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CalendarIcon, PlusCircle, Sparkles, Trash2, Loader2, Eye, FileDown } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { generateQuoteDescription } from "@/ai/flows/generate-quote-description";
import { Separator } from "./ui/separator";

const lineItemSchema = z.object({
    description: z.string().min(1, "Description is required."),
    quantity: z.coerce.number().min(0.1, "Quantity must be at least 0.1."),
    price: z.coerce.number().min(0, "Price cannot be negative."),
});

const quoteSchema = z.object({
    clientName: z.string().min(1, "Client name is required."),
    clientEmail: z.string().email("Invalid email address."),
    clientAddress: z.string().min(1, "Client address is required."),
    quoteNumber: z.string().min(1, "Quote number is required."),
    issueDate: z.date({ required_error: "Issue date is required." }),
    validUntil: z.date({ required_error: "Expiry date is required." }),
    lineItems: z.array(lineItemSchema).min(1, "At least one line item is required."),
    taxRate: z.coerce.number().min(0, "Tax rate cannot be negative.").optional().default(0),
});

type QuoteFormValues = z.infer<typeof quoteSchema>;
type LineItem = z.infer<typeof lineItemSchema>;

export default function QuoteBuilderClient() {
    const { toast } = useToast();
    const [generatingDescriptionIndex, setGeneratingDescriptionIndex] = useState<number | null>(null);

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
        },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "lineItems",
    });

    const watchedLineItems = form.watch("lineItems");
    const watchedTaxRate = form.watch("taxRate");

    const subtotal = watchedLineItems.reduce((acc, item) => acc + (item.quantity || 0) * (item.price || 0), 0);
    const taxAmount = subtotal * ((watchedTaxRate || 0) / 100);
    const total = subtotal + taxAmount;

    const handleGenerateDescription = async (index: number) => {
        setGeneratingDescriptionIndex(index);
        const itemName = form.getValues(`lineItems.${index}.description`);
        if (!itemName || itemName.trim().length < 3) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Please enter a brief item name first (at least 3 characters).',
            });
            setGeneratingDescriptionIndex(null);
            return;
        }

        try {
            const result = await generateQuoteDescription({ itemName });
            if (result.description) {
                form.setValue(`lineItems.${index}.description`, result.description, { shouldValidate: true });
                toast({
                    title: 'Success',
                    description: 'AI-powered description has been generated!',
                });
            }
        } catch (error) {
            console.error("Error generating description:", error);
            toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'Could not generate a description at this time.',
            });
        } finally {
            setGeneratingDescriptionIndex(null);
        }
    };


    const onSubmit = (data: QuoteFormValues) => {
        console.log(data);
        toast({
            title: "Quote Saved!",
            description: "The quote has been successfully saved to your records.",
        });
    };

    return (
        <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="grid grid-cols-1 lg:grid-cols-5 gap-8 items-start">
                <div className="lg:col-span-3 space-y-8">
                    <Card>
                        <CardHeader>
                            <CardTitle>Quote Details</CardTitle>
                            <CardDescription>Enter the client and quote information.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-6">
                             <div className="grid md:grid-cols-2 gap-6">
                                <FormField control={form.control} name="clientName" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Name</FormLabel>
                                        <FormControl><Input placeholder="Juan Dela Cruz" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="clientEmail" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Client Email</FormLabel>
                                        <FormControl><Input type="email" placeholder="juan@example.com" {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                             <FormField control={form.control} name="clientAddress" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Client Address</FormLabel>
                                    <FormControl><Textarea placeholder="123 Rizal St, Brgy. Poblacion, Quezon City" {...field} /></FormControl>
                                    <FormMessage />
                                </FormItem>
                            )} />
                            <Separator />
                            <div className="grid md:grid-cols-3 gap-6">
                                <FormField control={form.control} name="quoteNumber" render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Quote Number</FormLabel>
                                        <FormControl><Input {...field} /></FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="issueDate" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Issue Date</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                                <FormField control={form.control} name="validUntil" render={({ field }) => (
                                    <FormItem className="flex flex-col">
                                        <FormLabel>Valid Until</FormLabel>
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <FormControl>
                                                    <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                    </Button>
                                                </FormControl>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-auto p-0" align="start">
                                                <Calendar mode="single" selected={field.value} onSelect={field.onChange} />
                                            </PopoverContent>
                                        </Popover>
                                        <FormMessage />
                                    </FormItem>
                                )} />
                            </div>
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Line Items</CardTitle>
                            <CardDescription>Add the services or products included in this quote.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="w-[50%]">Description</TableHead>
                                            <TableHead>Qty</TableHead>
                                            <TableHead>Price</TableHead>
                                            <TableHead className="text-right">Total</TableHead>
                                            <TableHead className="w-[50px]"></TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {fields.map((field, index) => (
                                            <TableRow key={field.id}>
                                                <TableCell>
                                                    <div className="flex gap-2 items-start">
                                                        <FormField control={form.control} name={`lineItems.${index}.description`} render={({ field }) => (
                                                            <FormItem className="flex-1">
                                                                <FormControl><Textarea placeholder="e.g., Basic Lawn Mowing" {...field} rows={2} /></FormControl>
                                                                <FormMessage />
                                                            </FormItem>
                                                        )} />
                                                        <Button type="button" size="icon" variant="ghost" className="shrink-0" onClick={() => handleGenerateDescription(index)} disabled={generatingDescriptionIndex === index}>
                                                            {generatingDescriptionIndex === index ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                                                            <span className="sr-only">Generate Description</span>
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                                <TableCell>
                                                    <FormField control={form.control} name={`lineItems.${index}.quantity`} render={({ field }) => (
                                                        <FormItem><FormControl><Input type="number" {...field} className="min-w-[80px]" /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </TableCell>
                                                <TableCell>
                                                    <FormField control={form.control} name={`lineItems.${index}.price`} render={({ field }) => (
                                                        <FormItem><FormControl><Input type="number" {...field} className="min-w-[100px]" /></FormControl><FormMessage /></FormItem>
                                                    )} />
                                                </TableCell>
                                                <TableCell className="text-right font-medium">
                                                    ₱{((watchedLineItems[index]?.quantity || 0) * (watchedLineItems[index]?.price || 0)).toFixed(2)}
                                                </TableCell>
                                                <TableCell>
                                                    <Button type="button" size="icon" variant="destructive" onClick={() => remove(index)}>
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                            <Button type="button" variant="outline" size="sm" className="mt-4" onClick={() => append({ description: "", quantity: 1, price: 0 })}>
                                <PlusCircle className="mr-2 h-4 w-4" /> Add Line Item
                            </Button>
                        </CardContent>
                    </Card>
                </div>

                <div className="lg:col-span-2">
                     <Card className="sticky top-20">
                        <CardHeader><CardTitle>Quote Summary</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="flex justify-between">
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
                        </CardContent>
                        <CardFooter className="flex flex-col gap-2">
                            <Button type="submit" className="w-full"><FileDown className="mr-2" />Save Quote</Button>
                            <Button type="button" variant="outline" className="w-full"><Eye className="mr-2" />Preview</Button>
                        </CardFooter>
                    </Card>
                </div>
            </form>
        </Form>
    );
}
