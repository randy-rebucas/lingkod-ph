
"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { getDb  } from '@/lib/firebase';
import { collection, query, onSnapshot, orderBy, Timestamp } from "firebase/firestore";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, MessageSquare } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { format, formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { handleUpdateTicketStatus, handleAddTicketNote } from "./actions";
import { Separator } from "@/components/ui/separator";

type TicketStatus = "New" | "In Progress" | "Closed";

type TicketNote = {
    text: string;
    authorId: string;
    authorName: string;
    createdAt: Timestamp;
};

type Ticket = {
    id: string;
    subject: string;
    userName: string;
    status: TicketStatus;
    createdAt: Timestamp;
    updatedAt: Timestamp;
    message: string;
    userEmail: string;
    notes?: TicketNote[];
};

const getStatusVariant = (status: TicketStatus) => {
    switch (status) {
        case "New": return "destructive";
        case "In Progress": return "default";
        case "Closed": return "secondary";
        default: return "outline";
    }
};

export default function AdminTicketsPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const [tickets, setTickets] = useState<Ticket[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);
    const [newNote, setNewNote] = useState("");

    useEffect(() => {
        if (userRole !== 'admin' || !getDb()) {
            setLoading(false);
            return;
        }

        const ticketsQuery = query(collection(getDb(), "tickets"), orderBy("updatedAt", "desc"));
        
        const unsubscribe = onSnapshot(ticketsQuery, (snapshot) => {
            const data = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Ticket));
            setTickets(data);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching tickets:", error);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [userRole]);
    
    const onUpdateStatus = async (ticketId: string, status: TicketStatus) => {
        if (!user) return;
        const result = await handleUpdateTicketStatus(ticketId, status, { id: user.uid, name: user.displayName });
        toast({
            title: result.error ? 'Error' : 'Success',
            description: result.message,
            variant: result.error ? 'destructive' : 'default',
        });
    };

    const onAddNote = async () => {
        if (!user || !selectedTicket) return;
        const result = await handleAddTicketNote(selectedTicket.id, newNote, { id: user.uid, name: user.displayName });
        if (result.error) {
            toast({ title: 'Error', description: result.message, variant: 'destructive' });
        } else {
            toast({ title: 'Note Added', description: 'Your note has been saved.' });
            setNewNote("");
            // The onSnapshot listener will update the ticket in the dialog automatically.
        }
    };
    
    const openDetailsDialog = (ticket: Ticket) => {
        setSelectedTicket(ticket);
        setIsDetailsOpen(true);
    };

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
    
    if (loading) {
        return (
             <div className="container space-y-8">
                 <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage user-submitted support requests.</p>
                </div>
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-64 w-full" />
                        </CardContent>
                    </Card>
                </div>
             </div>
        )
    }

    return (
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Support Tickets</h1>
                    <p className="text-muted-foreground">Manage user-submitted support requests.</p>
                </div>
                <div className=" mx-auto">
                     <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent>
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Last Updated</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Subject</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {tickets.length > 0 ? tickets.map(ticket => (
                                        <TableRow key={ticket.id}>
                                            <TableCell className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(ticket.updatedAt.toDate(), { addSuffix: true })}
                                            </TableCell>
                                            <TableCell>{ticket.userName}</TableCell>
                                            <TableCell className="font-medium">{ticket.subject}</TableCell>
                                            <TableCell><Badge variant={getStatusVariant(ticket.status)}>{ticket.status}</Badge></TableCell>
                                             <TableCell className="text-right">
                                                <DropdownMenu>
                                                    <DropdownMenuTrigger asChild>
                                                        <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                                                    </DropdownMenuTrigger>
                                                    <DropdownMenuContent align="end">
                                                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => openDetailsDialog(ticket)}><Eye className="mr-2 h-4 w-4" />View Details</DropdownMenuItem>
                                                        <DropdownMenuSeparator />
                                                        <DropdownMenuLabel>Change Status</DropdownMenuLabel>
                                                        <DropdownMenuItem onSelect={() => onUpdateStatus(ticket.id, "New")} disabled={ticket.status === 'New'}>New</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => onUpdateStatus(ticket.id, "In Progress")} disabled={ticket.status === 'In Progress'}>In Progress</DropdownMenuItem>
                                                        <DropdownMenuItem onSelect={() => onUpdateStatus(ticket.id, "Closed")} disabled={ticket.status === 'Closed'}>Closed</DropdownMenuItem>
                                                    </DropdownMenuContent>
                                                </DropdownMenu>
                                            </TableCell>
                                        </TableRow>
                                    )) : (
                                        <TableRow>
                                            <TableCell colSpan={5} className="text-center h-24">
                                                No support tickets found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </CardContent>
                    </Card>
                </div>
                 {selectedTicket && (
                    <DialogContent className="max-w-2xl">
                        <DialogHeader>
                            <DialogTitle>{selectedTicket.subject}</DialogTitle>
                            <DialogDescription>
                                Submitted by {selectedTicket.userName} ({selectedTicket.userEmail}) on {format(selectedTicket.createdAt.toDate(), 'PPp')}
                            </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
                            <div>
                                <h4 className="font-semibold mb-2">Original Message</h4>
                                <div className="p-4 bg-secondary rounded-md text-sm text-secondary-foreground">
                                    {selectedTicket.message}
                                </div>
                            </div>
                            <Separator />
                            <div>
                                <h4 className="font-semibold mb-2">Internal Notes</h4>
                                <div className="space-y-4">
                                    {selectedTicket.notes?.map(note => (
                                        <div key={note.createdAt.seconds} className="text-sm p-3 border rounded-md bg-background">
                                            <p>{note.text}</p>
                                            <p className="text-xs text-muted-foreground mt-2">
                                                - {note.authorName}, {formatDistanceToNow(note.createdAt.toDate(), { addSuffix: true })}
                                            </p>
                                        </div>
                                    ))}
                                    <div className="flex items-start gap-2">
                                        <Textarea value={newNote} onChange={e => setNewNote(e.target.value)} placeholder="Add a new internal note..." />
                                        <Button onClick={onAddNote}><MessageSquare className="mr-2 h-4 w-4" /> Add Note</Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </DialogContent>
                )}
            </div>
        </Dialog>
    )
}
