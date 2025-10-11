
"use client";

import { useState, useEffect, useRef, useCallback, useMemo, memo } from "react";
import { useTranslations } from 'next-intl';
import Image from 'next/image';
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { 
  getUserConversations,
  getConversationMessages,
  sendMessage,
  createNotification
} from './actions';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Search, Paperclip, X, MessageSquare, Check, CheckCheck } from "lucide-react";
import { SkeletonGrid, LoadingSpinner } from "@/components/ui/loading-states";
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
    timestamp: Date;
    unread?: number;
};

type Message = {
    id?: string;
    senderId: string;
    text: string;
    imageUrl?: string;
    timestamp: Date;
    hint?: string;
    status?: 'sent' | 'delivered' | 'read';
};


const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};



// Memoized conversation item component
const ConversationItem = memo(({
    convo,
    isActive,
    onSelect,
    getOtherParticipantInfo,
    getAvatarFallback,
    _t
}: {
    convo: Conversation;
    isActive: boolean;
    onSelect: (convo: Conversation) => void;
    getOtherParticipantInfo: (convo: Conversation) => { name: string; avatar: string };
    getAvatarFallback: (name: string | null | undefined) => string;
    _t: any;
}) => {
    const { name, avatar } = getOtherParticipantInfo(convo);

    return (
        <button
            className={cn("w-full text-left p-4 transition-all duration-200 group border-b border-gray-200",
                isActive ? "bg-gray-100" : "hover:bg-gray-50")}
            onClick={() => onSelect(convo)}
            aria-label={`Open conversation with ${name}`}
        >
            <div className="flex items-start gap-3">
                <Avatar className="h-12 w-12">
                    <AvatarImage src={avatar} alt={name} />
                    <AvatarFallback className="bg-gray-300 text-gray-900 font-medium text-sm">
                        {getAvatarFallback(name)}
                    </AvatarFallback>
                </Avatar>
                <div className="flex-1 overflow-hidden">
                    <div className="flex justify-between items-center mb-1">
                        <p className="font-medium truncate text-sm text-gray-900">{name}</p>
                        <p className="text-xs text-gray-500 flex-shrink-0">
                            {convo.timestamp?.toLocaleDateString([], { month: 'numeric', day: 'numeric', year: '2-digit' })}
                        </p>
                    </div>
                    <div className="flex justify-between items-end">
                        <p className="text-xs text-gray-600 truncate max-w-[180px]">{convo.lastMessage}</p>
                        {convo.unread && convo.unread > 0 && (
                            <span className="bg-green-500 text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                {convo.unread > 99 ? '99+' : convo.unread}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
});

ConversationItem.displayName = 'ConversationItem';

// Memoized message component
const MessageBubble = memo(({
    msg,
    isCurrentUser,
    senderInfo,
    getAvatarFallback,
    t
}: {
    msg: Message;
    isCurrentUser: boolean;
    senderInfo: { avatar: string; name: string | null | undefined };
    getAvatarFallback: (name: string | null | undefined) => string;
    t: any;
}) => {
    const getStatusIcon = (status?: string) => {
        switch (status) {
            case 'read':
                return <CheckCheck className="h-3 w-3 text-blue-400" />;
            case 'delivered':
                return <CheckCheck className="h-3 w-3 text-gray-400" />;
            case 'sent':
                return <Check className="h-3 w-3 text-gray-400" />;
            default:
                return <Check className="h-3 w-3 text-gray-400" />;
        }
    };

    return (
        <div className={cn("flex items-end gap-3 mb-4", isCurrentUser ? "justify-end" : "justify-start")}>
            {!isCurrentUser && (
                <Avatar className="h-8 w-8">
                    <AvatarImage src={senderInfo.avatar} alt={senderInfo.name || 'User'} />
                    <AvatarFallback className="bg-gray-300 text-gray-900 text-xs">
                        {getAvatarFallback(senderInfo.name)}
                    </AvatarFallback>
                </Avatar>
            )}
            <div className={cn("max-w-md rounded-2xl",
                isCurrentUser ? "bg-green-600 text-white rounded-br-sm" : "bg-gray-200 text-gray-900 rounded-bl-sm")}>
                {msg.imageUrl && (
                    <div className="p-2">
                        <Image
                            src={msg.imageUrl}
                            alt={t('sentImage')}
                            width={300}
                            height={200}
                            data-ai-hint={msg.hint}
                            className="rounded-lg object-cover"
                        />
                    </div>
                )}
                {msg.text && (
                    <p className="text-sm px-4 py-3 leading-relaxed">{msg.text}</p>
                )}
                {isCurrentUser && (
                    <div className="flex justify-end items-center px-3 pb-2">
                        <span className="text-xs text-gray-200">
                            {msg.timestamp?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                        <span className="ml-1">
                            {getStatusIcon(msg.status)}
                        </span>
                    </div>
                )}
                {!isCurrentUser && (
                    <div className="flex justify-start items-center px-3 pb-2">
                        <span className="text-xs text-gray-500">
                            {msg.timestamp?.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true })}
                        </span>
                    </div>
                )}
            </div>
        </div>
    );
});

MessageBubble.displayName = 'MessageBubble';

// Typing indicator component
const TypingIndicator = memo(() => (
    <div className="flex items-end gap-3 justify-start mb-4">
        <div className="h-8 w-8 rounded-full bg-gray-300 animate-pulse" />
        <div className="bg-gray-200 text-gray-900 rounded-2xl rounded-bl-sm p-3">
            <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </div>
        </div>
    </div>
));

TypingIndicator.displayName = 'TypingIndicator';

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
    const [searchQuery, setSearchQuery] = useState("");
    const [isTyping, setIsTyping] = useState(false);
    const [typingTimeout, setTypingTimeout] = useState<NodeJS.Timeout | null>(null);

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
        
        const fetchConversations = async () => {
            setLoadingConversations(true);
            try {
                const result = await getUserConversations(user.uid);
                if (result.success && result.data) {
                    setConversations(result.data);
                } else {
                    toast({ variant: "destructive", title: t('error'), description: result.error || t('couldNotFetchConversations') });
                }
            } catch (error) {
                console.error("Error fetching conversations: ", error);
                toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchConversations') });
            } finally {
                setLoadingConversations(false);
            }
        };

        fetchConversations();
    }, [user, toast, t]);

    useEffect(() => {
        if (!activeConversation) return;

        const fetchMessages = async () => {
            setLoadingMessages(true);
            try {
                const result = await getConversationMessages(activeConversation.id);
                if (result.success && result.data) {
                    setMessages(result.data);
                } else {
                    toast({ variant: "destructive", title: t('error'), description: result.error || t('couldNotFetchMessages') });
                }
            } catch (error) {
                console.error("Error fetching messages: ", error);
                toast({ variant: "destructive", title: t('error'), description: t('couldNotFetchMessages') });
            } finally {
                setLoadingMessages(false);
            }
        };

        fetchMessages();
    }, [activeConversation, toast, t]);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages]);


    // Memoized functions for performance
    const handleSelectConversation = useCallback((convo: Conversation) => {
        setActiveConversation(convo);
        setSelectedImage(null);
        setPreviewUrl(null);
    }, []);

    const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        if (event.target.files && event.target.files[0]) {
            const file = event.target.files[0];
            // Validate file size (max 5MB)
            if (file.size > 5 * 1024 * 1024) {
                toast({
                    variant: "destructive",
                    title: t('error'),
                    description: t('fileTooLarge')
                });
                return;
            }
            setSelectedImage(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    }, [toast, t]);

    // Memoized filtered conversations
    // Memoized other participant info function
    const getOtherParticipantInfo = useCallback((convo: Conversation) => {
        if (!user) return { name: t('user'), avatar: '' };
        const otherId = convo.participants.find(p => p !== user.uid);
        if (otherId && convo.participantInfo[otherId]) {
            return {
                name: convo.participantInfo[otherId].displayName,
                avatar: convo.participantInfo[otherId].photoURL || ''
            };
        }
        return { name: t('unknownUser'), avatar: '' };
    }, [user, t]);

    const filteredConversations = useMemo(() => {
        if (!searchQuery.trim()) return conversations;
        return conversations.filter(convo => {
            const { name } = getOtherParticipantInfo(convo);
            return name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                convo.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [conversations, searchQuery, getOtherParticipantInfo]);

    // Handle typing indicator
    const handleTyping = useCallback(() => {
        setIsTyping(true);

        if (typingTimeout) {
            clearTimeout(typingTimeout);
        }

        const timeout = setTimeout(() => {
            setIsTyping(false);
        }, 1000);

        setTypingTimeout(timeout);
    }, [typingTimeout]);

    // Cleanup typing timeout on unmount
    useEffect(() => {
        return () => {
            if (typingTimeout) {
                clearTimeout(typingTimeout);
            }
        };
    }, [typingTimeout]);

    // Image compression utility
    const compressImage = useCallback((file: File): Promise<File> => {
        return new Promise<File>((resolve) => {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            const img = new window.Image();

            img.onload = () => {
                const maxWidth = 800;
                const maxHeight = 600;
                let { width, height } = img;

                if (width > height) {
                    if (width > maxWidth) {
                        height = (height * maxWidth) / width;
                        width = maxWidth;
                    }
                } else {
                    if (height > maxHeight) {
                        width = (width * maxHeight) / height;
                        height = maxHeight;
                    }
                }

                canvas.width = width;
                canvas.height = height;

                ctx?.drawImage(img, 0, 0, width, height);

                canvas.toBlob((blob) => {
                    if (blob) {
                        const compressedFile = new File([blob], file.name, {    
                            type: 'image/jpeg',
                            lastModified: Date.now(),
                        });
                        resolve(compressedFile);
                    } else {
                        resolve(file);
                    }
                }, 'image/jpeg', 0.8);
            };

            img.src = URL.createObjectURL(file);
        });
    }, []);

    const handleSendMessage = useCallback(async (e: React.FormEvent) => {
        e.preventDefault();
        if ((!newMessage.trim() && !selectedImage) || !user || !activeConversation) return;

        setIsSending(true);

        try {
            let compressedFile: File | undefined;
            if (selectedImage) {
                // Compress image if it's too large
                compressedFile = await compressImage(selectedImage);
            }

            // Send message using server action
            const result = await sendMessage(
                activeConversation.id,
                user.uid,
                newMessage,
                compressedFile
            );

            if (result.success) {
                // Create notification for recipient
                const recipientId = activeConversation.participants.find(p => p !== user.uid);
                if (recipientId) {
                    await createNotification(
                        recipientId, 
                        user.displayName || t('someone'), 
                        newMessage || t('sentAnImage'), 
                        `/messages?conversationId=${activeConversation.id}`
                    );
                }

                setNewMessage("");
                setSelectedImage(null);
                setPreviewUrl(null);
                if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                }

                // Refresh messages and conversations
                const [messagesResult, conversationsResult] = await Promise.all([
                    getConversationMessages(activeConversation.id),
                    getUserConversations(user.uid)
                ]);

                if (messagesResult.success && messagesResult.data) {
                    setMessages(messagesResult.data);
                }
                if (conversationsResult.success && conversationsResult.data) {
                    setConversations(conversationsResult.data);
                }
            } else {
                toast({
                    variant: "destructive",
                    title: t('error'),
                    description: result.error || t('failedToSendMessage')
                });
            }
        } catch (error) {
            console.error("Error sending message: ", error);
            toast({
                variant: "destructive",
                title: t('error'),
                description: error instanceof Error ? error.message : t('failedToSendMessage')
            });
        } finally {
            setIsSending(false);
        }
    }, [newMessage, selectedImage, user, activeConversation, toast, t, compressImage]);

    // Image compression utility


    return (
        <div className="h-screen bg-gray-50 flex container space-y-8">
            {/* Left Column - Messages List */}
            <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
                {/* Messages Header */}
                <div className="p-4 border-b border-gray-200">
                    <div className="mb-4">
                        <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
                        <Input
                            placeholder="Search"
                            className="pl-9 bg-gray-100 border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>

                {/* Conversations List */}
                <ScrollArea className="flex-1">
                    {loadingConversations ? (
                        <div className="p-4">
                            <SkeletonGrid count={5} itemClassName="h-16 bg-gray-200" />
                        </div>
                    ) : filteredConversations.length > 0 ? (
                        filteredConversations.map((convo) => (
                            <ConversationItem
                                key={convo.id}
                                convo={convo}
                                isActive={activeConversation?.id === convo.id}
                                onSelect={handleSelectConversation}
                                getOtherParticipantInfo={getOtherParticipantInfo}
                                getAvatarFallback={getAvatarFallback}
                                _t={t}
                            />
                        ))
                    ) : (
                        <div className="text-center text-gray-500 p-8">
                            <MessageSquare className="mx-auto h-12 w-12 mb-4 text-gray-400" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                {searchQuery ? t('noConversationsFound') : t('noConversationsYet')}
                            </h3>
                            <p className="text-sm">
                                {searchQuery ? t('tryDifferentSearch') : t('startConversationWithProvider')}
                            </p>
                        </div>
                    )}
                </ScrollArea>
            </div>

            {/* Center Column - Chat Window */}
            <div className="flex-1 flex flex-col bg-white h-screen">
                {activeConversation ? (
                    <>
                        {/* Chat Header - Fixed */}
                        <div className="flex-shrink-0 p-4 border-b border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <Avatar className="h-10 w-10">
                                    <AvatarImage src={getOtherParticipantInfo(activeConversation).avatar} alt={getOtherParticipantInfo(activeConversation).name} />
                                    <AvatarFallback className="bg-gray-300 text-gray-900">
                                        {getAvatarFallback(getOtherParticipantInfo(activeConversation).name)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-semibold text-gray-900">{getOtherParticipantInfo(activeConversation).name}</h2>
                                </div>
                            </div>
                        </div>

                        {/* Messages Area - Scrollable */}
                        <div className="flex-1 overflow-hidden">
                            <ScrollArea className="h-full p-6">
                                {loadingMessages ? (
                                    <div className="flex justify-center items-center h-full">
                                        <LoadingSpinner size="lg" text="Loading messages..." />
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {messages.map((msg) => {
                                            const isCurrentUser = msg.senderId === user?.uid;
                                            const senderInfo = isCurrentUser ? { avatar: user?.photoURL || '', name: user?.displayName } : getOtherParticipantInfo(activeConversation)
                                            return (
                                                <MessageBubble
                                                    key={msg.id}
                                                    msg={msg}
                                                    isCurrentUser={isCurrentUser}
                                                    senderInfo={senderInfo}
                                                    getAvatarFallback={getAvatarFallback}
                                                    t={t}
                                                />
                                            )
                                        })}
                                        {isTyping && <TypingIndicator />}
                                        <div ref={messagesEndRef} />
                                    </div>
                                )}
                            </ScrollArea>
                        </div>

                        {/* Message Input - Fixed at bottom */}
                        <div className="flex-shrink-0 p-4 border-t border-gray-200 bg-gray-50">
                            {previewUrl && (
                                <div className="relative mb-3 w-24 h-24">
                                    <Image src={previewUrl} alt={t('imagePreview')} fill className="object-cover rounded-lg" />
                                    <Button size="icon" variant="destructive" className="absolute -top-2 -right-2 h-6 w-6 rounded-full" onClick={() => { setPreviewUrl(null); setSelectedImage(null); if (fileInputRef.current) fileInputRef.current.value = ""; }}>
                                        <X className="h-3 w-3" />
                                    </Button>
                                </div>
                            )}
                            <form className="flex items-center gap-2" onSubmit={handleSendMessage}>
                                <Input
                                    placeholder="Send a message..."
                                    className="flex-1 bg-white border-gray-300 text-gray-900 placeholder-gray-500 focus:border-green-500"
                                    value={newMessage}
                                    onChange={(e) => {
                                        setNewMessage(e.target.value);
                                        handleTyping();
                                    }}
                                    disabled={isSending}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            if (newMessage.trim() || selectedImage) {
                                                handleSendMessage(e);
                                            }
                                        }
                                    }}
                                />
                                <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <div className="flex items-center gap-2">
                                    <Button variant="ghost" size="icon" type="button" onClick={() => fileInputRef.current?.click()} className="text-gray-500 hover:text-gray-900">
                                        <Paperclip className="h-4 w-4" />
                                    </Button>
                                    <Button
                                        size="icon"
                                        type="submit"
                                        disabled={isSending || (!newMessage.trim() && !selectedImage)}
                                        className="bg-green-600 hover:bg-green-700 text-white"
                                    >
                                        {isSending ? <LoadingSpinner size="sm" /> : <Send className="h-4 w-4" />}
                                    </Button>
                                </div>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-gray-500 p-8">
                        <MessageSquare className="h-20 w-20 mb-6 text-gray-400" />
                        <h3 className="text-2xl font-semibold text-gray-900 mb-3">
                            {t('selectConversation')}
                        </h3>
                        <p className="text-lg max-w-md">{t('selectConversationDescription')}</p>
                    </div>
                )}
            </div>

        </div>
    );
}
