
"use client";

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, Timestamp } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Calendar } from './ui/calendar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import type { Service } from '@/app/(app)/providers/[providerId]/page';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { designTokens } from '@/lib/design-tokens';

const bookingSchema = z.object({
  date: z.date({ required_error: "Please select a date." }),
  time: z.string({ required_error: "Please select a time." }),
  notes: z.string().optional(),
});

type BookingFormValues = z.infer<typeof bookingSchema>;

type Provider = {
    uid: string;
    displayName: string;
    email: string;
    bio?: string;
    photoURL?: string;
    role: string;
};

type BookingDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    service: Service;
    provider: Provider;
    onBookingConfirmed: () => void;
};

const generateTimeSlots = () => {
    const slots = [];
    for (let i = 8; i <= 17; i++) {
        const hour = i % 12 === 0 ? 12 : i % 12;
        const ampm = i < 12 ? 'AM' : 'PM';
        slots.push(`${hour}:00 ${ampm}`);
    }
    return slots;
};

export function BookingDialog({ isOpen, setIsOpen, service, provider, onBookingConfirmed }: BookingDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const router = useRouter();
    const [isSaving, setIsSaving] = useState(false);
    const timeSlots = generateTimeSlots();
    const t = useTranslations('BookingDialog');

    const form = useForm<BookingFormValues>({
        resolver: zodResolver(bookingSchema),
        defaultValues: {
            date: new Date(),
            time: undefined,
            notes: "",
        },
    });
    
    useEffect(() => {
        form.reset();
    }, [isOpen, form]);

    const onSubmit = async (data: BookingFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        try {
            const timeParts = data.time.match(/(\d+):(\d+)\s(AM|PM)/);
            if (!timeParts) {
                toast({ variant: 'destructive', title: t('error'), description: t('invalidTimeFormat') });
                setIsSaving(false);
                return;
            }
            let hours = parseInt(timeParts[1], 10);
            const minutes = parseInt(timeParts[2], 10);
            const ampm = timeParts[3];

            if (ampm === 'PM' && hours < 12) hours += 12;
            if (ampm === 'AM' && hours === 12) hours = 0;

            const bookingDateTime = new Date(data.date);
            bookingDateTime.setHours(hours, minutes, 0, 0);

            const bookingData = {
                providerId: provider.uid,
                providerName: provider.displayName,
                providerAvatar: provider.photoURL || '',
                clientId: user.uid,
                clientName: user.displayName,
                clientAvatar: user.photoURL || '',
                serviceId: service.id,
                serviceName: service.name,
                price: service.price,
                date: Timestamp.fromDate(bookingDateTime),
                status: "Pending Payment",
                notes: data.notes,
                createdAt: serverTimestamp(),
            };

            const newBookingRef = await addDoc(collection(db, 'bookings'), bookingData);
            onBookingConfirmed();
            router.push(`/bookings/${newBookingRef.id}/payment`);

        } catch (error) {
            console.error("Error creating booking:", error);
            toast({ variant: 'destructive', title: t('error'), description: t('failedToCreateBooking') });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className={`sm:max-w-md ${designTokens.effects.cardElevated}`}>
                <DialogHeader>
                    <DialogTitle>{t('book')}: {service.name}</DialogTitle>
                    <DialogDescription>
                        {t('confirmDateTime')} {provider.displayName}.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="date" render={({ field }) => (
                                <FormItem className="flex flex-col">
                                    <FormLabel className="mb-1">{t('date')}</FormLabel>
                                    <Popover>
                                        <PopoverTrigger asChild>
                                            <FormControl>
                                                <Button variant="outline" className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                                    {field.value ? format(field.value, "PPP") : <span>{t('pickDate')}</span>}
                                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                                </Button>
                                            </FormControl>
                                        </PopoverTrigger>
                                        <PopoverContent className="w-auto p-0" align="start">
                                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus disabled={(date) => date < new Date(new Date().setDate(new Date().getDate() -1))} />
                                        </PopoverContent>
                                    </Popover>
                                    <FormMessage />
                                </FormItem>
                            )} />
                             <FormField control={form.control} name="time" render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('time')}</FormLabel>
                                     <Select onValueChange={field.onChange} defaultValue={field.value}>
                                        <FormControl>
                                            <SelectTrigger>
                                                <SelectValue placeholder={t('selectTimeSlot')} />
                                            </SelectTrigger>
                                        </FormControl>
                                        <SelectContent>
                                            {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                        </SelectContent>
                                    </Select>
                                    <FormMessage />
                                </FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name="notes" render={({ field }) => (
                            <FormItem>
                                <FormLabel>{t('additionalNotes')}</FormLabel>
                                <FormControl>
                                    <Textarea placeholder={t('notesPlaceholder')} {...field} />
                                </FormControl>
                                <FormMessage />
                            </FormItem>
                        )} />

                        <div className="rounded-lg border bg-secondary/50 p-4 flex justify-between items-center">
                            <span className="font-semibold">{t('totalPrice')}:</span>
                            <span className="font-bold text-lg text-primary">₱{service.price.toFixed(2)}</span>
                        </div>
                        
                         <DialogFooter>
                             <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSaving}>{t('cancel')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? t('proceeding') : t('proceedToPayment')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
