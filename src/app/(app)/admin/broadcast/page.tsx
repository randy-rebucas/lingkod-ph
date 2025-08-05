"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { db } from "@/lib/firebase";
import { collection, doc, writeBatch, query, where, getDocs, serverTimestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";

export default function BroadcastPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendBroadcast = async () => {
        if (message.trim().length < 10) {
            toast({ variant: "destructive", title: "Message too short", description: "Broadcast message must be at least 10 characters."});
            return;
        }

        setIsSending(true);
        try {
            const batch = writeBatch(db);
            const broadcastsRef = collection(db, "broadcasts");

            // 1. Deactivate all existing active broadcasts
            const q = query(broadcastsRef, where("status", "==", "active"));
            const activeBroadcasts = await getDocs(q);
            activeBroadcasts.forEach(doc => {
                batch.update(doc.ref, { status: "inactive" });
            });

            // 2. Add the new broadcast as active
            const newBroadcastRef = doc(collection(db, "broadcasts"));
            batch.set(newBroadcastRef, {
                message,
                status: 'active',
                createdAt: serverTimestamp()
            });

            await batch.commit();

            toast({ title: "Broadcast Sent!", description: "Your message is now active for all users." });
            setMessage("");

        } catch (error) {
             console.error("Error sending broadcast:", error);
            toast({ variant: "destructive", title: "Error", description: "Failed to send broadcast."});
        } finally {
            setIsSending(false);
        }
    }


    if (userRole !== 'admin') {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Access Denied</CardTitle>
                    <CardDescription>This page is for administrators only.</CardDescription>
                </CardHeader>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
             <div>
                <h1 className="text-3xl font-bold font-headline">Admin Broadcast</h1>
                <p className="text-muted-foreground">
                    Send a site-wide announcement to all users.
                </p>
            </div>
            <Card>
                <CardHeader>
                    <CardTitle>Create Broadcast Message</CardTitle>
                    <CardDescription>This message will appear as a banner at the top of the page for all users. Sending a new message will replace the previous one.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea 
                        placeholder="Enter your announcement here..."
                        rows={5}
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                    />
                    <Button onClick={handleSendBroadcast} disabled={isSending}>
                        {isSending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                        {isSending ? "Sending..." : "Send Broadcast"}
                    </Button>
                </CardContent>
            </Card>
        </div>
    );
}
