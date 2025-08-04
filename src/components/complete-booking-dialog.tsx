
"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { db, storage } from '@/lib/firebase';
import { doc, runTransaction, collection, serverTimestamp, writeBatch, updateDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';
import { Booking } from '@/app/(app)/bookings/page';
import Image from 'next/image';

type CompleteBookingDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    booking: Booking;
};

const createNotification = async (userId: string, message: string, link: string) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        await writeBatch(db).set(doc(notificationsRef), {
            userId, message, link,
            type: 'booking_update',
            read: false,
            createdAt: serverTimestamp(),
        }).commit();
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};

export function CompleteBookingDialog({ isOpen, setIsOpen, booking }: CompleteBookingDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleConfirmCompletion = async () => {
        if (!user || !imageFile) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please upload a photo as proof of completion.' });
            return;
        }
        setIsSaving(true);

        try {
            // 1. Upload image to storage
            const storageRef = ref(storage, `completion-photos/${booking.id}/${Date.now()}_${imageFile.name}`);
            const uploadResult = await uploadBytes(storageRef, imageFile);
            const completionPhotoURL = await getDownloadURL(uploadResult.ref);
            
            // 2. Run transaction to update booking, job, and loyalty points
            await runTransaction(db, async (transaction) => {
                const bookingRef = doc(db, "bookings", booking.id);
                const clientRef = doc(db, "users", booking.clientId);

                const clientDoc = await transaction.get(clientRef);
                if (!clientDoc.exists()) throw "Client document does not exist!";
                
                // Update booking status and add photo URL
                transaction.update(bookingRef, { status: "Completed", completionPhotoURL });

                // Update client's loyalty points
                const pointsToAward = Math.floor(booking.price / 10);
                const currentPoints = clientDoc.data().loyaltyPoints || 0;
                const newTotalPoints = currentPoints + pointsToAward;
                transaction.update(clientRef, { loyaltyPoints: newTotalPoints });

                // Create loyalty transaction record
                const loyaltyTxRef = doc(collection(db, `users/${booking.clientId}/loyaltyTransactions`));
                transaction.set(loyaltyTxRef, {
                    points: pointsToAward, type: 'earn',
                    description: `Points for completing service: ${booking.serviceName}`,
                    bookingId: booking.id, createdAt: serverTimestamp()
                });
                
                // Update original job post status to "Completed" if it exists
                if (booking.jobId) {
                    const jobRef = doc(db, "jobs", booking.jobId);
                    transaction.update(jobRef, { status: "Completed" });
                }
            });

            // 3. Send notification to client
            await createNotification(booking.clientId, `Your booking for "${booking.serviceName}" has been marked as completed.`, '/bookings');
            
            toast({
                title: "Booking Completed!",
                description: "The booking has been successfully marked as completed.",
            });
            setIsOpen(false);

        } catch (error) {
            console.error("Error completing booking:", error);
            toast({ variant: "destructive", title: "Update Failed", description: "Could not complete the booking." });
        } finally {
            setIsSaving(false);
            setPreviewUrl(null);
            setImageFile(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Complete Booking</DialogTitle>
                    <DialogDescription>
                        Upload a photo as proof of completion for the service: "{booking.serviceName}".
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label>Proof of Completion</Label>
                        <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                           {previewUrl ? (
                                <Image src={previewUrl} alt="Completion preview" layout="fill" className="object-cover"/>
                           ) : (
                            <div className="text-center text-muted-foreground p-4">
                                <Camera className="h-8 w-8 mx-auto mb-2"/>
                                <p>Upload a photo of the completed work.</p>
                            </div>
                           )}
                        </div>
                        <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                     </div>
                </div>
                 <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSaving}>Cancel</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleConfirmCompletion} disabled={isSaving || !imageFile}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? 'Confirming...' : 'Confirm Completion'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
