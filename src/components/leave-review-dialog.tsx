
"use client";

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, addDoc, serverTimestamp, writeBatch, doc } from 'firebase/firestore';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Star } from 'lucide-react';
import { Booking } from '@/app/(app)/bookings/page';
import { cn } from '@/lib/utils';

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
    const [isSaving, setIsSaving] = useState(false);
    const [hoverRating, setHoverRating] = useState(0);

    const form = useForm<ReviewFormValues>({
        resolver: zodResolver(reviewSchema),
        defaultValues: {
            rating: 0,
            comment: "",
        },
    });

    const onSubmit = async (data: ReviewFormValues) => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in.' });
            return;
        }
        setIsSaving(true);
        const batch = writeBatch(db);

        try {
            const reviewRef = doc(collection(db, 'reviews'));
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

            const bookingRef = doc(db, 'bookings', booking.id);
            batch.update(bookingRef, { reviewId: reviewRef.id });
            
            // Create notification for the provider
            const providerNotifRef = doc(collection(db, `users/${booking.providerId}/notifications`));
            batch.set(providerNotifRef, {
                type: 'info',
                message: `${user.displayName} left you a ${data.rating}-star review for "${booking.serviceName}".`,
                link: `/providers/${booking.providerId}`,
                read: false,
                createdAt: serverTimestamp(),
            });

            await batch.commit();
            
            toast({ title: 'Success', description: 'Your review has been submitted. Thank you!' });
            setIsOpen(false);
        } catch (error) {
            console.error("Error submitting review:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to submit your review.' });
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Leave a Review for {booking.providerName}</DialogTitle>
                    <DialogDescription>
                        Your feedback helps other clients and provides valuable insight to the provider.
                    </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        <FormField
                            control={form.control}
                            name="rating"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Overall Rating</FormLabel>
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
                                    <FormLabel>Your Comment</FormLabel>
                                    <FormControl>
                                        <Textarea placeholder="Share your experience..." {...field} rows={5} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />
                         <DialogFooter>
                             <DialogClose asChild>
                                <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                            </DialogClose>
                            <Button type="submit" disabled={isSaving}>
                                {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSaving ? 'Submitting...' : 'Submit Review'}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
