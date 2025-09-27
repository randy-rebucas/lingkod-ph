
"use client";

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, or, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  ChevronLeft, 
  ChevronRight, 
  MessageSquare,
  TrendingUp,
  TrendingDown,
  BarChart3,
  PieChart,
  Download,
  Filter,
  Calendar as CalendarIcon,
  Target,
  AlertTriangle,
  Users,
  Clock,
  Award,
  Zap,
  Eye,
  Settings,
  RefreshCw,
  Share2,
  Activity,
  MapPin,
  ArrowUpRight,
  ArrowDownRight,
  Minus,
  Calculator,
  Receipt,
  CreditCard,
  Banknote,
  PiggyBank,
  TrendingUp as Growth,
  Percent,
  FileText,
  PieChart as ChartPie,
  Search,
  Mail,
  UserCheck,
  UserX,
  CheckCircle,
  XCircle,
  DollarSign,
  BookCheck,
  Wallet,
  WalletCards,
  CheckCircle2,
  Hourglass,
  User,
  Shield,
  Crown,
  Building,
  Globe,
  Phone,
  MapPin as Location,
  Calendar as CalendarIcon2,
  Edit,
  Copy,
  Send,
  Archive,
  Flag,
  Info,
  HelpCircle,
  ExternalLink,
  ChevronDown,
  ChevronUp,
  Plus,
  Minus as MinusIcon,
  Volume2,
  VolumeX,
  Volume1,
  BellRing,
  BellOff,
  AlertCircle,
  Info as InfoIcon,
  CheckCircle as CheckCircleIcon,
  XCircle as XCircleIcon,
  AlertTriangle as AlertTriangleIcon,
  Lightbulb,
  Megaphone,
  Radio,
  Tv,
  Smartphone,
  Monitor,
  Laptop,
  Tablet,
  Headphones,
  Speaker,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Camera,
  CameraOff,
  Image,
  File,
  Folder,
  FolderOpen,
  Database,
  Server,
  Cloud,
  Wifi,
  WifiOff,
  Signal,
  SignalHigh,
  SignalMedium,
  SignalLow,
  Battery,
  BatteryLow,
  BatteryMedium,
  BatteryFull,
  Power,
  PowerOff,
  Plug,
  Unplug,
  Zap as ZapIcon,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  CloudRain,
  CloudSnow,
  CloudLightning,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Snowflake,
  Tornado,
  Flame,
  Sparkles,
  Star as StarIcon,
  Heart,
  Smile,
  Frown,
  Meh,
  Angry,
  Laugh,
  Ghost,
  Skull,
  Cat,
  Dog,
  Bird,
  Fish,
  Bug,
  Flower,
  Leaf,
  Mountain,
  Building2,
  Home,
  Car,
  Bus,
  Train,
  Plane,
  Ship,
  Rocket,
  Bike,
  Tent,
  Compass,
  Map,
  Navigation,
  Route,
  Flag as FlagIcon,
  Trophy,
  Medal,
  Ribbon,
  Gift,
  Cake,
  Cookie,
  Pizza,
  Sandwich,
  Salad,
  Soup,
  Coffee,
  Beer,
  Wine,
  Milk,
  Egg,
  Apple,
  Banana,
  Grape,
  Cherry,
  IceCream,
  Lollipop,
  Popcorn,
  Candy,
  Donut,
  Croissant,
  Mouse,
  Rat,
  Rabbit
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, getDay, isSameMonth, isToday, isSameDay, startOfWeek, endOfWeek } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";

type BookingEvent = {
    id: string;
    title: string;
    start: Date;
    end: Date;
    allDay?: boolean;
    resource?: any;
    status: "Upcoming" | "Completed" | "Cancelled" | "Pending";
    providerName: string;
    clientName: string;
    serviceName: string;
    location?: string;
    description?: string;
    price?: number;
    duration?: number;
    category?: string;
    priority?: 'low' | 'medium' | 'high' | 'urgent';
    recurring?: boolean;
    recurringPattern?: 'daily' | 'weekly' | 'monthly' | 'yearly';
    tags?: string[];
    attendees?: string[];
    notes?: string;
    reminder?: boolean;
    reminderTime?: number; // minutes before
    color?: string;
    metadata?: {
        bookingId?: string;
        clientId?: string;
        providerId?: string;
        serviceId?: string;
        [key: string]: any;
    };
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
    const [viewMode, setViewMode] = useState<'month' | 'week' | 'day'>('month');
    const [filterStatus, setFilterStatus] = useState<string>('all');
    const [filterCategory, setFilterCategory] = useState<string>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [showCompleted, setShowCompleted] = useState(true);

    useEffect(() => {
        if (!user || !db) {
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

    // Calculate analytics data
    const analyticsData = useMemo(() => {
        const totalEvents = events.length;
        const upcomingEvents = events.filter(e => e.status === 'Upcoming').length;
        const completedEvents = events.filter(e => e.status === 'Completed').length;
        const cancelledEvents = events.filter(e => e.status === 'Cancelled').length;
        const pendingEvents = events.filter(e => e.status === 'Pending').length;
        
        const todayEvents = events.filter(e => isSameDay(e.start, new Date())).length;
        const thisWeekEvents = events.filter(e => {
            const weekStart = startOfWeek(new Date());
            const weekEnd = endOfWeek(new Date());
            return e.start >= weekStart && e.start <= weekEnd;
        }).length;
        
        const categoryBreakdown = events.reduce((acc, event) => {
            const category = event.category || 'Other';
            acc[category] = (acc[category] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const statusBreakdown = events.reduce((acc, event) => {
            acc[event.status] = (acc[event.status] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const monthlyGrowth = events.filter(e => {
            const thisMonth = new Date();
            const eventMonth = e.start;
            return eventMonth.getMonth() === thisMonth.getMonth() && 
                   eventMonth.getFullYear() === thisMonth.getFullYear();
        }).length;

        const lastMonth = new Date();
        lastMonth.setMonth(lastMonth.getMonth() - 1);
        const lastMonthEvents = events.filter(e => {
            return e.start.getMonth() === lastMonth.getMonth() && 
                   e.start.getFullYear() === lastMonth.getFullYear();
        }).length;

        const growthRate = lastMonthEvents > 0 ? ((monthlyGrowth - lastMonthEvents) / lastMonthEvents) * 100 : 0;

        return {
            totalEvents,
            upcomingEvents,
            completedEvents,
            cancelledEvents,
            pendingEvents,
            todayEvents,
            thisWeekEvents,
            categoryBreakdown,
            statusBreakdown,
            monthlyGrowth,
            lastMonthEvents,
            growthRate
        };
    }, [events]);

    // Advanced filtering logic
    const filteredEvents = useMemo(() => {
        let filtered = events;

        // Apply status filter
        if (filterStatus !== 'all') {
            filtered = filtered.filter(e => e.status === filterStatus);
        }

        // Apply category filter
        if (filterCategory !== 'all') {
            filtered = filtered.filter(e => (e.category || 'Other') === filterCategory);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(e => 
                e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.serviceName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.providerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                e.clientName.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply completed filter
        if (!showCompleted) {
            filtered = filtered.filter(e => e.status !== 'Completed');
        }

        return filtered;
    }, [events, filterStatus, filterCategory, searchQuery, showCompleted]);


    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent className="p-6">
                        <Skeleton className="h-[75vh] w-full" />
                    </CardContent>
                </Card>
            </div>
        )
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
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
                                            <div key={eventIndex} className={cn("text-xs text-white rounded px-1 py-0.5 truncate shadow-sm", getStatusClass(event.status))}>
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

             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent className="shadow-glow border-0 bg-background/95 backdrop-blur-md">
                    <DialogHeader>
                        <DialogTitle className="font-headline text-xl bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            {t('bookingsFor', { date: selectedDayEvents.length > 0 ? format(selectedDayEvents[0].start, 'PPP') : '' })}
                        </DialogTitle>
                    </DialogHeader>
                     <div className="space-y-3">
                        {selectedDayEvents.map((event, index) => (
                            <div key={index} className="p-4 border border-border/50 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 shadow-soft">
                                <p className="font-bold text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{event.title}</p>
                                 <p className="text-sm text-muted-foreground mt-1">
                                    {t('with', { name: userRole === 'client' ? event.providerName : event.clientName })}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                    {t('time', { time: format(event.start, 'p') })}
                                </p>
                                 <Badge className={cn("mt-3 text-white shadow-soft", getStatusClass(event.status))}>{t(event.status.toLowerCase())}</Badge>
                            </div>
                        ))}
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}

// Calendar Tab Component
function CalendarTab({ 
    currentDate, 
    setCurrentDate, 
    events, 
    onDayClick, 
    getEventsForDay, 
    viewMode 
}: { 
    currentDate: Date, 
    setCurrentDate: (date: Date) => void, 
    events: BookingEvent[], 
    onDayClick: (day: Date) => void, 
    getEventsForDay: (day: Date) => BookingEvent[],
    viewMode: 'month' | 'week' | 'day'
}) {
    const nextMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() + 1)));
    const prevMonth = () => setCurrentDate(new Date(currentDate.setMonth(currentDate.getMonth() - 1)));

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

    return (
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
                        Today
                    </Button>
                    <Button variant="outline" size="icon" onClick={nextMonth} className="hover:bg-primary/10 transition-colors">
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
                                    isSameMonth(day, currentDate) && "hover:bg-primary/5",
                                    dayEvents.length > 0 && "cursor-pointer hover:bg-primary/10 hover:shadow-soft"
                                )}
                                onClick={() => onDayClick(day)}
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
                                </div>
                            </div>
                         )
                    })}
                </div>
            </CardContent>
        </Card>
    );
}

// Analytics Tab Component
function AnalyticsTab({ events, analyticsData }: { events: BookingEvent[], analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Event Categories</CardTitle>
                        <CardDescription>Breakdown of events by category</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(analyticsData.categoryBreakdown).map(([category, count]) => (
                                <div key={category} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-500 text-white">
                                            <Activity className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{category}</p>
                                            <p className="text-sm text-muted-foreground">{count as number} events</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{count as number}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Status Distribution</CardTitle>
                        <CardDescription>Event status breakdown</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {Object.entries(analyticsData.statusBreakdown).map(([status, count]) => (
                                <div key={status} className="flex items-center justify-between p-3 rounded-lg border">
                                    <div className="flex items-center gap-3">
                                        <div className={cn(
                                            "flex items-center justify-center w-8 h-8 rounded-full text-white",
                                            getStatusClass(status as BookingEvent['status'])
                                        )}>
                                            <CheckCircle className="h-4 w-4" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{status}</p>
                                            <p className="text-sm text-muted-foreground">{count as number} events</p>
                                        </div>
                                    </div>
                                    <Badge variant="outline">{count as number}</Badge>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}

// Events Tab Component
function EventsTab({ events }: { events: BookingEvent[] }) {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>All Events</CardTitle>
                    <CardDescription>Complete list of your calendar events</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        {events.map((event, index) => (
                            <div key={index} className="p-4 border border-border/50 rounded-lg bg-gradient-to-r from-muted/30 to-muted/10 shadow-soft">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-bold text-lg font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{event.title}</p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            {format(event.start, 'PPP p')}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            {event.providerName} • {event.clientName}
                                        </p>
                                    </div>
                                    <Badge className={cn("text-white shadow-soft", getStatusClass(event.status))}>
                                        {event.status}
                                    </Badge>
                                </div>
                            </div>
                        ))}
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Scheduling Tab Component
function SchedulingTab() {
    return (
        <div className="space-y-6">
            <Card>
                <CardHeader>
                    <CardTitle>Scheduling Tools</CardTitle>
                    <CardDescription>Advanced scheduling and availability management</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="space-y-6">
                        <div className="grid gap-4 md:grid-cols-2">
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Availability</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Manage your availability and time blocks
                                    </p>
                                    <Button variant="outline" size="sm">
                                        <Settings className="h-4 w-4 mr-2" />
                                        Set Availability
                                    </Button>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader>
                                    <CardTitle className="text-lg">Recurring Events</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="text-sm text-muted-foreground mb-4">
                                        Create recurring events and appointments
                                    </p>
                                    <Button variant="outline" size="sm">
                                        <RefreshCw className="h-4 w-4 mr-2" />
                                        Create Recurring
                                    </Button>
                                </CardContent>
                            </Card>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

// Insights Tab Component
function InsightsTab({ events, analyticsData }: { events: BookingEvent[], analyticsData: any }) {
    return (
        <div className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
                <Card>
                    <CardHeader>
                        <CardTitle>Calendar Insights</CardTitle>
                        <CardDescription>AI-powered insights and recommendations</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <Alert>
                                <TrendingUp className="h-4 w-4" />
                                <AlertDescription>
                                    You have {analyticsData.upcomingEvents} upcoming events. Consider reviewing your schedule for optimal time management.
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Target className="h-4 w-4" />
                                <AlertDescription>
                                    Your completion rate is {((analyticsData.completedEvents / analyticsData.totalEvents) * 100).toFixed(1)}%. Great job staying on track!
                                </AlertDescription>
                            </Alert>
                            
                            <Alert>
                                <Calculator className="h-4 w-4" />
                                <AlertDescription>
                                    You have {analyticsData.thisWeekEvents} events this week. Consider blocking time for preparation.
                                </AlertDescription>
                            </Alert>
                        </div>
                    </CardContent>
                </Card>

                <Card>
                    <CardHeader>
                        <CardTitle>Optimization Tips</CardTitle>
                        <CardDescription>Strategies to improve your calendar management</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg bg-green-50 border border-green-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <ArrowUpRight className="h-4 w-4 text-green-600" />
                                    <span className="font-medium text-green-800">Time Blocking</span>
                                </div>
                                <p className="text-sm text-green-700">
                                    Block time for preparation and follow-up to improve event quality.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Clock className="h-4 w-4 text-blue-600" />
                                    <span className="font-medium text-blue-800">Buffer Time</span>
                                </div>
                                <p className="text-sm text-blue-700">
                                    Add buffer time between events to avoid running late.
                                </p>
                            </div>
                            
                            <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                                <div className="flex items-center gap-2 mb-2">
                                    <Users className="h-4 w-4 text-purple-600" />
                                    <span className="font-medium text-purple-800">Recurring Events</span>
                                </div>
                                <p className="text-sm text-purple-700">
                                    Set up recurring events for regular appointments to save time.
                                </p>
                            </div>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </div>
    );
}
