
"use client";

import { memo, useMemo } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/app/(app)/bookings/page";
import { format } from "date-fns";
import { Separator } from "./ui/separator";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";
import { useTranslations } from 'next-intl';
import { Timestamp } from "firebase/firestore";

// Helper function to safely convert Firebase Timestamp or Date to Date object
const toDate = (dateValue: Timestamp | Date): Date => {
    if (dateValue && typeof (dateValue as any).toDate === 'function') {
        return (dateValue as Timestamp).toDate();
    }
    if (dateValue instanceof Date) {
        return dateValue;
    }
    return new Date(dateValue.toString());
};

type BookingDetailsDialogProps = {
    isOpen: boolean;
    setIsOpen: (open: boolean) => void;
    booking: Booking;
};

const getStatusVariant = (status: string) => {
    switch (status) {
        case "Upcoming": return "default";
        case "Completed": return "secondary";
        case "Cancelled": return "destructive";
        case "Pending": return "outline";
        default: return "outline";
    }
}

export const BookingDetailsDialog = memo(function BookingDetailsDialog({ isOpen, setIsOpen, booking }: BookingDetailsDialogProps) {
    const { userRole } = useAuth();
    const t = useTranslations('BookingDetailsDialog');
    
    // Memoize user display logic
    const { displayUserLabel, displayUserName } = useMemo(() => ({
        displayUserLabel: userRole === 'client' ? t('provider') : t('client'),
        displayUserName: userRole === 'client' ? booking.providerName : booking.clientName
    }), [userRole, booking.providerName, booking.clientName, t]);

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{t('bookingDetails')}</DialogTitle>
                    <DialogDescription>
                        {t('bookingSummary', { serviceName: booking.serviceName })}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">{t('status')}</span>
                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </div>

                    <Separator />

                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{displayUserLabel}</span>
                        <span className="font-medium">{displayUserName}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('service')}</span>
                        <span className="font-medium">{booking.serviceName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('dateTime')}</span>
                         <span className="font-medium">{format(toDate(booking.date), 'PPP p')}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">{t('price')}</span>
                        <span className="font-medium">₱{booking.price?.toFixed(2) || '0.00'}</span>
                    </div>

                    {booking.notes && (
                        <>
                        <Separator />
                         <div className="space-y-2">
                            <span className="text-muted-foreground">{t('notes')}</span>
                            <p className="p-3 bg-secondary rounded-md">{booking.notes}</p>
                        </div>
                        </>
                    )}

                    {booking.completionPhotoURL && (
                         <>
                        <Separator />
                         <div className="space-y-2">
                            <span className="text-muted-foreground">{t('proofOfCompletion')}</span>
                            <div className="relative aspect-video w-full">
                                 <Image src={booking.completionPhotoURL} alt={t('proofOfCompletion')} layout="fill" className="rounded-md object-cover" />
                            </div>
                        </div>
                        </>
                    )}
                </div>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">{t('close')}</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
});
