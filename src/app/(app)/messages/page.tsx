
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { Send, Search } from "lucide-react";

const conversations = [
    {
        id: 1,
        name: "Maria Dela Cruz",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Okay, see you then!",
        timestamp: "10:42 AM",
        unread: 2,
        active: true,
    },
    {
        id: 2,
        name: "Jose Rizal",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Thank you for the excellent service.",
        timestamp: "Yesterday",
        unread: 0,
        active: false,
    },
    {
        id: 3,
        name: "Andres Bonifacio",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "Can we reschedule to Friday?",
        timestamp: "2 days ago",
        unread: 0,
        active: false,
    },
     {
        id: 4,
        name: "Gabriela Silang",
        avatar: "https://placehold.co/100x100.png",
        lastMessage: "I have a question about the booking.",
        timestamp: "3 days ago",
        unread: 0,
        active: false,
    },
];

const messages = [
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
];

export default function MessagesPage() {
    return (
        <div className="space-y-6 h-full flex flex-col">
            <div>
                <h1 className="text-3xl font-bold font-headline">Messages</h1>
                <p className="text-muted-foreground">
                    Communicate with clients and service providers.
                </p>
            </div>
            <Card className="flex-1 grid grid-cols-1 md:grid-cols-[300px_1fr] shadow-lg">
                <div className="flex flex-col border-r">
                    <div className="p-4 border-b">
                         <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input placeholder="Search conversations..." className="pl-9" />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {conversations.map((convo) => (
                                <button key={convo.id} className={cn("w-full text-left p-3 rounded-lg transition-colors", convo.active ? "bg-secondary" : "hover:bg-secondary")}>
                                    <div className="flex items-start gap-3">
                                        <Avatar className="h-10 w-10 border">
                                            <AvatarImage src={convo.avatar} alt={convo.name} />
                                            <AvatarFallback>{convo.name.charAt(0)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1">
                                            <div className="flex justify-between items-center">
                                                <p className="font-semibold">{convo.name}</p>
                                                <p className="text-xs text-muted-foreground">{convo.timestamp}</p>
                                            </div>
                                            <div className="flex justify-between items-end mt-1">
                                                <p className="text-sm text-muted-foreground truncate max-w-[150px]">{convo.lastMessage}</p>
                                                {convo.unread > 0 && <span className="flex items-center justify-center bg-primary text-primary-foreground text-xs rounded-full h-5 w-5">{convo.unread}</span>}
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </ScrollArea>
                </div>

                <div className="flex flex-col h-full">
                    <div className="p-4 border-b flex items-center gap-3">
                        <Avatar>
                            <AvatarImage src="https://placehold.co/100x100.png" alt="Maria Dela Cruz" />
                            <AvatarFallback>MD</AvatarFallback>
                        </Avatar>
                        <div>
                            <p className="font-semibold">Maria Dela Cruz</p>
                            <p className="text-xs text-muted-foreground">Online</p>
                        </div>
                    </div>
                    <ScrollArea className="flex-1 p-4 bg-secondary/50">
                        <div className="space-y-4">
                            {messages.map((msg) => (
                                <div key={msg.id} className={cn("flex items-end gap-2", msg.isCurrentUser ? "justify-end" : "justify-start")}>
                                     {!msg.isCurrentUser && (
                                         <Avatar className="h-8 w-8">
                                            <AvatarImage src="https://placehold.co/100x100.png" />
                                            <AvatarFallback>MD</AvatarFallback>
                                        </Avatar>
                                     )}
                                    <div className={cn("max-w-xs md:max-w-md p-3 rounded-2xl", msg.isCurrentUser ? "bg-primary text-primary-foreground rounded-br-none" : "bg-card text-card-foreground rounded-bl-none")}>
                                        <p className="text-sm">{msg.text}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </ScrollArea>
                    <div className="p-4 border-t bg-background">
                        <div className="relative">
                            <Input placeholder="Type your message..." className="pr-12" />
                            <Button size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 h-8 w-8">
                                <Send className="h-4 w-4"/>
                            </Button>
                        </div>
                    </div>
                </div>
            </Card>
        </div>
    );
}
