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
import { Star, Building, MessageSquare, CalendarPlus, Clock, Heart, Flag, Users, FileText, MapPin, Phone, Mail } from "lucide-react";
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
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { designTokens } from "@/lib/design-tokens";

type Availability = {
    day: string;
    enabled: boolean;
    startTime: string;
    endTime: string;
};

type Agency = {
    uid: string;
    displayName: string;
    email: string;
    bio?: string;
    photoURL?: string;
    role: 'agency';
    availabilitySchedule?: Availability[];
    availabilityStatus?: 'available' | 'limited' | 'unavailable';
    keyServices?: string[];
    isVerified?: boolean;
    documents?: { name: string; url: string }[];
    businessAddress?: string;
    phoneNumber?: string;
    website?: string;
    businessLicense?: string;
    totalProviders?: number;
    totalBookings?: number;
    averageRating?: number;
    totalReviews?: number;
    establishedDate?: Timestamp;
    specialties?: string[];
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

type Provider = {
    id: string;
    displayName: string;
    photoURL?: string;
    specialties: string[];
    rating: number;
    totalBookings: number;
    isVerified: boolean;
};

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-5 w-5 ${i < Math.round(rating) ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "A";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const getAvailabilityBadge = (status: Agency['availabilityStatus']) => {
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

export default function AgencyProfilePage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('AgencyProfile');
    const agencyId = params.agencyId as string;
    const servicesRef = useRef<HTMLDivElement>(null);

    const [agency, setAgency] = useState<Agency | null>(null);
    const [services, setServices] = useState<Service[]>([]);
    const [reviews, setReviews] = useState<Review[]>([]);
    const [providers, setProviders] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);
    const [isFavorited, setIsFavorited] = useState(false);
    const [isFavoriteLoading, setIsFavoriteLoading] = useState(true);

    const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState<Service | null>(null);

    const [reportReason, setReportReason] = useState("");
    const [isReporting, setIsReporting] = useState(false);

    useEffect(() => {
        if (!agencyId) return;

        const fetchAgencyData = async () => {
            setLoading(true);
            try {
                // Fetch agency details
                const agencyDocRef = doc(db, "users", agencyId);
                const agencyDoc = await getDoc(agencyDocRef);
                if (agencyDoc.exists()) {
                    const agencyData = { uid: agencyDoc.id, ...agencyDoc.data() } as Agency;
                    // Only show if it's actually an agency
                    if (agencyData.role === 'agency') {
                        setAgency(agencyData);
                    }
                }

                // Fetch services
                const servicesQuery = query(collection(db, "services"), where("userId", "==", agencyId), where("status", "==", "Active"));
                const servicesSnapshot = await getDocs(servicesQuery);
                const servicesData = servicesSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Service));
                setServices(servicesData);

                // Fetch reviews
                const reviewsQuery = query(collection(db, "reviews"), where("providerId", "==", agencyId), orderBy("createdAt", "desc"));
                const reviewsSnapshot = await getDocs(reviewsQuery);
                const reviewsData = reviewsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Review));
                setReviews(reviewsData);

                // Fetch agency providers
                const providersQuery = query(collection(db, "users"), where("role", "==", "provider"), where("agencyId", "==", agencyId));
                const providersSnapshot = await getDocs(providersQuery);
                const providersData = providersSnapshot.docs.map(doc => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        displayName: data.displayName,
                        photoURL: data.photoURL,
                        specialties: data.specialties || [],
                        rating: data.averageRating || 0,
                        totalBookings: data.totalBookings || 0,
                        isVerified: data.isVerified || false
                    } as Provider;
                });
                setProviders(providersData);

            } catch (error) {
                console.error("Error fetching agency data:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAgencyData();
    }, [agencyId]);
    
    useEffect(() => {
        if (!user || !agencyId) {
            setIsFavoriteLoading(false);
            return;
        }
        setIsFavoriteLoading(true);
        const favQuery = query(
            collection(db, 'favorites'),
            where('userId', '==', user.uid),
            where('providerId', '==', agencyId)
        );

        const unsubscribe = onSnapshot(favQuery, (snapshot) => {
            setIsFavorited(!snapshot.empty);
            setIsFavoriteLoading(false);
        });
        
        return () => unsubscribe();
    }, [user, agencyId]);

    const handleToggleFavorite = async () => {
        if (!user || !agency) {
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedInToFavorite') });
            return;
        }
        setIsFavoriteLoading(true);
        const favoritesRef = collection(db, 'favorites');
        
        try {
            if (isFavorited) {
                const q = query(favoritesRef, where('userId', '==', user.uid), where('providerId', '==', agency.uid));
                const snapshot = await getDocs(q);
                if (!snapshot.empty) {
                    await deleteDoc(snapshot.docs[0].ref);
                }
                toast({ title: t('removedFromFavorites') });
            } else {
                 await addDoc(favoritesRef, {
                    userId: user.uid,
                    providerId: agency.uid,
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
        if (!user || !agency) {
            toast({ variant: "destructive", title: t('error'), description: t('mustBeLoggedInToMessage') });
            return;
        }

        if (user.uid === agency.uid) {
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
                if (convo.participants.includes(agency.uid)) {
                    existingConvoId = doc.id;
                }
            });

            if (existingConvoId) {
                router.push(`/messages?conversationId=${existingConvoId}`);
            } else {
                // Create a new conversation
                const newConvoRef = await addDoc(collection(db, "conversations"), {
                    participants: [user.uid, agency.uid],
                    participantInfo: {
                        [user.uid]: {
                            displayName: user.displayName,
                            photoURL: user.photoURL || '',
                        },
                        [agency.uid]: {
                            displayName: agency.displayName,
                            photoURL: agency.photoURL || '',
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

    const handleReportAgency = async () => {
        if (!user || !agency || !reportReason) {
            toast({ variant: "destructive", title: t('error'), description: t('pleaseProvideReason') });
            return;
        }
        setIsReporting(true);
        try {
            await addDoc(collection(db, "reports"), {
                reportedBy: user.uid,
                reportedItemType: 'user',
                reportedItemId: agency.uid,
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
            <div className="max-w-6xl mx-auto space-y-8">
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

    if (!agency) {
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-4xl font-bold">{t('agencyNotFound')}</h1>
                <p className="text-muted-foreground mt-4">{t('agencyNotFoundDescription')}</p>
                <Button asChild className="mt-8">
                    <Link href="/dashboard">{t('returnToDashboard')}</Link>
                </Button>
            </div>
        )
    }

    const today = new Date().toLocaleString('en-us', { weekday: 'long' });
    const todaySchedule = agency.availabilitySchedule?.find(s => s.day === today);

    return (
        <Dialog>
            <div className="max-w-6xl mx-auto space-y-8">
                {/* Header Card */}
                <Card className="shadow-lg">
                    <CardContent className="p-6">
                        <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-left">
                            <Avatar className="h-32 w-32 border-4 border-primary">
                                <AvatarImage src={agency.photoURL} alt={agency.displayName} />
                                <AvatarFallback className="text-5xl">{getAvatarFallback(agency.displayName)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1 space-y-2">
                                <div className="flex items-center justify-center md:justify-start gap-2">
                                    <CardTitle className="text-4xl font-bold font-headline">{agency.displayName}</CardTitle>
                                    {getAvailabilityBadge(agency.availabilityStatus)}
                                    {agency.isVerified && <Badge variant="default" className="bg-blue-100 text-blue-800 border-blue-200">Verified</Badge>}
                                </div>
                                <div className="flex items-center justify-center md:justify-start gap-2 text-muted-foreground">
                                    {renderStars(overallRating)}
                                    <span>({reviews.length} {t('reviews')})</span>
                                    <Badge variant="secondary" className="capitalize"><Building className="mr-1 h-4 w-4"/> {t('agency')}</Badge>
                                </div>
                                <p className="text-muted-foreground pt-2">{agency.bio || t('noBioYet')}</p>
                                
                                {/* Agency Stats */}
                                <div className="flex flex-wrap gap-4 pt-2 text-sm text-muted-foreground">
                                    {agency.totalProviders && (
                                        <div className="flex items-center gap-1">
                                            <Users className="h-4 w-4" />
                                            <span>{agency.totalProviders} {t('providers')}</span>
                                        </div>
                                    )}
                                    {agency.totalBookings && (
                                        <div className="flex items-center gap-1">
                                            <CalendarPlus className="h-4 w-4" />
                                            <span>{agency.totalBookings} {t('bookings')}</span>
                                        </div>
                                    )}
                                    {agency.establishedDate && (
                                        <div className="flex items-center gap-1">
                                            <Clock className="h-4 w-4" />
                                            <span>{t('established')} {format(agency.establishedDate.toDate(), "yyyy")}</span>
                                        </div>
                                    )}
                                </div>
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
                                <Flag className="mr-2 h-3 w-3" /> {t('reportThisAgency')}
                            </Button>
                        </DialogTrigger>
                    </CardFooter>
                </Card>

                {/* Contact Information */}
                {(agency.businessAddress || agency.phoneNumber || agency.email || agency.website) && (
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <MapPin className="h-5 w-5" />
                                {t('contactInformation')}
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-3">
                            {agency.businessAddress && (
                                <div className="flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    <span>{agency.businessAddress}</span>
                                </div>
                            )}
                            {agency.phoneNumber && (
                                <div className="flex items-center gap-2">
                                    <Phone className="h-4 w-4 text-muted-foreground" />
                                    <span>{agency.phoneNumber}</span>
                                </div>
                            )}
                            {agency.email && (
                                <div className="flex items-center gap-2">
                                    <Mail className="h-4 w-4 text-muted-foreground" />
                                    <span>{agency.email}</span>
                                </div>
                            )}
                            {agency.website && (
                                <div className="flex items-center gap-2">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    <a href={agency.website} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                                        {agency.website}
                                    </a>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2">
                        {/* Services Section */}
                        <div ref={servicesRef}>
                            <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Building /> {t('servicesOffered')}</h2>
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

                        {/* Providers Section */}
                        {providers.length > 0 && (
                            <div className="mt-8">
                                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Users /> {t('ourProviders')}</h2>
                                <div className="grid gap-4 md:grid-cols-2">
                                    {providers.slice(0, 6).map(provider => (
                                        <Card key={provider.id} className="cursor-pointer hover:shadow-md transition-shadow">
                                            <CardContent className="p-4">
                                                <div className="flex items-center gap-3">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={provider.photoURL} alt={provider.displayName} />
                                                        <AvatarFallback>{getAvatarFallback(provider.displayName)}</AvatarFallback>
                                                    </Avatar>
                                                    <div className="flex-1">
                                                        <div className="flex items-center gap-2">
                                                            <h3 className="font-semibold">{provider.displayName}</h3>
                                                            {provider.isVerified && <Badge variant="default" className="text-xs">Verified</Badge>}
                                                        </div>
                                                        <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                                            {renderStars(provider.rating)}
                                                            <span>({provider.totalBookings} bookings)</span>
                                                        </div>
                                                        {provider.specialties.length > 0 && (
                                                            <div className="flex flex-wrap gap-1 mt-1">
                                                                {provider.specialties.slice(0, 2).map((specialty, index) => (
                                                                    <Badge key={index} variant="secondary" className="text-xs">
                                                                        {specialty}
                                                                    </Badge>
                                                                ))}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </CardContent>
                                        </Card>
                                    ))}
                                </div>
                                {providers.length > 6 && (
                                    <p className="text-center text-muted-foreground mt-4">
                                        {t('andMoreProviders', { count: providers.length - 6 })}
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                    <div className="md:col-span-1 space-y-8">
                        {/* Availability Section */}
                         <div>
                            <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Clock /> {t('businessHours')}</h2>
                             <Card>
                                 <CardContent className="p-6 space-y-3">
                                    {agency.availabilitySchedule && agency.availabilitySchedule.length > 0 ? (
                                        agency.availabilitySchedule.map(schedule => (
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

                        {/* Specialties */}
                        {agency.specialties && agency.specialties.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><Building /> {t('specialties')}</h2>
                                <Card>
                                    <CardContent className="p-6">
                                        <div className="flex flex-wrap gap-2">
                                            {agency.specialties.map((specialty, index) => (
                                                <Badge key={index} variant="secondary">
                                                    {specialty}
                                                </Badge>
                                            ))}
                                        </div>
                                    </CardContent>
                                </Card>
                            </div>
                        )}

                        {/* Documents */}
                          {agency.documents && agency.documents.length > 0 && (
                            <div>
                                <h2 className="text-2xl font-bold font-headline mb-4 flex items-center gap-2"><FileText /> {t('documents')}</h2>
                                <Card>
                                    <CardContent className="p-6 space-y-3">
                                        {agency.documents.map((doc, i) => (
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
                {agency && selectedService && (
                    <BookingDialog 
                        isOpen={isBookingDialogOpen}
                        setIsOpen={setIsBookingDialogOpen}
                        service={selectedService}
                        provider={agency}
                        onBookingConfirmed={() => {
                            toast({ title: t('bookingSuccessful'), description: t('bookingSuccessfulDescription')});
                            setIsBookingDialogOpen(false);
                        }}
                    />
                )}
            </div>

            <DialogContent>
                <DialogHeader>
                    <DialogTitle>{t('reportAgencyTitle', { agencyName: agency.displayName })}</DialogTitle>
                    <DialogDescription>
                        {t('reportAgencyDescription')}
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
                    <Button onClick={handleReportAgency} disabled={isReporting}>
                        {isReporting ? t('submitting') : t('submitReport')}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
