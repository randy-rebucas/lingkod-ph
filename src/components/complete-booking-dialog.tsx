
"use client";

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { Loader2, Camera, Upload } from 'lucide-react';
import { Booking } from '@/app/(app)/bookings/page';
import Image from 'next/image';
import { completeBookingAction } from '@/app/(app)/bookings/actions';
import { useTranslations } from 'next-intl';

type CompleteBookingDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    booking: Booking;
};

export function CompleteBookingDialog({ isOpen, setIsOpen, booking }: CompleteBookingDialogProps) {
    const { user } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('CompleteBookingDialog');
    const [isSaving, setIsSaving] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setImageFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    }, []);

    const handleConfirmCompletion = useCallback(async () => {
        if (!user || !imageFile || !previewUrl) {
            toast({ variant: 'destructive', title: t('error'), description: t('uploadProof') });
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
                title: t('bookingCompleted'),
                description: t('bookingCompleted'),
            });
            setIsOpen(false);

        } catch (error: unknown) {
            handleError(error, 'complete booking');
        } finally {
            setIsSaving(false);
            setPreviewUrl(null);
            setImageFile(null);
        }
    }, [user, imageFile, previewUrl, booking, toast, t, handleError, setIsOpen]);

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
                    <DialogTitle>{t('completeBooking')}</DialogTitle>
                    <DialogDescription>
                        {t('uploadProof')} &quot;{booking.serviceName}&quot;.
                    </DialogDescription>
                </DialogHeader>
                <div className="py-4 space-y-4">
                     <div className="space-y-2">
                        <Label>{t('uploadProof')}</Label>
                        <div className="w-full">
                             {previewUrl ? (
                                <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={previewUrl} alt="Completion preview" layout="fill" className="object-cover"/>
                                </div>
                           ) : (
                             <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50">
                                <div className="text-center text-muted-foreground p-4">
                                    <Camera className="h-8 w-8 mx-auto mb-2"/>
                                    <p>{t('uploadImage')}</p>
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
                            {previewUrl ? t('changePhoto') : t('selectPhoto')}
                        </Button>
                        <Input className="hidden" type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} />
                     </div>
                </div>
                 <DialogFooter>
                     <DialogClose asChild>
                        <Button type="button" variant="outline" disabled={isSaving}>{t('cancel')}</Button>
                    </DialogClose>
                    <Button type="button" onClick={handleConfirmCompletion} disabled={isSaving || !imageFile}>
                        {isSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        {isSaving ? t('completing') : t('complete')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
