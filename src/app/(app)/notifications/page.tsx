"use client";

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, orderBy, onSnapshot, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

import { Bell, Briefcase, MessageSquare, ThumbsDown, ThumbsUp, UserPlus, X, Star, Trash2, Check, CheckCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { handleInviteAction } from '@/app/(app)/profile/actions';
import { cn } from '@/lib/utils';

type NotificationType = 'booking_update' | 'new_message' | 'agency_invite' | 'info' | 'renewal_reminder' | 'new_review' | 'new_job';

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

const getTypeColor = (type: NotificationType) => {
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

export default function NotificationsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('Notifications');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'unread'>('all');

    useEffect(() => {
        if (!user || !db) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const notifsRef = collection(db, `users/${user.uid}/notifications`);
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
        if (!user || !db) return;
        if (!notif.read) {
            await updateDoc(doc(db, `users/${user.uid}/notifications`, notif.id), { read: true });
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
        if (!user || !db) return;
        try {
            await deleteDoc(doc(db, `users/${user.uid}/notifications`, notificationId));
            toast({ title: t('success'), description: t('notificationDeleted') });
        } catch (error) {
            toast({ variant: 'destructive', title: t('error'), description: t('deleteFailed') });
        }
    };

    const handleMarkAllAsRead = async () => {
        if (!user || !db) return;
        try {
            const unreadNotifications = notifications.filter(n => !n.read);
            const promises = unreadNotifications.map(notif => 
                updateDoc(doc(db!, `users/${user.uid}/notifications`, notif.id), { read: true })
            );
            await Promise.all(promises);
            toast({ title: t('success'), description: t('allMarkedAsRead') });
        } catch (error) {
            toast({ variant: 'destructive', title: t('error'), description: t('markAsReadFailed') });
        }
    };

    const handleDeleteAllRead = async () => {
        if (!user || !db) return;
        try {
            const readNotifications = notifications.filter(n => n.read);
            const promises = readNotifications.map(notif => 
                deleteDoc(doc(db!, `users/${user.uid}/notifications`, notif.id))
            );
            await Promise.all(promises);
            toast({ title: t('success'), description: t('readNotificationsDeleted') });
        } catch (error) {
            toast({ variant: 'destructive', title: t('error'), description: t('deleteFailed') });
        }
    };

    const filteredNotifications = filter === 'unread' 
        ? notifications.filter(n => !n.read)
        : notifications;

    const unreadCount = notifications.filter(n => !n.read).length;

    if (loading) {
        return (
            <div className="max-w-6xl mx-auto space-y-8">
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
        );
    }

    return (
        <div className="max-w-6xl mx-auto space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                        {t('notifications')}
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        {t('notificationsDescription')}
                    </p>
                </div>
                <div className="flex gap-2">
                    {unreadCount > 0 && (
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

            {/* Filter Tabs */}
            <div className="flex gap-2">
                <Button
                    variant={filter === 'all' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('all')}
                    className="transition-all duration-300"
                >
                    {t('all')} ({notifications.length})
                </Button>
                <Button
                    variant={filter === 'unread' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setFilter('unread')}
                    className="transition-all duration-300"
                >
                    {t('unread')} ({unreadCount})
                </Button>
            </div>

            {/* Notifications List */}
            {filteredNotifications.length > 0 ? (
                <div className="space-y-4">
                    {filteredNotifications.map(notif => (
                        <Card 
                            key={notif.id} 
                            className={cn(
                                "shadow-soft border-0 bg-background/80 backdrop-blur-sm hover:shadow-glow/20 transition-all duration-300 cursor-pointer group",
                                !notif.read && "ring-2 ring-primary/20"
                            )}
                            onClick={() => handleNotificationClick(notif)}
                        >
                            <CardContent className="p-6">
                                <div className="flex items-start space-x-4">
                                    {/* Icon */}
                                    <div className={cn(
                                        "flex items-center justify-center w-12 h-12 rounded-full text-white",
                                        getTypeColor(notif.type)
                                    )}>
                                        {getIconForType(notif.type)}
                                    </div>

                                    {/* Content */}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                                <p className={cn(
                                                    "text-sm font-medium",
                                                    !notif.read && "font-semibold"
                                                )}>
                                                    {notif.message}
                                                </p>
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    {notif.createdAt ? formatDistanceToNow(notif.createdAt.toDate(), { addSuffix: true }) : ''}
                                                </p>
                                                
                                                {/* Agency Invite Actions */}
                                                {notif.type === 'agency_invite' && (
                                                    <div className="flex gap-2 mt-3">
                                                        <Button 
                                                            size="sm" 
                                                            className="h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInviteResponse(notif, true);
                                                            }}
                                                        >
                                                            <ThumbsUp className="mr-1 h-3 w-3"/>
                                                            {t('accept')}
                                                        </Button>
                                                        <Button 
                                                            size="sm" 
                                                            variant="destructive" 
                                                            className="h-8"
                                                            onClick={(e) => {
                                                                e.stopPropagation();
                                                                handleInviteResponse(notif, false);
                                                            }}
                                                        >
                                                            <ThumbsDown className="mr-1 h-3 w-3"/>
                                                            {t('decline')}
                                                        </Button>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Status and Actions */}
                                            <div className="flex items-center gap-2 ml-4">
                                                {!notif.read && (
                                                    <Badge variant="secondary" className="text-xs">
                                                        {t('new')}
                                                    </Badge>
                                                )}
                                                <Button 
                                                    variant="ghost" 
                                                    size="icon" 
                                                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDeleteNotification(notif.id);
                                                    }}
                                                >
                                                    <X className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>
            ) : (
                <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                    <CardContent className="flex flex-col items-center justify-center text-center p-12">
                        <Bell className="h-16 w-16 text-muted-foreground mb-4" />
                        <h3 className="text-xl font-semibold mb-2">
                            {filter === 'unread' ? t('noUnreadNotifications') : t('noNotifications')}
                        </h3>
                        <p className="text-muted-foreground">
                            {filter === 'unread' ? t('noUnreadDescription') : t('noNotificationsDescription')}
                        </p>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}
