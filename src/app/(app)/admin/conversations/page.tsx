
"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy } from "firebase/firestore";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { MessageSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import Image from "next/image";

type Conversation = {
    id: string;
    participants: string[];
    participantInfo: {
        [key: string]: {
            displayName: string;
            photoURL: string;
        }
    };
    lastMessage: string;
    timestamp: any;
};

type Message = {
    id?: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    timestamp: any;
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

export default function AdminConversationsPage() {
    const { userRole } = useAuth();
    const { toast } = useToast();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoadingConversations(false);
            return;
        }
        
        const q = query(collection(getDb(), "conversations"), orderBy("timestamp", "desc"));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation));
            setConversations(convos);
            setLoadingConversations(false);
        }, (error) => {
            console.error("Error fetching conversations: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch conversations."})
            setLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [userRole, toast]);
    
    useEffect(() => {
        if (!activeConversation || !getDb()) return;

        setLoadingMessages(true);
        const messagesRef = collection(getDb(), "conversations", activeConversation.id, "messages");
        const q = query(messagesRef, orderBy("timestamp", "asc"));

        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const msgs = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Message));
            setMessages(msgs);
            setLoadingMessages(false);
        }, (error) => {
            console.error("Error fetching messages: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch messages."})
            setLoadingMessages(false);
        });

        return () => unsubscribe();

    }, [activeConversation, toast]);
    
     useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);

    const getParticipantNames = (convo: Conversation) => {
        return Object.values(convo.participantInfo).map(p => p.displayName).join(' & ');
    }

    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8 h-full flex flex-col">
            <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Conversation Monitoring</h1>
                <p className="text-muted-foreground">
                    Review user conversations on the platform.
                </p>
            </div>
            <div className=" mx-auto flex-1">
                <Card className="flex-1 grid grid-cols-1 md:grid-cols-[350px_1fr] shadow-soft border-0 bg-background/80 backdrop-blur-sm overflow-hidden">
                <div className="flex flex-col border-r bg-background/50">
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {loadingConversations ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : conversations.length > 0 ? (
                                conversations.map((convo) => (
                                    <button key={convo.id} className={cn("w-full text-left p-3 rounded-lg transition-colors", activeConversation?.id === convo.id ? "bg-secondary" : "hover:bg-secondary/50")}
                                        onClick={() => setActiveConversation(convo)}
                                    >
                                        <div className="flex-1 overflow-hidden">
                                            <p className="font-semibold truncate">{getParticipantNames(convo)}</p>
                                            <p className="text-sm text-muted-foreground truncate max-w-[90%]">{convo.lastMessage}</p>
                                        </div>
                                    </button>
                                ))
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <MessageSquare className="mx-auto h-10 w-10 mb-2"/>
                                    No conversations yet.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex flex-col h-full bg-secondary/30">
                   {activeConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3 bg-background">
                             <p className="font-semibold">{getParticipantNames(activeConversation)}</p>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => {
                                        const senderInfo = activeConversation.participantInfo[msg.senderId];
                                        return (
                                            <div key={msg.id} className="flex items-start gap-2">
                                                <Avatar className="h-8 w-8">
                                                    <AvatarImage src={senderInfo?.photoURL} />
                                                    <AvatarFallback>{getAvatarFallback(senderInfo?.displayName)}</AvatarFallback>
                                                </Avatar>
                                                <div className="max-w-xs md:max-w-md">
                                                    <p className="font-semibold text-sm">{senderInfo?.displayName}</p>
                                                    <div className="bg-card text-card-foreground rounded-lg p-3 text-sm">
                                                        {msg.imageUrl && (
                                                            <div className="p-2">
                                                                <Image 
                                                                    src={msg.imageUrl} 
                                                                    alt="Sent image" 
                                                                    width={300}
                                                                    height={200}
                                                                    className="rounded-lg object-cover max-w-full" 
                                                                />
                                                            </div>
                                                        )}
                                                        {msg.text && <p>{msg.text}</p>}
                                                    </div>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                    </>
                   ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <MessageSquare className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">Select a conversation</h3>
                        <p>Choose a conversation from the left panel to view messages.</p>
                    </div>
                   )}
                </div>
            </Card>
            </div>
        </div>
    );
}
