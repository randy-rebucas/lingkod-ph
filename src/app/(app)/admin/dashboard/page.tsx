
"use client";

import React from "react";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, Loader2, Users2, Briefcase, UserPlus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { db } from "@/lib/firebase";
import { collection, query, onSnapshot, orderBy, limit, Timestamp } from "firebase/firestore";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDistanceToNow } from "date-fns";
import { PageLayout } from "@/components/app/page-layout";
import { StandardCard } from "@/components/app/standard-card";
import { LoadingState } from "@/components/app/loading-state";
import { AccessDenied } from "@/components/app/access-denied";
import { designTokens } from "@/lib/design-tokens";

type Booking = {
    id: string;
    clientName: string;
    providerName: string;
    serviceName: string;
    status: "Upcoming" | "Completed" | "Cancelled" | "Pending";
    price: number;
    createdAt: Timestamp;
};

type User = {
    uid: string;
    displayName: string;
    email: string;
    role: 'client' | 'provider' | 'agency' | 'admin';
    createdAt: Timestamp;
    photoURL?: string;
};

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "upcoming": return "default";
        case "completed": return "secondary";
        case "pending": return "outline";
        default: return "outline";
    }
}

const getAvatarFallback = (name: string | null | undefined) => {
    if (!name) return "U";
    const parts = name.split(" ");
    if (parts.length > 1 && parts[0] && parts[1]) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
};

const AdminDashboardCard = ({ title, icon: Icon, value, change, isLoading }: { title: string, icon: React.ElementType, value: string, change?: string, isLoading: boolean }) => {
    if (isLoading) {
        return (
            <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{title}</CardTitle>
                    <Icon className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                    <Skeleton className="h-8 w-24 mb-2" />
                    <Skeleton className="h-4 w-32" />
                </CardContent>
            </Card>
        );
    }
    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
                <div className="text-2xl font-bold">{value}</div>
                {change && <p className="text-xs text-muted-foreground">{change}</p>}
            </CardContent>
        </Card>
    )
}

export default function AdminDashboardPage() {
    const { userRole } = useAuth();
    const t = useTranslations('AdminDashboard');
    const [stats, setStats] = useState({ totalUsers: 0, totalProviders: 0, totalClients: 0, totalAgencies: 0, totalRevenue: 0, totalBookings: 0 });
    const [recentBookings, setRecentBookings] = useState<Booking[]>([]);
    const [recentUsers, setRecentUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }
        
        const usersQuery = query(collection(db, "users"));
        const bookingsQuery = query(collection(db, "bookings"));

        const unsubUsers = onSnapshot(usersQuery, (snapshot) => {
            let userCount = 0, providerCount = 0, clientCount = 0, agencyCount = 0;
            snapshot.forEach(doc => {
                userCount++;
                const role = doc.data().role;
                if (role === 'provider') providerCount++;
                if (role === 'client') clientCount++;
                if (role === 'agency') agencyCount++;
            });
            setStats(prev => ({ ...prev, totalUsers: userCount, totalProviders: providerCount, totalClients: clientCount, totalAgencies: agencyCount }));
            setLoading(false);
        });

        const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
            let revenue = 0;
            snapshot.forEach(doc => {
                if (doc.data().status === 'Completed') {
                    revenue += doc.data().price;
                }
            });
            setStats(prev => ({ ...prev, totalBookings: snapshot.size, totalRevenue: revenue }));
            setLoading(false);
        });

        const recentBookingsQuery = query(collection(db, "bookings"), orderBy("createdAt", "desc"), limit(5));
        const unsubRecentBookings = onSnapshot(recentBookingsQuery, (snapshot) => {
            setRecentBookings(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking)));
        });
        
        const recentUsersQuery = query(collection(db, "users"), orderBy("createdAt", "desc"), limit(5));
        const unsubRecentUsers = onSnapshot(recentUsersQuery, (snapshot) => {
            setRecentUsers(snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() } as User)));
        });

        return () => {
            unsubUsers();
            unsubBookings();
            unsubRecentBookings();
            unsubRecentUsers();
        };
    }, []);

    if (userRole !== 'admin') {
        return <AccessDenied 
            title={t('accessDenied')} 
            description={t('adminOnly')} 
        />;
    }

    return (
        <PageLayout 
            title={t('title')} 
            description={t('subtitle')}
        >

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <AdminDashboardCard isLoading={loading} title={t('totalRevenue')} icon={DollarSign} value={`₱${stats.totalRevenue.toFixed(2)}`} />
                <AdminDashboardCard isLoading={loading} title={t('totalBookings')} icon={Briefcase} value={`${stats.totalBookings}`} />
                <AdminDashboardCard isLoading={loading} title={t('totalUsers')} icon={Users} value={`${stats.totalUsers}`} />
                <AdminDashboardCard isLoading={loading} title={`${t('totalProviders')} & ${t('totalAgencies')}`} icon={Users2} value={`${stats.totalProviders + stats.totalAgencies}`} />
            </div>

            <div className="grid gap-6 md:grid-cols-2">
                 <Card>
                    <CardHeader>
                        <CardTitle>{t('recentBookings')}</CardTitle>
                        <CardDescription>The latest bookings made on the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-48 w-full" /> : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>{t('serviceName')}</TableHead>
                                    <TableHead>{t('clientName')}</TableHead>
                                    <TableHead>{t('providerName')}</TableHead>
                                    <TableHead>{t('status')}</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentBookings.length > 0 ? recentBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.serviceName}</TableCell>
                                        <TableCell>{booking.clientName}</TableCell>
                                        <TableCell>{booking.providerName}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                )) : (
                                    <TableRow>
                                        <TableCell colSpan={4} className="h-24 text-center">No recent bookings.</TableCell>
                                    </TableRow>
                                )}
                            </TableBody>
                        </Table>
                        )}
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader>
                        <CardTitle>{t('recentUsers')}</CardTitle>
                        <CardDescription>The latest users to join the platform.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        {loading ? <Skeleton className="h-48 w-full" /> : (
                            <div className="space-y-4">
                                {recentUsers.length > 0 ? recentUsers.map(user => (
                                    <div key={user.uid} className="flex items-center">
                                        <Avatar className="h-9 w-9">
                                            <AvatarImage src={user.photoURL} alt="Avatar" />
                                            <AvatarFallback>{getAvatarFallback(user.displayName)}</AvatarFallback>
                                        </Avatar>
                                        <div className="ml-4 space-y-1">
                                            <p className="text-sm font-medium leading-none">{user.displayName}</p>
                                            <p className="text-sm text-muted-foreground">{user.email}</p>
                                        </div>
                                        <div className="ml-auto font-medium">
                                             <Badge variant="outline" className="capitalize">{user.role}</Badge>
                                        </div>
                                    </div>
                                )) : <p className="text-center text-muted-foreground">No new users.</p>}
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>
        </PageLayout>
    );

    
}
