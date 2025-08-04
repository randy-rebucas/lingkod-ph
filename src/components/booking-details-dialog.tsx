
"use client";

import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogClose } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Booking } from "@/app/(app)/bookings/page";
import { format } from "date-fns";
import { Separator } from "./ui/separator";
import { useAuth } from "@/context/auth-context";
import Image from "next/image";

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

export function BookingDetailsDialog({ isOpen, setIsOpen, booking }: BookingDetailsDialogProps) {
    const { userRole } = useAuth();
    const displayUserLabel = userRole === 'client' ? 'Provider' : 'Client';
    const displayUserName = userRole === 'client' ? booking.providerName : booking.clientName;

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Booking Details</DialogTitle>
                    <DialogDescription>
                        Summary of your booking for "{booking.serviceName}".
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4 text-sm">
                    <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Status</span>
                        <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                    </div>

                    <Separator />

                     <div className="flex justify-between">
                        <span className="text-muted-foreground">{displayUserLabel}</span>
                        <span className="font-medium">{displayUserName}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Service</span>
                        <span className="font-medium">{booking.serviceName}</span>
                    </div>
                    
                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Date & Time</span>
                         <span className="font-medium">{format(booking.date.toDate(), 'PPP p')}</span>
                    </div>

                    <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-medium">₱{booking.price.toFixed(2)}</span>
                    </div>

                    {booking.notes && (
                        <>
                        <Separator />
                         <div className="space-y-2">
                            <span className="text-muted-foreground">Notes</span>
                            <p className="p-3 bg-secondary rounded-md">{booking.notes}</p>
                        </div>
                        </>
                    )}

                    {booking.completionPhotoURL && (
                         <>
                        <Separator />
                         <div className="space-y-2">
                            <span className="text-muted-foreground">Proof of Completion</span>
                            <div className="relative aspect-video w-full">
                                 <Image src={booking.completionPhotoURL} alt="Proof of completion" layout="fill" className="rounded-md object-cover" />
                            </div>
                        </div>
                        </>
                    )}
                </div>
                 <DialogClose asChild>
                    <Button type="button" variant="outline">Close</Button>
                </DialogClose>
            </DialogContent>
        </Dialog>
    );
}
