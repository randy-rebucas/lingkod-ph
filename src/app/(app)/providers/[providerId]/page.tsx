
"use client";

import { useEffect, useState, useRef } from "react";
import { useTranslations } from 'next-intl';
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, query, where, getDocs, Timestamp, addDoc, serverTimestamp, deleteDoc, setDoc, onSnapshot, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Star, BriefcaseBusiness, MessageSquare, CalendarPlus, Clock, Heart, Flag, Building, FileText } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/context/auth-context";
import { useToast } from "@/hooks/use-toast";
import { BookingDialog } from "@/components/booking-dialog";
import { cn } from "@/lib/utils";
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { format } from "date-fns";

type Availability = {
    day: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
};

type Provider = {
    uid: string;
    displayName: string;
    email: string;
    bio?: string;
    photoURL?: string;
    role: 'provider' | 'agency';
    availabilitySchedule?: Availability[];
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
    keyServices?: string[];
    isVerified?: boolean;
    documents?: { name: string; url: string }[];
};

export type Service = {
    id: string;
    name: string;
    category: string;
    price: number;
    description: string;
    status: 'Active' | 'Inactive';
};

type Review = {
    id: string;
    clientName: string;
    clientAvatar?: string;
    rating: number;
    comment: string;
    createdAt: Timestamp;
};

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getAvailabilityBadge = (status: Provider['availabilityStatus']) => {
    switch (status) {
        case 'available':
            return <Badge variant="default" className="bg-green-100 text-green-800 border-green-200">Available</Badge>;
        case 'limited':
            return <Badge variant="secondary" className="bg-yellow-100 text-yellow-800 border-yellow-200">Limited</Badge>;
        case 'unavailable':
            return <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">Unavailable</Badge>;
        default:
            return null;
    }
};

export default function ProviderProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('ProviderProfile');
    const providerId = params.providerId as string;
    const servicesRef = useRef<HTMLDivElement>(null);

    const [provider, setProvider] = useState<Provider | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(true);

    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    useEffect(() => {
        if (!providerId || !db) return;

        const fetchProviderData = async () => {
            if (!db) return;
            setLoading(true);
            try {
                // Fetch provider details
                const providerDocRef = doc(db, "users", providerId);
                const providerDoc = await getDoc(providerDocRef);
                if (providerDoc.exists()) {
                    setProvider({ uid: providerDoc.id, ...providerDoc.data() } as Provider);
                }

                // Fetch services
                const servicesQuery = query(collection(db, "services"), where("userId", "==", providerId), where("status", "==", "Active"));
                const servicesSnapshot = await getDocs(servicesQuery);
                const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);

                // Fetch reviews
                const reviewsQuery = query(collection(db, "reviews"), where("providerId", "==", providerId), orderBy("createdAt", "desc"));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
                setReviews(reviewsData);

            } catch (error) {
                console.error("Error fetching provider data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchProviderData();
    }, [providerId]);
    
    useEffect(() => {
        if (!user || !providerId || !db) {
            setIsFavoriteLoading(false);
            return;
        }
        setIsFavoriteLoading(true);
        const favQuery = query(
            collection(db, 'favorites'),
            where('userId', '==', user.uid),
            where('providerId', '==', providerId)
        );

        const unsubscribe = onSnapshot(favQuery, (snapshot) => {
            setIsFavorited(!snapshot.empty);
            setIsFavoriteLoading(false);
        });
        
        return () => unsubscribe();
    }, [user, providerId]);


    const handleToggleFavorite = async () => {
        if (!user || !provider || !db) {
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedInToFavorite') });
            return;
        }
        setIsFavoriteLoading(true);
        const favoritesRef = collection(db, 'favorites');
        
        try {
            if (isFavorited) {
                const q = query(favoritesRef, where('userId', '==', user.uid), where('providerId', '==', provider.uid));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    await deleteDoc(snapshot.docs[0].ref);
                }
                toast({ title: t('removedFromFavorites') });
            } else {
                 await addDoc(favoritesRef, {
                    userId: user.uid,
                    providerId: provider.uid,
                    favoritedAt: serverTimestamp()
                });
                toast({ title: t('addedToFavorites') });
            }
        } catch (error) {
            console.error("Error updating favorite status:", error);
            toast({ variant: "destructive", title: t('error'), description: t('couldNotUpdateFavorites') });
        } finally {
            setIsFavoriteLoading(false);
        }
    };
    
    const handleSendMessage = async () => {
        if (!user || !provider || !db) {
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedInToMessage') });
            return;
        }

        if (user.uid === provider.uid) {
             toast({ variant: "destructive", title: t('error'), description: t('cannotMessageYourself') });
            return;
        }

        try {
            // Check if a conversation already exists
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("participants", "array-contains", user.uid));
            const querySnapshot = await getDocs(q);
            
            let existingConvoId: string | null = null;
            querySnapshot.forEach(doc => {
                const convo = doc.data();
                if (convo.participants.includes(provider.uid)) {
                    existingConvoId = doc.id;
                }
            });

            if (existingConvoId) {
                router.push(`/messages?conversationId=${existingConvoId}`);
            } else {
                // Create a new conversation
                const newConvoRef = await addDoc(collection(db, "conversations"), {
                    participants: [user.uid, provider.uid],
                    participantInfo: {
                        [user.uid]: {
                            displayName: user.displayName,
                            photoURL: user.photoURL || '',
                        },
                        [provider.uid]: {
                            displayName: provider.displayName,
                            photoURL: provider.photoURL || '',
                        }
                    },
                    lastMessage: "Conversation started.",
                    timestamp: serverTimestamp(),
                });
                router.push(`/messages?conversationId=${newConvoRef.id}`);
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast({ variant: "destructive", title: t('error'), description: t('couldNotStartConversation') });
        }
    };

    const handleReportProvider = async () => {
        if (!user || !provider || !reportReason || !db) {
            toast({ variant: "destructive", title: t('error'), description: t('pleaseProvideReason') });
            return;
        }
        setIsReporting(true);
        try {
            await addDoc(collection(db, "reports"), {
                reportedBy: user.uid,
                reportedItemType: 'user',
                reportedItemId: provider.uid,
                reason: reportReason,
                status: 'New',
                createdAt: serverTimestamp(),
            });
            toast({ title: t('reportSubmitted'), description: t('reportSubmittedDescription') });
            setReportReason("");
        } catch(error) {
            console.error("Error submitting report:", error);
            toast({ variant: "destructive", title: t('error'), description: t('failedToSubmitReport') });
        } finally {
            setIsReporting(false);
        }
    };
    
    const handleBookNow = () => {
        servicesRef.current?.scrollIntoView({ behavior: 'smooth' });
    }

    const handleBookServiceClick = (service: Service) => {
        if (!user) {
            toast({ variant: 'destructive', title: t('loginRequired'), description: t('pleaseLoginToBook') });
            router.push('/login');
            return;
        }
        setSelectedService(service);
        setIsBookingDialogOpen(true);
    };

    const overallRating = reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0;

    if (loading) {
        return (
            <div className="container space-y-8">
                <Card className="flex flex-col md:flex-row items-center gap-6 p-6">
                    <Skeleton className="h-32 w-32 rounded-full" />
                    <div className="space-y-4 flex-1">
                        <Skeleton className="h-8 w-48" />
                        <Skeleton className="h-5 w-32" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                </Card>
                <Skeleton className="h-64 w-full" />
                <Skeleton className="h-48 w-full" />
            </div>
        )
    }

    if (!provider) {
        return (
            <div className="container text-center py-20">
                <h1 className="text-4xl font-bold">{t('providerNotFound')}</h1>
                <p className="text-muted-foreground mt-4">{t('providerNotFoundDescription')}</p>
                <Button asChild className="mt-8">
                    <Link href="/dashboard">{t('returnToDashboard')}</Link>
                </Button>
            </div>
        )
    }

    const today = new Date().toLocaleString('en-us', { weekday: 'long' });
    const todaySchedule = provider.availabilitySchedule?.find(s => s.day === today);
    const ProfileIcon = provider.role === 'agency' ? Building : BriefcaseBusiness;

    return (
        <Dialog>
            <div className="container space-y-8">
                {/* Header Card */}
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <Avatar className="h-32 w-32 border-4 border-primary">
                                <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                                <AvatarFallback className="text-5xl">{getAvatarFallback(provider.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <CardTitle className="text-4xl font-bold font-headline">{provider.displayName}</CardTitle>
                                    {getAvailabilityBadge(provider.availabilityStatus)}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                                    {renderStars(overallRating)}
                                    <span>({reviews.length} {t('reviews')})</span>
                                    <Badge variant="secondary" className="capitalize"><ProfileIcon className="mr-1 h-4 w-4"/> {provider.role}</Badge>
                                </div>
                                <p className="text-muted-foreground pt-2">{provider.bio || t('noBioYet')}</p>
                            </div>
                            <div className="flex flex-col gap-2 w-full md:w-auto">
                                <Button size="lg" onClick={handleBookNow}><CalendarPlus className="mr-2" /> {t('bookNow')}</Button>
                                <Button size="lg" variant="outline" onClick={handleSendMessage}><MessageSquare className="mr-2" /> {t('sendMessage')}</Button>
                                <Button size="lg" variant="outline" onClick={handleToggleFavorite} disabled={isFavoriteLoading}>
                                    <Heart className={cn("mr-2", isFavorited && "fill-red-500 text-red-500")} />
                                    {isFavorited ? t('favorited') : t('favorite')}
                                </Button>
                            </div>
                        </div>
                    </CardContent>
                    <CardFooter className="bg-secondary/50 p-2 flex justify-end">
                        <DialogTrigger asChild>
                            <Button variant="link" size="sm" className="text-xs text-muted-foreground">
                                <Flag className="mr-2 h-3 w-3" /> {t('reportThisProvider')}
                            </Button>
                        </DialogTrigger>
                    </CardFooter>
                </Card>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        {/* Services Section */}
                        <div ref={servicesRef}>
                            <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><BriefcaseBusiness /> {t('servicesOffered')}</h2>
                            <div className="grid gap-6 md:grid-cols-2">
                                {services.length > 0 ? services.map(service => (
                                    <Card key={service.id}>
                                        <CardHeader>
                                            <CardTitle>{service.name}</CardTitle>
                                            <CardDescription>{service.category}</CardDescription>
                                        </CardHeader>
                                        <CardContent>
                                            <p className="text-sm text-muted-foreground h-20 line-clamp-4">{service.description}</p>
                                        </CardContent>
                                        <CardFooter className="flex justify-between items-center">
                                            <p className="text-xl font-bold text-primary">₱{service.price.toFixed(2)}</p>
                                            <Button onClick={() => handleBookServiceClick(service)}>Book</Button>
                                        </CardFooter>
                                    </Card>
                                )) : (
                                    <p className="text-muted-foreground col-span-full text-center py-8">{t('noServicesListed')}</p>
                                )}
                            </div>
                        </div>
                    </div>
                    <div className="md:col-span-1 space-y-8">
                        {/* Availability Section */}
                         <div>
                            <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Clock /> {t('weeklyHours')}</h2>
                             <Card>
                                 <CardContent className="p-6 space-y-3">
                                    {provider.availabilitySchedule && provider.availabilitySchedule.length > 0 ? (
                                        provider.availabilitySchedule.map(schedule => (
                                            <div key={schedule.day} className={`flex justify-between text-sm ${schedule.day === today ? 'font-bold text-primary' : 'text-muted-foreground'}`}>
                                                <span>{schedule.day}</span>
                                                <span>
                                                    {schedule.enabled ? `${schedule.startTime} - ${schedule.endTime}` : t('closed')}
                                                </span>
                                            </div>
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-4">{t('availabilityNotSet')}</p>
                                    )}
                                </CardContent>
                            </Card>
                        </div>
                          {provider.documents && provider.documents.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><FileText /> {t('documents')}</h2>
                                <Card>
                                    <CardContent className="p-6 space-y-3">
                                        {provider.documents.map((doc, i) => (
                                            <a key={i} href={doc.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:underline text-primary">
                                                <FileText className="h-4 w-4" />
                                                <span>{doc.name}</span>
                                            </a>
                                        ))}
                                    </CardContent>
                                </Card>
                            </div>
                        )}
                    </div>
                </div>

                
                <Separator />

                {/* Reviews Section */}
                <div>
                    <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Star /> {t('clientReviews')}</h2>
                    <Card>
                        <CardContent className="p-6 space-y-6">
                            {reviews.length > 0 ? reviews.map(review => (
                                <div key={review.id} className="flex gap-4">
                                    <Avatar>
                                        <AvatarImage src={review.clientAvatar} alt={review.clientName} />
                                        <AvatarFallback>{getAvatarFallback(review.clientName)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-center">
                                            <p className="font-semibold">{review.clientName}</p>
                                            <div className="flex items-center gap-1">
                                                {renderStars(review.rating)}
                                            </div>
                                        </div>
                                        <p className="text-xs text-muted-foreground">{format(review.createdAt.toDate(), "PPP")}</p>
                                        <p className="mt-2 text-sm">{review.comment}</p>
                                    </div>
                                </div>
                            )) : (
                                 <p className="text-muted-foreground text-center py-8">{t('noReviewsYet')}</p>
                            )}
                        </CardContent>
                    </Card>
                </div>
                {provider && selectedService && (
                    <BookingDialog 
                        isOpen={isBookingDialogOpen}
                        setIsOpen={setIsBookingDialogOpen}
                        service={selectedService}
                        provider={provider}
                        onBookingConfirmed={() => {
                            toast({ title: t('bookingSuccessful'), description: t('bookingSuccessfulDescription')});
                            setIsBookingDialogOpen(false);
                        }}
                    />
                )}
            </div>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('reportProviderTitle', { providerName: provider.displayName })}</DialogTitle>
                    <DialogDescription>
                        {t('reportProviderDescription')}
                    </DialogDescription>
                </DialogHeader>
                <div className="space-y-2">
                    <Label htmlFor="report-reason">{t('reason')}</Label>
                    <Textarea 
                        id="report-reason"
                        value={reportReason}
                        onChange={(e) => setReportReason(e.target.value)}
                        placeholder={t('reportReasonPlaceholder')}
                    />
                </div>
                <DialogFooter>
                    <DialogClose asChild><Button variant="ghost">{t('cancel')}</Button></DialogClose>
                    <Button onClick={handleReportProvider} disabled={isReporting}>
                        {isReporting ? t('submitting') : t('submitReport')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
