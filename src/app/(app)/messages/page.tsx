
"use client";

import React, { useState, useEffect, useRef } from "react";
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { db, storage } from "@/lib/firebase";
import { collection, query, where, onSnapshot, doc, addDoc, serverTimestamp, orderBy, updateDoc, getDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Search, Paperclip, X, MessageSquare, Loader2, Phone, Video, MoreVertical, Pin, VolumeX, Archive, Trash2 } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";


type Conversation = {
    id: string;
    participants: string[];
    participantInfo: {
        [key: string]: {
            displayName: string;
            photoURL: string;
            isOnline?: boolean;
            lastSeen?: any;
        }
    };
    lastMessage: string;
    timestamp: any;
    unread?: number;
    isPinned?: boolean;
    isArchived?: boolean;
    isMuted?: boolean;
    type?: 'direct' | 'group';
    title?: string;
    description?: string;
    tags?: string[];
    priority?: 'low' | 'medium' | 'high';
};

type Message = {
    id?: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    timestamp: any;
    hint?: string;
    isEdited?: boolean;
    editedAt?: any;
    isDeleted?: boolean;
    deletedAt?: any;
    replyTo?: string;
    reactions?: {
        [key: string]: string[]; // emoji -> array of user IDs
    };
    isPinned?: boolean;
    messageType?: 'text' | 'image' | 'file' | 'system';
    fileUrl?: string;
    fileName?: string;
    fileSize?: number;
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
    const t = useTranslations('Messages');
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
    
    const [searchTerm, setSearchTerm] = useState("");
    
    const fileInputRef = useRef<HTMLInputElement>(null);
    const messagesEndRef = useRef<HTMLDivElement>(null);


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
            toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchConversations')})
            setLoadingConversations(false);
        });

        return () => unsubscribe();
    }, [user, toast, t]);

    // Auto-select first conversation if none is selected and conversations are available
    useEffect(() => {
        if (conversations.length > 0 && !activeConversation && !loadingConversations) {
            // Check if there's a conversation ID in URL params first
            const conversationId = searchParams.get('conversationId');
            if (conversationId) {
                const convoToOpen = conversations.find(c => c.id === conversationId);
                if (convoToOpen) {
                    setActiveConversation(convoToOpen);
                    return;
                }
            }
            // If no URL param or conversation not found, select the first one
            const firstConversation = conversations[0];
            setActiveConversation(firstConversation);
        }
    }, [conversations, activeConversation, loadingConversations, searchParams]);
    
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
            toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchMessages')})
            setLoadingMessages(false);
        });

        return () => unsubscribe();

    }, [activeConversation, toast, t]);
    
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
                lastMessage: newMessage || t('imageSent'),
                timestamp: serverTimestamp()
            });

            const recipientId = activeConversation.participants.find(p => p !== user.uid);
            if(recipientId) {
                await createNotification(recipientId, user.displayName || t('someone'), newMessage || t('sentAnImage'), `/messages?conversationId=${activeConversation.id}`);
            }

            setNewMessage("");
            setSelectedImage(null);
            setPreviewUrl(null);
            if(fileInputRef.current) {
                fileInputRef.current.value = "";
            }
        } catch (error) {
             console.error("Error sending message: ", error);
             toast({ variant: "destructive", title: t('error'), description: t('failedToSendMessage')})
        } finally {
            setIsSending(false);
        }
    };

    const getOtherParticipantInfo = (convo: Conversation) => {
        if (!user) return { name: t('user'), avatar: '' };
        const otherId = convo.participants.find(p => p !== user.uid);
        if (otherId && convo.participantInfo[otherId]) {
            return {
                name: convo.participantInfo[otherId].displayName,
                avatar: convo.participantInfo[otherId].photoURL || '',
                isOnline: convo.participantInfo[otherId].isOnline || false,
                lastSeen: convo.participantInfo[otherId].lastSeen
            };
        }
        return { name: t('unknownUser'), avatar: '', isOnline: false };
    }

    // Filter conversations based on search
    const filteredConversations = conversations.filter(convo => {
        const { name } = getOtherParticipantInfo(convo);
        return searchTerm === "" || 
            name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            convo.lastMessage.toLowerCase().includes(searchTerm.toLowerCase());
    });




    return (
        <PageLayout 
            title={t('messages')} 
            description={t('messagesDescription')}
            className="h-full flex flex-col"
        >
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[350px_1fr] gap-4 h-full min-h-0">
                {/* Message Threads Sidebar */}
                <StandardCard title="Message Threads" variant="elevated" className="flex flex-col h-full">
                    <div className="p-4 border-b border-border/50">
                        <div className="flex items-center justify-between mb-3">
                            <h3 className="font-semibold text-sm">All Conversations</h3>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                                {filteredConversations.length}
                            </span>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search conversations..." 
                                className="pl-10" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {loadingConversations ? (
                                <div className="p-4 space-y-4">
                                    {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
                                </div>
                            ) : filteredConversations.length > 0 ? (
                                filteredConversations.map((convo) => {
                                    const { name, avatar, isOnline } = getOtherParticipantInfo(convo);
                                    return (
                                        <div key={convo.id} className={cn("w-full p-4 rounded-lg transition-all duration-200 group cursor-pointer border", 
                                            activeConversation?.id === convo.id ? "bg-primary/10 border-primary/20 shadow-sm" : "hover:bg-muted/50 border-transparent hover:border-border/50")}
                                            onClick={() => handleSelectConversation(convo)}>
                                            <div className="flex items-start gap-3">
                                                <div className="relative">
                                                    <Avatar className="h-12 w-12">
                                                        <AvatarImage src={avatar} alt={name} />
                                                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">
                                                            {getAvatarFallback(name)}
                                                        </AvatarFallback>
                                                    </Avatar>
                                                    {isOnline && (
                                                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                                                    )}
                                                </div>
                                                <div className="flex-1 overflow-hidden min-w-0">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <div className="flex items-center gap-2 min-w-0">
                                                            <p className="font-semibold truncate text-sm">{name}</p>
                                                            {convo.isPinned && <Pin className="h-3 w-3 text-primary flex-shrink-0" />}
                                                        </div>
                                                        <div className="flex items-center gap-1 flex-shrink-0">
                                                            {convo.unread && convo.unread > 0 && (
                                                                <Badge variant="destructive" className="h-5 w-5 p-0 flex items-center justify-center text-xs">
                                                                    {convo.unread > 99 ? '99+' : convo.unread}
                                                                </Badge>
                                                            )}
                                                            <p className="text-xs text-muted-foreground">
                                                                {convo.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground truncate leading-relaxed">{convo.lastMessage}</p>
                                                </div>
                                            </div>
                                        </div>
                                    )
                                })
                            ) : (
                                <div className="text-center text-muted-foreground p-8">
                                    <MessageSquare className="mx-auto h-12 w-12 mb-4 text-primary opacity-60"/>
                                    <h3 className="text-lg font-semibold mb-2">
                                        {searchTerm ? "No Conversations Found" : t('noConversationsYet')}
                                    </h3>
                                    <p className="text-sm">
                                        {searchTerm ? "Try adjusting your search" : "Start a conversation with a service provider"}
                                    </p>
                                </div>
                            )}
                        </div>
                    </ScrollArea>
                </StandardCard>

                {/* Message Conversation View */}
                <StandardCard title={activeConversation ? getOtherParticipantInfo(activeConversation).name : "Select a conversation"} variant="elevated" className="flex flex-col h-full">
                   {activeConversation ? (
                    <>
                        <div className="p-4 border-b border-border/50 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="relative">
                                    <Avatar>
                                        <AvatarImage src={getOtherParticipantInfo(activeConversation).avatar} alt={getOtherParticipantInfo(activeConversation).name} />
                                        <AvatarFallback className="bg-gradient-to-r from-primary to-accent text-primary-foreground font-medium">
                                            {getAvatarFallback(getOtherParticipantInfo(activeConversation).name)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {getOtherParticipantInfo(activeConversation).isOnline && (
                                        <div className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-500 border-2 border-background rounded-full"></div>
                                    )}
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">
                                        {getOtherParticipantInfo(activeConversation).isOnline ? 'Online' : 'Last seen recently'}
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Phone className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                    <Video className="h-4 w-4" />
                                </Button>
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="h-8 w-8">
                                            <MoreVertical className="h-4 w-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent>
                                        <DropdownMenuItem>
                                            <Pin className="h-4 w-4 mr-2" />
                                            {activeConversation.isPinned ? 'Unpin' : 'Pin'} Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuItem>
                                            <Archive className="h-4 w-4 mr-2" />
                                            Archive Chat
                                        </DropdownMenuItem>
                                        <DropdownMenuSeparator />
                                        <DropdownMenuItem className="text-destructive">
                                            <Trash2 className="h-4 w-4 mr-2" />
                                            Delete Chat
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-6">
                            {loadingMessages ? (
                                <div className="flex justify-center items-center h-full">
                                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    {messages.map((msg) => {
                                        const isCurrentUser = msg.senderId === user?.uid;
                                        const senderInfo = isCurrentUser ? {avatar: user?.photoURL || '', name: user?.displayName} : getOtherParticipantInfo(activeConversation)
                                        return (
                                            <div key={msg.id} className={cn("flex items-end gap-3", isCurrentUser ? "justify-end" : "justify-start")}>
                                                {!isCurrentUser && (
                                                    <Avatar className="h-10 w-10">
                                                        <AvatarImage src={senderInfo.avatar} />
                                                        <AvatarFallback>{getAvatarFallback(senderInfo.name)}</AvatarFallback>
                                                    </Avatar>
                                                )}
                                                <div className={cn("max-w-sm lg:max-w-md", isCurrentUser ? "order-first" : "order-last")}>
                                                    <div className={cn("p-4 rounded-2xl shadow-sm", 
                                                        isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted text-foreground rounded-bl-none")}>
                                                        {msg.imageUrl && (
                                                            <div className="mb-3">
                                                                <Image 
                                                                    src={msg.imageUrl} 
                                                                    alt="Sent image" 
                                                                    width={300} 
                                                                    height={200}
                                                                    className="rounded-lg object-cover"
                                                                />
                                                            </div>
                                                        )}
                                                        {msg.text && (
                                                            <p className="text-sm leading-relaxed">{msg.text}</p>
                                                        )}
                                                        {msg.isEdited && (
                                                            <p className="text-xs opacity-70 mt-2">(edited)</p>
                                                        )}
                                                    </div>
                                                    <span className="text-xs text-muted-foreground mt-2 block">
                                                        {msg.timestamp?.toDate().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                    </span>
                                                </div>
                                            </div>
                                        )
                                    })}
                                    <div ref={messagesEndRef} />
                                </div>
                            )}
                        </ScrollArea>
                        <div className="p-6 border-t border-border/50">
                            {previewUrl && (
                                <div className="relative mb-4 w-32 h-32">
                                    <Image src={previewUrl} alt="Image preview" fill className="object-cover rounded-lg" />
                                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setPreviewUrl(null); setSelectedImage(null); if(fileInputRef.current) fileInputRef.current.value = "";}}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            <form className="flex items-end gap-3" onSubmit={handleSendMessage}>
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button size="icon" variant="ghost" type="button" onClick={() => fileInputRef.current?.click()} disabled={isSending} className="h-10 w-10">
                                    <Paperclip className="h-4 w-4"/>
                                    <span className="sr-only">{t('attachFile')}</span>
                                </Button>
                                <Textarea 
                                    placeholder={t('typeMessage')} 
                                    className="flex-1 min-h-[44px] max-h-32 resize-none"
                                    value={newMessage}
                                    onChange={(e) => setNewMessage(e.target.value)}
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            handleSendMessage(e);
                                        }
                                    }}
                                />
                                <Button size="icon" type="submit" disabled={isSending || (!newMessage.trim() && !selectedImage)} className="h-10 w-10">
                                    {isSending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4"/>}
                                    <span className="sr-only">{t('sendMessage')}</span>
                                </Button>
                            </form>
                        </div>
                    </>
                   ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <MessageSquare className="h-20 w-20 mb-6 text-primary opacity-60" />
                        <h3 className="text-2xl font-semibold mb-3">
                            {t('selectConversation')}
                        </h3>
                        <p className="text-lg max-w-md">{t('selectConversationDescription')}</p>
                    </div>
                   )}
                </StandardCard>
            </div>
        </PageLayout>
    );
}
