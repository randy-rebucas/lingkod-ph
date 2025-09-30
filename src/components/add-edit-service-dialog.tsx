
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { getDb  } from '@/lib/firebase';
import { collection, addDoc, doc, updateDoc, serverTimestamp, getDocs, query, orderBy } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { Loader2, Sparkles } from 'lucide-react';
import { generateServiceDescription } from '@/ai/flows/generate-service-description';
import { useTranslations } from 'next-intl';

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

const _serviceSchema = z.object({
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
    const { handleError } = useErrorHandler();
    const t = useTranslations('Components');
    const [isSaving, setIsSaving] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [categories, setCategories] = useState<Category[]>([]);

    const form = useForm<Service>({
        resolver: zodResolver(z.object({
            name: z.string().min(3, { message: t('serviceNameRequired') }),
            category: z.string().min(1, { message: t('categoryRequired') }),
            price: z.coerce.number().positive({ message: t('priceMustBePositive') }),
            description: z.string().min(10, { message: t('descriptionMinLength') }),
            status: z.enum(['Active', 'Inactive']),
        })),
        defaultValues: {
            name: '',
            category: '',
            price: 0,
            description: '',
            status: 'Active',
        },
    });

    const fetchCategories = useCallback(async () => {
        if (!getDb()) return;
        try {
            const categoriesRef = collection(getDb(), "categories");
            const q = query(categoriesRef, orderBy("name"));
            const querySnapshot = await getDocs(q);
            const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
            setCategories(fetchedCategories);
        } catch (error) {
            handleError(error, 'fetch categories');
        }
    }, [handleError]);

    useEffect(() => {
        if (isOpen) {
            fetchCategories();
        }
    }, [isOpen, fetchCategories]);

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

    const handleGenerateDescription = useCallback(async () => {
        const serviceName = form.getValues('name');
        if (!serviceName || serviceName.trim().length < 3) {
            toast({
                variant: 'destructive',
                title: t('serviceNameRequired'),
                description: t('enterServiceNameFirst'),
            });
            return;
        }

        setIsGenerating(true);
        try {
            const result = await generateServiceDescription({ serviceName });
            if (result.description) {
                form.setValue('description', result.description, { shouldValidate: true });
                toast({
                    title: t('descriptionGenerated'),
                    description: t('aiDescriptionAdded'),
                });
            }
        } catch (error) {
            handleError(error, 'generate service description');
        } finally {
            setIsGenerating(false);
        }
    }, [form, toast, t, handleError]);

    const onSubmit = useCallback(async (data: Service) => {
        if (!user) {
            toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        try {
            if (service?.id) {
                // Update existing service
                const serviceRef = doc(getDb(), 'services', service.id);
                await updateDoc(serviceRef, data);
                toast({ title: t('success'), description: t('serviceUpdated') });
            } else {
                // Add new service
                await addDoc(collection(getDb(), 'services'), {
                    ...data,
                    userId: user.uid,
                    createdAt: serverTimestamp(),
                });
                toast({ title: t('success'), description: t('serviceAdded') });
            }
            onServiceSaved();
        } catch (error) {
            handleError(error, 'save service');
        } finally {
            setIsSaving(false);
        }
    }, [user, service, onServiceSaved, toast, t, handleError]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>{service ? t('editService') : t('addNewService')}</DialogTitle>
                    <DialogDescription>
                        {service ? t('updateServiceDetails') : t('addServiceDetails')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                        <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('serviceName')}</FormLabel>
                                    <FormControl>
                                        <Input placeholder={t('serviceNamePlaceholder')} {...field} />
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
                                    <FormLabel>{t('category')}</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectCategory')} />
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
                                    <FormLabel>{t('price')} (PHP)</FormLabel>
                                    <FormControl>
                                        <Input type="number" placeholder={t('pricePlaceholder')} {...field} />
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
                                        <FormLabel>{t('description')}</FormLabel>
                                        <Button type="button" variant="ghost" size="sm" onClick={handleGenerateDescription} disabled={isGenerating}>
                                            {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4 text-accent" />}
                                            <span className="ml-2">{isGenerating ? t('generating') : t('generateWithAI')}</span>
                                        </Button>
                                    </div>
                                    <FormControl>
                                        <Textarea placeholder={t('describeService')} {...field} rows={4} />
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
                                    <FormLabel>{t('status')}</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectStatus')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            <SelectItem value="Active">{t('active')}</SelectItem>
                                            <SelectItem value="Inactive">{t('inactive')}</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsOpen(false)} disabled={isSaving}>
                                {t('cancel')}
                            </Button>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? t('saving') : t('saveService')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
