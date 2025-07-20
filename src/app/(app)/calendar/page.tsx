
"use client";

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer, Views } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or, Timestamp } from 'firebase/firestore';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Link } from 'lucide-react';

const locales = {
  'en-US': enUS,
};

const localizer = dateFnsLocalizer({
  format,
  parse,
  startOfWeek,
  getDay,
  locales,
});

type BookingEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    status: "Upcoming" | "Completed" | "Cancelled";
};

export default function CalendarPage() {
    const { user, userRole } = useAuth();
    const [events, setEvents] = useState<BookingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedEvent, setSelectedEvent] = useState<BookingEvent | null>(null);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    
    useEffect(() => {
        if (!user) {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(db, "bookings");
        const q = query(bookingsRef, 
            or(where("clientId", "==", user.uid), where("providerId", "==", user.uid))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                const bookingDate = (data.date as Timestamp).toDate();
                const eventTitle = userRole === 'client' 
                    ? `${data.serviceName} w/ ${data.providerName}`
                    : `${data.serviceName} for ${data.clientName}`;

                return {
                    title: eventTitle,
                    start: bookingDate,
                    end: new Date(bookingDate.getTime() + 60 * 60 * 1000), // Assuming 1-hour booking
                    status: data.status,
                };
            }).filter(event => event.status !== 'Pending'); // Exclude pending bookings from calendar view
            setEvents(bookingEvents as BookingEvent[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const eventStyleGetter = (event: BookingEvent) => {
        let backgroundColor = 'hsl(var(--primary))';
        let color = 'hsl(var(--primary-foreground))';

        if(event.status === 'Completed') {
            backgroundColor = 'hsl(var(--secondary))';
            color = 'hsl(var(--secondary-foreground))';
        } else if (event.status === 'Cancelled') {
            backgroundColor = 'hsl(var(--destructive))';
            color = 'hsl(var(--destructive-foreground))';
        }
        
        const style = {
            backgroundColor,
            color,
            borderRadius: '5px',
            opacity: 0.8,
            border: '0px',
            display: 'block',
        };
        return {
            style: style,
        };
    };

    const handleSelectEvent = (event: BookingEvent) => {
        setSelectedEvent(event);
        setIsDialogOpen(true);
    };

    const getStatusVariant = (status: string) => {
        switch (status) {
            case "Upcoming": return "default";
            case "Completed": return "secondary";
            case "Cancelled": return "destructive";
            default: return "outline";
        }
    };

    if (loading) {
        return (
             <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Calendar</h1>
                    <p className="text-muted-foreground">Loading your schedule...</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-[600px] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline">Calendar</h1>
                    <p className="text-muted-foreground">View your upcoming and past bookings.</p>
                </div>
                <Button variant="outline" disabled>
                    <Link className="mr-2 h-4 w-4" />
                    Sync with Google Calendar
                </Button>
            </div>
             <Card>
                <CardContent className="p-4 bg-card h-[75vh]">
                   <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                        onSelectEvent={handleSelectEvent}
                        views={[Views.MONTH, Views.WEEK, Views.DAY, Views.AGENDA]}
                        className="text-foreground"
                        components={{
                            toolbar: (toolbar) => {
                                return (
                                    <div className="rbc-toolbar mb-4">
                                        <span className="rbc-btn-group">
                                            <Button variant="outline" onClick={() => toolbar.onNavigate('PREV')}>Back</Button>
                                            <Button variant="outline" onClick={() => toolbar.onNavigate('NEXT')}>Next</Button>
                                            <Button variant="outline" onClick={() => toolbar.onNavigate('TODAY')}>Today</Button>
                                        </span>
                                        <span className="rbc-toolbar-label font-bold text-lg">{toolbar.label}</span>
                                        <span className="rbc-btn-group">
                                            {
                                                (toolbar.views as string[]).map(view => (
                                                    <Button 
                                                        key={view} 
                                                        variant={toolbar.view === view ? 'default' : 'outline'}
                                                        onClick={() => toolbar.onView(view)}
                                                    >
                                                        {view.charAt(0).toUpperCase() + view.slice(1)}
                                                    </Button>
                                                ))
                                            }
                                        </span>
                                    </div>
                                )
                            }
                        }}
                    />
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedEvent?.title}</DialogTitle>
                         <DialogDescription>
                            Booking Details
                        </DialogDescription>
                    </DialogHeader>
                    {selectedEvent && (
                        <div className="space-y-4">
                            <div>
                                <h4 className="font-semibold">Status</h4>
                                <Badge variant={getStatusVariant(selectedEvent.status)}>{selectedEvent.status}</Badge>
                            </div>
                            <div>
                                <h4 className="font-semibold">Time</h4>
                                <p className="text-muted-foreground">
                                    {format(selectedEvent.start, 'PPP p')}
                                </p>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}
