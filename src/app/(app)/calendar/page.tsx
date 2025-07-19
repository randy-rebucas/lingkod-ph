
"use client";

import { useState, useEffect } from 'react';
import { Calendar, dateFnsLocalizer } from 'react-big-calendar';
import format from 'date-fns/format';
import parse from 'date-fns/parse';
import startOfWeek from 'date-fns/startOfWeek';
import getDay from 'date-fns/getDay';
import enUS from 'date-fns/locale/en-US';
import 'react-big-calendar/lib/css/react-big-calendar.css';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

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
            });
            setEvents(bookingEvents as BookingEvent[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const eventStyleGetter = (event: BookingEvent) => {
        let backgroundColor = 'hsl(var(--primary))';
        if(event.status === 'Completed') {
            backgroundColor = 'hsl(var(--secondary-foreground))';
        } else if (event.status === 'Cancelled') {
            backgroundColor = 'hsl(var(--destructive))';
        }
        
        const style = {
            backgroundColor,
            borderRadius: '5px',
            opacity: 0.8,
            color: 'hsl(var(--primary-foreground))',
            border: '0px',
            display: 'block',
        };
        return {
            style: style,
        };
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
            <div>
                <h1 className="text-3xl font-bold font-headline">Calendar</h1>
                <p className="text-muted-foreground">View your upcoming and past bookings.</p>
            </div>
             <Card>
                <CardContent className="p-6 bg-card h-[70vh]">
                    <Calendar
                        localizer={localizer}
                        events={events}
                        startAccessor="start"
                        endAccessor="end"
                        style={{ height: '100%' }}
                        eventPropGetter={eventStyleGetter}
                    />
                </CardContent>
            </Card>
        </div>
    );
}
