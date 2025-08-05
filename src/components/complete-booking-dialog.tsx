
"use client";

import { useState, useRef } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { Loader2, Camera, Upload } from 'lucide-react';
import { Booking } from '@/app/(app)/bookings/page';
import Image from 'next/image';
import { completeBookingAction } from '@/app/(app)/bookings/actions';

type CompleteBookingDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    booking: Booking;
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
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleConfirmCompletion = async () => {
        if (!user || !imageFile || !previewUrl) {
            toast({ variant: 'destructive', title: 'Error', description: 'Please upload a photo as proof of completion.' });
            return;
        }
        setIsSaving(true);

        try {
            const result = await completeBookingAction({
                bookingId: booking.id,
                clientId: booking.clientId,
                jobId: booking.jobId,
                serviceName: booking.serviceName,
                price: booking.price,
                photoDataUrl: previewUrl,
                fileName: imageFile.name,
            });

            if (result.error) {
                throw new Error(result.error);
            }
            
            toast({
                title: "Booking Completed!",
                description: "The booking has been successfully marked as completed.",
            });
            setIsOpen(false);

        } catch (error: any) {
            console.error("Error completing booking:", error);
            toast({ variant: "destructive", title: "Update Failed", description: error.message || "Could not complete the booking." });
        } finally {
            setIsSaving(false);
            setPreviewUrl(null);
            setImageFile(null);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={(open) => {
            if (!open) {
                setPreviewUrl(null);
                setImageFile(null);
            }
            setIsOpen(open);
        }}>
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
                        <div className="w-full">
                             {previewUrl ? (
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={previewUrl} alt="Completion preview" layout="fill" className="object-cover"/>
                                </div>
                           ) : (
                             <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50">
                                <div className="text-center text-muted-foreground p-4">
                                    <Camera className="h-8 w-8 mx-auto mb-2"/>
                                    <p>Upload a photo of the completed work.</p>
                                </div>
                            </div>
                           )}
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            className="w-full"
                            onClick={() => fileInputRef.current?.click()}
                        >
                            <Upload className="mr-2 h-4 w-4" />
                            {previewUrl ? 'Change Photo' : 'Select Photo'}
                        </Button>
                        <Input className="hidden" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
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
