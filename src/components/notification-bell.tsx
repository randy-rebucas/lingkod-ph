
"use client";

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/shared/auth';
import { getDb  } from '@/shared/db';
import { collection, query, orderBy, onSnapshot, limit, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { formatDistanceToNow } from 'date-fns';

import { Bell, Briefcase, MessageSquare, ThumbsDown, ThumbsUp, UserPlus, X, Star, Eye } from 'lucide-react';
import { Button } from './ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import Link from 'next/link';
import { handleInviteAction } from '@/app/(app)/profile/actions';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/shared/utils';
import { useTranslations } from 'next-intl';


type NotificationType = 'booking_update' | 'new_message' | 'agency_invite' | 'info' | 'renewal_reminder' | 'new_review' | 'new_job';

type Notification = {
    id: string;
    type: NotificationType;
    message: string;
    link: string;
    read: boolean;
    createdAt: unknown; // Firestore Timestamp
    inviteId?: string;
    agencyId?: string;
    agencyName?: string;
};

// Memoized icon mapping for better performance
const getIconForType = (type: NotificationType) => {
    switch (type) {
        case 'booking_update': return <Briefcase className="h-4 w-4" aria-hidden="true" />;
        case 'new_message': return <MessageSquare className="h-4 w-4" aria-hidden="true" />;
        case 'agency_invite': return <UserPlus className="h-4 w-4" aria-hidden="true" />;
        case 'renewal_reminder': return <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
        case 'new_review': return <Star className="h-4 w-4 text-yellow-500" aria-hidden="true" />;
        case 'new_job': return <Briefcase className="h-4 w-4 text-blue-500" aria-hidden="true" />;
        default: return <Bell className="h-4 w-4" aria-hidden="true" />;
    }
};

export function NotificationBell() {
    const { user } = useAuth();
    const router = useRouter();
    const { toast } = useToast();
    const t = useTranslations('NotificationBell');
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [unreadCount, setUnreadCount] = useState(0);

    useEffect(() => {
        if (!user || !getDb()) return;

        const notifsRef = collection(getDb(), `users/${user.uid}/notifications`);
        const q = query(notifsRef, orderBy('createdAt', 'desc'), limit(10));

        const unsubscribe = onSnapshot(q, (snapshot) => {
            const notifsData = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            } as Notification));
            setNotifications(notifsData);
            setUnreadCount(notifsData.filter(n => !n.read).length);
        });

        return () => unsubscribe();
    }, [user]);

    const handleNotificationClick = useCallback(async (notif: Notification) => {
        if (!user) return;
        if (!notif.read) {
            await updateDoc(doc(getDb(), `users/${user.uid}/notifications`, notif.id), { read: true });
        }
        if (notif.type !== 'agency_invite') {
            router.push(notif.link);
        }
    }, [user, router]);

    const handleInviteResponse = useCallback(async (event: React.MouseEvent, notif: Notification, accepted: boolean) => {
        event.stopPropagation(); // Prevent dropdown from closing
        if (!user || !notif.inviteId) return;

        const formData = new FormData();
        formData.append('inviteId', notif.inviteId);
        formData.append('accepted', String(accepted));
        
        const result = await handleInviteAction({ error: null, message: '' }, formData);

        if (result.error) {
            toast({ variant: 'destructive', title: t('error'), description: result.error });
        } else {
            toast({ title: t('success'), description: result.message });
            // The notification will disappear as the invite status changes.
        }
    }, [user, toast, t]);
    
    const handleDeleteNotification = useCallback(async (event: React.MouseEvent, notificationId: string) => {
        event.stopPropagation();
        if (!user) return;
        await deleteDoc(doc(getDb(), `users/${user.uid}/notifications`, notificationId));
    }, [user]);


    return (
        <DropdownMenu>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-destructive" />
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80">
                <DropdownMenuLabel>{t('notifications')}</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {notifications.length > 0 ? (
                    notifications.map(notif => (
                        <DropdownMenuItem key={notif.id} className={cn("flex flex-col items-start gap-2 whitespace-normal cursor-pointer", !notif.read && "bg-secondary")} onClick={() => handleNotificationClick(notif)}>
                           <div className="flex items-start w-full gap-3">
                                <div className="text-muted-foreground mt-1">{getIconForType(notif.type)}</div>
                                <div className="flex-1">
                                    <p className="text-sm">{notif.message}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {notif.createdAt ? formatDistanceToNow((notif.createdAt as any).toDate ? (notif.createdAt as any).toDate() : new Date(notif.createdAt as any), { addSuffix: true }) : ''}
                                    </p>
                                     {notif.type === 'agency_invite' && (
                                        <div className="flex gap-2 mt-2">
                                            <Button size="sm" className="h-7" onClick={(e) => handleInviteResponse(e, notif, true)}><ThumbsUp className="mr-1 h-3 w-3"/> Accept</Button>
                                            <Button size="sm" variant="destructive" className="h-7" onClick={(e) => handleInviteResponse(e, notif, false)}><ThumbsDown className="mr-1 h-3 w-3"/> Decline</Button>
                                        </div>
                                    )}
                                </div>
                                 <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={(e) => handleDeleteNotification(e, notif.id)}>
                                    <X className="h-4 w-4" />
                                </Button>
                           </div>
                        </DropdownMenuItem>
                    ))
                ) : (
                    <p className="p-4 text-sm text-center text-muted-foreground">{t('noNotifications')}</p>
                )}
                {notifications.length > 0 && (
                    <>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                            <Link href="/notifications" className="flex items-center justify-center w-full">
                                <Eye className="h-4 w-4 mr-2" />
                                {t('viewAllNotifications')}
                            </Link>
                        </DropdownMenuItem>
                    </>
                )}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
