
"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { doc, getDoc, collection, getDocs, where, query, serverTimestamp, addDoc, updateDoc, arrayUnion, writeBatch, Timestamp } from "firebase/firestore";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Star, MessageSquare, Award, User, Briefcase, Mail, ArrowLeft, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import type { Job as JobType } from "@/app/(app)/my-job-posts/page";


type Provider = {
    uid: string;
    displayName: string;
    photoURL?: string;
    rating: number;
    reviewCount: number;
    keyServices?: string[];
    bio?: string;
};

// Use a more detailed job type for this page
type JobDetails = JobType & {
    deadline?: Timestamp | null;
}

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

    const [job, setJob] = useState<JobDetails | null>(null);
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
                const jobData = { id: jobSnap.id, ...jobSnap.data() } as JobDetails;
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
                price: job.budget.amount,
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
                        [user.uid]: { displayName: user.displayName, photoURL: user.photoURL || '' },
                        [provider.uid]: { displayName: provider.displayName, photoURL: provider.photoURL || '' }
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
            <div className="max-w-6xl mx-auto space-y-8">
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                     {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-64 w-full" />)}
                </div>
            </div>
        )
    }


    return (
        <div className="max-w-6xl mx-auto space-y-8">
                <div className="relative z-10 flex items-center gap-4">
                    <Button variant="outline" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
                        <ArrowLeft className="h-4 w-4" />
                    </Button>
                    <div>
                        <h1 className="text-4xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                            Applicants for "{job?.title}"
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed">
                            Review the providers who have applied for your job.
                        </p>
                    </div>
                </div>
            
            {applicants.length > 0 ? (
                 <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {applicants.map(applicant => (
                        <Card key={applicant.uid} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 group flex flex-col">
                            <CardHeader className="text-center pb-3">
                                <Avatar className="h-16 w-16 mx-auto mb-3 border-2 border-primary/20 shadow-soft">
                                    <AvatarImage src={applicant.photoURL} alt={applicant.displayName} />
                                    <AvatarFallback className="text-lg bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">{getAvatarFallback(applicant.displayName)}</AvatarFallback>
                                </Avatar>
                                <CardTitle className="text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent group-hover:from-primary group-hover:to-accent transition-all duration-300">{applicant.displayName}</CardTitle>
                                {applicant.reviewCount > 0 && (
                                     <div className="flex items-center justify-center gap-1 mt-1 text-muted-foreground">
                                        {renderStars(applicant.rating)}
                                        <span className="text-sm">({applicant.reviewCount})</span>
                                    </div>
                                )}
                            </CardHeader>
                            <CardContent className="flex-1 space-y-3 px-4">
                               {applicant.keyServices && applicant.keyServices.length > 0 && (
                                    <div>
                                        <h4 className="font-semibold flex items-center gap-2 mb-2 text-sm"><Briefcase className="h-4 w-4" /> Key Services</h4>
                                        <div className="flex flex-wrap gap-1">
                                            {applicant.keyServices.slice(0, 2).map(service => (
                                                <span key={service} className="text-xs bg-gradient-to-r from-muted/50 to-muted/30 text-muted-foreground py-1 px-2 rounded-full border border-border/50 shadow-soft">{service}</span>
                                            ))}
                                            {applicant.keyServices.length > 2 && (
                                                <span className="text-xs text-muted-foreground py-1 px-2">+{applicant.keyServices.length - 2} more</span>
                                            )}
                                        </div>
                                    </div>
                                )}
                                <p className="text-sm text-muted-foreground line-clamp-2">{applicant.bio || 'No bio available.'}</p>
                            </CardContent>
                             <CardFooter className="flex flex-col gap-2 pt-2 px-4 pb-4">
                                 <AlertDialog>
                                    <AlertDialogTrigger asChild>
                                        <Button className="w-full shadow-glow hover:shadow-glow/50 transition-all duration-300" disabled={job?.status !== 'Open'}>
                                            <Award className="mr-2 h-4 w-4" /> Award Job
                                        </Button>
                                    </AlertDialogTrigger>
                                    <AlertDialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                        <AlertDialogHeader>
                                            <AlertDialogTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Award Job to {applicant.displayName}?</AlertDialogTitle>
                                            <AlertDialogDescription>
                                                This will create a new booking with this provider and change the job status to "In Progress". Are you sure you want to proceed?
                                            </AlertDialogDescription>
                                        </AlertDialogHeader>
                                        <AlertDialogFooter>
                                            <AlertDialogCancel className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">Cancel</AlertDialogCancel>
                                            <AlertDialogAction onClick={() => handleAwardJob(applicant)} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">Confirm</AlertDialogAction>
                                        </AlertDialogFooter>
                                    </AlertDialogContent>
                                </AlertDialog>
                                <div className="grid grid-cols-2 gap-2 w-full">
                                    <Button variant="outline" asChild className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                        <Link href={`/providers/${applicant.uid}`}><User className="mr-2 h-4 w-4" /> View Profile</Link>
                                    </Button>
                                    <Button variant="outline" className="w-full shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground" onClick={() => handleSendMessage(applicant)}>
                                        <MessageSquare className="mr-2 h-4 w-4" /> Message
                                    </Button>
                                </div>
                            </CardFooter>
                        </Card>
                    ))}
                 </div>
            ) : (
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <Users className="h-20 w-20 mb-6 text-primary opacity-60" />
                        <div className="space-y-3">
                            <h3 className="text-2xl font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">No Applicants Yet</h3>
                            <p className="text-lg text-muted-foreground max-w-md">Check back later to see who has applied for your job.</p>
                        </div>
                    </CardContent>
                </Card>
            )}

        </div>
    );
}

    