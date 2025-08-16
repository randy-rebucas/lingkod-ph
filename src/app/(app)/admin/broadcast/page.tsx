
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send } from "lucide-react";
import { sendBroadcastAction } from "./actions";

export default function BroadcastPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [message, setMessage] = useState("");
    const [isSending, setIsSending] = useState(false);

    const handleSendBroadcast = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }
        setIsSending(true);
        const result = await sendBroadcastAction(message, { id: user.uid, name: user.displayName });

        toast({
            title: result.error ? 'Error' : 'Broadcast Sent!',
            description: result.message,
            variant: result.error ? "destructive" : "default"
        });

        if (!result.error) {
            setMessage("");
        }

        setIsSending(false);
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
