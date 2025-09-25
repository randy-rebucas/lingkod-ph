
"use client";

import React from "react";

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/context/auth-context';
import { db } from '@/lib/firebase';
import { collection, query, onSnapshot, getDocs, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { DollarSign, BookCheck, Calculator, FilePieChart, CheckCircle } from "lucide-react";
import { Skeleton } from '@/components/ui/skeleton';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Bar,
  BarChart,
} from 'recharts';
import { PageLayout } from '@/components/app/page-layout';
import { StandardCard } from '@/components/app/standard-card';
import { LoadingState } from '@/components/app/loading-state';
import { EmptyState } from '@/components/app/empty-state';
import { AccessDenied } from '@/components/app/access-denied';
import { designTokens } from '@/lib/design-tokens';

type Booking = {
    id: string;
    providerId: string;
    providerName: string;
    status: "Upcoming" | "Completed" | "Cancelled";
    price: number;
    date: Timestamp;
};

type ProviderStats = {
    providerId: string;
    providerName: string;
    completedBookings: number;
    totalRevenue: number;
};

const processRevenueChartData = (bookings: Booking[]) => {
    const monthlyData: { [key: string]: number } = {};
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    
    bookings.forEach(booking => {
        if (booking.status !== 'Completed') return;
        const date = booking.date.toDate();
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        if (!monthlyData[key]) {
            monthlyData[key] = 0;
        }
        monthlyData[key] += booking.price;
    });

    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    
    return Array.from({ length: 12 }, (_, i) => {
        const date = new Date(twelveMonthsAgo);
        date.setMonth(date.getMonth() + i);
        const key = `${date.getFullYear()}-${date.getMonth()}`;
        return {
            name: `${monthNames[date.getMonth()]} '${date.getFullYear().toString().slice(-2)}`,
            'Revenue': monthlyData[key] || 0,
        };
    });
};


export default function AdminReportsPage() {
    const { userRole } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (userRole !== 'admin') {
            setLoading(false);
            return;
        }

        const bookingsQuery = query(collection(db, "bookings"));
        const unsubBookings = onSnapshot(bookingsQuery, (snapshot) => {
            const fetchedBookings = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Booking));
            setBookings(fetchedBookings);
            setLoading(false);
        }, (error) => {
            console.error("Error fetching reports data:", error);
            setLoading(false);
        });

        return () => unsubBookings();

    }, [userRole]);

    const reportData = useMemo(() => {
        const completedBookings = bookings.filter(b => b.status === 'Completed');
        const totalRevenue = completedBookings.reduce((sum, b) => sum + b.price, 0);
        const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

        const providerStats: { [key: string]: ProviderStats } = {};

        completedBookings.forEach(booking => {
            if (!providerStats[booking.providerId]) {
                providerStats[booking.providerId] = {
                    providerId: booking.providerId,
                    providerName: booking.providerName,
                    completedBookings: 0,
                    totalRevenue: 0,
                };
            }
            providerStats[booking.providerId].completedBookings++;
            providerStats[booking.providerId].totalRevenue += booking.price;
        });
        
        const providerPerformance = Object.values(providerStats).sort((a,b) => b.totalRevenue - a.totalRevenue);

        return {
            totalRevenue,
            totalCompletedBookings: completedBookings.length,
            averageBookingValue,
            providerPerformance,
            revenueChartData: processRevenueChartData(completedBookings),
            providerChartData: providerPerformance.map(p => ({name: p.providerName, Bookings: p.completedBookings}))
        };
    }, [bookings]);
    
    if (userRole !== 'admin') {
        return <AccessDenied 
            title="Access Denied" 
            description="This page is for administrators only." 
        />;
    }

    if (loading) {
        return <LoadingState 
            title="Platform Reports" 
            description="Deep dive into the platform's performance with charts and detailed tables." 
        />;
    }

    return (
        <PageLayout 
            title="Platform Reports" 
            description="Deep dive into the platform's performance with charts and detailed tables."
        >
            
            <div className="grid gap-6 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{reportData.totalRevenue.toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Completed Bookings</CardTitle>
                        <BookCheck className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{reportData.totalCompletedBookings}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Avg. Booking Value</CardTitle>
                        <Calculator className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱{reportData.averageBookingValue.toFixed(2)}</div>
                    </CardContent>
                </Card>
            </div>
            
             <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-5">
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Monthly Revenue</CardTitle>
                        <CardDescription>Total revenue over the last 12 months.</CardDescription>
                    </CardHeader>
                    <CardContent>
                         <ResponsiveContainer width="100%" height={300}>
                            <LineChart data={reportData.revenueChartData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false}/>
                                <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false}/>
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} allowDecimals={false}/>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }} />
                                <Legend />
                                <Line type="monotone" dataKey="Revenue" stroke="hsl(var(--primary))" strokeWidth={2} dot={false} />
                            </LineChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-2">
                    <CardHeader>
                        <CardTitle>Provider Bookings</CardTitle>
                        <CardDescription>Number of completed bookings per provider.</CardDescription>
                    </CardHeader>
                    <CardContent>
                       <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={reportData.providerChartData} layout="vertical" margin={{ left: 20 }}>
                                <CartesianGrid strokeDasharray="3 3" horizontal={false}/>
                                <XAxis type="number" allowDecimals={false} />
                                <YAxis type="category" dataKey="name" width={80} stroke="#888888" fontSize={12}/>
                                <Tooltip contentStyle={{ backgroundColor: "hsl(var(--background))", border: "1px solid hsl(var(--border))" }}/>
                                <Legend />
                                <Bar dataKey="Bookings" fill="hsl(var(--chart-2))" />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Provider Performance</CardTitle>
                    <CardDescription>A summary of bookings and revenue by each provider.</CardDescription>
                </CardHeader>
                <CardContent>
                     <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Provider</TableHead>
                                <TableHead className="text-center">Completed Bookings</TableHead>
                                <TableHead className="text-right">Total Revenue</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {reportData.providerPerformance.length > 0 ? reportData.providerPerformance.map((provider) => (
                                <TableRow key={provider.providerId}>
                                    <TableCell className="font-medium">{provider.providerName}</TableCell>
                                    <TableCell className="text-center">{provider.completedBookings}</TableCell>
                                    <TableCell className="text-right">₱{provider.totalRevenue.toFixed(2)}</TableCell>
                                </TableRow>
                            )) : (
                                <TableRow>
                                    <TableCell colSpan={3} className="h-24 text-center">
                                        No data to display.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </PageLayout>
    );
}
