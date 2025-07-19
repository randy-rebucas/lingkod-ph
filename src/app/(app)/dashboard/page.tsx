
"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { DollarSign, Calendar, Star, Users, ArrowUp } from "lucide-react";
import { useAuth } from "@/context/auth-context";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";

const earningsData = [
  { month: "Jan", earnings: 2200 },
  { month: "Feb", earnings: 3100 },
  { month: "Mar", earnings: 2800 },
  { month: "Apr", earnings: 4500 },
  { month: "May", earnings: 3800 },
  { month: "Jun", earnings: 5200 },
];

const recentBookings = [
    { id: "BK001", user: "Maria D.", service: "Deep Cleaning", status: "Upcoming", amount: 2500 },
    { id: "BK002", user: "Jose R.", service: "Plumbing", status: "Completed", amount: 1800 },
    { id: "BK004", user: "Gabriela S.", service: "Aircon Clean", status: "Upcoming", amount: 1500 },
];

const recentReviews = [
    { id: 1, user: "Andres B.", rating: 5, comment: "Amazing work, very professional!", avatar: "https://placehold.co/100x100.png" },
    { id: 2, user: "Apolinario M.", rating: 4, comment: "Good service, but arrived a bit late.", avatar: "https://placehold.co/100x100.png" },
];

const getStatusVariant = (status: string) => {
    switch (status.toLowerCase()) {
        case "upcoming": return "default";
        case "completed": return "secondary";
        default: return "outline";
    }
}

const renderStars = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
        <Star key={i} className={`h-4 w-4 ${i < rating ? 'text-yellow-400 fill-yellow-400' : 'text-muted-foreground'}`} />
    ));
}

export default function DashboardPage() {
    const { user } = useAuth();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold font-headline">Welcome back, {user?.displayName || 'User'}!</h1>
                <p className="text-muted-foreground">Here&apos;s a summary of your activity and performance.</p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
                        <DollarSign className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">₱12,500.00</div>
                        <p className="text-xs text-muted-foreground">+20.1% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Upcoming Bookings</CardTitle>
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4</div>
                        <p className="text-xs text-muted-foreground">+2 this week</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">New Clients</CardTitle>
                        <Users className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">+12</div>
                        <p className="text-xs text-muted-foreground">+18.7% from last month</p>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Overall Rating</CardTitle>
                        <Star className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">4.8</div>
                        <p className="text-xs text-muted-foreground">Based on 25 reviews</p>
                    </CardContent>
                </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
                <Card className="lg:col-span-4">
                    <CardHeader>
                        <CardTitle>Earnings Overview</CardTitle>
                        <CardDescription>Your earnings for the last 6 months.</CardDescription>
                    </CardHeader>
                    <CardContent className="pl-2">
                        <ResponsiveContainer width="100%" height={300}>
                            <BarChart data={earningsData}>
                                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                <XAxis dataKey="month" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                                <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₱${value / 1000}k`} />
                                <Tooltip
                                    contentStyle={{
                                        backgroundColor: "hsl(var(--background))",
                                        border: "1px solid hsl(var(--border))",
                                        borderRadius: "var(--radius)"
                                    }}
                                    cursor={{ fill: 'hsl(var(--secondary))' }}
                                />
                                <Bar dataKey="earnings" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                            </BarChart>
                        </ResponsiveContainer>
                    </CardContent>
                </Card>
                <Card className="lg:col-span-3">
                    <CardHeader>
                        <CardTitle>Recent Bookings</CardTitle>
                        <CardDescription>A list of your most recent bookings.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Client</TableHead>
                                    <TableHead>Service</TableHead>
                                    <TableHead>Status</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {recentBookings.map((booking) => (
                                    <TableRow key={booking.id}>
                                        <TableCell className="font-medium">{booking.user}</TableCell>
                                        <TableCell>{booking.service}</TableCell>
                                        <TableCell>
                                            <Badge variant={getStatusVariant(booking.status)}>{booking.status}</Badge>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
            
            <Card>
                <CardHeader>
                    <CardTitle>Recent Reviews</CardTitle>
                    <CardDescription>What your clients are saying about you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {recentReviews.map((review) => (
                        <div key={review.id} className="flex items-start gap-4">
                            <Avatar>
                                <AvatarImage src={review.avatar} alt={review.user} />
                                <AvatarFallback>{review.user.charAt(0)}</AvatarFallback>
                            </Avatar>
                            <div className="flex-1">
                                <div className="flex items-center justify-between">
                                    <p className="font-semibold">{review.user}</p>
                                    <div className="flex items-center gap-1">
                                        {renderStars(review.rating)}
                                    </div>
                                </div>
                                <p className="text-sm text-muted-foreground mt-1">{review.comment}</p>
                            </div>
                        </div>
                    ))}
                    <div className="text-center">
                        <Button variant="outline">View All Reviews</Button>
                    </div>
                </CardContent>
            </Card>

        </div>
    );
}
