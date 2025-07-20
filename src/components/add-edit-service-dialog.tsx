
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Sparkles } from 'lucide-react';
import { generateServiceDescription } from '@/ai/flows/generate-service-description';

export type Service = {
    id?: string;
    name: string;
    category: string;
    price: number;
    description: string;
    status: 'Active' | 'Inactive';
    userId?: string;
    createdAt?: Date;
};

type Category = {
    id: string;
    name: string;
};

const serviceSchema = z.object({
    name: z.string().min(3, { message: "Service name must be at least 3 characters." }),
    category: z.string().min(1, { message: "Please select a category." }),
    price: z.coerce.number().positive({ message: "Price must be a positive number." }),
    description: z.string().min(10, { message: "Description must be at least 10 characters." }),
    status: z.enum(['Active', 'Inactive']),
});

type AddEditServiceDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    service: Service | null;
    onServiceSaved: () => void;
};

export function AddEditServiceDialog({ isOpen, setIsOpen, service, onServiceSaved }: AddEditServiceDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const form = useForm<Service>({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            category: '',
            price: 0,
            description: '',
            status: 'Active',
        },
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const categoriesRef = collection(db, "categories");
                const q = query(categoriesRef, orderBy("name"));
                const querySnapshot = await getDocs(q);
                const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories: ", error);
                toast({ variant: 'destructive', title: 'Error', description: 'Could not fetch categories.' });
            }
        };

        if (isOpen) {
            fetchCategories();
        }

    }, [isOpen, toast]);

    useEffect(() => {
        if (service) {
            form.reset(service);
        } else {
            form.reset({
                name: '',
                category: '',
                price: 0,
                description: '',
                status: 'Active',
            });
        }
    }, [service, form, isOpen]);

    const handleGenerateDescription = async () => {
        const serviceName = form.getValues('name');
        if (!serviceName || serviceName.trim().length < 3) {
            toast({
                variant: 'destructive',
                title: 'Service Name Required',
                description: 'Please enter a service name (at least 3 characters) first.',
            });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateServiceDescription({ serviceName });
            if (result.description) {
                form.setValue('description', result.description, { shouldValidate: true });
                toast({
                    title: 'Description Generated!',
                    description: 'The AI-powered description has been added.',
                });
            }
        } catch (error) {
            console.error('Error generating description:', error);
            toast({
                variant: 'destructive',
                title: 'AI Error',
                description: 'Could not generate a description at this time.',
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const onSubmit = async (data: Service) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        setIsSaving(true);
        try {
            if (service?.id) {
                // Update existing service
                const serviceRef = doc(db, 'services', service.id);
                await updateDoc(serviceRef, data);
                toast({ title: 'Success', description: 'Service updated successfully.' });
            } else {
                // Add new service
                await addDoc(collection(db, 'services'), {
                    ...data,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                toast({ title: 'Success', description: 'Service added successfully.' });
            }
            onServiceSaved();
        } catch (error) {
            console.error("Error saving service:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to save service.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{service ? 'Edit Service' : 'Add New Service'}</DialogTitle>
                    <DialogDescription>
                        {service ? 'Update the details of your service.' : 'Fill in the details to add a new service to your profile.'}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Service Name</FormLabel>
                                    <FormControl>
                                        <Input placeholder="e.g., Deep House Cleaning" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="category"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Category</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a category" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {categories.map(cat => (
                                                <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="price"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Price (PHP)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder="e.g., 2500" {...field} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="description"
                            render={({ field }) => (
                                <FormItem>
                                    <div className="flex justify-between items-center">
                                        <FormLabel>Description</FormLabel>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                                            <span className="ml-2">{isGenerating ? 'Generating...' : 'Generate with AI'}</span>
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Textarea placeholder="Describe your service in detail..." {...field} rows={4} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="status"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Status</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a status" />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">Active</SelectItem>
                                            <SelectItem value="Inactive">Inactive</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? 'Saving...' : 'Save Service'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
