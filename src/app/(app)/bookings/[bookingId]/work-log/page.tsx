
"use client";

import React from "react";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { doc, onSnapshot, updateDoc, arrayUnion, Timestamp, writeBatch, arrayRemove } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Timer, Play, Square, Camera, Send, PlusCircle, Trash2, CheckSquare } from "lucide-react";
import { format, formatDistanceStrict } from "date-fns";
import Image from "next/image";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { EmptyState } from "@/components/app/empty-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";


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

type ChecklistItem = {
    id: string;
    text: string;
    completed: boolean;
};


type BookingWorkLog = {
    id: string;
    title: string;
    jobId?: string;
    workLog: WorkLogEntry[];
    photos: PhotoEntry[];
    notes: NoteEntry[];
    checklist?: ChecklistItem[];
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
    const [newChecklistItem, setNewChecklistItem] = useState("");
    
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
                    checklist: data.checklist || [],
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

     const handleAddChecklistItem = async () => {
        if (!newChecklistItem.trim() || !booking) return;
        const newItem: ChecklistItem = {
            id: `task-${Date.now()}`,
            text: newChecklistItem.trim(),
            completed: false,
        };
        try {
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, {
                checklist: arrayUnion(newItem)
            });
            setNewChecklistItem("");
        } catch (error) {
            console.error("Error adding checklist item:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not add task." });
        }
    };

    const handleToggleChecklistItem = async (itemToToggle: ChecklistItem) => {
        if (!booking?.checklist) return;
        const updatedChecklist = booking.checklist.map(item =>
            item.id === itemToToggle.id ? { ...item, completed: !item.completed } : item
        );
        try {
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, { checklist: updatedChecklist });
        } catch (error) {
            console.error("Error updating checklist:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not update task." });
        }
    };

    const handleDeleteChecklistItem = async (itemToDelete: ChecklistItem) => {
        if (!booking?.checklist) return;
        try {
            const bookingRef = doc(db, "bookings", booking.id);
            await updateDoc(bookingRef, {
                checklist: arrayRemove(itemToDelete)
            });
        } catch (error) {
            console.error("Error deleting checklist item:", error);
            toast({ variant: "destructive", title: "Error", description: "Could not delete task." });
        }
    };

    if (loading) {
        return <LoadingState 
            title="Work Log" 
            description="Please wait while we fetch the work log information." 
        />;
    }

    if (!booking) return null;
    
    const isActiveLog = booking.workLog.some(log => log.endTime === null);

    const completedTasks = booking.checklist?.filter(item => item.completed).length || 0;
    const totalTasks = booking.checklist?.length || 0;
    const progressPercentage = totalTasks > 0 ? (completedTasks / totalTasks) * 100 : 0;

    return (
        <PageLayout 
            title="Work Log" 
            description="Track and manage your work progress for this booking."
        >
            <div className="flex items-center gap-4 mb-6">
                <Button variant="outline" size="icon" onClick={() => router.back()} className="hover:bg-primary/10 transition-colors">
                    <ArrowLeft className="h-4 w-4" />
                </Button>
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        Work Log
                    </h1>
                    <p className="text-lg text-muted-foreground">
                        For booking: {booking.title}
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Left Column - Main Actions */}
                <div className="md:col-span-2 space-y-6">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                <Timer className="h-5 w-5" /> Time Tracker
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="flex items-center justify-between p-6">
                            <div>
                                <CardDescription className="text-base">Total Logged Time</CardDescription>
                                <p className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">{totalDuration}</p>
                            </div>
                            {userRole === 'provider' && (
                                isActiveLog ? (
                                    <Button onClick={handleStopTimer} disabled={isSaving} variant="destructive" className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        <Square className="mr-2 h-4 w-4" /> Stop Timer
                                    </Button>
                                ) : (
                                    <Button onClick={handleStartTimer} disabled={isSaving} className="shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                        <Play className="mr-2 h-4 w-4" /> Start Timer
                                    </Button>
                                )
                            )}
                        </CardContent>
                    </Card>
                    
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                <CheckSquare className="h-5 w-5" /> Task Checklist
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                           {userRole === 'provider' && (
                                <div className="flex gap-2">
                                    <Input 
                                        value={newChecklistItem} 
                                        onChange={e => setNewChecklistItem(e.target.value)}
                                        placeholder="Add a new task..."
                                        onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); handleAddChecklistItem(); }}}
                                        className="bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-colors shadow-soft"
                                    />
                                    <Button onClick={handleAddChecklistItem} className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                        <PlusCircle className="mr-2 h-4 w-4"/> Add Task
                                    </Button>
                                </div>
                            )}
                             <div className="space-y-2">
                                {booking.checklist && booking.checklist.length > 0 ? (
                                    booking.checklist.map(item => (
                                        <div key={item.id} className="flex items-center gap-2 group p-2 rounded-lg hover:bg-muted/30 transition-colors">
                                            <Checkbox 
                                                id={item.id}
                                                checked={item.completed}
                                                onCheckedChange={() => handleToggleChecklistItem(item)}
                                                disabled={userRole !== 'provider'}
                                            />
                                            <label htmlFor={item.id} className="flex-1 text-sm peer-disabled:cursor-not-allowed peer-disabled:opacity-70">
                                                {item.text}
                                            </label>
                                            {userRole === 'provider' && (
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-6 w-6 text-muted-foreground opacity-0 group-hover:opacity-100 hover:bg-destructive/10 hover:text-destructive transition-all duration-200"
                                                    onClick={() => handleDeleteChecklistItem(item)}
                                                >
                                                    <Trash2 className="h-4 w-4"/>
                                                </Button>
                                            )}
                                        </div>
                                    ))
                                ) : (
                                    <p className="text-sm text-muted-foreground text-center py-4">No tasks added yet.</p>
                                )}
                             </div>
                        </CardContent>
                    </Card>

                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="flex items-center gap-2 font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                <Camera className="h-5 w-5" /> Photo Uploads
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <h3 className="font-semibold text-center mb-2 text-lg">Before</h3>
                                    <div className="grid grid-cols-2 gap-2">
                                        {booking.photos.filter(p => p.type === 'before').map((photo, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden shadow-soft">
                                                <Image src={photo.url} alt="Before" layout="fill" className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                 <div>
                                    <h3 className="font-semibold text-center mb-2 text-lg">After</h3>
                                     <div className="grid grid-cols-2 gap-2">
                                        {booking.photos.filter(p => p.type === 'after').map((photo, i) => (
                                            <div key={i} className="relative aspect-square rounded-lg overflow-hidden shadow-soft">
                                                <Image src={photo.url} alt="After" layout="fill" className="object-cover" />
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                           
                            {userRole === 'provider' && (
                                <>
                                 <Separator className="bg-border/50" />
                                <div className="space-y-3">
                                    <p className="font-medium text-lg">Add New Photo</p>
                                    <Input 
                                        type="file" 
                                        accept="image/*" 
                                        ref={photoInputRef} 
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                setPhotoFile(file);
                                                setPhotoPreview(URL.createObjectURL(file));
                                            }
                                        }}
                                        className="bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-colors shadow-soft"
                                    />
                                     {photoPreview && (
                                        <div className="relative w-32 h-32 rounded-lg overflow-hidden shadow-soft">
                                            <Image src={photoPreview} alt="preview" layout="fill" className="object-cover" />
                                        </div>
                                    )}
                                </div>
                                <div className="flex gap-2 items-center">
                                    <Select value={photoType} onValueChange={(value) => setPhotoType(value as 'before' | 'after')}>
                                        <SelectTrigger className="w-[120px] bg-background/80 backdrop-blur-sm border-2 shadow-soft">
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                                            <SelectItem value="before">Before</SelectItem>
                                            <SelectItem value="after">After</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    <Button onClick={handlePhotoUpload} disabled={!photoFile || isSaving} className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                        <PlusCircle className="mr-2 h-4 w-4"/> Upload
                                    </Button>
                                </div>
                                </>
                            )}
                        </CardContent>
                    </Card>
                </div>

                {/* Right Column - Notes */}
                <div className="md:col-span-1">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Progress Notes</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4 p-6">
                            {userRole === 'provider' && (
                                <div className="flex gap-2">
                                    <Textarea 
                                        value={noteText} 
                                        onChange={e => setNoteText(e.target.value)} 
                                        placeholder="Add a new note..."
                                        className="bg-background/80 backdrop-blur-sm border-2 focus:border-primary transition-colors shadow-soft"
                                        rows={3}
                                    />
                                    <Button size="icon" onClick={handleAddNote} disabled={isSaving} className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                        <Send className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <div className="space-y-3 max-h-96 overflow-y-auto">
                                {booking.notes.length > 0 ? [...booking.notes].reverse().map((note, i) => (
                                    <div key={i} className="text-sm p-3 bg-gradient-to-r from-muted/30 to-muted/10 rounded-lg border border-border/50 shadow-soft">
                                        <p className="mb-2">{note.text}</p>
                                        <p className="text-xs text-muted-foreground">{note.createdAt ? format(note.createdAt.toDate(), 'PPp') : 'Just now'}</p>
                                    </div>
                                )) : (
                                    <div className="text-center py-8">
                                        <p className="text-sm text-muted-foreground">No notes yet.</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </div>
            </div>
        </PageLayout>
    );
}
