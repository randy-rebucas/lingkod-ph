
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
import { PaymentConfig } from "@/lib/payment-config";
import { PaymentRetryService } from "@/lib/payment-retry-service";
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
            
            // Validate file using PaymentConfig
            const validation = PaymentConfig.validateFileUpload(file);
            if (!validation.valid) {
                toast({ 
                    variant: "destructive", 
                    title: "Invalid File", 
                    description: validation.error 
                });
                return;
            }
            
            setPaymentProofFile(file);
            const reader = new FileReader();
            reader.onloadend = () => {
                setPaymentProofPreview(reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleUploadProof = async () => {
        if (!paymentProofFile || !booking || !user) return;
        setIsUploading(true);
        
        try {
            // Basic client-side validation
            if (paymentProofFile.size > 5 * 1024 * 1024) { // 5MB limit
                toast({ 
                    variant: "destructive", 
                    title: "File Too Large", 
                    description: "Payment proof file must be less than 5MB" 
                });
                return;
            }

            if (!paymentProofFile.type.startsWith('image/')) {
                toast({ 
                    variant: "destructive", 
                    title: "Invalid File Type", 
                    description: "Please upload an image file" 
                });
                return;
            }


            // Use retry service for file upload
            const uploadResult = await PaymentRetryService.retryFileUpload(async () => {
                const storagePath = `payment-proofs/${booking.id}/${Date.now()}_${paymentProofFile.name}`;
                const storageRef = ref(storage, storagePath);
                const uploadResult = await uploadBytes(storageRef, paymentProofFile);
                return await getDownloadURL(uploadResult.ref);
            });

            if (!uploadResult.success) {
                throw new Error(uploadResult.error || 'Upload failed');
            }

            const url = uploadResult.data;

            // Use retry service for database operations
            const dbResult = await PaymentRetryService.retryDatabaseOperation(async () => {
                const bookingRef = doc(db, "bookings", booking.id);
                await updateDoc(bookingRef, {
                    paymentProofUrl: url,
                    status: "Pending Verification",
                    paymentRejectionReason: null,
                    paymentRejectedAt: null,
                    paymentRejectedBy: null,
                    paymentProofUploadedAt: serverTimestamp(),
                });
            });

            if (!dbResult.success) {
                throw new Error(dbResult.error || 'Database update failed');
            }
            
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

            // Payment event tracking will be handled server-side

            // Clear the file input
            setPaymentProofFile(null);
            setPaymentProofPreview(null);
            if (fileInputRef.current) fileInputRef.current.value = '';

            toast({ title: 'Upload Successful', description: 'Your proof of payment has been submitted for verification.' });
        } catch (error) {
            console.error("Error uploading proof:", error);
            let errorMessage = "Could not upload your proof of payment.";
            
            if (error instanceof Error) {
                if (error.message.includes('storage/unauthorized')) {
                    errorMessage = "You don't have permission to upload files. Please contact support.";
                } else if (error.message.includes('storage/network-request-failed')) {
                    errorMessage = "Network error. Please check your connection and try again.";
                } else if (error.message.includes('storage/quota-exceeded')) {
                    errorMessage = "Storage quota exceeded. Please contact support.";
                } else if (error.message.includes('Duplicate payment')) {
                    errorMessage = "A payment for this booking has already been submitted. Please wait for verification.";
                } else {
                    errorMessage = error.message;
                }
            }
            
            toast({ 
                variant: "destructive", 
                title: "Upload Failed", 
                description: errorMessage 
            });
        } finally {
            setIsUploading(false);
        }
    };

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8 w-full">
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
        <div className="max-w-6xl mx-auto space-y-8 w-full">
            <div className="relative z-10 flex items-center gap-4">
                <Button variant="outline" size="icon" onClick={() => router.push('/bookings')} className="hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                        Payment Instructions
                    </h1>
                    <p className="text-xl text-muted-foreground leading-relaxed">
                        For booking: {booking.serviceName}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Payment Details</CardTitle>
                        <CardDescription className="text-base">Please complete your payment using one of the methods below.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6 p-6">
                        <div className="p-6 rounded-xl bg-gradient-to-r from-muted/50 to-muted/30 text-center space-y-3 border border-border/50 shadow-soft">
                             <p className="text-sm text-muted-foreground font-medium">Total Amount Due</p>
                             <p className="text-5xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">₱{booking.price.toFixed(2)}</p>
                             <div className="flex items-center justify-center gap-2 pt-3">
                                <p className="text-sm text-muted-foreground">Booking ID:</p>
                                <code className="font-mono text-sm p-2 rounded-lg bg-background/80 border border-border/50 shadow-soft">{booking.id}</code>
                                <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-primary/10 transition-colors" onClick={() => handleCopy(booking.id)}>
                                    {copied ? <Check className="h-4 w-4 text-green-500" /> : <ClipboardCopy className="h-4 w-4" />}
                                </Button>
                             </div>
                             <p className="text-xs text-muted-foreground">Use your Booking ID as the reference number for your payment.</p>
                        </div>
                        
                        <div className="space-y-4">
                             <div className="flex items-center gap-3">
                                 <Wallet className="h-6 w-6 text-blue-500"/>
                                <h3 className="font-semibold text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">GCash Payment</h3>
                            </div>
                            
                            <Tabs defaultValue="automated" className="w-full">
                                <TabsList className="grid w-full grid-cols-2 bg-background/80 backdrop-blur-sm shadow-soft border-0">
                                    <TabsTrigger value="automated" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
                                        <Smartphone className="h-4 w-4" />
                                        Instant
                                    </TabsTrigger>
                                    <TabsTrigger value="manual" className="flex items-center gap-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-glow transition-all duration-300">
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
                                
                                <TabsContent value="manual" className="mt-6">
                                    <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                        <div className="text-sm space-y-2">
                                            <p><strong>Account Name:</strong> {PaymentConfig.GCASH.accountName}</p>
                                            <p><strong>Account Number:</strong> {PaymentConfig.GCASH.accountNumber}</p>
                                            <div className="w-32 h-32 mt-3 mx-auto"><QRCode/></div>
                                            <p className="text-xs text-muted-foreground mt-3 text-center">
                                                After payment, upload proof for manual verification
                                            </p>
                                        </div>
                                    </div>
                                </TabsContent>
                            </Tabs>
                        </div>
                         <Separator className="bg-border/50" />
                         <div className="space-y-4">
                            <div className="flex items-center gap-3">
                                <Landmark className="h-6 w-6 text-indigo-700"/>
                                <h3 className="font-semibold text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Bank Transfer (BPI)</h3>
                            </div>
                            <div className="p-4 rounded-lg bg-gradient-to-r from-muted/30 to-muted/20 border border-border/50 shadow-soft">
                                <div className="text-sm space-y-2">
                                    <p><strong>Account Name:</strong> {PaymentConfig.BANK.accountName}</p>
                                    <p><strong>Account Number:</strong> {PaymentConfig.BANK.accountNumber}</p>
                                    {PaymentConfig.BANK.bankName && (
                                        <p><strong>Bank:</strong> {PaymentConfig.BANK.bankName}</p>
                                    )}
                                </div>
                            </div>
                        </div>

                    </CardContent>
                </Card>
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                        <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Upload Proof of Payment</CardTitle>
                        <CardDescription className="text-base">
                            {isPaymentUploaded 
                                ? "Your payment proof has been submitted."
                                : "After paying, please upload a screenshot or photo of your receipt."
                            }
                        </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4 p-6">
                         {isPaymentRejected ? (
                             <div className="space-y-4 text-center">
                                 <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border/50 shadow-soft">
                                    <Image src={booking.paymentProofUrl || "https://placehold.co/600x400.png"} alt="Payment proof" layout="fill" className="object-contain"/>
                                </div>
                                <Badge variant="destructive" className="shadow-soft">Status: {booking.status}</Badge>
                                {booking.paymentRejectionReason && (
                                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg shadow-soft">
                                        <p className="text-sm text-red-800"><strong>Rejection Reason:</strong> {booking.paymentRejectionReason}</p>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground">Please upload a new payment proof or contact support for assistance.</p>
                                <Button onClick={() => {
                                    setPaymentProofFile(null);
                                    setPaymentProofPreview(null);
                                    if (fileInputRef.current) fileInputRef.current.value = '';
                                }} className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                    Upload New Payment Proof
                                </Button>
                             </div>
                         ) : isPaymentUploaded && booking.paymentProofUrl ? (
                             <div className="space-y-4 text-center">
                                 <div className="relative aspect-video w-full rounded-lg overflow-hidden border border-border/50 shadow-soft">
                                    <Image src={booking.paymentProofUrl} alt="Payment proof" layout="fill" className="object-contain"/>
                                </div>
                                <Badge className="shadow-soft">Status: {booking.status}</Badge>
                                <p className="text-sm text-muted-foreground">An admin will verify your payment shortly.</p>
                             </div>
                         ) : (
                            <div className="space-y-4">
                                <div className="aspect-video w-full rounded-lg border-2 border-dashed border-border/50 flex items-center justify-center bg-gradient-to-r from-muted/30 to-muted/20 overflow-hidden shadow-soft">
                                     {paymentProofPreview ? (
                                        <Image src={paymentProofPreview} alt="Payment proof preview" layout="fill" className="object-contain"/>
                                    ) : (
                                        <div className="text-center text-muted-foreground p-6">
                                            <Upload className="h-12 w-12 mx-auto mb-3 text-primary opacity-60"/>
                                            <p className="text-lg font-medium">Select a file to upload</p>
                                            <p className="text-sm mt-1">Screenshot or photo of your payment receipt</p>
                                        </div>
                                    )}
                                </div>
                                <Input type="file" accept="image/*" ref={fileInputRef} onChange={handleFileChange} className="text-sm bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-colors shadow-soft" />
                                 <Button className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300" onClick={handleUploadProof} disabled={isUploading || !paymentProofFile}>
                                    {isUploading ? <Loader2 className="mr-2 animate-spin"/> : <Upload className="mr-2"/>}
                                    {isUploading ? 'Uploading...' : 'Submit Proof of Payment'}
                                </Button>
                            </div>
                         )}
                         <Alert variant="default" className="bg-gradient-to-r from-blue-50 to-blue-100 border-blue-200 text-blue-800 shadow-soft">
                            <Info className="h-4 w-4 !text-blue-700"/>
                            <AlertTitle className="font-headline">Important</AlertTitle>
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
