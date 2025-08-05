
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, orderBy, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Search, Paperclip, X, MessageSquare, Loader2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";


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
    unread?: number;
};

type Message = {
    id?: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    timestamp: any;
    hint?: string;
};


const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const createNotification = async (userId: string, senderName: string, message: string, link: string) => {
    try {
        const userNotifSettingsRef = doc(db, 'users', userId);
        const docSnap = await getDoc(userNotifSettingsRef);

        if (docSnap.exists() && docSnap.data().notificationSettings?.newMessages === false) {
             return; 
        }

        const notificationsRef = collection(db, `users/${userId}/notifications`);
        await addDoc(notificationsRef, {
            userId,
            message: `${senderName}: ${message}`,
            link,
            type: 'new_message',
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating notification: ", error);
    }
};


export default function MessagesPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const searchParams = useSearchParams();

    const [conversations, setConversations] = useState<Conversation[]>([]);
    const [activeConversation, setActiveConversation] = useState<Conversation | null>(null);
    const [messages, setMessages] = useState<Message[]>([]);
    
    const [loadingConversations, setLoadingConversations] = useState(true);
    const [loadingMessages, setLoadingMessages] = useState(false);
    
    const [newMessage, setNewMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSending, setIsSending] = useState(false);
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const conversationId = searchParams.get('conversationId');
        if (conversationId && conversations.length > 0) {
            const convoToOpen = conversations.find(c => c.id === conversationId);
            if (convoToOpen) {
                setActiveConversation(convoToOpen);
            }
        }
    }, [searchParams, conversations]);

    useEffect(() => {
        if (!user) return;
        setLoadingConversations(true);
        const q = query(collection(db, "conversations"), where("participants", "array-contains", user.uid));
        
        const unsubscribe = onSnapshot(q, (querySnapshot) => {
            const convos = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Conversation)).sort((a,b) => b.timestamp - a.timestamp);
            setConversations(convos);
            setLoadingConversations(false);
        }, (error) => {
            console.error("Error fetching conversations: ", error);
            toast({ variant: "destructive", title: "Error", description: "Could not fetch conversations."})
            setLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [user, toast]);
    
    useEffect(() => {
        if (!activeConversation) return;

        setLoadingMessages(true);
        const messagesRef = collection(db, "conversations", activeConversation.id, "messages");
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


    const handleSelectConversation = (convo: Conversation) => {
        setActiveConversation(convo);
        setSelectedImage(null);
        setPreviewUrl(null);
    }

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };
    
    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !user || !activeConversation) return;

        setIsSending(true);

        try {
            let imageUrl = '';
            if (selectedImage) {
                const storageRef = ref(storage, `chat-images/${activeConversation.id}/${Date.now()}_${selectedImage.name}`);
                const uploadResult = await uploadBytes(storageRef, selectedImage);
                imageUrl = await getDownloadURL(uploadResult.ref);
            }

            const messageData: Omit<Message, 'id'> = {
                senderId: user.uid,
                text: newMessage,
                timestamp: serverTimestamp(),
                ...(imageUrl && { imageUrl: imageUrl }),
            };
            
            const messagesRef = collection(db, "conversations", activeConversation.id, "messages");
            await addDoc(messagesRef, messageData);
            
            const conversationRef = doc(db, "conversations", activeConversation.id);
            await updateDoc(conversationRef, {
                lastMessage: newMessage || "Image sent",
                timestamp: serverTimestamp()
            });

            const recipientId = activeConversation.participants.find(p => p !== user.uid);
            if(recipientId) {
                await createNotification(recipientId, user.displayName || 'Someone', newMessage || "sent an image.", `/messages?conversationId=${activeConversation.id}`);
            }

            setNewMessage("");
            setSelectedImage(null);
            setPreviewUrl(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
             console.error("Error sending message: ", error);
             toast({ variant: "destructive", title: "Error", description: "Failed to send message."})
        } finally {
            setIsSending(false);
        }
    };

    const getOtherParticipantInfo = (convo: Conversation) => {
        if (!user) return { name: 'User', avatar: '' };
        const otherId = convo.participants.find(p => p !== user.uid);
        if (otherId && convo.participantInfo[otherId]) {
            return {
                name: convo.participantInfo[otherId].displayName,
                avatar: convo.participantInfo[otherId].photoURL || ''
            };
        }
        return { name: 'Unknown User', avatar: '' };
    }


    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold font-headline">Messages</h1>
                <p className="text-muted-foreground">
                    Communicate with clients and service providers.
                </p>
            </div>
            <Card className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] shadow-lg overflow-hidden">
                {/* Conversation List */}
                <div className="flex flex-col border-r bg-background/50">
                    <div className="p-4 border-b">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search conversations..." className="pl-9 bg-background" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {loadingConversations ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : conversations.length > 0 ? (
                                conversations.map((convo) => {
                                    const { name, avatar } = getOtherParticipantInfo(convo);
                                    return (
                                        <button key={convo.id} className={cn("w-full text-left p-3 rounded-lg transition-colors", activeConversation?.id === convo.id ? "bg-secondary" : "hover:bg-secondary/50")}
                                            onClick={() => handleSelectConversation(convo)}
                                        >
                                            <div className="flex items-start gap-3">
                                                <Avatar className="h-10 w-10 border">
                                                    <AvatarImage src={avatar} alt={name} />
                                                    <AvatarFallback>{getAvatarFallback(name)}</AvatarFallback>
                                                </Avatar>
                                                <div className="flex-1 overflow-hidden">
                                                    <div className="flex justify-between items-center">
                                                        <p className="font-semibold truncate">{name}</p>
                                                        <p className="text-xs text-muted-foreground flex-shrink-0">
                                                            {convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                        </p>
                                                    </div>
                                                    <div className="flex justify-between items-end mt-1">
                                                        <p className="text-sm text-muted-foreground truncate max-w-[150px]">{convo.lastMessage}</p>
                                                        {/* Unread count UI can be added here */}
                                                    </div>
                                                </div>
                                            </div>
                                        </button>
                                    )
                                })
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <MessageSquare className="mx-auto h-10 w-10 mb-2"/>
                                    No conversations yet.
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                {/* Message View */}
                <div className="flex flex-col h-full bg-secondary/30">
                   {activeConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3 bg-background">
                            <Avatar>
                                <AvatarImage src={getOtherParticipantInfo(activeConversation).avatar} alt={getOtherParticipantInfo(activeConversation).name} />
                                <AvatarFallback>{getAvatarFallback(getOtherParticipantInfo(activeConversation).name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{getOtherParticipantInfo(activeConversation).name}</p>
                                {/* Online status would require presence management (e.g., Firestore RTDB) */}
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    {messages.map((msg) => {
                                        const isCurrentUser = msg.senderId === user?.uid;
                                        const senderInfo = isCurrentUser ? {avatar: user?.photoURL || '', name: user?.displayName} : getOtherParticipantInfo(activeConversation)
                                        return (
                                            <div key={msg.id} className={cn("flex items-end gap-2", isCurrentUser ? "justify-end" : "justify-start")}>
                                                {!isCurrentUser && (
                                                    <Avatar className="h-8 w-8">
                                                        <AvatarImage src={senderInfo.avatar} />
                                                        <AvatarFallback>{getAvatarFallback(senderInfo.name)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn("max-w-xs md:max-w-md p-1 rounded-2xl shadow-sm", isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none")}>
                                                    {msg.imageUrl && (
                                                        <div className="p-2">
                                                            <Image 
                                                                src={msg.imageUrl} 
                                                                alt="Sent image" 
                                                                width={300} 
                                                                height={200}
                                                                data-ai-hint={msg.hint}
                                                                className="rounded-lg object-cover"
                                                            />
                                                        </div>
                                                    )}
                                                    {msg.text && (
                                                        <p className="text-sm px-3 py-2">{msg.text}</p>
                                                    )}
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-4 border-t bg-background">
                            {previewUrl && (
                                <div className="relative mb-2 w-24 h-24">
                                    <Image src={previewUrl} alt="Image preview" fill className="object-cover rounded-md" />
                                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setPreviewUrl(null); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = "";}}>
                                        <X className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                            <form className="relative flex items-center gap-2" onSubmit={handleSendMessage}>
                                <Input 
                                    placeholder="Type your message..." 
                                    className="flex-1"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isSending}
                                />
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button size="icon" variant="ghost" type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending}>
                                    <Paperclip className="h-5 w-5"/>
                                    <span className="sr-only">Attach File</span>
                                </Button>
                                <Button size="icon" type="submit" disabled={isSending || (!newMessage.trim() && !selectedImage)}>
                                    {isSending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5"/>}
                                    <span className="sr-only">Send Message</span>
                                </Button>
                            </form>
                        </div>
                    </>
                   ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <MessageSquare className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">Select a conversation</h3>
                        <p>Choose a conversation from the left panel to start chatting.</p>
                    </div>
                   )}
                </div>
            </Card>
        </div>
    );
}
