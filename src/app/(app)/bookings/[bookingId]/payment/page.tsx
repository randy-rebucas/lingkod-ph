
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, Timestamp, addDoc, collection, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Upload, Loader2, ClipboardCopy, Check, Wallet, Landmark, Info, Smartphone } from "lucide-react";
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { Booking } from "../../page";
import {QRCode} from "@/components/qrcode-svg";
import { GCashPaymentButton } from "@/components/gcash-payment-button";

export default function PaymentPage() {
    const { bookingId } = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();

    const [booking, setBooking] = useState<Booking | null>(null);
    const [loading, setLoading] = useState(true);
    const [isUploading, setIsUploading] = useState(false);
    const [paymentProofFile, setPaymentProofFile] = useState<File | null>(null);
    const [paymentProofPreview, setPaymentProofPreview] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [copied, setCopied] = useState(false);

    useEffect(() => {
        if (!bookingId || !user) return;

        const bookingRef = doc(db, "bookings", bookingId as string);
        const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
            if (docSnap.exists() && docSnap.data().clientId === user.uid) {
                setBooking({ id: docSnap.id, ...docSnap.data() } as Booking);
            } else {
                toast({ variant: "destructive", title: "Error", description: "Booking not found or access denied." });
                router.push("/bookings");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [bookingId, user, router, toast]);

    const handleCopy = (text: string) => {
        navigator.clipboard.writeText(text);
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
    }
    
    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setPaymentProofFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadProof = async () => {
        if (!paymentProofFile || !booking) return;
        setIsUploading(true);
        try {
            const storagePath = `payment-proofs/${booking.id}/${Date.now()}_${paymentProofFile.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadResult = await uploadBytes(storageRef, paymentProofFile);
            const url = await getDownloadURL(uploadResult.ref);

            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, {
                paymentProofUrl: url,
                status: "Pending Verification",
                paymentRejectionReason: null, // Clear any previous rejection reason
                paymentRejectedAt: null,
                paymentRejectedBy: null
            });
            
            // Notify Admin
            const adminQuery = query(collection(db, 'users'), where('role', '==', 'admin'));
            const adminSnapshot = await getDocs(adminQuery);
            if (!adminSnapshot.empty) {
                const adminId = adminSnapshot.docs[0].id;
                await addDoc(collection(db, `users/${adminId}/notifications`), {
                    type: 'info',
                    message: `A payment for booking #${booking.id.slice(0, 6)} has been uploaded and requires verification.`,
                    link: '/admin/transactions',
                    read: false,
                    createdAt: serverTimestamp(),
                });
            }

            toast({ title: 'Upload Successful', description: 'Your proof of payment has been submitted for verification.' });
        } catch (error) {
            console.error("Error uploading proof:", error);
            toast({ variant: "destructive", title: "Upload Failed", description: "Could not upload your proof of payment." });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-1/3" />
                <div className="grid md:grid-cols-2 gap-8">
                    <Skeleton className="h-96 w-full" />
                    <Skeleton className="h-80 w-full" />
                </div>
            </div>
        )
    }

    if (!booking) return null;
    
    const isPaymentUploaded = booking.status === 'Pending Verification' || booking.status === 'Upcoming' || booking.status === 'Completed';
    const isPaymentRejected = booking.status === 'Payment Rejected';

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
            <div className="flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/bookings')}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Payment Instructions</h1>
                    <p className="text-muted-foreground">For booking: {booking.serviceName}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card>
                    <CardHeader>
                        <CardTitle>Payment Details</CardTitle>
                        <CardDescription>Please complete your payment using one of the methods below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="p-4 rounded-lg bg-secondary text-center space-y-2">
                             <p className="text-sm text-muted-foreground">Total Amount Due</p>
                             <p className="text-4xl font-bold text-primary">₱{booking.price.toFixed(2)}</p>
                             <div className="flex items-center justify-center gap-2 pt-2">
                                <p className="text-sm text-muted-foreground">Booking ID:</p>
                                <code className="font-mono text-sm p-1 rounded bg-background">{booking.id}</code>
                                <Button size="icon" variant="ghost" className="h-6 w-6" onClick={() => handleCopy(booking.id)}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Use your Booking ID as the reference number for your payment.</p>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                 <Wallet className="h-6 w-6 text-blue-500"/>
                                <h3 className="font-semibold text-lg">GCash Payment</h3>
                            </div>
                            
                            <Tabs defaultValue="automated" className="w-full">
                                <TabsList className="grid w-full grid-cols-2">
                                    <TabsTrigger value="automated" className="flex items-center gap-2">
                                        <Smartphone className="h-4 w-4" />
                                        Instant
                                    </TabsTrigger>
                                    <TabsTrigger value="manual" className="flex items-center gap-2">
                                        <Upload className="h-4 w-4" />
                                        Manual
                                    </TabsTrigger>
                                </TabsList>
                                
                                <TabsContent value="automated" className="mt-4">
                                    <GCashPaymentButton
                                        bookingId={booking.id}
                                        amount={booking.price}
                                        serviceName={booking.serviceName}
                                        onPaymentSuccess={() => {
                                            toast({ title: 'Payment Successful!', description: 'Your booking has been confirmed.' });
                                            router.push('/bookings');
                                        }}
                                        onPaymentError={(error) => {
                                            toast({ variant: 'destructive', title: 'Payment Failed', description: error });
                                        }}
                                    />
                                </TabsContent>
                                
                                <TabsContent value="manual" className="mt-4">
                                    <div className="text-sm space-y-1">
                                        <p><strong>Account Name:</strong> Lingkod PH Services</p>
                                        <p><strong>Account Number:</strong> 0917-123-4567</p>
                                        <div className="w-32 h-32 mt-2"><QRCode/></div>
                                        <p className="text-xs text-muted-foreground mt-2">
                                            After payment, upload proof for manual verification
                                        </p>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                         <Separator />
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Landmark className="h-6 w-6 text-indigo-700"/>
                                <h3 className="font-semibold text-lg">Bank Transfer (BPI)</h3>
                            </div>
                            <div className="text-sm space-y-1 pl-9">
                                <p><strong>Account Name:</strong> Lingkod PH Services Inc.</p>
                                <p><strong>Account Number:</strong> 1234-5678-90</p>
                            </div>
                        </div>

                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>Upload Proof of Payment</CardTitle>
                        <CardDescription>
                            {isPaymentUploaded 
                                ? "Your payment proof has been submitted."
                                : "After paying, please upload a screenshot or photo of your receipt."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                         {isPaymentRejected ? (
                             <div className="space-y-4 text-center">
                                 <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={booking.paymentProofUrl || "https://placehold.co/600x400.png"} alt="Payment proof" layout="fill" className="object-contain"/>
                                </div>
                                <Badge variant="destructive">Status: {booking.status}</Badge>
                                {booking.paymentRejectionReason && (
                                    <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                        <p className="text-sm text-red-800"><strong>Rejection Reason:</strong> {booking.paymentRejectionReason}</p>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">Please upload a new payment proof or contact support for assistance.</p>
                                <Button onClick={() => {
                                    setPaymentProofFile(null);
                                    setPaymentProofPreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }} className="w-full">
                                    Upload New Payment Proof
                                </Button>
                             </div>
                         ) : isPaymentUploaded && booking.paymentProofUrl ? (
                             <div className="space-y-4 text-center">
                                 <div className="relative aspect-video w-full rounded-md overflow-hidden border">
                                    <Image src={booking.paymentProofUrl} alt="Payment proof" layout="fill" className="object-contain"/>
                                </div>
                                <Badge>Status: {booking.status}</Badge>
                                <p className="text-sm text-muted-foreground">An admin will verify your payment shortly.</p>
                             </div>
                         ) : (
                            <div className="space-y-4">
                                <div className="aspect-video w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                     {paymentProofPreview ? (
                                        <Image src={paymentProofPreview} alt="Payment proof preview" layout="fill" className="object-contain"/>
                                    ) : (
                                        <div className="text-center text-muted-foreground p-4">
                                            <Upload className="h-8 w-8 mx-auto mb-2"/>
                                            <p>Select a file to upload</p>
                                        </div>
                                    )}
                                </div>
                                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="text-sm" />
                                 <Button className="w-full" onClick={handleUploadProof} disabled={isUploading || !paymentProofFile}>
                                    {isUploading ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                                    {isUploading ? 'Uploading...' : 'Submit Proof of Payment'}
                                </Button>
                            </div>
                         )}
                         <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
                            <Info className="h-4 w-4 !text-blue-700"/>
                            <AlertTitle>Important</AlertTitle>
                            <AlertDescription>
                                Your booking will only be confirmed and scheduled once an administrator has verified your payment. You will receive a notification upon confirmation.
                            </AlertDescription>
                         </Alert>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
