
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

const serviceSchema = z.object({
    name: z.string().min(3, { message: "Service name must be at least 3 characters." }),
    category: z.string().min(3, { message: "Category must be at least 3 characters." }),
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
    }, [service, form]);

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
                                    <FormControl>
                                        <Input placeholder="e.g., Cleaning" {...field} />
                                    </FormControl>
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
                                    <FormLabel>Description</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Describe your service in detail..." {...field} />
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

