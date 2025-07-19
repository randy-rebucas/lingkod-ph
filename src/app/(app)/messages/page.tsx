
"use client";

import { useState, useRef } from "react";
import Image from 'next/image';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Search, Paperclip, X } from "lucide-react";

const initialConversations = [
    {
        id: 1,
        name: "Maria Dela Cruz",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Okay, see you then!",
        timestamp: "10:42 AM",
        unread: 2,
    },
    {
        id: 2,
        name: "Jose Rizal",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Thank you for the excellent service.",
        timestamp: "Yesterday",
        unread: 0,
    },
    {
        id: 3,
        name: "Andres Bonifacio",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Can we reschedule to Friday?",
        timestamp: "2 days ago",
        unread: 0,
    },
     {
        id: 4,
        name: "Gabriela Silang",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Here is the photo of the broken pipe.",
        timestamp: "3 days ago",
        unread: 0,
    },
];

const messagesByConvoId: { [key: number]: any[] } = {
    1: [
        {
            id: 1,
            sender: "Maria Dela Cruz",
            text: "Hi! I'm excited for our appointment for Deep House Cleaning on August 15.",
            isCurrentUser: false,
        },
        {
            id: 2,
            sender: "You",
            text: "Hello Maria! We are too. We'll be there on time.",
            isCurrentUser: true,
        },
        {
            id: 3,
            sender: "Maria Dela Cruz",
            text: "Great to hear! Just wanted to confirm the address is correct.",
            isCurrentUser: false,
        },
        {
            id: 4,
            sender: "Maria Dela Cruz",
            text: "Okay, see you then!",
            isCurrentUser: false,
        },
    ],
    2: [
        { id: 1, sender: "Jose Rizal", text: "Thank you for the excellent service.", isCurrentUser: false },
        { id: 2, sender: "You", text: "You're most welcome, Jose!", isCurrentUser: true }
    ],
    3: [
        { id: 1, sender: "Andres Bonifacio", text: "Can we reschedule to Friday?", isCurrentUser: false },
    ],
    4: [
        { id: 1, sender: "Gabriela Silang", text: "Here is the photo of the broken pipe.", isCurrentUser: false, imageUrl: "https://placehold.co/400x300.png", hint: "broken pipe" },
        { id: 2, sender: "You", text: "Thanks for sending that. I see the issue. We'll bring the right parts.", isCurrentUser: true },
    ],
};

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};


export default function MessagesPage() {
    const [conversations, setConversations] = useState(initialConversations);
    const [activeConversationId, setActiveConversationId] = useState(conversations[0]?.id);
    const [messages, setMessages] = useState(activeConversationId ? messagesByConvoId[activeConversationId] : []);
    const [newMessage, setNewMessage] = useState("");
    const [selectedImage, setSelectedImage] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSelectConversation = (id: number) => {
        setActiveConversationId(id);
        setMessages(messagesByConvoId[id] || []);
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
    
    const handleSendMessage = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() && !selectedImage) return;

        const message = {
            id: Date.now(),
            sender: "You",
            text: newMessage,
            isCurrentUser: true,
            ...(previewUrl && { imageUrl: previewUrl }),
        };

        setMessages(prev => [...prev, message]);
        setNewMessage("");
        setSelectedImage(null);
        setPreviewUrl(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    };

    const activeConversation = conversations.find(c => c.id === activeConversationId);


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
                            {conversations.map((convo) => (
                                <button key={convo.id} className={cn("w-full text-left p-3 rounded-lg transition-colors", activeConversationId === convo.id ? "bg-secondary" : "hover:bg-secondary/50")}
                                    onClick={() => handleSelectConversation(convo.id)}
                                >
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={convo.avatar} alt={convo.name} />
                                            <AvatarFallback>{getAvatarFallback(convo.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 overflow-hidden">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold truncate">{convo.name}</p>
                                                <p className="text-xs text-muted-foreground flex-shrink-0">{convo.timestamp}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-1">
                                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{convo.lastMessage}</p>
                                                {convo.unread > 0 && <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5 flex-shrink-0">{convo.unread}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                {/* Message View */}
                <div className="flex flex-col h-full bg-secondary/30">
                   {activeConversation ? (
                    <>
                        <div className="p-4 border-b flex items-center gap-3 bg-background">
                            <Avatar>
                                <AvatarImage src={activeConversation.avatar} alt={activeConversation.name} />
                                <AvatarFallback>{getAvatarFallback(activeConversation.name)}</AvatarFallback>
                            </Avatar>
                            <div>
                                <p className="font-semibold">{activeConversation.name}</p>
                                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                                    <span className="h-2 w-2 rounded-full bg-green-500"></span>
                                    Online
                                </p>
                            </div>
                        </div>
                        <ScrollArea className="flex-1 p-4">
                            <div className="space-y-4">
                                {messages.map((msg) => (
                                    <div key={msg.id} className={cn("flex items-end gap-2", msg.isCurrentUser ? "justify-end" : "justify-start")}>
                                        {!msg.isCurrentUser && (
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={activeConversation.avatar} />
                                                <AvatarFallback>{getAvatarFallback(activeConversation.name)}</AvatarFallback>
                                            </Avatar>
                                        )}
                                        <div className={cn("max-w-xs md:max-w-md p-1 rounded-2xl shadow-sm", msg.isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none")}>
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
                                ))}
                            </div>
                        </ScrollArea>
                        <div className="p-4 border-t bg-background">
                            {previewUrl && (
                                <div className="relative mb-2 w-24 h-24">
                                    <Image src={previewUrl} alt="Image preview" layout="fill" className="object-cover rounded-md" />
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
                                />
                                 <input
                                    type="file"
                                    ref={fileInputRef}
                                    onChange={handleFileChange}
                                    accept="image/*"
                                    className="hidden"
                                />
                                <Button size="icon" variant="ghost" type="button" onClick={() => fileInputRef.current?.click()}>
                                    <Paperclip className="h-5 w-5"/>
                                    <span className="sr-only">Attach File</span>
                                </Button>
                                <Button size="icon" type="submit">
                                    <Send className="h-5 w-5"/>
                                    <span className="sr-only">Send Message</span>
                                </Button>
                            </form>
                        </div>
                    </>
                   ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground p-8">
                        <Send className="h-16 w-16 mb-4" />
                        <h3 className="text-xl font-semibold">Select a conversation</h3>
                        <p>Choose a conversation from the left panel to start chatting.</p>
                    </div>
                   )}
                </div>
            </Card>
        </div>
    );
}
