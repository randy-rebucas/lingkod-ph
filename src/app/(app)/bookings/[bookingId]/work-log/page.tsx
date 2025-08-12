
"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp, writeBatch } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Timer, Play, Square, Camera, Send, PlusCircle, Trash2 } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


type WorkLogEntry = {
    startTime: Timestamp;
    endTime: Timestamp | null;
};

type PhotoEntry = {
    url: string;
    type: 'before' | 'after';
    uploadedAt: Timestamp;
};

type NoteEntry = {
    text: string;
    createdAt: Timestamp;
};

type BookingWorkLog = {
    id: string;
    title: string;
    jobId?: string;
    workLog: WorkLogEntry[];
    photos: PhotoEntry[];
    notes: NoteEntry[];
};

export default function WorkLogPage() {
    const { bookingId } = useParams();
    const router = useRouter();
    const { user, userRole } = useAuth();
    const { toast } = useToast();

    const [booking, setBooking] = useState<BookingWorkLog | null>(null);
    const [loading, setLoading] = useState(true);
    const [totalDuration, setTotalDuration] = useState("0 minutes");
    
    // State for new entries
    const [noteText, setNoteText] = useState("");
    const [photoFile, setPhotoFile] = useState<File | null>(null);
    const [photoType, setPhotoType] = useState<'before' | 'after'>('before');
    const [photoPreview, setPhotoPreview] = useState<string | null>(null);
    
    const [isSaving, setIsSaving] = useState(false);
    const photoInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (!bookingId || !user) return;
        
        const bookingRef = doc(db, "bookings", bookingId as string);
        const unsubscribe = onSnapshot(bookingRef, (docSnap) => {
            if (docSnap.exists()) {
                const data = docSnap.data();
                setBooking({
                    id: docSnap.id,
                    title: data.serviceName,
                    jobId: data.jobId,
                    workLog: data.workLog || [],
                    photos: data.photos || [],
                    notes: data.notes || [],
                });
            } else {
                toast({ variant: "destructive", title: "Error", description: "Booking not found." });
                router.push("/bookings");
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, [bookingId, user, router, toast]);

    useEffect(() => {
        if (booking?.workLog) {
            let totalSeconds = 0;
            booking.workLog.forEach(log => {
                if (log.endTime) {
                    totalSeconds += (log.endTime.seconds - log.startTime.seconds);
                }
            });
            if (totalSeconds > 0) {
                 setTotalDuration(formatDistanceStrict(0, totalSeconds * 1000, { unit: 'minute' }));
            }
        }
    }, [booking]);

    const handleStartTimer = async () => {
        if (!booking) return;
        setIsSaving(true);
        try {
            const bookingRef = doc(db, "bookings", booking.id);
            const batch = writeBatch(db);

            batch.update(bookingRef, {
                status: "In Progress",
                workLog: arrayUnion({
                    startTime: Timestamp.now(),
                    endTime: null,
                })
            });

            if (booking.jobId) {
                const jobRef = doc(db, "jobs", booking.jobId);
                batch.update(jobRef, { status: "In Progress" });
            }

            await batch.commit();

            toast({ title: "Timer Started", description: "Work has officially begun." });
        } catch (error) {
            console.error("Error starting timer:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not start the timer." });
        } finally {
            setIsSaving(false);
        }
    };

    const handleStopTimer = async () => {
        if (!booking) return;
        const activeLogIndex = booking.workLog.findIndex(log => log.endTime === null);
        if (activeLogIndex === -1) return;

        setIsSaving(true);
        try {
            const updatedWorkLog = [...booking.workLog];
            updatedWorkLog[activeLogIndex] = { ...updatedWorkLog[activeLogIndex], endTime: Timestamp.now() };

            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, { workLog: updatedWorkLog });
            toast({ title: "Timer Stopped", description: "Work session has been logged." });
        } catch (error) {
            console.error("Error stopping timer:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not stop the timer." });
        } finally {
            setIsSaving(false);
        }
    };
    
    const handleAddNote = async () => {
        if (!noteText.trim() || !booking) return;
        setIsSaving(true);
        try {
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, {
                notes: arrayUnion({
                    text: noteText,
                    createdAt: Timestamp.now(),
                })
            });
            setNoteText("");
        } catch (error) {
            console.error("Error adding note:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add note." });
        } finally {
            setIsSaving(false);
        }
    };

    const handlePhotoUpload = async () => {
        if (!photoFile || !booking) return;
        setIsSaving(true);
        try {
            const storagePath = `work-log-photos/${booking.id}/${Date.now()}_${photoFile.name}`;
            const storageRef = ref(storage, storagePath);
            const uploadResult = await uploadBytes(storageRef, photoFile);
            const url = await getDownloadURL(uploadResult.ref);
            
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, {
                photos: arrayUnion({
                    url,
                    type: photoType,
                    uploadedAt: Timestamp.now(),
                })
            });
            
            setPhotoFile(null);
            setPhotoPreview(null);
            if (photoInputRef.current) photoInputRef.current.value = "";

        } catch (error) {
            console.error("Error uploading photo:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not upload photo." });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) {
        return (
             <div className="space-y-6 max-w-4xl mx-auto">
                <Skeleton className="h-10 w-1/3" />
                <Skeleton className="h-96 w-full" />
             </div>
        )
    }

    if (!booking) return null;
    
    const isActiveLog = booking.workLog.some(log => log.endTime === null);

    return (
        <div className="space-y-6 max-w-4xl mx-auto">
             <div className="flex items-center gap-4">
                 <Button variant="outline" size="icon" onClick={() => router.back()}>
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline">Work Log</h1>
                    <p className="text-muted-foreground">For booking: {booking.title}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Actions */}
                <div className="md:col-span-2 space-y-6">
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2"><Timer /> Time Tracker</CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between">
                            <div>
                                <CardDescription>Total Logged Time</CardDescription>
                                <p className="text-2xl font-bold">{totalDuration}</p>
                            </div>
                            {userRole === 'provider' && (
                                isActiveLog ? (
                                    <Button onClick={handleStopTimer} disabled={isSaving} variant="destructive">
                                        <Square className="mr-2" /> Stop Timer
                                    </Button>
                                ) : (
                                    <Button onClick={handleStartTimer} disabled={isSaving}>
                                        <Play className="mr-2" /> Start Timer
                                    </Button>
                                )
                            )}
                        </CardContent>
                    </Card>

                    <Card>
                        <CardHeader><CardTitle className="flex items-center gap-2"><Camera /> Photo Uploads</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold text-center mb-2">Before</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {booking.photos.filter(p => p.type === 'before').map((photo, i) => (
                                            <div key={i} className="relative aspect-square"><Image src={photo.url} alt="Before" layout="fill" className="rounded-md object-cover" /></div>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-center mb-2">After</h3>
                                     <div className="grid grid-cols-2 gap-2">
                                        {booking.photos.filter(p => p.type === 'after').map((photo, i) => (
                                            <div key={i} className="relative aspect-square"><Image src={photo.url} alt="After" layout="fill" className="rounded-md object-cover" /></div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                           
                            {userRole === 'provider' && (
                                <>
                                 <Separator />
                                <div className="space-y-2">
                                    <p className="font-medium">Add New Photo</p>
                                    <Input type="file" accept="image/*" ref={photoInputRef} onChange={e => {
                                        const file = e.target.files?.[0];
                                        if (file) {
                                            setPhotoFile(file);
                                            setPhotoPreview(URL.createObjectURL(file));
                                        }
                                    }}/>
                                     {photoPreview && <div className="relative w-32 h-32"><Image src={photoPreview} alt="preview" layout="fill" className="rounded-md object-cover" /></div>}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Select value={photoType} onValueChange={(value) => setPhotoType(value as 'before' | 'after')}>
                                        <SelectTrigger className="w-[120px]">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="before">Before</SelectItem>
                                            <SelectItem value="after">After</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handlePhotoUpload} disabled={!photoFile || isSaving}><PlusCircle className="mr-2"/> Upload</Button>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Notes */}
                <div className="md:col-span-1">
                    <Card>
                        <CardHeader><CardTitle>Progress Notes</CardTitle></CardHeader>
                        <CardContent className="space-y-4">
                            {userRole === 'provider' && (
                                <div className="flex gap-2">
                                    <Textarea value={noteText} onChange={e => setNoteText(e.target.value)} placeholder="Add a new note..."/>
                                    <Button size="icon" onClick={handleAddNote} disabled={isSaving}><Send /></Button>
                                </div>
                            )}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {booking.notes.length > 0 ? [...booking.notes].reverse().map((note, i) => (
                                    <div key={i} className="text-sm p-2 bg-secondary rounded-md">
                                        <p>{note.text}</p>
                                        <p className="text-xs text-muted-foreground mt-1">{note.createdAt ? format(note.createdAt.toDate(), 'PPp') : 'Just now'}</p>
                                    </div>
                                )) : <p className="text-sm text-muted-foreground text-center">No notes yet.</p>}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </div>
    );
}

    