
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, MessageSquare } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

type BookingEvent = {
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    status: "Upcoming" | "Completed" | "Cancelled" | "Pending";
    providerName: string;
    clientName: string;
};

const getStatusClass = (status: BookingEvent['status']) => {
    switch (status) {
        case "Upcoming": return "bg-blue-500 hover:bg-blue-600";
        case "Completed": return "bg-green-500 hover:bg-green-600";
        case "Cancelled": return "bg-red-500 hover:bg-red-600";
        default: return "bg-gray-400 hover:bg-gray-500";
    }
};

export default function CalendarPage() {
    const { user, userRole } = useAuth();
    const t = useTranslations('Calendar');
    const [events, setEvents] = useState<BookingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState<BookingEvent[]>([]);
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
                return {
                    title: data.serviceName,
                    start: (data.date as Timestamp).toDate(),
                    end: new Date((data.date as Timestamp).toDate().getTime() + 60 * 60 * 1000), // Assuming 1-hour booking
                    status: data.status,
                    providerName: data.providerName,
                    clientName: data.clientName,
                };
            }).filter(event => event.status !== 'Pending' && event.status !== 'Cancelled');
            setEvents(bookingEvents as BookingEvent[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const firstDayOfMonth = startOfMonth(currentDate);
    const lastDayOfMonth = endOfMonth(currentDate);

    const daysInMonth = eachDayOfInterval({
        start: firstDayOfMonth,
        end: lastDayOfMonth,
    });
    
    const startingDayIndex = getDay(startOfWeek(firstDayOfMonth));

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);

        // Get the first day of the week for the first day of the month
        const calendarStart = startOfWeek(firstDayOfMonth);
        // Get the last day of the week for the last day of the month
        const calendarEnd = endOfWeek(lastDayOfMonth);

        return eachDayOfInterval({
            start: calendarStart,
            end: calendarEnd
        });

    }, [currentDate]);

    const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));
    
    const handleDayClick = (day: Date) => {
        const dayEvents = events.filter(event => isSameDay(event.start, day));
        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setIsDialogOpen(true);
        }
    }
    
    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.start, day));
    }


    if (loading) {
        return (
            <div className="space-y-6">
                <div>
                    <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                    <p className="text-muted-foreground">{t('loadingSchedule')}</p>
                </div>
                <Card>
                    <CardContent className="p-6">
                        <Skeleton className="h-[75vh] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">{t('title')}</h1>
                <p className="text-muted-foreground">{t('subtitle')}</p>
            </div>
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <CardTitle className="text-2xl font-bold">{format(currentDate, 'MMMM yyyy')}</CardTitle>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" onClick={prevMonth}><ChevronLeft /></Button>
                        <Button variant="outline" onClick={() => setCurrentDate(new Date())}>{t('today')}</Button>
                        <Button variant="outline" size="icon" onClick={nextMonth}><ChevronRight /></Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground">
                        {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => <div key={day}>{day}</div>)}
                    </div>
                    <div className="grid grid-cols-7 grid-rows-5 gap-px border-t border-l mt-2">
                        {calendarGrid.map((day, index) => {
                             const dayEvents = getEventsForDay(day);
                             return (
                                <div 
                                    key={index}
                                    className={cn("relative border-r border-b p-2 h-28 flex flex-col group", 
                                        !isSameMonth(day, currentDate) && "bg-secondary/30 text-muted-foreground",
                                        dayEvents.length > 0 && "cursor-pointer hover:bg-secondary"
                                    )}
                                    onClick={() => handleDayClick(day)}
                                >
                                    <span className={cn("font-medium", isToday(day) && "bg-primary text-primary-foreground rounded-full h-8 w-8 flex items-center justify-center")}>
                                        {format(day, 'd')}
                                    </span>
                                    <div className="mt-1 space-y-1 overflow-y-auto">
                                        {dayEvents.map((event, eventIndex) => (
                                            <div key={eventIndex} className={cn("text-xs text-white rounded px-1 truncate", getStatusClass(event.status))}>
                                                {event.title}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                             )
                        })}
                    </div>
                </CardContent>
            </Card>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{t('bookingsFor', { date: selectedDayEvents.length > 0 ? format(selectedDayEvents[0].start, 'PPP') : '' })}</DialogTitle>
                    </DialogHeader>
                     <div className="space-y-4">
                        {selectedDayEvents.map((event, index) => (
                            <div key={index} className="p-4 border rounded-lg">
                                <p className="font-bold">{event.title}</p>
                                 <p className="text-sm text-muted-foreground">
                                    {t('with', { name: userRole === 'client' ? event.providerName : event.clientName })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('time', { time: format(event.start, 'p') })}
                                </p>
                                 <Badge className={cn("mt-2 text-white", getStatusClass(event.status))}>{t(event.status.toLowerCase())}</Badge>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
