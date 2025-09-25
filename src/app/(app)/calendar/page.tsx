
"use client";

import React from "react";

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
import { ChevronLeft, ChevronRight, MessageSquare, TrendingUp, TrendingDown, BarChart3, RefreshCw, Download, Settings, Plus, Target, Award, Zap, Activity, DollarSign, Users, Star, MapPin, Phone, Trash2, Grid3X3, List, CheckCircle, XCircle, AlertTriangle, Info, Bell, Bookmark, Share2, Archive, Edit, Copy, ExternalLink, Calendar as CalendarIcon, Clock, Filter, Search, Eye, MoreHorizontal, User, Briefcase, Timer, Wallet, CheckCircle2, AlertCircle, Ban, CreditCard, FileCheck } from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { EmptyState } from '@/components/app/empty-state';
import { designTokens } from '@/lib/design-tokens';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';

type BookingEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    status: "Upcoming" | "Completed" | "Cancelled" | "Pending" | "In Progress" | "Pending Payment" | "Pending Verification" | "Payment Rejected";
    providerName: string;
    clientName: string;
    providerId: string;
    clientId: string;
    price?: number;
    location?: string;
    notes?: string;
    priority?: 'low' | 'medium' | 'high';
    category?: string;
    tags?: string[];
    duration?: number; // in hours
    estimatedCompletion?: Date;
    actualCompletion?: Date;
    rating?: number;
    feedback?: string;
};

const getStatusClass = (status: BookingEvent['status']) => {
    switch (status) {
        case "Upcoming": return "bg-gradient-to-r from-blue-500 to-blue-600 shadow-soft";
        case "Completed": return "bg-gradient-to-r from-green-500 to-green-600 shadow-soft";
        case "Cancelled": return "bg-gradient-to-r from-red-500 to-red-600 shadow-soft";
        case "In Progress": return "bg-gradient-to-r from-orange-500 to-amber-500 shadow-soft";
        case "Pending Payment": return "bg-gradient-to-r from-yellow-500 to-orange-500 shadow-soft";
        case "Pending Verification": return "bg-gradient-to-r from-purple-500 to-violet-500 shadow-soft";
        case "Payment Rejected": return "bg-gradient-to-r from-red-500 to-pink-500 shadow-soft";
        default: return "bg-gradient-to-r from-gray-400 to-gray-500 shadow-soft";
    }
};

const getStatusIcon = (status: BookingEvent['status']) => {
    switch (status) {
        case "Completed": return <CheckCircle2 className="h-3 w-3" />;
        case "Upcoming": return <CalendarIcon className="h-3 w-3" />;
        case "In Progress": return <Timer className="h-3 w-3" />;
        case "Cancelled": return <Ban className="h-3 w-3" />;
        case "Pending Payment": return <CreditCard className="h-3 w-3" />;
        case "Pending Verification": return <FileCheck className="h-3 w-3" />;
        case "Payment Rejected": return <AlertCircle className="h-3 w-3" />;
        default: return <Briefcase className="h-3 w-3" />;
    }
};

export default function CalendarPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Calendar');
    const [events, setEvents] = useState<BookingEvent[]>([]);
    const [loading, setLoading] = useState(true);
    const [currentDate, setCurrentDate] = useState(new Date());
    const [selectedDayEvents, setSelectedDayEvents] = useState<BookingEvent[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [viewMode, setViewMode] = useState<'calendar' | 'agenda' | 'timeline'>('calendar');
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState("");
    const [refreshing, setRefreshing] = useState(false);
    const [selectedEvents, setSelectedEvents] = useState<string[]>([]);
    const [priorityFilter, setPriorityFilter] = useState<string>("all");

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
                    id: doc.id,
                    title: data.serviceName,
                    start: (data.date as Timestamp).toDate(),
                    end: new Date((data.date as Timestamp).toDate().getTime() + (data.duration || 1) * 60 * 60 * 1000),
                    status: data.status,
                    providerName: data.providerName,
                    clientName: data.clientName,
                    providerId: data.providerId,
                    clientId: data.clientId,
                    price: data.price,
                    location: data.location,
                    notes: data.notes,
                    priority: data.priority || 'medium',
                    category: data.category,
                    tags: data.tags || [],
                    duration: data.duration || 1,
                    estimatedCompletion: data.estimatedCompletion ? (data.estimatedCompletion as Timestamp).toDate() : undefined,
                    actualCompletion: data.actualCompletion ? (data.actualCompletion as Timestamp).toDate() : undefined,
                    rating: data.rating,
                    feedback: data.feedback,
                };
            });
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
        const dayEvents = filteredEvents.filter(event => isSameDay(event.start, day));
        if (dayEvents.length > 0) {
            setSelectedDayEvents(dayEvents);
            setIsDialogOpen(true);
        }
    }
    
    const getEventsForDay = (day: Date) => {
        return filteredEvents.filter(event => isSameDay(event.start, day));
    }

    // Filter events based on search and filters
    const filteredEvents = events.filter(event => {
        const matchesSearch = searchTerm === "" || 
            event.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.providerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            event.location?.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || event.status === statusFilter;
        const matchesPriority = priorityFilter === "all" || event.priority === priorityFilter;
        
        return matchesSearch && matchesStatus && matchesPriority;
    });

    // Calculate statistics
    const stats = {
        total: events.length,
        thisMonth: events.filter(event => {
            const eventDate = event.start;
            return eventDate.getMonth() === currentDate.getMonth() && 
                   eventDate.getFullYear() === currentDate.getFullYear();
        }).length,
        thisWeek: events.filter(event => {
            const eventDate = event.start;
            const now = new Date();
            const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            return eventDate >= weekAgo;
        }).length,
        upcoming: events.filter(event => event.status === 'Upcoming').length,
        inProgress: events.filter(event => event.status === 'In Progress').length,
        completed: events.filter(event => event.status === 'Completed').length,
        totalRevenue: events.reduce((sum, event) => sum + (event.price || 0), 0),
        avgRating: events.filter(event => event.rating).length > 0 ? 
            (events.filter(event => event.rating).reduce((sum, event) => sum + (event.rating || 0), 0) / 
             events.filter(event => event.rating).length).toFixed(1) : "0.0"
    };

    const handleRefresh = async () => {
        setRefreshing(true);
        await new Promise(resolve => setTimeout(resolve, 1000));
        setRefreshing(false);
        toast({
            title: "Calendar Refreshed",
            description: "All calendar data has been updated successfully.",
        });
    };

    const toggleEventSelection = (eventId: string) => {
        setSelectedEvents(prev => 
            prev.includes(eventId) 
                ? prev.filter(id => id !== eventId)
                : [...prev, eventId]
        );
    };

    const selectAllEvents = () => {
        setSelectedEvents(filteredEvents.map(event => event.id));
    };

    const clearSelection = () => {
        setSelectedEvents([]);
    };

    const handleBulkAction = async (action: string) => {
        if (selectedEvents.length === 0) {
            toast({
                variant: "destructive",
                title: "No Events Selected",
                description: "Please select events to perform bulk actions.",
            });
            return;
        }

        try {
            toast({
                title: "Bulk Action Completed",
                description: `${action} applied to ${selectedEvents.length} events.`,
            });
            setSelectedEvents([]);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to perform bulk action.",
            });
        }
    };


    // Statistics Dashboard Component
    const StatsCard = ({ title, value, icon: Icon, variant = "default", change, trend }: {
        title: string;
        value: string | number;
        icon: React.ElementType;
        variant?: 'default' | 'success' | 'warning' | 'info';
        change?: string;
        trend?: 'up' | 'down' | 'neutral';
    }) => {
        const getVariantStyles = () => {
            switch (variant) {
                case 'success':
                    return 'border-l-4 border-l-green-500 bg-green-50/50 dark:bg-green-950/20';
                case 'warning':
                    return 'border-l-4 border-l-yellow-500 bg-yellow-50/50 dark:bg-yellow-950/20';
                case 'info':
                    return 'border-l-4 border-l-blue-500 bg-blue-50/50 dark:bg-blue-950/20';
                default:
                    return '';
            }
        };

        return (
            <StandardCard 
                title={title} 
                variant="elevated"
                className={`group hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 ${getVariantStyles()}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex-1">
                        <div className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-1">
                            {value}
                        </div>
                        {change && (
                            <div className="flex items-center gap-1 text-xs text-muted-foreground">
                                {trend === 'up' && <TrendingUp className="h-3 w-3 text-green-500" />}
                                {trend === 'down' && <TrendingUp className="h-3 w-3 text-red-500 rotate-180" />}
                                <span>{change}</span>
                            </div>
                        )}
                    </div>
                    <div className={`p-2 rounded-lg ${
                        variant === 'success' ? 'bg-green-100 dark:bg-green-900/30' :
                        variant === 'warning' ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                        variant === 'info' ? 'bg-blue-100 dark:bg-blue-900/30' :
                        'bg-primary/10'
                    }`}>
                        <Icon className={`h-5 w-5 transition-colors ${
                            variant === 'success' ? 'text-green-600' :
                            variant === 'warning' ? 'text-yellow-600' :
                            variant === 'info' ? 'text-blue-600' :
                            'text-muted-foreground group-hover:text-primary'
                        }`} />
                    </div>
                </div>
            </StandardCard>
        );
    };

    if (loading) {
        return <LoadingState 
            title={t('title')} 
            description={t('subtitle')} 
        />;
    }

    return (
        <PageLayout 
            title={format(currentDate, 'MMMM yyyy')} 
            description={t('subtitle')}
            action={
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={handleRefresh}
                        disabled={refreshing}
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Refresh
                    </Button>
                    <Button
                        variant="outline"
                        size="sm"
                        className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                        asChild
                    >
                        <Link href="/dashboard">
                            <Plus className="h-4 w-4 mr-2" />
                            New Booking
                        </Link>
                    </Button>
                </div>
            }
        >
            {/* Statistics Dashboard */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard 
                    title="Total Events" 
                    value={stats.total} 
                    icon={CalendarIcon} 
                    variant="default"
                    change={`${stats.thisWeek} this week`}
                />
                <StatsCard 
                    title="This Month" 
                    value={stats.thisMonth} 
                    icon={BarChart3} 
                    variant="info"
                    change={`${stats.upcoming} upcoming`}
                />
                <StatsCard 
                    title="In Progress" 
                    value={stats.inProgress} 
                    icon={Timer} 
                    variant="warning"
                    change={`${stats.completed} completed`}
                />
                <StatsCard 
                    title="Total Revenue" 
                    value={`₱${stats.totalRevenue.toFixed(2)}`} 
                    icon={DollarSign} 
                    variant="success"
                    change={`${stats.avgRating} avg rating`}
                />
            </div>

            {/* Advanced Filters and Controls */}
            <StandardCard 
                title="Calendar Management" 
                description="Filter, search, and manage your calendar events"
                variant="elevated"
            >
                <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row gap-4">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search events by title, provider, client, notes, or location..." 
                                className="pl-10 shadow-soft" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="Upcoming">Upcoming</SelectItem>
                                <SelectItem value="In Progress">In Progress</SelectItem>
                                <SelectItem value="Completed">Completed</SelectItem>
                                <SelectItem value="Pending Payment">Pending Payment</SelectItem>
                                <SelectItem value="Pending Verification">Pending Verification</SelectItem>
                                <SelectItem value="Cancelled">Cancelled</SelectItem>
                                <SelectItem value="Payment Rejected">Payment Rejected</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger className="w-full sm:w-48 shadow-soft">
                                <SelectValue placeholder="Filter by priority" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Priority</SelectItem>
                                <SelectItem value="high">High Priority</SelectItem>
                                <SelectItem value="medium">Medium Priority</SelectItem>
                                <SelectItem value="low">Low Priority</SelectItem>
                            </SelectContent>
                        </Select>
                        <div className="flex items-center gap-1 border-2 p-1 rounded-lg bg-background/50 backdrop-blur-sm">
                            <Button 
                                size="icon" 
                                variant={viewMode === 'calendar' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('calendar')} 
                                className="h-8 w-8"
                            >
                                <CalendarIcon className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'agenda' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('agenda')} 
                                className="h-8 w-8"
                            >
                                <List className="h-4 w-4" />
                            </Button>
                            <Button 
                                size="icon" 
                                variant={viewMode === 'timeline' ? 'secondary' : 'ghost'} 
                                onClick={() => setViewMode('timeline')} 
                                className="h-8 w-8"
                            >
                                <BarChart3 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Bulk Actions */}
                    {selectedEvents.length > 0 && (
                        <div className="flex items-center gap-2 p-3 bg-primary/10 rounded-lg border border-primary/20">
                            <span className="text-sm font-medium">
                                {selectedEvents.length} event{selectedEvents.length > 1 ? 's' : ''} selected
                            </span>
                            <div className="flex items-center gap-2 ml-auto">
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Export')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Download className="h-3 w-3 mr-1" />
                                    Export
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={() => handleBulkAction('Archive')}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    <Archive className="h-3 w-3 mr-1" />
                                    Archive
                                </Button>
                                <Button 
                                    size="sm" 
                                    variant="outline" 
                                    onClick={clearSelection}
                                    className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                                >
                                    Clear Selection
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </StandardCard>

            {/* Calendar Display */}
            <StandardCard 
                title="Calendar View" 
                description={`${filteredEvents.length} events in ${format(currentDate, 'MMMM yyyy')}`}
                variant="elevated"
            >
                {viewMode === 'calendar' ? (
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="flex flex-row items-center justify-between border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="text-2xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                                {format(currentDate, 'MMMM yyyy')}
                            </CardTitle>
                            <div className="flex gap-2">
                                <Button variant="outline" size="icon" onClick={prevMonth} className="hover:bg-primary/10 transition-colors">
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button variant="outline" onClick={() => setCurrentDate(new Date())} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                    {t('today')}
                                </Button>
                                <Button variant="outline" size="icon" onClick={nextMonth} className="hover:bg-primary/10 transition-colors">
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </CardHeader>
                        <CardContent className="p-6">
                            <div className="grid grid-cols-7 text-center font-semibold text-muted-foreground mb-4">
                                {[t('sun'), t('mon'), t('tue'), t('wed'), t('thu'), t('fri'), t('sat')].map(day => (
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
                                                isSameMonth(day, currentDate) && "hover:bg-primary/5",
                                                dayEvents.length > 0 && "cursor-pointer hover:bg-primary/10 hover:shadow-soft"
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
                                                    <div key={eventIndex} className={cn("text-xs text-white rounded px-1 py-0.5 truncate shadow-sm flex items-center gap-1", getStatusClass(event.status))}>
                                                        {getStatusIcon(event.status)}
                                                        {event.title}
                                                    </div>
                                                ))}
                                                {dayEvents.length > 2 && (
                                                    <div className="text-xs text-muted-foreground font-medium">
                                                        +{dayEvents.length - 2} more
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                     )
                                })}
                            </div>
                        </CardContent>
                    </Card>
                ) : viewMode === 'agenda' ? (
                    // Agenda View
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <Checkbox 
                                    checked={selectedEvents.length === filteredEvents.length && filteredEvents.length > 0}
                                    onCheckedChange={(checked) => checked ? selectAllEvents() : clearSelection()}
                                />
                                <span className="text-sm text-muted-foreground">
                                    Select all ({filteredEvents.length})
                                </span>
                            </div>
                        </div>
                        
                        <div className="space-y-3">
                            {filteredEvents.length > 0 ? filteredEvents.map((event) => (
                                <div key={event.id} className="flex items-center gap-4 p-4 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors border border-border/50">
                                    <Checkbox 
                                        checked={selectedEvents.includes(event.id)}
                                        onCheckedChange={() => toggleEventSelection(event.id)}
                                    />
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2">
                                            <h3 className="font-semibold">{event.title}</h3>
                                            <Badge 
                                                className={`${getStatusClass(event.status)} flex items-center gap-1 text-xs px-2 py-1`}
                                            >
                                                {getStatusIcon(event.status)}
                                                {event.status}
                                            </Badge>
                                            {event.priority && (
                                                <Badge variant="outline" className="text-xs">{event.priority}</Badge>
                                            )}
                                        </div>
                                        <div className="flex items-center gap-4 text-sm text-muted-foreground mt-1">
                                            <span className="flex items-center gap-1">
                                                <User className="h-3 w-3" />
                                                {userRole === 'client' ? event.providerName : event.clientName}
                                            </span>
                                            <span className="flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {format(event.start, 'MMM dd, yyyy p')}
                                            </span>
                                            {event.price && (
                                                <span className="flex items-center gap-1 font-semibold">
                                                    <Wallet className="h-3 w-3" />
                                                    ₱{event.price.toFixed(2)}
                                                </span>
                                            )}
                                        </div>
                                        {event.location && (
                                            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
                                                <MapPin className="h-3 w-3" />
                                                <span>{event.location}</span>
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/bookings/${event.id}`}>
                                                <Eye className="mr-2 h-4 w-4" /> View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="mr-2 h-4 w-4" /> Message
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Share2 className="mr-2 h-4 w-4" /> Share
                                        </Button>
                                    </div>
                                </div>
                            )) : (
                                <div className="text-center py-12">
                                    <CalendarIcon className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                                    <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                        {searchTerm || statusFilter !== "all" ? "No Events Found" : "No Events Yet"}
                                    </h3>
                                    <p className="text-muted-foreground">
                                        {searchTerm || statusFilter !== "all" ? "Try adjusting your filters" : "You don't have any events yet."}
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>
                ) : (
                    // Timeline View
                    <div className="space-y-4">
                        <div className="text-center py-8">
                            <BarChart3 className="h-16 w-16 mx-auto text-primary opacity-60 mb-4" />
                            <h3 className="text-lg font-semibold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent mb-2">
                                Timeline View
                            </h3>
                            <p className="text-muted-foreground">
                                Timeline view coming soon! This will show your events in a chronological timeline format.
                            </p>
                        </div>
                    </div>
                )}
            </StandardCard>

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md max-w-2xl">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {t('bookingsFor', { date: selectedDayEvents.length > 0 ? format(selectedDayEvents[0].start, 'PPP') : '' })}
                        </DialogTitle>
                        <DialogDescription>
                            {selectedDayEvents.length} event{selectedDayEvents.length > 1 ? 's' : ''} scheduled for this day
                        </DialogDescription>
                    </DialogHeader>
                     <div className="space-y-3 max-h-96 overflow-y-auto">
                        {selectedDayEvents.map((event, index) => (
                            <div key={index} className="p-4 border border-border/50 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 shadow-soft">
                                <div className="flex items-start justify-between">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-2">
                                            <p className="font-bold text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{event.title}</p>
                                            <Badge className={cn("text-white shadow-soft flex items-center gap-1", getStatusClass(event.status))}>
                                                {getStatusIcon(event.status)}
                                                {event.status}
                                            </Badge>
                                            {event.priority && (
                                                <Badge variant="outline" className="text-xs">{event.priority}</Badge>
                                            )}
                                        </div>
                                        <div className="space-y-1 text-sm text-muted-foreground">
                                            <p className="flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                {t('with', { name: userRole === 'client' ? event.providerName : event.clientName })}
                                            </p>
                                            <p className="flex items-center gap-2">
                                                <Clock className="h-4 w-4" />
                                                {format(event.start, 'p')} - {format(event.end, 'p')}
                                            </p>
                                            {event.price && (
                                                <p className="flex items-center gap-2">
                                                    <Wallet className="h-4 w-4" />
                                                    ₱{event.price.toFixed(2)}
                                                </p>
                                            )}
                                            {event.location && (
                                                <p className="flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    {event.location}
                                                </p>
                                            )}
                                            {event.notes && (
                                                <p className="flex items-center gap-2">
                                                    <MessageSquare className="h-4 w-4" />
                                                    {event.notes}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 ml-4">
                                        <Button variant="outline" size="sm" asChild>
                                            <Link href={`/bookings/${event.id}`}>
                                                <Eye className="h-4 w-4 mr-2" />
                                                View
                                            </Link>
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <MessageSquare className="h-4 w-4 mr-2" />
                                            Message
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </PageLayout>
    );
}
