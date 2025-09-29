
"use client";

import { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { getDb  } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { Loader2, Star } from 'lucide-react';
import { Booking } from '@/app/(app)/bookings/page';
import { cn } from '@/lib/utils';
import { useTranslations } from 'next-intl';

const reviewSchema = z.object({
  rating: z.number().min(1, "Rating is required.").max(5),
  comment: z.string().min(10, "Comment must be at least 10 characters.").max(500, "Comment cannot exceed 500 characters."),
});

type ReviewFormValues = z.infer<typeof reviewSchema>;

type LeaveReviewDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    booking: Booking;
};

export function LeaveReviewDialog({ isOpen, setIsOpen, booking }: LeaveReviewDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const [isSaving, setIsSaving] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);
    const t = useTranslations('ReviewDialog');

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(z.object({
            rating: z.number().min(1, t('ratingRequired')).max(5),
            comment: z.string().min(10, t('commentMinLength')).max(500, t('commentMaxLength')),
        })),
        defaultValues: {
            rating: 0,
            comment: "",
        },
    });

    const onSubmit = useCallback(async (data: ReviewFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
            return;
        }
        setIsSaving(true);
        const batch = writeBatch(getDb());

        try {
            const reviewRef = doc(collection(getDb(), 'reviews'));
            batch.set(reviewRef, {
                providerId: booking.providerId,
                clientId: user.uid,
                clientName: user.displayName,
                clientAvatar: user.photoURL,
                bookingId: booking.id,
                rating: data.rating,
                comment: data.comment,
                createdAt: serverTimestamp(),
            });

            const bookingRef = doc(getDb(), 'bookings', booking.id);
            batch.update(bookingRef, { reviewId: reviewRef.id });
            
            // Create notification for the provider
            const providerNotifRef = doc(collection(getDb(), `users/${booking.providerId}/notifications`));
            batch.set(providerNotifRef, {
                type: 'new_review',
                message: `${user.displayName} left you a ${data.rating}-star review for "${booking.serviceName}".`,
                link: `/providers/${booking.providerId}`,
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            
            toast({ title: t('success'), description: t('reviewSubmitted') });
            setIsOpen(false);
        } catch (error) {
            handleError(error, 'submit review');
        } finally {
            setIsSaving(false);
        }
    }, [user, booking, toast, t, handleError, setIsOpen]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('leaveReview')} {booking.providerName}</DialogTitle>
                    <DialogDescription>
                        {t('feedbackDescription')}
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('overallRating')}</FormLabel>
                                    <FormControl>
                                        <div 
                                            className="flex items-center gap-1"
                                            onMouseLeave={() => setHoverRating(0)}
                                        >
                                            {[1, 2, 3, 4, 5].map((star) => (
                                                <Star
                                                    key={star}
                                                    className={cn(
                                                        "h-8 w-8 cursor-pointer transition-colors",
                                                        (hoverRating || field.value) >= star
                                                            ? "text-yellow-400 fill-yellow-400"
                                                            : "text-muted-foreground"
                                                    )}
                                                    onClick={() => field.onChange(star)}
                                                    onMouseEnter={() => setHoverRating(star)}
                                                />
                                            ))}
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <FormField
                            control={form.control}
                            name="comment"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{t('yourComment')}</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder={t('commentPlaceholder')} {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                             <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSaving}>{t('cancel')}</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? t('submitting') : t('submitReview')}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
