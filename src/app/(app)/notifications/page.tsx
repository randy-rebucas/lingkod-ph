"use client";

import React, { useState, useEffect, memo } from 'react';
import { useAuth } from '@/shared/auth';
import { getDb  } from '@/shared/db';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useErrorHandler } from '@/hooks/use-error-handler';

import { 
  Bell, 
  Briefcase, 
  MessageSquare, 
  UserPlus, 
  X, 
  Star, 
  Trash2, 
  Check, 
  CheckCheck,
  Search,
  Zap,
} from 'lucide-react';
import { Button } from '@/shared/ui/button';
import { Card, CardContent } from '@/shared/ui/card';
import { Badge } from '@/shared/ui/badge';
import { Skeleton } from '@/shared/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleInviteAction } from '@/app/(app)/profile/actions';
import { cn } from '@/shared/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Input } from "@/shared/ui/input";
// import { Label } from "@/shared/ui/label";
// import { Avatar, AvatarFallback, AvatarImage } from "@/shared/ui/avatar";
// import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/shared/ui/tooltip";

type NotificationType = 'booking_update' | 'new_message' | 'agency_invite' | 'info' | 'renewal_reminder' | 'new_review' | 'new_job' | 'payment_received' | 'payment_failed' | 'system_alert' | 'maintenance' | 'security' | 'promotion' | 'newsletter' | 'reminder' | 'deadline' | 'achievement' | 'warning' | 'error' | 'success';

type NotificationPriority = 'low' | 'medium' | 'high' | 'urgent';

type Notification = {
    id: string;
    type: NotificationType;
    message: string;
    link: string;
    read: boolean;
    createdAt: any; // Firestore Timestamp
    inviteId?: string;
    agencyId?: string;
    agencyName?: string;
    priority?: NotificationPriority;
    category?: string;
    source?: string;
    metadata?: {
        bookingId?: string;
        amount?: number;
        userId?: string;
        userName?: string;
        avatar?: string;
        [key: string]: any;
    };
    actions?: {
        label: string;
        action: string;
        variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
    }[];
    expiresAt?: any; // Firestore Timestamp
    archived?: boolean;
    starred?: boolean;
};

const getIconForType = (type: NotificationType) => {
    switch (type) {
        case 'booking_update': return <Briefcase className="h-5 w-5" />;
        case 'new_message': return <MessageSquare className="h-5 w-5" />;
        case 'agency_invite': return <UserPlus className="h-5 w-5" />;
        case 'renewal_reminder': return <Star className="h-5 w-5 text-yellow-500" />;
        case 'new_review': return <Star className="h-5 w-5 text-yellow-500" />;
        case 'new_job': return <Briefcase className="h-5 w-5 text-blue-500" />;
        default: return <Bell className="h-5 w-5" />;
    }
};

    const _getTypeColor = (type: NotificationType) => {
    switch (type) {
        case 'booking_update': return 'bg-blue-500';
        case 'new_message': return 'bg-green-500';
        case 'agency_invite': return 'bg-purple-500';
        case 'renewal_reminder': return 'bg-yellow-500';
        case 'new_review': return 'bg-yellow-500';
        case 'new_job': return 'bg-blue-500';
        default: return 'bg-gray-500';
    }
};

// Notifications Tab Component
const NotificationsTab = memo(function NotificationsTab({ 
    notifications, 
    filter, 
    setFilter, 
    onNotificationClick, 
    onInviteResponse, 
    onDeleteNotification,
    analyticsData 
}: { 
    notifications: Notification[], 
    filter: 'all' | 'unread' | 'starred' | 'archived', 
    setFilter: (filter: 'all' | 'unread' | 'starred' | 'archived') => void,
    onNotificationClick: (notif: Notification) => void,
    onInviteResponse: (notif: Notification, accepted: boolean) => void,
    onDeleteNotification: (id: string) => void,
    analyticsData: any
}) {
    return (
        <div className="space-y-6">
            {/* Simple Filter Tabs */}
            <div className="flex gap-1 border-b">
                <button
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'all' 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter('all')}
                >
                    All ({analyticsData.totalCount})
                </button>
                <button
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'unread' 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter('unread')}
                >
                    Unread ({analyticsData.unreadCount})
                </button>
                <button
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'starred' 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter('starred')}
                >
                    Starred ({analyticsData.starredCount})
                </button>
                <button
                    className={cn(
                        "px-4 py-2 text-sm font-medium border-b-2 transition-colors",
                        filter === 'archived' 
                            ? "border-primary text-primary" 
                            : "border-transparent text-muted-foreground hover:text-foreground"
                    )}
                    onClick={() => setFilter('archived')}
                >
                    Archived ({analyticsData.archivedCount})
                </button>
            </div>

            {/* Notifications List */}
            {notifications.length > 0 ? (
                <div className="space-y-2">
                    {notifications.map(notif => (
                        <div 
                            key={notif.id} 
                            className={cn(
                                "flex items-center gap-3 p-4 rounded-lg border cursor-pointer hover:bg-muted/50 transition-colors",
                                !notif.read && "bg-blue-50 border-blue-200"
                            )}
                            onClick={() => onNotificationClick(notif)}
                        >
                            {/* Simple Icon */}
                            <div className="flex-shrink-0">
                                {getIconForType(notif.type)}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0">
                                <p className={cn(
                                    "text-sm",
                                    !notif.read && "font-medium"
                                )}>
                                    {notif.message}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                                </p>
                            </div>

                            {/* Simple Actions */}
                            <div className="flex items-center gap-2">
                                {!notif.read && (
                                    <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                                )}
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    className="h-8 w-8 p-0"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        onDeleteNotification(notif.id);
                                    }}
                                >
                                    <X className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-12">
                    <Bell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                    <h3 className="text-lg font-medium mb-2">
                        {filter === 'unread' ? 'No unread notifications' : 'No notifications'}
                    </h3>
                    <p className="text-muted-foreground">
                        {filter === 'unread' ? 'You\'re all caught up!' : 'No notifications to display'}
                    </p>
                </div>
            )}
        </div>
    );
});

const NotificationsPage = memo(function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const { handleError: _handleError } = useErrorHandler();
    const t = useTranslations('Notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread' | 'starred' | 'archived'>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [typeFilter, setTypeFilter] = useState<string>('all');
    const [priorityFilter, _setPriorityFilter] = useState<string>('all');
    const [dateFilter, setDateFilter] = useState<string>('all');

    useEffect(() => {
        if (!user || !getDb()) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const notifsRef = collection(getDb(), `users/${user.uid}/notifications`);
        const q = query(notifsRef, orderBy('createdAt', 'desc'));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(notifsData);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching notifications:", error);
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to fetch notifications.' });
            setLoading(false);
        });

        return () => unsubscribe();
    }, [user, toast]);

    const handleNotificationClick = async (notif: Notification) => {
        if (!user || !getDb()) return;
        if (!notif.read) {
            await updateDoc(doc(getDb(), `users/${user.uid}/notifications`, notif.id), { read: true });
        }
        if (notif.type !== 'agency_invite' && notif.link) {
            router.push(notif.link);
        }
    };

    const handleInviteResponse = async (notif: Notification, accepted: boolean) => {
        if (!user || !notif.inviteId) return;

        const formData = new FormData();
        formData.append('inviteId', notif.inviteId);
        formData.append('accepted', String(accepted));
        
        const result = await handleInviteAction({ error: null, message: '' }, formData);

        if (result.error) {
            toast({ variant: 'destructive', title: t('error'), description: result.error });
        } else {
            toast({ title: t('success'), description: result.message });
        }
    };
    
    const handleDeleteNotification = async (notificationId: string) => {
        if (!user || !getDb()) return;
        try {
            await deleteDoc(doc(getDb(), `users/${user.uid}/notifications`, notificationId));
            toast({ title: t('success'), description: t('notificationDeleted') });
            } catch {
            toast({ variant: 'destructive', title: t('error'), description: t('deleteFailed') });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user || !getDb()) return;
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            const promises = unreadNotifications.map(notif => 
                updateDoc(doc(getDb(), `users/${user.uid}/notifications`, notif.id), { read: true })
            );
            await Promise.all(promises);
            toast({ title: t('success'), description: t('allMarkedAsRead') });
            } catch {
            toast({ variant: 'destructive', title: t('error'), description: t('markAsReadFailed') });
        }
    };

    const handleDeleteAllRead = async () => {
        if (!user || !getDb()) return;
        try {
            const readNotifications = notifications.filter(n => n.read);
            const promises = readNotifications.map(notif => 
                deleteDoc(doc(getDb(), `users/${user.uid}/notifications`, notif.id))
            );
            await Promise.all(promises);
            toast({ title: t('success'), description: t('readNotificationsDeleted') });
            } catch {
            toast({ variant: 'destructive', title: t('error'), description: t('deleteFailed') });
        }
    };

    // Calculate analytics data
    const analyticsData = React.useMemo(() => {
        const unreadCount = notifications.filter(n => !n.read).length;
        const starredCount = notifications.filter(n => n.starred).length;
        const archivedCount = notifications.filter(n => n.archived).length;
        const todayCount = notifications.filter(n => {
            const today = new Date();
            const notifDate = n.createdAt?.toDate();
            return notifDate && notifDate.toDateString() === today.toDateString();
        }).length;
        
        const typeBreakdown = notifications.reduce((acc, notif) => {
            acc[notif.type] = (acc[notif.type] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        const priorityBreakdown = notifications.reduce((acc, notif) => {
            const priority = notif.priority || 'medium';
            acc[priority] = (acc[priority] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);

        return {
            unreadCount,
            starredCount,
            archivedCount,
            todayCount,
            typeBreakdown,
            priorityBreakdown,
            totalCount: notifications.length
        };
    }, [notifications]);

    // Advanced filtering logic
    const filteredNotifications = React.useMemo(() => {
        let filtered = notifications;

        // Apply main filter
        switch (filter) {
            case 'unread':
                filtered = filtered.filter(n => !n.read);
                break;
            case 'starred':
                filtered = filtered.filter(n => n.starred);
                break;
            case 'archived':
                filtered = filtered.filter(n => n.archived);
                break;
            default:
                filtered = filtered.filter(n => !n.archived);
        }

        // Apply search filter
        if (searchQuery) {
            filtered = filtered.filter(n => 
                n.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                n.type.toLowerCase().includes(searchQuery.toLowerCase()) ||
                (n.metadata?.userName && n.metadata.userName.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        // Apply type filter
        if (typeFilter !== 'all') {
            filtered = filtered.filter(n => n.type === typeFilter);
        }

        // Apply priority filter
        if (priorityFilter !== 'all') {
            filtered = filtered.filter(n => (n.priority || 'medium') === priorityFilter);
        }

        // Apply date filter
        if (dateFilter !== 'all') {
            const now = new Date();
            filtered = filtered.filter(n => {
                const notifDate = n.createdAt?.toDate();
                if (!notifDate) return false;

                switch (dateFilter) {
                    case 'today':
                        return notifDate.toDateString() === now.toDateString();
                    case 'week':
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return notifDate >= weekAgo;
                    case 'month':
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return notifDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        return filtered;
    }, [notifications, filter, searchQuery, typeFilter, priorityFilter, dateFilter]);

    if (loading) {
        return (
            <div className="container space-y-8">
                <div className="max-w-6xl mx-auto">
                    <div className="flex items-center justify-between">
                        <div>
                            <Skeleton className="h-8 w-48 mb-2" />
                            <Skeleton className="h-4 w-64" />
                        </div>
                        <div className="flex gap-2">
                            <Skeleton className="h-10 w-32" />
                            <Skeleton className="h-10 w-32" />
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto">
                    <div className="space-y-4">
                        {[...Array(5)].map((_, i) => (
                            <Card key={i} className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                                <CardContent className="p-6">
                                    <div className="flex items-start space-x-4">
                                        <Skeleton className="h-12 w-12 rounded-full" />
                                        <div className="space-y-2 flex-1">
                                            <Skeleton className="h-4 w-3/4" />
                                            <Skeleton className="h-3 w-1/2" />
                                        </div>
                                        <Skeleton className="h-8 w-8" />
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t('notifications')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('notificationsDescription')}
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Badge variant="outline" className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        Advanced Notifications
                    </Badge>
                    <div className="flex gap-2">
                        {analyticsData.unreadCount > 0 && (
                            <Button 
                                onClick={handleMarkAllAsRead}
                                variant="outline" 
                                size="sm"
                                className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                            >
                                <CheckCheck className="h-4 w-4 mr-2" />
                                {t('markAllAsRead')}
                            </Button>
                        )}
                        <Button 
                            onClick={handleDeleteAllRead}
                            variant="outline" 
                            size="sm"
                            className="shadow-soft hover:shadow-glow/20 transition-all duration-300"
                        >
                            <Trash2 className="h-4 w-4 mr-2" />
                            {t('deleteRead')}
                        </Button>
                    </div>
                </div>
            </div>

            {/* Simple Filter Controls */}
            <div className="max-w-6xl mx-auto">
                <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
                    <div className="flex-1 max-w-md">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input 
                                placeholder="Search notifications..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>
                    <div className="flex gap-2">
                        <Select value={typeFilter} onValueChange={setTypeFilter}>
                            <SelectTrigger className="w-40">
                                <SelectValue placeholder="Type" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Types</SelectItem>
                                <SelectItem value="booking_update">Booking Updates</SelectItem>
                                <SelectItem value="new_message">Messages</SelectItem>
                                <SelectItem value="agency_invite">Agency Invites</SelectItem>
                                <SelectItem value="payment_received">Payments</SelectItem>
                                <SelectItem value="system_alert">System Alerts</SelectItem>
                                <SelectItem value="reminder">Reminders</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={dateFilter} onValueChange={setDateFilter}>
                            <SelectTrigger className="w-32">
                                <SelectValue placeholder="Date" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Time</SelectItem>
                                <SelectItem value="today">Today</SelectItem>
                                <SelectItem value="week">This Week</SelectItem>
                                <SelectItem value="month">This Month</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>


            {/* Notifications List */}
            <div className="max-w-6xl mx-auto">
                <NotificationsTab 
                    notifications={filteredNotifications} 
                    filter={filter}
                    setFilter={setFilter}
                    onNotificationClick={handleNotificationClick}
                    onInviteResponse={handleInviteResponse}
                    onDeleteNotification={handleDeleteNotification}
                    analyticsData={analyticsData}
                />
            </div>

        </div>
    );
});

export default NotificationsPage;

