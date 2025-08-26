
"use client";

import { useEffect, useState, useRef, useMemo } from "react";
import { useTranslations } from 'next-intl';
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Camera, Upload, Loader2, Star, User, Settings, Briefcase, Award, Users, Copy, Share2, LinkIcon, Gift, ShieldCheck, ThumbsUp, ThumbsDown, MapPin, Edit, Wallet, Building, FileText, Trash2, ArrowRight } from "lucide-react";
import { storage, db } from "@/lib/firebase";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject, uploadBytes } from "firebase/storage";
import { updateProfile } from "firebase/auth";
import { doc, updateDoc, getDoc, Timestamp, collection, onSnapshot, query, orderBy, runTransaction, serverTimestamp, where, addDoc, getDocs, arrayUnion, arrayRemove } from "firebase/firestore";
import { useToast } from "@/hooks/use-toast";
import { Progress } from "@/components/ui/progress";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import IdentityVerification from "@/components/identity-verification";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { X } from "lucide-react";
import { handleInviteAction } from "./actions";
import { useLoadScript, Autocomplete } from "@react-google-maps/api";
import { Separator } from "@/components/ui/separator";
import { useActionState } from "react";
import Link from 'next/link';


type Reward = {
    id: string;
    title: string;
    description: string;
    pointsRequired: number;
    isActive: boolean;
};

type LoyaltyTransaction = {
    id: string;
    points: number;
    type: 'earn' | 'redeem' | 'referral';
    description: string;
    createdAt: Timestamp;
};

type Referral = {
    id: string;
    referredEmail: string;
    rewardPointsGranted: number;
    createdAt: Timestamp;
};

type Invite = {
    id: string;
    agencyId: string;
    agencyName: string;
    status: 'pending' | 'accepted' | 'declined';
}

type Availability = {
    day: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
};

type Category = {
    id: string;
    name: string;
};

type Document = {
    name: string;
    url: string;
    uploadedAt: Timestamp;
}

const initialAvailability: Availability[] = [
    { day: "Monday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Tuesday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Wednesday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Thursday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Friday", enabled: true, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Saturday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
    { day: "Sunday", enabled: false, startTime: "9:00 AM", endTime: "5:00 PM" },
];

const timeSlots = Array.from({ length: 24 * 2 }, (_, i) => {
    const totalMinutes = i * 30;
    const hours = Math.floor(totalMinutes / 60);
    const minutes = totalMinutes % 60;
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const formattedHours = hours % 12 === 0 ? 12 : hours % 12;
    return `${formattedHours}:${String(minutes).padStart(2, '0')} ${ampm}`;
});

export default function ProfilePage() {
    const { user, userRole, loading, subscription, verificationStatus } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Profile');
    
    // States for form fields
    const [name, setName] = useState('');
    const [phone, setPhone] = useState(''); 
    const [bio, setBio] = useState('');
    const [address, setAddress] = useState('');
    const [latitude, setLatitude] = useState<number | null>(null);
    const [longitude, setLongitude] = useState<number | null>(null);
    const [gender, setGender] = useState('');
    const [birthDay, setBirthDay] = useState<string | undefined>();
    const [birthMonth, setBirthMonth] = useState<string | undefined>();
    const [birthYear, setBirthYear] = useState<string | undefined>();
    const [availabilityStatus, setAvailabilityStatus] = useState('');
    const [yearsOfExperience, setYearsOfExperience] = useState<number | string>('');
    const [keyServices, setKeyServices] = useState<string[]>([]);
    const [currentKeyService, setCurrentKeyService] = useState("");
    const [ownsToolsSupplies, setOwnsToolsSupplies] = useState(false);
    const [isLicensed, setIsLicensed] = useState(false);
    const [licenseNumber, setLicenseNumber] = useState('');
    const [licenseType, setLicenseType] = useState('');
    const [licenseExpirationDate, setLicenseExpirationDate] = useState('');
    const [licenseIssuingState, setLicenseIssuingState] = useState('');
    const [licenseIssuingCountry, setLicenseIssuingCountry] = useState('');
    const [availabilitySchedule, setAvailabilitySchedule] = useState<Availability[]>(initialAvailability);
    const [categories, setCategories] = useState<Category[]>([]);
    
    const [isSavingPublic, setIsSavingPublic] = useState(false);
    const [isSavingPersonal, setIsSavingPersonal] = useState(false);
    const [isSavingProvider, setIsSavingProvider] = useState(false);
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [uploadProgress, setUploadProgress] = useState<number | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [rewards, setRewards] = useState<Reward[]>([]);
    const [loyaltyPoints, setLoyaltyPoints] = useState(0);
    const [transactions, setTransactions] = useState<LoyaltyTransaction[]>([]);
    const [isRedeeming, setIsRedeeming] = useState<string | null>(null);

    const [referralCode, setReferralCode] = useState('');
    const [referrals, setReferrals] = useState<Referral[]>([]);
    const [invites, setInvites] = useState<Invite[]>([]);

    const [state, formAction, isPending] = useActionState(handleInviteAction, { error: null, message: '' });

    // Payout fields
    const [payoutMethod, setPayoutMethod] = useState('');
    const [gCashNumber, setGCashNumber] = useState('');
    const [bankName, setBankName] = useState('');
    const [bankAccountNumber, setBankAccountNumber] = useState('');
    const [bankAccountName, setBankAccountName] = useState('');
    const [isSavingPayout, setIsSavingPayout] = useState(false);

    // Document fields
    const [documents, setDocuments] = useState<Document[]>([]);
    const [newDocName, setNewDocName] = useState("");
    const [newDocFile, setNewDocFile] = useState<File | null>(null);
    const [isUploadingDoc, setIsUploadingDoc] = useState(false);
    const newDocFileInputRef = useRef<HTMLInputElement>(null);

    const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
    const { isLoaded } = useLoadScript({
        googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
        libraries: ["places"],
    });

    const years = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 100 }, (_, i) => String(currentYear - i));
    }, []);

    const months = useMemo(() => {
        return Array.from({ length: 12 }, (_, i) => ({
            value: String(i),
            label: new Date(0, i).toLocaleString('default', { month: 'long' })
        }));
    }, []);

    const daysInMonth = useMemo(() => {
        if (!birthMonth || !birthYear) return 31;
        const monthIndex = parseInt(birthMonth, 10);
        const year = parseInt(birthYear, 10);
        return new Date(year, monthIndex + 1, 0).getDate();
    }, [birthMonth, birthYear]);

    useEffect(() => {
        if (state.message) {
             toast({
                title: state.error ? t('error') : t('success'),
                description: state.message,
                variant: state.error ? 'destructive' : 'default',
            });
        }
    }, [state, toast, t]);

    useEffect(() => {
        if (!user) return;
        
        const userDocRef = doc(db, "users", user.uid);
        const unsubscribeUser = onSnapshot(userDocRef, (doc) => {
            if (doc.exists()) {
                const data = doc.data();
                setName(data.displayName || user.displayName || '');
                setPhone(data.phone || '');
                setBio(data.bio || '');
                setAddress(data.address || '');
                setLatitude(data.latitude || null);
                setLongitude(data.longitude || null);
                setGender(data.gender || '');
                setReferralCode(data.referralCode || '');
                if (data.birthdate && data.birthdate.toDate) {
                    const date = data.birthdate.toDate();
                    setBirthDay(String(date.getDate()));
                    setBirthMonth(String(date.getMonth()));
                    setBirthYear(String(date.getFullYear()));
                }
                setLoyaltyPoints(data.loyaltyPoints || 0);

                if (userRole === 'provider' || userRole === 'agency') {
                    setAvailabilityStatus(data.availabilityStatus || '');
                    setYearsOfExperience(data.yearsOfExperience || '');
                    setKeyServices(data.keyServices || []);
                    setOwnsToolsSupplies(data.ownsToolsSupplies || false);
                    setIsLicensed(data.isLicensed || false);
                    setLicenseNumber(data.licenseNumber || '');
                    setLicenseType(data.licenseType || '');
                    setLicenseExpirationDate(data.licenseExpirationDate || '');
                    setLicenseIssuingState(data.licenseIssuingState || '');
                    setLicenseIssuingCountry(data.licenseIssuingCountry || '');
                    setAvailabilitySchedule(data.availabilitySchedule || initialAvailability);
                }

                if (userRole === 'provider' || userRole === 'agency') {
                    // Load payout details
                    setPayoutMethod(data.payoutDetails?.method || '');
                    setGCashNumber(data.payoutDetails?.gCashNumber || '');
                    setBankName(data.payoutDetails?.bankName || '');
                    setBankAccountNumber(data.payoutDetails?.bankAccountNumber || '');
                    setBankAccountName(data.payoutDetails?.bankAccountName || '');
                    setDocuments(data.documents || []);
                }
            }
        });

        const fetchCategories = async () => {
            try {
                const categoriesRef = collection(db, "categories");
                const q = query(categoriesRef, orderBy("name"));
                const querySnapshot = await getDocs(q);
                const fetchedCategories = querySnapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name }));
                setCategories(fetchedCategories);
            } catch (error) {
                console.error("Error fetching categories: ", error);
            }
        };

        if (userRole === 'provider' || userRole === 'agency') {
            fetchCategories();
        }

        // Fetch loyalty rewards
        const rewardsRef = collection(db, "loyaltyRewards");
        const qRewards = query(rewardsRef, where("isActive", "==", true), orderBy("pointsRequired"));
        const unsubscribeRewards = onSnapshot(qRewards, (snapshot) => {
            const rewardsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Reward));
            setRewards(rewardsData);
        });

        // Fetch loyalty transactions
        const transactionsRef = collection(db, `users/${user.uid}/loyaltyTransactions`);
        const qTransactions = query(transactionsRef, orderBy("createdAt", "desc"));
        const unsubscribeTransactions = onSnapshot(qTransactions, (snapshot) => {
            const transData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as LoyaltyTransaction));
            setTransactions(transData);
        });

        // Fetch referrals
        const referralsRef = collection(db, 'referrals');
        const qReferrals = query(referralsRef, where("referrerId", "==", user.uid), orderBy("createdAt", "desc"));
        const unsubscribeReferrals = onSnapshot(qReferrals, (snapshot) => {
            const referralsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data()} as Referral));
            setReferrals(referralsData);
        });

        // Fetch Agency Invites
        const invitesRef = collection(db, "invites");
        const qInvites = query(invitesRef, where("providerId", "==", user.uid), where("status", "==", "pending"));
        const unsubscribeInvites = onSnapshot(qInvites, (snapshot) => {
            const invitesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Invite));
            setInvites(invitesData);
        });


        return () => {
            unsubscribeUser();
            unsubscribeRewards();
            unsubscribeTransactions();
            unsubscribeReferrals();
            unsubscribeInvites();
        };
    }, [user, userRole]);


    const handleCopy = (textToCopy: string, toastMessage: string) => {
        navigator.clipboard.writeText(textToCopy);
        toast({ title: t('copied'), description: toastMessage });
    };

    const handleRedeemReward = async (reward: Reward) => {
        if (!user || loyaltyPoints < reward.pointsRequired) {
            toast({ variant: "destructive", title: t('error'), description: t('notEnoughPoints') });
            return;
        }

        setIsRedeeming(reward.id);
        const userRef = doc(db, "users", user.uid);

        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userRef);
                if (!userDoc.exists()) throw "User document does not exist!";

                const currentPoints = userDoc.data().loyaltyPoints || 0;
                if (currentPoints < reward.pointsRequired) throw "Not enough points.";

                const newTotalPoints = currentPoints - reward.pointsRequired;
                transaction.update(userRef, { loyaltyPoints: newTotalPoints });

                const loyaltyTxRef = doc(collection(db, `users/${user.uid}/loyaltyTransactions`));
                transaction.set(loyaltyTxRef, {
                    points: reward.pointsRequired, type: 'redeem',
                    description: `Redeemed: ${reward.title}`,
                    rewardId: reward.id, createdAt: serverTimestamp()
                });
            });
            toast({ title: t('rewardRedeemed'), description: t('rewardRedeemedDescription', { rewardTitle: reward.title }) });
        } catch (error) {
            console.error("Error redeeming reward:", error);
            const errorMessage = error instanceof Error ? error.message : t('couldNotRedeemReward');
            toast({ variant: "destructive", title: t('redemptionFailed'), description: errorMessage });
        } finally {
            setIsRedeeming(null);
        }
    };


    const getAvatarFallback = (name: string | null | undefined) => {
        if (!name) return "U";
        const parts = name.split(" ");
        if (parts.length > 1 && parts[0] && parts[1]) {
            return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setImageFile(e.target.files[0]);
        }
    };

    const handlePublicProfileUpdate = async () => {
        if (!user) return;
        setIsSavingPublic(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                displayName: name,
                bio: bio,
            };

            if (user.displayName !== name) {
                await updateProfile(user, { displayName: name });
            }
            
            await updateDoc(userDocRef, updates);
            toast({ title: t('success'), description: t('publicProfileUpdated') });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('updateFailed'), description: error.message });
        } finally {
            setIsSavingPublic(false);
        }
    }

    const handlePersonalDetailsUpdate = async () => {
        if (!user) return;
        setIsSavingPersonal(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                phone: phone,
                gender: gender,
                address: address,
                latitude: latitude,
                longitude: longitude,
            };

            if (birthDay && birthMonth && birthYear) {
                const day = parseInt(birthDay, 10);
                const month = parseInt(birthMonth, 10);
                const year = parseInt(birthYear, 10);
                updates.birthdate = Timestamp.fromDate(new Date(year, month, day));
            }

            await updateDoc(userDocRef, updates);
            toast({ title: t('success'), description: t('personalDetailsUpdated') });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('updateFailed'), description: error.message });
        } finally {
            setIsSavingPersonal(false);
        }
    }
    
    const handleProviderDetailsUpdate = async () => {
        if (!user) return;
        setIsSavingProvider(true);
         try {
            const userDocRef = doc(db, "users", user.uid);
            const updates: { [key: string]: any } = {
                availabilityStatus: availabilityStatus,
                yearsOfExperience: Number(yearsOfExperience),
                keyServices: keyServices,
                ownsToolsSupplies: ownsToolsSupplies,
                isLicensed: isLicensed,
                licenseNumber: licenseNumber,
                licenseType: licenseType,
                licenseExpirationDate: licenseExpirationDate,
                licenseIssuingState: licenseIssuingState,
                licenseIssuingCountry: licenseIssuingCountry,
                availabilitySchedule: availabilitySchedule,
            };
            
            await updateDoc(userDocRef, updates);
            toast({ title: t('success'), description: t('detailsUpdated') });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('updateFailed'), description: error.message });
        } finally {
            setIsSavingProvider(false);
        }
    }

    const handlePayoutDetailsUpdate = async () => {
        if (!user) return;
        setIsSavingPayout(true);
        try {
            const userDocRef = doc(db, "users", user.uid);
            const payoutDetails: any = { method: payoutMethod };
            if (payoutMethod === 'gcash') {
                payoutDetails.gCashNumber = gCashNumber;
            } else if (payoutMethod === 'bank') {
                payoutDetails.bankName = bankName;
                payoutDetails.bankAccountNumber = bankAccountNumber;
                payoutDetails.bankAccountName = bankAccountName;
            }
            await updateDoc(userDocRef, { payoutDetails });
            toast({ title: t('success'), description: t('payoutDetailsUpdated') });
        } catch (error: any) {
            toast({ variant: "destructive", title: t('updateFailed'), description: error.message });
        } finally {
            setIsSavingPayout(false);
        }
    };
    
    const handleUpload = async () => {
        if (!imageFile || !user) return;

        setIsUploading(true);
        setUploadProgress(0);

        const storagePath = `profile-pictures/${user.uid}/${imageFile.name}`;
        const storageRef = ref(storage, storagePath);
        const uploadTask = uploadBytesResumable(storageRef, imageFile);

        uploadTask.on(
            'state_changed',
            (snapshot) => {
                const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
                setUploadProgress(progress);
            },
            (error) => {
                console.error("Upload failed", error);
                toast({ variant: "destructive", title: t('uploadFailed'), description: error.message });
                setIsUploading(false);
                setUploadProgress(null);
                setImageFile(null);
            },
            async () => {
                try {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    await updateProfile(user, { photoURL: downloadURL });
                    const userDocRef = doc(db, "users", user.uid);
                    await updateDoc(userDocRef, { photoURL: downloadURL });
                    toast({ title: t('success'), description: t('profilePictureUpdated') });
                } catch (error: any) {
                     toast({ variant: "destructive", title: t('updateFailed'), description: t('failedToUpdateProfilePicture') });
                } finally {
                    setIsUploading(false);
                    setUploadProgress(null);
                    setImageFile(null);
                }
            }
        );
    };

    const handleUploadDocument = async () => {
        if (!user || !newDocFile || !newDocName) {
            toast({ variant: 'destructive', title: t('missingInfo'), description: t('pleaseProvideDocumentInfo') });
            return;
        }
        setIsUploadingDoc(true);
        try {
            const storagePath = `provider-documents/${user.uid}/${Date.now()}_${newDocFile.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadResult = await uploadBytes(storageRef, newDocFile);
            const url = await getDownloadURL(uploadResult.ref);

            const newDocument = {
                name: newDocName,
                url: url,
                uploadedAt: Timestamp.now()
            };

            await updateDoc(doc(db, "users", user.uid), {
                documents: arrayUnion(newDocument)
            });

            toast({ title: t('success'), description: t('documentUploaded') });
            setNewDocName("");
            setNewDocFile(null);
            if (newDocFileInputRef.current) newDocFileInputRef.current.value = "";

        } catch (error) {
            console.error("Document upload failed: ", error);
            toast({ variant: 'destructive', title: t('uploadFailed'), description: t('couldNotDeleteDocument') });
        } finally {
            setIsUploadingDoc(false);
        }
    };

    const handleDeleteDocument = async (docToDelete: Document) => {
        if (!user) return;
        try {
            // Delete from Storage
            const fileRef = ref(storage, docToDelete.url);
            await deleteObject(fileRef);

            // Delete from Firestore
            const userRef = doc(db, "users", user.uid);
            await updateDoc(userRef, {
                documents: arrayRemove(docToDelete)
            });

            toast({ title: t('success'), description: t('documentDeleted') });
        } catch (error) {
            console.error("Error deleting document: ", error);
            toast({ variant: 'destructive', title: t('error'), description: t('couldNotDeleteDocument') });
        }
    };

    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <Skeleton className="h-10 w-1/3" />
                    <Skeleton className="h-4 w-2/3 mt-2" />
                </div>
                <div className="grid gap-6 md:grid-cols-3">
                    <div className="md:col-span-1 space-y-6">
                        <Skeleton className="h-64 w-full" />
                    </div>
                    <div className="md:col-span-2">
                        <Skeleton className="h-96 w-full" />
                    </div>
                </div>
            </div>
        );
    }
    
    if (!user) {
        return <p>{t('pleaseLoginToViewProfile')}</p>;
    }
    
    const totalReferralPoints = referrals.reduce((sum, ref) => sum + ref.rewardPointsGranted, 0);
    
    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/signup?ref=${referralCode}` : '';

    const handleAddKeyService = () => {
        if (currentKeyService.trim() && !keyServices.includes(currentKeyService.trim())) {
            if (keyServices.length >= 5) {
                toast({
                    variant: "destructive",
                    title: t('limitReached'),
                    description: t('maxKeyServices')
                });
                return;
            }
            setKeyServices([...keyServices, currentKeyService.trim()]);
            setCurrentKeyService("");
        }
    };
    const handleRemoveKeyService = (serviceToRemove: string) => {
        setKeyServices(keyServices.filter(s => s !== serviceToRemove));
    }

    const handleAvailabilityChange = (day: string, field: keyof Availability, value: any) => {
        setAvailabilitySchedule(prev => 
            prev.map(item => item.day === day ? { ...item, [field]: value } : item)
        );
    };


    const isProvider = userRole === 'provider';
    const isAgency = userRole === 'agency';
    const isClient = userRole === 'client';


    const handleCurrentLocation = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(async (position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                setLatitude(lat);
                setLongitude(lng);

                // Reverse Geocode to get address
                const geocoder = new google.maps.Geocoder();
                geocoder.geocode({ location: { lat, lng } }, (results, status) => {
                    if (status === 'OK' && results && results[0]) {
                        setAddress(results[0].formatted_address);
                    } else {
                        toast({ variant: 'destructive', title: t('error'), description: t('couldNotRetrieveAddress') });
                    }
                });
            }, (error) => {
                 toast({ variant: 'destructive', title: t('geolocationError'), description: error.message });
            });
        } else {
            toast({ variant: 'destructive', title: t('error'), description: t('geolocationNotSupported') });
        }
    };

    const onLoad = (autocomplete: google.maps.places.Autocomplete) => {
        autocompleteRef.current = autocomplete;
    };

    const onPlaceChanged = () => {
        if (autocompleteRef.current) {
            const place = autocompleteRef.current.getPlace();
            if (place.formatted_address) {
                setAddress(place.formatted_address);
            }
            if (place.geometry?.location) {
                setLatitude(place.geometry.location.lat());
                setLongitude(place.geometry.location.lng());
            }
        }
    };

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                <p className="text-muted-foreground">
                    {t('subtitle')}
                </p>
            </div>

            <Card>
                <CardHeader className="flex-row items-center gap-4 space-y-0">
                    <div className="relative">
                        <Avatar className="h-24 w-24 border-2 border-primary">
                            <AvatarImage src={user.photoURL || ''} alt={user.displayName || 'User'} />
                            <AvatarFallback className="text-3xl">{getAvatarFallback(user.displayName)}</AvatarFallback>
                        </Avatar>
                        <Button size="icon" className="absolute bottom-0 right-0 rounded-full h-8 w-8" onClick={() => fileInputRef.current?.click()}>
                            <Camera className="h-4 w-4"/>
                            <span className="sr-only">{t('changePhoto')}</span>
                        </Button>
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} accept="image/*" className="hidden" />
                    </div>
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            {user.displayName}
                             {verificationStatus === 'Verified' && (
                                <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
                                    <ShieldCheck className="h-4 w-4" />
                                    {t('verified')}
                                </Badge>
                            )}
                             {subscription?.planId === 'pro' && (
                                <Badge variant="default" className="flex items-center gap-1 bg-blue-100 text-blue-800 border-blue-200">
                                    <ShieldCheck className="h-4 w-4" />
                                    {t('pro')}
                                </Badge>
                            )}
                             {subscription?.planId === 'elite' && (
                                <Badge variant="default" className="flex items-center gap-1 bg-purple-100 text-purple-800 border-purple-200">
                                    <Star className="h-4 w-4" />
                                    {t('elite')}
                                </Badge>
                            )}
                        </CardTitle>
                        <CardDescription className="flex items-center gap-2 mt-1">
                           {user.email}
                            <Badge variant="secondary" className="capitalize">{userRole}</Badge>
                        </CardDescription>
                         {imageFile && (
                            <div className="mt-2 space-y-2 text-left">
                                <p className="text-sm text-muted-foreground truncate">{t('selected', { fileName: imageFile.name })}</p>
                                {isUploading && uploadProgress !== null ? (
                                    <Progress value={uploadProgress} className="w-full" />
                                ) : (
                                    <Button onClick={handleUpload} disabled={isUploading} size="sm">
                                        <Upload className="mr-2 h-4 w-4" />
                                        {isUploading ? t('uploading') : t('uploadPicture')}
                                    </Button>
                                )}
                            </div>
                        )}
                    </div>
                </CardHeader>
            </Card>
            
            {userRole === 'provider' && invites.length > 0 && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('agencyInvitations')}</CardTitle>
                        <CardDescription>{t('agencyInvitationsDescription')}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-2">
                        {invites.map(invite => (
                             <form action={formAction} key={invite.id} className="flex items-center justify-between p-3 border rounded-lg">
                                <p>{t('invitationFrom', { agencyName: invite.agencyName })}</p>
                                <input type="hidden" name="inviteId" value={invite.id} />
                                <div className="flex gap-2">
                                    <Button size="sm" variant="outline" type="submit" name="accepted" value="true" disabled={isPending}>
                                        <ThumbsUp className="mr-2 h-4 w-4"/> {t('accept')}
                                    </Button>
                                    <Button size="sm" variant="destructive" type="submit" name="accepted" value="false" disabled={isPending}>
                                        <ThumbsDown className="mr-2 h-4 w-4"/> {t('decline')}
                                    </Button>
                                </div>
                            </form>
                        ))}
                    </CardContent>
                </Card>
            )}

            {userRole === 'client' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('becomeProvider')}</CardTitle>
                        <CardDescription>{t('becomeProviderDescription')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/subscription">
                                {t('viewProviderPlans')} <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}
             {userRole === 'provider' && (
                <Card>
                    <CardHeader>
                        <CardTitle>{t('upgradeToAgency')}</CardTitle>
                        <CardDescription>{t('upgradeToAgencyDescription')}</CardDescription>
                    </CardHeader>
                    <CardFooter>
                        <Button asChild>
                            <Link href="/subscription">
                                {t('viewAgencyPlans')} <ArrowRight className="ml-2 h-4 w-4"/>
                            </Link>
                        </Button>
                    </CardFooter>
                </Card>
            )}

            <Tabs defaultValue="public-profile" className="w-full">
                 <TabsList className="w-full h-auto justify-start overflow-x-auto">
                    <TabsTrigger value="public-profile"><User className="mr-2"/> {t('publicProfile')}</TabsTrigger>
                    {isProvider && <TabsTrigger value="provider-settings"><Briefcase className="mr-2"/> {t('provider')}</TabsTrigger>}
                    {isAgency && <TabsTrigger value="business-settings"><Building className="mr-2"/> {t('business')}</TabsTrigger>}
                    {(isProvider || isAgency) && <TabsTrigger value="payout-settings"><Wallet className="mr-2" /> {t('payout')}</TabsTrigger>}
                    <TabsTrigger value="account-settings"><Settings className="mr-2"/> {t('account')}</TabsTrigger>
                    {userRole !== 'admin' && (
                        <>
                            <TabsTrigger value="loyalty"><Award className="mr-2"/> {t('loyalty')}</TabsTrigger>
                            <TabsTrigger value="referrals"><Users className="mr-2"/> {t('referrals')}</TabsTrigger>
                        </>
                    )}
                </TabsList>

                <TabsContent value="public-profile" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Public Profile Information</CardTitle>
                            <CardDescription>This information will be displayed on your public profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="name">{isAgency ? 'Business Name' : 'Full Name'}</Label>
                                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="bio">Bio / About</Label>
                                <Textarea 
                                    id="bio"
                                    placeholder="Tell us a little about yourself or your business..."
                                    value={bio}
                                    onChange={(e) => setBio(e.target.value)}
                                    rows={5}
                                />
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handlePublicProfileUpdate} disabled={isSavingPublic}>
                                {isSavingPublic && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingPublic ? 'Saving...' : 'Update Profile'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                
                <TabsContent value="account-settings" className="mt-6 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Personal Details</CardTitle>
                            <CardDescription>This information is private and will not be shown on your profile.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="email">Email Address</Label>
                                <Input id="email" type="email" value={user.email || ''} disabled />
                            </div>
                             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="phone">Mobile Number</Label>
                                    <Input id="phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="e.g., 09123456789" />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="gender">Gender</Label>
                                    <Select value={gender} onValueChange={setGender}>
                                        <SelectTrigger id="gender"><SelectValue placeholder="Select gender" /></SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="male">Male</SelectItem>
                                            <SelectItem value="female">Female</SelectItem>
                                            <SelectItem value="other">Other</SelectItem>
                                            <SelectItem value="prefer-not-to-say">Prefer not to say</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>
                            {isLoaded && (
                                <div className="space-y-2">
                                    <Label htmlFor="address">Address / Service Area</Label>
                                    <div className="flex gap-2 items-center">
                                        <Autocomplete
                                            onLoad={onLoad}
                                            onPlaceChanged={onPlaceChanged}
                                            className="w-full"
                                        >
                                            <Input 
                                                id="address" 
                                                value={address} 
                                                onChange={(e) => setAddress(e.target.value)} 
                                                placeholder="e.g., Quezon City, Metro Manila"
                                                className="w-full"
                                            />
                                        </Autocomplete>
                                        
                                    </div>
                                    <div className="flex gap-2">
                                        <Button type="button" variant="outline" className="w-full" onClick={handleCurrentLocation}>
                                            <MapPin className="mr-2 h-4 w-4"/>
                                            Use Current Location
                                        </Button>
                                    </div>
                                    <input type="hidden" value={latitude || ''} onChange={() => {}} />
                                    <input type="hidden" value={longitude || ''} onChange={() => {}} />
                                </div>
                            )}
                            <div className="space-y-2">
                                <Label>Birthdate</Label>
                                <div className="grid grid-cols-3 gap-2">
                                    <Select value={birthMonth} onValueChange={setBirthMonth}>
                                        <SelectTrigger><SelectValue placeholder="Month" /></SelectTrigger>
                                        <SelectContent>{months.map(m => <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>)}</SelectContent>
                                    </Select>
                                    <Select value={birthDay} onValueChange={setBirthDay}>
                                        <SelectTrigger><SelectValue placeholder="Day" /></SelectTrigger>
                                        <SelectContent>
                                            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map(d => (
                                                <SelectItem key={d} value={String(d)}>{d}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                    <Select value={birthYear} onValueChange={setBirthYear}>
                                        <SelectTrigger><SelectValue placeholder="Year" /></SelectTrigger>
                                        <SelectContent>{years.map(y => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
                                    </Select>
                                </div>
                            </div>
                        </CardContent>
                         <CardFooter>
                            <Button onClick={handlePersonalDetailsUpdate} disabled={isSavingPersonal}>
                                {isSavingPersonal && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingPersonal ? 'Saving...' : 'Update Details'}
                            </Button>
                        </CardFooter>
                    </Card>

                    <Card>
                        <CardHeader>
                            <CardTitle>Password & Security</CardTitle>
                            <CardDescription>Manage your password and account security settings.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="current-password">Current Password</Label>
                                <Input id="current-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="new-password">New Password</Label>
                                <Input id="new-password" type="password" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="confirm-password">Confirm New Password</Label>
                                <Input id="confirm-password" type="password" />
                            </div>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full sm:w-auto" disabled>Change Password</Button>
                        </CardFooter>
                    </Card>
                    
                    {userRole !== 'admin' && <IdentityVerification />}
                </TabsContent>

                <TabsContent value="loyalty" className="mt-6 space-y-6">
                    <div>
                         <h2 className="text-2xl font-bold">Loyalty Program</h2>
                         <p className="text-muted-foreground">Earn points for completed bookings and redeem them for exclusive rewards.</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Card className="lg:col-span-1 bg-gradient-to-br from-primary to-accent text-primary-foreground shadow-lg flex flex-col justify-center text-center">
                            <CardHeader>
                                <CardTitle>Your Loyalty Points</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <p className="text-6xl font-bold">{loyaltyPoints.toLocaleString()}</p>
                            </CardContent>
                        </Card>
                        
                        <Card className="lg:col-span-2">
                             <CardHeader>
                                <CardTitle>Available Rewards</CardTitle>
                                <CardDescription>Use your points to claim these rewards.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {rewards.length > 0 ? rewards.map(reward => (
                                     <div key={reward.id} className="p-4 border rounded-lg flex justify-between items-center">
                                        <div>
                                            <p className="font-semibold">{reward.title}</p>
                                            <p className="text-sm text-muted-foreground">{reward.description}</p>
                                            <p className="text-sm font-bold text-primary">{reward.pointsRequired.toLocaleString()} points</p>
                                        </div>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button 
                                                    variant="secondary"
                                                    disabled={isRedeeming === reward.id || loyaltyPoints < reward.pointsRequired}
                                                >
                                                    {isRedeeming === reward.id ? <Loader2 className="animate-spin" /> : 'Redeem'}
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Confirm Redemption</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        Are you sure you want to redeem "{reward.title}" for {reward.pointsRequired.toLocaleString()} points? This action cannot be undone.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleRedeemReward(reward)}>Confirm</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                )) : <p className="text-muted-foreground text-center">No rewards available at the moment.</p>}
                            </CardContent>
                        </Card>
                    </div>
                     <Card>
                        <CardHeader>
                            <CardTitle>Points History</CardTitle>
                            <CardDescription>Your recent point transactions.</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Date</TableHead>
                                        <TableHead>Description</TableHead>
                                        <TableHead className="text-right">Points</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {transactions.length > 0 ? transactions.slice(0, 10).map(tx => (
                                         <TableRow key={tx.id}>
                                            <TableCell className="text-xs text-muted-foreground">{tx.createdAt ? format(tx.createdAt.toDate(), 'MMM d, yyyy') : ''}</TableCell>
                                            <TableCell>{tx.description}</TableCell>
                                            <TableCell className={cn("text-right font-medium", tx.type === 'earn' || tx.type === 'referral' ? 'text-green-600' : 'text-destructive')}>
                                                {tx.type === 'earn' || tx.type === 'referral' ? '+' : '-'}{tx.points.toLocaleString()}
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={3} className="text-center h-24 text-muted-foreground">No transactions yet.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </TabsContent>

                <TabsContent value="referrals" className="mt-6 space-y-6">
                    <div>
                        <h2 className="text-2xl font-bold">Referral Program</h2>
                        <p className="text-muted-foreground">Invite friends to LocalPro and earn 250 points for each successful referral!</p>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Your Referral Link & Code</CardTitle>
                                    <CardDescription>Share these with friends. When they sign up, you both get rewarded.</CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div>
                                        <Label htmlFor="referralCode" className="text-xs text-muted-foreground">Your Code</Label>
                                        <div className="flex items-center space-x-2 p-3 border-2 border-dashed rounded-lg bg-secondary">
                                            <p id="referralCode" className="text-lg font-mono font-bold text-primary flex-1">{referralCode}</p>
                                            <Button size="icon" variant="ghost" onClick={() => handleCopy(referralCode, 'Your referral code has been copied.')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                    <div>
                                        <Label htmlFor="referralLink" className="text-xs text-muted-foreground">Your Link</Label>
                                        <div className="flex items-center space-x-2 p-3 border-2 border-dashed rounded-lg bg-secondary">
                                            <p id="referralLink" className="text-sm text-primary flex-1 truncate">{referralLink}</p>
                                            <Button size="icon" variant="ghost" onClick={() => handleCopy(referralLink, 'Your referral link has been copied.')}>
                                                <Copy className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader>
                                    <CardTitle>How It Works</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">1</div>
                                        <div>
                                            <h4 className="font-semibold">Share Your Code</h4>
                                            <p className="text-sm text-muted-foreground">Send your referral link or code to friends and family.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">2</div>
                                        <div>
                                            <h4 className="font-semibold">Friend Signs Up</h4>
                                            <p className="text-sm text-muted-foreground">Your friend signs up on LocalPro using your referral code.</p>
                                        </div>
                                    </div>
                                    <div className="flex items-start gap-4">
                                        <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary font-bold">3</div>
                                        <div>
                                            <h4 className="font-semibold">You Both Earn Points</h4>
                                            <p className="text-sm text-muted-foreground">You receive 250 loyalty points once their account is created!</p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </div>
                        
                        <div className="space-y-6">
                            <Card>
                                <CardHeader>
                                    <CardTitle>Share</CardTitle>
                                    <CardDescription>Share your link directly on social media.</CardDescription>
                                </CardHeader>
                                <CardContent className="flex flex-col space-y-2">
                                     <Button variant="outline" asChild>
                                        <a href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`} target="_blank" rel="noopener noreferrer">Facebook</a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Join me on LocalPro! Use my code: ' + referralCode)}`} target="_blank" rel="noopener noreferrer">Twitter / X</a>
                                    </Button>
                                    <Button variant="outline" asChild>
                                        <a href={`https://wa.me/?text=${encodeURIComponent('Join me on LocalPro! Use my referral code ' + referralCode + ' when you sign up: ' + referralLink)}`} target="_blank" rel="noopener noreferrer">WhatsApp</a>
                                    </Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle>Referral History</CardTitle>
                                    <CardDescription>Users who joined using your code.</CardDescription>
                                </CardHeader>
                                <CardContent>
                                    {referrals.length > 0 ? (
                                        <ul className="space-y-2 text-sm">
                                            {referrals.map(ref => (
                                                <li key={ref.id} className="flex justify-between items-center">
                                                    <span>{ref.referredEmail}</span>
                                                    <span className="font-medium text-green-600">+{ref.rewardPointsGranted} pts</span>
                                                </li>
                                            ))}
                                        </ul>
                                    ) : (
                                        <p className="text-sm text-muted-foreground text-center py-4">No referrals yet.</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </TabsContent>

                 <TabsContent value="provider-settings" className="mt-6">
                    <div className="space-y-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Professional Details</CardTitle>
                                <CardDescription>Your professional experience and qualifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="yearsOfExperience">Years of Experience</Label>
                                        <Input id="yearsOfExperience" type="number" value={yearsOfExperience} onChange={(e) => setYearsOfExperience(e.target.value)} placeholder="e.g., 5" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="availabilityStatus">Availability Status</Label>
                                        <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                            <SelectTrigger id="availabilityStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="available">Available for Bookings</SelectItem>
                                                <SelectItem value="limited">Limited Availability</SelectItem>
                                                <SelectItem value="unavailable">Not Available</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <Label>Key Services</Label>
                                    <div className="flex gap-2">
                                        <Select onValueChange={setCurrentKeyService} value={currentKeyService}>
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select a key service" /></SelectTrigger>
                                            <SelectContent>
                                                {categories
                                                    .filter(cat => !keyServices.includes(cat.name))
                                                    .map(cat => (
                                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={handleAddKeyService}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {keyServices.map(service => (
                                            <Badge key={service} variant="secondary">
                                                {service}
                                                <button onClick={() => handleRemoveKeyService(service)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">List up to 5 key services to highlight on your profile card.</p>
                                </div>

                                <div className="flex items-center space-x-2">
                                    <Switch id="ownsToolsSupplies" checked={ownsToolsSupplies} onCheckedChange={setOwnsToolsSupplies} />
                                    <Label htmlFor="ownsToolsSupplies">I own my own tools and supplies</Label>
                                </div>
                            </CardContent>
                            <CardFooter>
                                <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                    {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSavingProvider ? 'Saving...' : 'Update Professional Details'}
                                </Button>
                            </CardFooter>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Weekly Availability</CardTitle>
                                <CardDescription>Set your standard working hours for each day.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {availabilitySchedule.map((item, index) => (
                                    <div key={item.day} className="grid grid-cols-4 items-center gap-4">
                                        <div className="col-span-1 flex items-center gap-2">
                                             <Switch 
                                                id={`enabled-${item.day}`} 
                                                checked={item.enabled}
                                                onCheckedChange={(checked) => handleAvailabilityChange(item.day, 'enabled', checked)}
                                            />
                                            <Label htmlFor={`enabled-${item.day}`}>{item.day}</Label>
                                        </div>
                                        <div className="col-span-3 grid grid-cols-2 gap-2">
                                             <Select 
                                                value={item.startTime}
                                                onValueChange={(value) => handleAvailabilityChange(item.day, 'startTime', value)}
                                                disabled={!item.enabled}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                             <Select 
                                                value={item.endTime}
                                                onValueChange={(value) => handleAvailabilityChange(item.day, 'endTime', value)}
                                                disabled={!item.enabled}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                    {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSavingProvider ? 'Saving...' : 'Update Availability'}
                                </Button>
                            </CardFooter>
                        </Card>

                         <Card>
                            <CardHeader>
                                <CardTitle>Licensing & Credentials</CardTitle>
                                <CardDescription>Add any relevant licenses or certifications.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="flex items-center space-x-2">
                                    <Switch id="isLicensed" checked={isLicensed} onCheckedChange={setIsLicensed}/>
                                    <Label htmlFor="isLicensed">I have a professional license or certification</Label>
                                </div>
                                {isLicensed && (
                                    <div className="space-y-4 pt-4 border-t">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                             <div className="space-y-2">
                                                <Label htmlFor="licenseType">License/Certification Type</Label>
                                                <Input id="licenseType" value={licenseType} onChange={e => setLicenseType(e.target.value)} placeholder="e.g., TESDA NC II" />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="licenseNumber">License Number</Label>
                                                <Input id="licenseNumber" value={licenseNumber} onChange={e => setLicenseNumber(e.target.value)} />
                                            </div>
                                        </div>
                                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                             <div className="space-y-2">
                                                <Label htmlFor="licenseExpirationDate">Expiration Date</Label>
                                                <Input id="licenseExpirationDate" type="date" value={licenseExpirationDate} onChange={e => setLicenseExpirationDate(e.target.value)} />
                                            </div>
                                             <div className="space-y-2">
                                                <Label htmlFor="licenseIssuingState">Issuing State/Region</Label>
                                                <Input id="licenseIssuingState" value={licenseIssuingState} onChange={e => setLicenseIssuingState(e.target.value)} placeholder="e.g., NCR" />
                                            </div>
                                            <div className="space-y-2">
                                                <Label htmlFor="licenseIssuingCountry">Issuing Country</Label>
                                                <Input id="licenseIssuingCountry" value={licenseIssuingCountry} onChange={e => setLicenseIssuingCountry(e.target.value)} placeholder="e.g., Philippines" />
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                    {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSavingProvider ? 'Saving...' : 'Update Credentials'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>
                
                <TabsContent value="business-settings" className="mt-6">
                    <div className="space-y-6">
                         <Card>
                            <CardHeader>
                                <CardTitle>Business Details</CardTitle>
                                <CardDescription>Settings related to your agency's business profile.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label htmlFor="availabilityStatus">Availability Status</Label>
                                        <Select value={availabilityStatus} onValueChange={setAvailabilityStatus}>
                                            <SelectTrigger id="availabilityStatus"><SelectValue placeholder="Select status" /></SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="available">Available for Bookings</SelectItem>
                                                <SelectItem value="limited">Limited Availability</SelectItem>
                                                <SelectItem value="unavailable">Not Available</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label>Key Services</Label>
                                    <div className="flex gap-2">
                                        <Select onValueChange={setCurrentKeyService} value={currentKeyService}>
                                            <SelectTrigger><SelectValue placeholder="Select a key service" /></SelectTrigger>
                                            <SelectContent>
                                                {categories
                                                    .filter(cat => !keyServices.includes(cat.name))
                                                    .map(cat => (
                                                    <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Button type="button" onClick={handleAddKeyService}>Add</Button>
                                    </div>
                                    <div className="flex flex-wrap gap-2 pt-2">
                                        {keyServices.map(service => (
                                            <Badge key={service} variant="secondary">
                                                {service}
                                                <button onClick={() => handleRemoveKeyService(service)} className="ml-2 rounded-full hover:bg-muted-foreground/20 p-0.5">
                                                    <X className="h-3 w-3" />
                                                </button>
                                            </Badge>
                                        ))}
                                    </div>
                                    <p className="text-xs text-muted-foreground">List up to 5 key services for your agency.</p>
                                </div>
                                <div className="space-y-2">
                                    <h4 className="font-medium">Documents</h4>
                                    <p className="text-xs text-muted-foreground">Upload business permits, contracts, or other relevant documents.</p>
                                    <div className="flex gap-2">
                                        <Input value={newDocName} onChange={e => setNewDocName(e.target.value)} placeholder="Document Name (e.g., Business Permit)" />
                                        <Input type="file" ref={newDocFileInputRef} onChange={e => setNewDocFile(e.target.files ? e.target.files[0] : null)} className="max-w-xs" />
                                        <Button onClick={handleUploadDocument} disabled={isUploadingDoc}>
                                            {isUploadingDoc ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                                            Upload
                                        </Button>
                                    </div>
                                </div>
                                 <Separator />
                                <div className="space-y-2">
                                    {documents.length > 0 ? documents.map((doc, i) => (
                                        <div key={i} className="flex items-center justify-between p-2 border rounded-md">
                                            <a href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline">
                                                <FileText className="h-4 w-4" />
                                                <span>{doc.name}</span>
                                            </a>
                                            <AlertDialog>
                                                <AlertDialogTrigger asChild>
                                                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                                        <Trash2 className="h-4 w-4" />
                                                    </Button>
                                                </AlertDialogTrigger>
                                                <AlertDialogContent>
                                                    <AlertDialogHeader>
                                                        <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                        <AlertDialogDescription>
                                                            This will permanently delete the document "{doc.name}". This action cannot be undone.
                                                        </AlertDialogDescription>
                                                    </AlertDialogHeader>
                                                    <AlertDialogFooter>
                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                        <AlertDialogAction onClick={() => handleDeleteDocument(doc)} className="bg-destructive hover:bg-destructive/80">Delete</AlertDialogAction>
                                                    </AlertDialogFooter>
                                                </AlertDialogContent>
                                            </AlertDialog>
                                        </div>
                                    )) : <p className="text-sm text-muted-foreground">No documents uploaded yet.</p>}
                                </div>
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                    {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSavingProvider ? 'Saving...' : 'Update Business Details'}
                                </Button>
                            </CardFooter>
                        </Card>
                         <Card>
                            <CardHeader>
                                <CardTitle>Weekly Availability</CardTitle>
                                <CardDescription>Set your standard business hours for each day.</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                {availabilitySchedule.map((item, index) => (
                                    <div key={item.day} className="grid grid-cols-4 items-center gap-4">
                                        <div className="col-span-1 flex items-center gap-2">
                                             <Switch 
                                                id={`enabled-${item.day}-agency`} 
                                                checked={item.enabled}
                                                onCheckedChange={(checked) => handleAvailabilityChange(item.day, 'enabled', checked)}
                                            />
                                            <Label htmlFor={`enabled-${item.day}-agency`}>{item.day}</Label>
                                        </div>
                                        <div className="col-span-3 grid grid-cols-2 gap-2">
                                             <Select 
                                                value={item.startTime}
                                                onValueChange={(value) => handleAvailabilityChange(item.day, 'startTime', value)}
                                                disabled={!item.enabled}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                             <Select 
                                                value={item.endTime}
                                                onValueChange={(value) => handleAvailabilityChange(item.day, 'endTime', value)}
                                                disabled={!item.enabled}
                                            >
                                                <SelectTrigger><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                    {timeSlots.map(time => <SelectItem key={time} value={time}>{time}</SelectItem>)}
                                                </SelectContent>
                                            </Select>
                                        </div>
                                    </div>
                                ))}
                            </CardContent>
                             <CardFooter>
                                <Button onClick={handleProviderDetailsUpdate} disabled={isSavingProvider}>
                                    {isSavingProvider && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                    {isSavingProvider ? 'Saving...' : 'Update Availability'}
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>
                </TabsContent>

                <TabsContent value="payout-settings" className="mt-6">
                    <Card>
                        <CardHeader>
                            <CardTitle>Payout Details</CardTitle>
                            <CardDescription>Set your preferred method for receiving payments.</CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                                <div className="space-y-2">
                                <Label>Payout Method</Label>
                                <Select value={payoutMethod} onValueChange={setPayoutMethod}>
                                    <SelectTrigger><SelectValue placeholder="Select a method" /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="gcash">GCash</SelectItem>
                                        <SelectItem value="bank">Bank Transfer</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            {payoutMethod === 'gcash' && (
                                <div className="space-y-2 border-l-2 border-primary pl-4">
                                    <Label htmlFor="gCashNumber">GCash Number</Label>
                                    <Input id="gCashNumber" value={gCashNumber} onChange={e => setGCashNumber(e.target.value)} placeholder="09123456789"/>
                                </div>
                            )}
                            {payoutMethod === 'bank' && (
                                    <div className="space-y-4 border-l-2 border-primary pl-4">
                                        <div className="space-y-2">
                                        <Label htmlFor="bankName">Bank Name</Label>
                                        <Input id="bankName" value={bankName} onChange={e => setBankName(e.target.value)} placeholder="e.g., BDO Unibank"/>
                                    </div>
                                        <div className="space-y-2">
                                        <Label htmlFor="bankAccountNumber">Account Number</Label>
                                        <Input id="bankAccountNumber" value={bankAccountNumber} onChange={e => setBankAccountNumber(e.target.value)} />
                                    </div>
                                    <div className="space-y-2">
                                        <Label htmlFor="bankAccountName">Account Name</Label>
                                        <Input id="bankAccountName" value={bankAccountName} onChange={e => setBankAccountName(e.target.value)} />
                                    </div>
                                </div>
                            )}
                        </CardContent>
                        <CardFooter>
                            <Button onClick={handlePayoutDetailsUpdate} disabled={isSavingPayout}>
                                {isSavingPayout && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {isSavingPayout ? 'Saving...' : 'Save Payout Details'}
                            </Button>
                        </CardFooter>
                    </Card>
                </TabsContent>
                
            </Tabs>
        </div>
    );
}

    