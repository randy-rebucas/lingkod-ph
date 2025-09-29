"use client";

import { useState, useEffect, useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { getDb  } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or, Timestamp, addDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogClose, DialogFooter, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle, Loader2, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';

type BookingEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    status: "Upcoming" | "Completed" | "Cancelled" | "Pending";
    providerName: string;
    clientName: string;
    serviceName: string;
};

const getStatusClass = (status: BookingEvent['status']) => {
    switch (status) {
        case "Upcoming": return "bg-gradient-to-r from-blue-500 to-blue-600 shadow-soft";
        case "Completed": return "bg-gradient-to-r from-green-500 to-green-600 shadow-soft";
        case "Cancelled": return "bg-gradient-to-r from-red-500 to-red-600 shadow-soft";
        default: return "bg-gradient-to-r from-gray-400 to-gray-500 shadow-soft";
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
    const [isCreateEventOpen, setIsCreateEventOpen] = useState(false);
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        start: new Date(),
        end: new Date(Date.now() + 60 * 60 * 1000),
        serviceName: ''
    });

    useEffect(() => {
        if (!user || !getDb()) {
            setLoading(false);
            return;
        }

        const bookingsRef = collection(getDb(), "bookings");
        const q = query(bookingsRef,
            or(where("clientId", "==", user.uid), where("providerId", "==", user.uid))
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const bookingEvents = snapshot.docs.map(doc => {
                const data = doc.data();
                return {
                    id: doc.id,
                    title: data.serviceName,
                    start: (data.date as Timestamp).toDate(),
                    end: new Date((data.date as Timestamp).toDate().getTime() + 60 * 60 * 1000),
                    status: data.status,
                    providerName: data.providerName,
                    clientName: data.clientName,
                    serviceName: data.serviceName,
                };
            }).filter(event => event.status !== 'Pending' && event.status !== 'Cancelled');
            setEvents(bookingEvents as BookingEvent[]);
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, userRole]);

    const calendarGrid = useMemo(() => {
        const firstDayOfMonth = startOfMonth(currentDate);
        const lastDayOfMonth = endOfMonth(currentDate);
        const calendarStart = startOfWeek(firstDayOfMonth);
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
        } else {
            // Create new event on empty day
            setFormData({
                title: '',
                description: '',
                start: day,
                end: new Date(day.getTime() + 60 * 60 * 1000), // 1 hour later
                serviceName: ''
            });
            setIsCreateEventOpen(true);
        }
    }

    const getEventsForDay = (day: Date) => {
        return events.filter(event => isSameDay(event.start, day));
    }

    const handleCreateEvent = () => {
        setFormData({
            title: '',
            description: '',
            start: new Date(),
            end: new Date(Date.now() + 60 * 60 * 1000),
            serviceName: ''
        });
        setIsCreateEventOpen(true);
    }

    const handleSaveEvent = async (eventData: {
        title: string;
        description: string;
        start: Date;
        end: Date;
        serviceName: string;
    }) => {
        try {
            if (!user || !getDb()) return;

            const eventToSave = {
                title: eventData.title,
                serviceName: eventData.serviceName,
                description: eventData.description,
                date: Timestamp.fromDate(eventData.start),
                endDate: Timestamp.fromDate(eventData.end),
                status: 'Upcoming',
                clientId: userRole === 'client' ? user.uid : '',
                providerId: userRole === 'provider' ? user.uid : '',
                clientName: userRole === 'client' ? user.displayName || 'You' : '',
                providerName: userRole === 'provider' ? user.displayName || 'You' : '',
                createdAt: Timestamp.now(),
                updatedAt: Timestamp.now()
            };

            await addDoc(collection(getDb(), "bookings"), eventToSave);
            setIsCreateEventOpen(false);
        } catch (error) {
            console.error('Error creating event:', error);
        }
    }

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-4xl mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardContent className="p-6">
                            <Skeleton className="h-[60vh] w-full" />
                        </CardContent>
                    </Card>
                </div>
            </div>
        )
    }

    return (
        <div className="container space-y-8">
            {/* <div className="max-w-6xl mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('calendarTitle')}</h1>
                <p className="text-muted-foreground">
                    {t('calendarDescription')}
                </p>
                <Button onClick={handleCreateEvent}>
                    <Plus className="h-4 w-4 mr-2" />
                    {t('newEvent')}
                </Button>
            </div> */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('title')}</h1>
                    <p className="text-muted-foreground">
                        {t('subtitle')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Advanced Management
                    </Badge>
                    
                    <Dialog open={isCreateEventOpen} onOpenChange={setIsCreateEventOpen}>
                        <DialogTrigger asChild>
                            <Button className="shadow-soft hover:shadow-glow/20 transition-all duration-300">
                                <Plus className="mr-2 h-4 w-4" />
                                {t('newEvent')}
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md max-w-2xl">
                            <DialogHeader>
                                <DialogTitle>{t('newEvent')}</DialogTitle>
                            </DialogHeader>
                            <CreateEventForm
                                onSave={handleSaveEvent}
                                onClose={() => setIsCreateEventOpen(false)}
                                initialData={formData}
                            />
                        </DialogContent>
                    </Dialog>
                </div>
            </div>
            {/* Simple Calendar */}
            <div className="max-w-6xl mx-auto">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardHeader className="flex flex-row items-center justify-between border-b border-border/50">
                        <CardTitle className="text-2xl font-bold">
                            {format(currentDate, 'MMMM yyyy')}
                        </CardTitle>
                        <div className="flex gap-2">
                            <Button variant="outline" size="icon" onClick={prevMonth}>
                                <ChevronLeft className="h-4 w-4" />
                            </Button>
                            <Button variant="outline" onClick={() => setCurrentDate(new Date())}>
                                Today
                            </Button>
                            <Button variant="outline" size="icon" onClick={nextMonth}>
                                <ChevronRight className="h-4 w-4" />
                            </Button>
                        </div>
                    </CardHeader>
                    <CardContent className="p-6">
                        <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground mb-4">
                            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                                <div key={day} className="py-2 text-sm font-medium">{day}</div>
                            ))}
                        </div>
                        <div className="grid grid-cols-7 gap-1">
                            {calendarGrid.map((day, index) => {
                                const dayEvents = getEventsForDay(day);
                                return (
                                    <div
                                        key={index}
                                        className={cn("relative p-2 h-24 flex flex-col group rounded-lg transition-all duration-200",
                                            !isSameMonth(day, currentDate) && "bg-muted/20 text-muted-foreground",
                                            isSameMonth(day, currentDate) && "hover:bg-primary/5 cursor-pointer",
                                            dayEvents.length > 0 && "hover:bg-primary/10 hover:shadow-soft"
                                        )}
                                        onClick={() => handleDayClick(day)}
                                    >
                                        <span className={cn("font-medium text-sm mb-1",
                                            isToday(day) && "bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-full h-6 w-6 flex items-center justify-center text-xs font-bold"
                                        )}>
                                            {format(day, 'd')}
                                        </span>
                                        <div className="flex-1 space-y-0.5 overflow-hidden">
                                            {dayEvents.slice(0, 2).map((event, eventIndex) => (
                                                <div key={eventIndex} className={cn("text-xs text-white rounded px-1 py-0.5 truncate shadow-sm", getStatusClass(event.status))}>
                                                    {event.title}
                                                </div>
                                            ))}
                                            {dayEvents.length > 2 && (
                                                <div className="text-xs text-muted-foreground font-medium">
                                                    +{dayEvents.length - 2} more
                                                </div>
                                            )}
                                            {dayEvents.length === 0 && isSameMonth(day, currentDate) && (
                                                <div className="text-xs text-muted-foreground/50 group-hover:text-muted-foreground transition-colors">
                                                    Click to add event
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Day Events Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle>
                            {selectedDayEvents.length > 0 ? format(selectedDayEvents[0].start, 'PPP') : ''}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3">
                        {selectedDayEvents.map((event, index) => (
                            <div key={index} className="p-4 border border-border/50 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 shadow-soft">
                                <p className="font-bold text-lg">{event.title}</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {userRole === 'client' ? event.providerName : event.clientName}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {format(event.start, 'p')}
                                </p>
                                <Badge className={cn("mt-3 text-white shadow-soft", getStatusClass(event.status))}>
                                    {event.status}
                                </Badge>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>

        </div>
    );
}

// Create Event Form Component
function CreateEventForm({
    onSave,
    onClose,
    initialData
}: {
    onSave: (eventData: {
        title: string;
        description: string;
        start: Date;
        end: Date;
        serviceName: string;
    }) => void,
    onClose: () => void,
    initialData: {
        title: string;
        description: string;
        start: Date;
        end: Date;
        serviceName: string;
    }
}) {
    const [formData, setFormData] = useState(initialData);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (formData.title.trim() && formData.serviceName.trim()) {
            onSave(formData);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
                <div>
                    <Label htmlFor="title">Event Title *</Label>
                    <Input
                        id="title"
                        value={formData.title}
                        onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                        placeholder="Enter event title"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="service">Service Name *</Label>
                    <Input
                        id="service"
                        value={formData.serviceName}
                        onChange={(e) => setFormData(prev => ({ ...prev, serviceName: e.target.value }))}
                        placeholder="Enter service name"
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="start">Start Date & Time *</Label>
                    <Input
                        id="start"
                        type="datetime-local"
                        value={format(formData.start, "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setFormData(prev => ({ ...prev, start: new Date(e.target.value) }))}
                        required
                    />
                </div>
                <div>
                    <Label htmlFor="end">End Date & Time *</Label>
                    <Input
                        id="end"
                        type="datetime-local"
                        value={format(formData.end, "yyyy-MM-dd'T'HH:mm")}
                        onChange={(e) => setFormData(prev => ({ ...prev, end: new Date(e.target.value) }))}
                        required
                    />
                </div>
            </div>

            <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                    placeholder="Enter event description (optional)"
                    rows={3}
                />
            </div>

            <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={onClose}>
                    Cancel
                </Button>
                <Button type="submit">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Create Event
                </Button>
            </div>
        </form>
    );
}