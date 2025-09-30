
"use client";

import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/context/auth-context';
import { getDb, getStorageInstance   } from '@/lib/firebase';
import { doc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Progress } from './ui/progress';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { Loader2, CheckCircle, AlertCircle, Clock, ShieldCheck, User, CreditCard } from 'lucide-react';
import { Badge } from './ui/badge';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

type _VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

const StatusInfo = {
    Unverified: {
        icon: <AlertCircle className="h-12 w-12 text-destructive" />,
        title: "Unverified",
        description: "Please submit your documents to get verified.",
        badgeVariant: "destructive" as const,
    },
    Pending: {
        icon: <Clock className="h-12 w-12 text-yellow-500" />,
        title: "Pending Review",
        description: "Your documents have been submitted and are under review. This may take 1-2 business days.",
        badgeVariant: "secondary" as const,
    },
    Verified: {
        icon: <CheckCircle className="h-12 w-12 text-green-500" />,
        title: "Verified",
        description: "Congratulations! Your identity has been successfully verified.",
        badgeVariant: "default" as const,
    },
    Rejected: {
        icon: <AlertCircle className="h-12 w-12 text-destructive" />,
        title: "Verification Rejected",
        description: "There was an issue with your documents. Please review the feedback and resubmit.",
        badgeVariant: "destructive" as const,
    },
};

export default function IdentityVerification() {
    const { user, verificationStatus } = useAuth();
    const { toast } = useToast();
    const { handleError } = useErrorHandler();
    const t = useTranslations('IdentityVerification');
    const [selfie, setSelfie] = useState<File | null>(null);
    const [selfiePreview, setSelfiePreview] = useState<string | null>(null);
    const [govId, setGovId] = useState<File | null>(null);
    const [govIdPreview, setGovIdPreview] = useState<string | null>(null);

    const [selfieProgress, setSelfieProgress] = useState<number | null>(null);
    const [idProgress, setIdProgress] = useState<number | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    
    const selfieInputRef = useRef<HTMLInputElement>(null);
    const govIdInputRef = useRef<HTMLInputElement>(null);


    const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>, type: 'selfie' | 'govId') => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onloadend = () => {
            if (type === 'selfie') {
                setSelfie(file);
                setSelfiePreview(reader.result as string);
            } else {
                setGovId(file);
                setGovIdPreview(reader.result as string);
            }
        };
        reader.readAsDataURL(file);
    }, []);

    const uploadFile = useCallback((file: File, path: string, setProgress: (p: number) => void) => {
        return new Promise<string>((resolve, reject) => {
            const storageRef = ref(getStorageInstance(), path);
            const uploadTask = uploadBytesResumable(storageRef, file);

            uploadTask.on('state_changed',
                (snapshot) => setProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
                (error) => reject(error),
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
    }, []);

    const handleSubmit = useCallback(async () => {
        if (!user || !selfie || !govId) {
            toast({ variant: 'destructive', title: t('missingFiles'), description: t('uploadBothFiles') });
            return;
        }

        setIsSubmitting(true);
        try {
            const selfieURL = await uploadFile(selfie, `verification/${user.uid}/selfie.jpg`, setSelfieProgress);
            const govIdURL = await uploadFile(govId, `verification/${user.uid}/gov_id.jpg`, setIdProgress);
            
            const userDocRef = doc(getDb(), 'users', user.uid);
            await updateDoc(userDocRef, {
                verification: {
                    status: 'Pending',
                    selfieUrl: selfieURL,
                    govIdUrl: govIdURL,
                    submittedAt: serverTimestamp(),
                }
            });
            
            toast({ title: t('success'), description: t('documentsSubmitted') });
            // The AuthContext will automatically update the status via its listener
            setSelfie(null);
            setSelfiePreview(null);
            setGovId(null);
            setGovIdPreview(null);

        } catch (error: unknown) {
            handleError(error, 'submit verification documents');
        } finally {
            setIsSubmitting(false);
            setSelfieProgress(null);
            setIdProgress(null);
        }
    }, [user, selfie, govId, uploadFile, toast, t, handleError]);

    const currentStatusInfo = StatusInfo[verificationStatus || 'Unverified'];

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Identity Verification</CardTitle>
                    <CardDescription>Verify your identity to build trust on the platform.</CardDescription>
                </div>
                {verificationStatus && <Badge variant={currentStatusInfo.badgeVariant}>{currentStatusInfo.title}</Badge>}
            </CardHeader>
            <CardContent>
                {verificationStatus === 'Verified' ? (
                    <div className="flex flex-col items-center justify-center text-center p-8 bg-green-50 rounded-lg">
                        {currentStatusInfo.icon}
                        <h3 className="text-xl font-bold mt-4">{currentStatusInfo.title}</h3>
                        <p className="text-muted-foreground">{currentStatusInfo.description}</p>
                    </div>
                ) : verificationStatus === 'Pending' ? (
                     <div className="flex flex-col items-center justify-center text-center p-8 bg-yellow-50 rounded-lg">
                        {currentStatusInfo.icon}
                        <h3 className="text-xl font-bold mt-4">{currentStatusInfo.title}</h3>
                        <p className="text-muted-foreground">{currentStatusInfo.description}</p>
                    </div>
                ) : (
                    <div className='space-y-6'>
                         {verificationStatus === 'Rejected' && (
                             <div className="flex flex-col items-center justify-center text-center p-8 bg-red-50 rounded-lg mb-6">
                                {currentStatusInfo.icon}
                                <h3 className="text-xl font-bold mt-4">{currentStatusInfo.title}</h3>
                                <p className="text-muted-foreground">{currentStatusInfo.description}</p>
                            </div>
                        )}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Selfie Upload */}
                            <div className="space-y-2">
                                <label className="font-medium flex items-center gap-2"><User /> Selfie</label>
                                <div className="aspect-square w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                    {selfiePreview ? (
                                        <Image src={selfiePreview} alt="Selfie preview" width={200} height={200} className="object-cover h-full w-full" />
                                    ) : (
                                        <div className="text-center text-muted-foreground p-4">
                                            <p>Upload a clear photo of yourself.</p>
                                        </div>
                                    )}
                                </div>
                                <Input type="file" accept="image/*" ref={selfieInputRef} onChange={(e) => handleFileChange(e, 'selfie')} />
                                {selfieProgress !== null && <Progress value={selfieProgress} />}
                            </div>

                            {/* ID Upload */}
                            <div className="space-y-2">
                                <label className="font-medium flex items-center gap-2"><CreditCard /> Government ID</label>
                                 <div className="aspect-square w-full rounded-md border-2 border-dashed flex items-center justify-center bg-muted/50 overflow-hidden">
                                     {govIdPreview ? (
                                        <Image src={govIdPreview} alt="ID preview" width={200} height={200} className="object-cover h-full w-full" />
                                    ) : (
                                        <div className="text-center text-muted-foreground p-4">
                                            <p>Upload a clear photo of your valid ID (e.g., Driver&apos;s License, Passport).</p>
                                        </div>
                                    )}
                                </div>
                                <Input type="file" accept="image/*" ref={govIdInputRef} onChange={(e) => handleFileChange(e, 'govId')} />
                                {idProgress !== null && <Progress value={idProgress} />}
                            </div>
                        </div>
                        <Button
                            className="w-full mt-4"
                            onClick={handleSubmit}
                            disabled={!selfie || !govId || isSubmitting}
                        >
                            {isSubmitting ? (
                                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Submitting...</>
                            ) : (
                                <><ShieldCheck className="mr-2 h-4 w-4" />Submit for Verification</>
                            )}
                        </Button>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}
