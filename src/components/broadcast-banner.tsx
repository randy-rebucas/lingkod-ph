"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, query, where, onSnapshot, limit } from "firebase/firestore";
import { Alert, AlertDescription, AlertTitle } from "./ui/alert";
import { Megaphone, X } from "lucide-react";
import { Button } from "./ui/button";

type Broadcast = {
    id: string;
    message: string;
    createdAt: any;
    status: 'active' | 'inactive';
}

export default function BroadcastBanner() {
    const [broadcast, setBroadcast] = useState<Broadcast | null>(null);
    const [isVisible, setIsVisible] = useState(false);

    useEffect(() => {
        const broadcastsRef = collection(db, "broadcasts");
        const q = query(broadcastsRef, where("status", "==", "active"), limit(1));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            if (!snapshot.empty) {
                const doc = snapshot.docs[0];
                const broadcastData = { id: doc.id, ...doc.data() } as Broadcast;
                
                // Check if this broadcast has been dismissed before
                const dismissed = localStorage.getItem(`broadcast_${broadcastData.id}`);
                if (!dismissed) {
                    setBroadcast(broadcastData);
                    setIsVisible(true);
                }
            } else {
                setBroadcast(null);
                setIsVisible(false);
            }
        });

        return () => unsubscribe();
    }, []);

    const handleDismiss = () => {
        if (broadcast) {
            localStorage.setItem(`broadcast_${broadcast.id}`, "true");
        }
        setIsVisible(false);
    };

    if (!broadcast || !isVisible) {
        return null;
    }

    return (
        <div className="sticky top-16 z-30">
            <Alert variant="default" className="flex items-center justify-between rounded-none border-x-0 border-t-0 bg-accent text-accent-foreground">
                <div className="flex items-center gap-3">
                    <Megaphone className="h-5 w-5" />
                    <div>
                        <AlertTitle className="font-bold">Announcement</AlertTitle>
                        <AlertDescription className="text-accent-foreground/90">
                            {broadcast.message}
                        </AlertDescription>
                    </div>
                </div>
                <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-accent-foreground hover:bg-accent-foreground/10 hover:text-accent-foreground"
                    onClick={handleDismiss}
                >
                    <X className="h-4 w-4" />
                </Button>
            </Alert>
        </div>
    );
}
