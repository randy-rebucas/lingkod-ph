
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, where, query, serverTimestamp, addDoc, updateDoc, arrayUnion, writeBatch } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, Award, User, Briefcase, Mail, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Job } from "../../page";


type Provider = {
    uid: string;
    displayName: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
    keyServices?: string[];
    bio?: string;
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
};

export default function ApplicantsPage() {
    const params = useParams();
    const router = useRouter();
    const { user } = useAuth();
    const { toast } = useToast();
    const jobId = params.jobId as string;

    const [job, setJob] = useState<Job | null>(null);
    const [applicants, setApplicants] = useState<Provider[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!jobId || !user) return;

        const fetchJobAndApplicants = async () => {
            setLoading(true);
            try {
                // Fetch job details
                const jobRef = doc(db, "jobs", jobId);
                const jobSnap = await getDoc(jobRef);

                if (!jobSnap.exists() || jobSnap.data().clientId !== user.uid) {
                    toast({ variant: "destructive", title: "Error", description: "Job not found or you do not have permission to view it." });
                    router.push("/my-job-posts");
                    return;
                }
                const jobData = { id: jobSnap.id, ...jobSnap.data() } as Job;
                setJob(jobData);

                // Fetch applicants if any
                if (jobData.applications && jobData.applications.length > 0) {
                    const applicantsQuery = query(collection(db, "users"), where("uid", "in", jobData.applications));
                    const applicantsSnap = await getDocs(applicantsQuery);

                    // Fetch all reviews to calculate ratings
                    const reviewsSnapshot = await getDocs(collection(db, "reviews"));
                    const allReviews = reviewsSnapshot.docs.map(doc => doc.data());
                    
                    const providerRatings: { [key: string]: { totalRating: number, count: number } } = {};
                    allReviews.forEach((review: any) => {
                        if (!providerRatings[review.providerId]) {
                            providerRatings[review.providerId] = { totalRating: 0, count: 0 };
                        }
                        providerRatings[review.providerId].totalRating += review.rating;
                        providerRatings[review.providerId].count++;
                    });
                    
                    const applicantsData = applicantsSnap.docs.map(doc => {
                         const data = doc.data();
                         const ratingInfo = providerRatings[data.uid];
                        return {
                            ...data,
                            uid: doc.id,
                            rating: ratingInfo ? ratingInfo.totalRating / ratingInfo.count : 0,
                            reviewCount: ratingInfo ? ratingInfo.count : 0,
                        } as Provider
                    });
                    setApplicants(applicantsData);
                }

            } catch (error) {
                console.error("Error fetching data:", error);
                toast({ variant: "destructive", title: "Error", description: "Failed to fetch job applicants." });
            } finally {
                setLoading(false);
            }
        };

        fetchJobAndApplicants();
    }, [jobId, user, router, toast]);

    const handleAwardJob = async (provider: Provider) => {
        if (!job || !user) return;
        
        try {
            const batch = writeBatch(db);
            
            // 1. Create a booking document
            const bookingRef = doc(collection(db, 'bookings'));
            batch.set(bookingRef, {
                jobId: job.id,
                providerId: provider.uid,
                providerName: provider.displayName,
                providerAvatar: provider.photoURL || '',
                clientId: user.uid,
                clientName: user.displayName,
                clientAvatar: user.photoURL || '',
                serviceName: job.title, // Use job title as service name
                serviceId: '', // A job doesn't have a service ID
                price: job.budget, // Use job budget as price
                date: job.deadline || serverTimestamp(), // Use deadline or now as placeholder
                status: "Upcoming",
                notes: `This booking was created from job post: ${job.title}`,
                createdAt: serverTimestamp(),
            });

            // 2. Update job status to 'In Progress'
            const jobRef = doc(db, "jobs", jobId);
            batch.update(jobRef, { status: "In Progress" });

            await batch.commit();

            toast({ title: "Success!", description: `${provider.displayName} has been awarded the job. A new booking has been created.`});
            router.push("/bookings");
            
        } catch(error) {
             console.error("Error awarding job:", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to award the job." });
        }
    };
    
    const handleSendMessage = async (provider: Provider) => {
         if (!user || !provider) return;
        try {
            const conversationsRef = collection(db, "conversations");
            const q = query(conversationsRef, where("participants", "array-contains", user.uid));
            const querySnapshot = await getDocs(q);
            let existingConvoId: string | null = null;
            querySnapshot.forEach(doc => {
                if (doc.data().participants.includes(provider.uid)) {
                    existingConvoId = doc.id;
                }
            });

            if (existingConvoId) {
                router.push(`/messages?conversationId=${existingConvoId}`);
            } else {
                const newConvoRef = await addDoc(conversationsRef, {
                    participants: [user.uid, provider.uid],
                    participantInfo: {
                        [user.uid]: { displayName: user.displayName, photoURL: user.photoURL },
                        [provider.uid]: { displayName: provider.displayName, photoURL: provider.photoURL }
                    },
                    lastMessage: `Regarding your application for: ${job?.title}`,
                    timestamp: serverTimestamp(),
                });
                router.push(`/messages?conversationId=${newConvoRef.id}`);
            }
        } catch (error) {
            console.error("Error starting conversation:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start a conversation." });
        }
    };


    if (loading) {
        return (
            <div className="space-y-6">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-4 w-2/3" />
                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                     {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-80 w-full" />)}
                </div>
            </div>
        )
    }


    return (
        <div className="space-y-6">
            <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Applicants for "{job?.title}"</h1>
                    <p className="text-muted-foreground">Review the providers who have applied for your job.</p>
                </div>
            </div>
            
            {applicants.length > 0 ? (
                 <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                    {applicants.map(applicant => (
                        <Card key={applicant.uid} className="flex flex-col">
                            <CardHeader className="text-center">
                                <Avatar className="h-24 w-24 mx-auto mb-4 border-2 border-primary">
                                    <AvatarImage src={applicant.photoURL} alt={applicant.displayName} />
                                    <AvatarFallback>{getAvatarFallback(applicant.displayName)}</AvatarFallback>
                                </Avatar>
                                <CardTitle>{applicant.displayName}</CardTitle>
                                {applicant.reviewCount > 0 && (
                                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                                        {renderStars(applicant.rating)}
                                        <span className="text-sm">({applicant.reviewCount})</span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 space-y-4">
                               {applicant.keyServices && applicant.keyServices.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2"><Briefcase className="h-4 w-4" /> Key Services</h4>
                                        <div className="flex flex-wrap gap-2">
                                            {applicant.keyServices.map(service => (
                                                <span key={service} className="text-xs bg-secondary text-secondary-foreground py-1 px-2 rounded-full">{service}</span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground mt-2 h-16 line-clamp-3">{applicant.bio || 'No bio available.'}</p>
                            </CardContent>
                             <CardFooter className="flex flex-col gap-2">
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full" disabled={job?.status !== 'Open'}>
                                            <Award className="mr-2 h-4 w-4" /> Award Job
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent>
                                        <AlertDialogHeader>
                                            <AlertDialogTitle>Award Job to {applicant.displayName}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new booking with this provider and change the job status to "In Progress". Are you sure you want to proceed?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAwardJob(applicant)}>Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button variant="outline" asChild className="w-full">
                                        <Link href={`/providers/${applicant.uid}`}><User className="mr-2 h-4 w-4" /> View Profile</Link>
                                    </Button>
                                    <Button variant="outline" className="w-full" onClick={() => handleSendMessage(applicant)}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            ) : (
                <Card>
                    <CardContent className="flex flex-col items-center justify-center text-center text-muted-foreground p-12">
                        <Users className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">No Applicants Yet</h3>
                        <p>Check back later to see who has applied for your job.</p>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}
