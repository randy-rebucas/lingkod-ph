"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useAuth } from '@/context/auth-context';
import { useProSubscription } from '@/hooks/use-subscription';
import { db } from '@/lib/firebase';
import { collection, query, where, onSnapshot, orderBy, Timestamp } from 'firebase/firestore';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  Star, 
  Calendar,
  Award,
  Target,
  Eye,
  MessageSquare,
  Clock,
  CheckCircle
} from 'lucide-react';
import { AnalyticsGuard } from '@/components/feature-guard';
import { VerifiedProBadge } from '@/components/pro-badge';
import { format } from 'date-fns';

type Booking = {
  id: string;
  clientName: string;
  serviceName: string;
  price: number;
  status: string;
  createdAt: Timestamp;
  completedAt?: Timestamp;
  rating?: number;
  review?: string;
};

type Review = {
  id: string;
  clientName: string;
  rating: number;
  comment: string;
  createdAt: Timestamp;
  serviceName: string;
};

type AnalyticsData = {
  totalRevenue: number;
  totalBookings: number;
  completedBookings: number;
  averageRating: number;
  totalReviews: number;
  monthlyRevenue: number;
  monthlyBookings: number;
  ratingTrend: number;
  reviewTrend: number;
  topServices: Array<{ name: string; count: number; revenue: number }>;
  monthlyData: Array<{ month: string; revenue: number; bookings: number; ratings: number }>;
  ratingDistribution: Array<{ rating: number; count: number }>;
  completionRate: number;
  averageResponseTime: number;
  featuredPlacementViews: number;
  priorityJobApplications: number;
};

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function AnalyticsPage() {
  const { user } = useAuth();
  const { isPro, isActive } = useProSubscription();
  const t = useTranslations('Analytics');
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);

  useEffect(() => {
    if (!user || !isPro || !isActive) {
      setLoading(false);
      return;
    }

    // Fetch bookings
    if (!db) {
      setLoading(false);
      return;
    }
    
    const bookingsQuery = query(
      collection(db, "bookings"),
      where("providerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
      const bookingsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
        completedAt: doc.data().completedAt as Timestamp,
      })) as Booking[];
      setBookings(bookingsData);
    });

    // Fetch reviews
    const reviewsQuery = query(
      collection(db, "reviews"),
      where("providerId", "==", user.uid),
      orderBy("createdAt", "desc")
    );

    const unsubscribeReviews = onSnapshot(reviewsQuery, (snapshot) => {
      const reviewsData = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp,
      })) as Review[];
      setReviews(reviewsData);
    });

    return () => {
      unsubscribeBookings();
      unsubscribeReviews();
    };
  }, [user, isPro, isActive]);

  useEffect(() => {
    if (bookings.length > 0 || reviews.length > 0) {
      calculateAnalytics();
    }
  }, [bookings, reviews]);

  const calculateAnalytics = () => {
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    // Calculate basic metrics
    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.price, 0);

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    const totalReviews = reviews.length;

    // Calculate monthly metrics
    const monthlyBookings = bookings.filter(b => {
      const bookingDate = b.createdAt.toDate();
      return bookingDate.getMonth() === currentMonth && bookingDate.getFullYear() === currentYear;
    });

    const monthlyRevenue = monthlyBookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.price, 0);

    const monthlyBookingsCount = monthlyBookings.length;

    // Calculate trends (comparing with previous month)
    const previousMonth = currentMonth === 0 ? 11 : currentMonth - 1;
    const previousYear = currentMonth === 0 ? currentYear - 1 : currentYear;

    const previousMonthBookings = bookings.filter(b => {
      const bookingDate = b.createdAt.toDate();
      return bookingDate.getMonth() === previousMonth && bookingDate.getFullYear() === previousYear;
    });

    const previousMonthRevenue = previousMonthBookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + b.price, 0);

    const ratingTrend = reviews.length > 0 ? 
      (reviews.filter(r => {
        const reviewDate = r.createdAt.toDate();
        return reviewDate.getMonth() === currentMonth && reviewDate.getFullYear() === currentYear;
      }).length - reviews.filter(r => {
        const reviewDate = r.createdAt.toDate();
        return reviewDate.getMonth() === previousMonth && reviewDate.getFullYear() === previousYear;
      }).length) : 0;

    const reviewTrend = ratingTrend; // Same calculation for now

    // Calculate top services
    const serviceStats = new Map<string, { count: number; revenue: number }>();
    bookings.forEach(booking => {
      if (booking.status === 'Completed') {
        const existing = serviceStats.get(booking.serviceName) || { count: 0, revenue: 0 };
        serviceStats.set(booking.serviceName, {
          count: existing.count + 1,
          revenue: existing.revenue + booking.price
        });
      }
    });

    const topServices = Array.from(serviceStats.entries())
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    // Calculate monthly data for charts
    const monthlyData = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const monthBookings = bookings.filter(b => {
        const bookingDate = b.createdAt.toDate();
        return bookingDate.getMonth() === date.getMonth() && bookingDate.getFullYear() === date.getFullYear();
      });

      const monthRevenue = monthBookings
        .filter(b => b.status === 'Completed')
        .reduce((sum, b) => sum + b.price, 0);

      const monthReviews = reviews.filter(r => {
        const reviewDate = r.createdAt.toDate();
        return reviewDate.getMonth() === date.getMonth() && reviewDate.getFullYear() === date.getFullYear();
      });

      const monthRating = monthReviews.length > 0
        ? monthReviews.reduce((sum, r) => sum + r.rating, 0) / monthReviews.length
        : 0;

      monthlyData.push({
        month: date.toLocaleDateString('en-US', { month: 'short' }),
        revenue: monthRevenue,
        bookings: monthBookings.length,
        ratings: monthRating
      });
    }

    // Calculate rating distribution
    const ratingDistribution = [1, 2, 3, 4, 5].map(rating => ({
      rating,
      count: reviews.filter(r => r.rating === rating).length
    }));

    // Calculate additional metrics
    const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const averageResponseTime = 2.5; // Placeholder - would need to track actual response times
    const featuredPlacementViews = 0; // Placeholder - would need to track from subscription service
    const priorityJobApplications = 0; // Placeholder - would need to track from subscription service

    setAnalyticsData({
      totalRevenue,
      totalBookings,
      completedBookings,
      averageRating,
      totalReviews,
      monthlyRevenue,
      monthlyBookings: monthlyBookingsCount,
      ratingTrend,
      reviewTrend,
      topServices,
      monthlyData,
      ratingDistribution,
      completionRate,
      averageResponseTime,
      featuredPlacementViews,
      priorityJobApplications
    });

    setLoading(false);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-64" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  return (
    <AnalyticsGuard>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {t('title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('subtitle')}
            </p>
          </div>
          <VerifiedProBadge variant="large" />
        </div>

        {analyticsData && (
          <>
            {/* Key Metrics */}
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-0 shadow-soft bg-gradient-to-br from-green-50 to-emerald-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-green-700">
                    {t('totalRevenue')}
                  </CardTitle>
                  <DollarSign className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-green-800">
                    ₱{analyticsData.totalRevenue.toLocaleString()}
                  </div>
                  <p className="text-xs text-green-600 flex items-center gap-1">
                    {analyticsData.monthlyRevenue > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3" />
                        ₱{analyticsData.monthlyRevenue.toLocaleString()} {t('thisMonth')}
                      </>
                    ) : (
                      t('noRevenueThisMonth')
                    )}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft bg-gradient-to-br from-blue-50 to-cyan-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-blue-700">
                    {t('totalBookings')}
                  </CardTitle>
                  <Calendar className="h-4 w-4 text-blue-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-800">
                    {analyticsData.totalBookings}
                  </div>
                  <p className="text-xs text-blue-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3" />
                    {analyticsData.completedBookings} {t('completed')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-yellow-700">
                    {t('averageRating')}
                  </CardTitle>
                  <Star className="h-4 w-4 text-yellow-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-yellow-800">
                    {analyticsData.averageRating.toFixed(1)}
                  </div>
                  <p className="text-xs text-yellow-600 flex items-center gap-1">
                    <MessageSquare className="h-3 w-3" />
                    {analyticsData.totalReviews} {t('reviews')}
                  </p>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-soft bg-gradient-to-br from-purple-50 to-pink-50">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-purple-700">
                    {t('completionRate')}
                  </CardTitle>
                  <Target className="h-4 w-4 text-purple-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-purple-800">
                    {analyticsData.completionRate.toFixed(1)}%
                  </div>
                  <p className="text-xs text-purple-600 flex items-center gap-1">
                    <Award className="h-3 w-3" />
                    {t('excellentPerformance')}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Charts */}
            <Tabs defaultValue="revenue" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="revenue">{t('revenue')}</TabsTrigger>
                <TabsTrigger value="bookings">{t('bookings')}</TabsTrigger>
                <TabsTrigger value="ratings">{t('ratings')}</TabsTrigger>
              </TabsList>

              <TabsContent value="revenue" className="space-y-4">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      {t('revenueTrend')}
                    </CardTitle>
                    <CardDescription>
                      {t('revenueTrendDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={analyticsData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [`₱${value.toLocaleString()}`, t('revenue')]}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Bar dataKey="revenue" fill="#10B981" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="bookings" className="space-y-4">
                <Card className="border-0 shadow-soft">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-blue-600" />
                      {t('bookingTrend')}
                    </CardTitle>
                    <CardDescription>
                      {t('bookingTrendDescription')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart data={analyticsData.monthlyData}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip 
                          formatter={(value: number) => [value, t('bookings')]}
                          labelStyle={{ color: '#374151' }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="bookings" 
                          stroke="#3B82F6" 
                          strokeWidth={3}
                          dot={{ fill: '#3B82F6', strokeWidth: 2, r: 4 }}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="ratings" className="space-y-4">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="border-0 shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Star className="h-5 w-5 text-yellow-600" />
                        {t('ratingTrend')}
                      </CardTitle>
                      <CardDescription>
                        {t('ratingTrendDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <LineChart data={analyticsData.monthlyData}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="month" />
                          <YAxis domain={[0, 5]} />
                          <Tooltip 
                            formatter={(value: number) => [value.toFixed(1), t('averageRating')]}
                            labelStyle={{ color: '#374151' }}
                          />
                          <Line 
                            type="monotone" 
                            dataKey="ratings" 
                            stroke="#F59E0B" 
                            strokeWidth={3}
                            dot={{ fill: '#F59E0B', strokeWidth: 2, r: 4 }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-soft">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-purple-600" />
                        {t('ratingDistribution')}
                      </CardTitle>
                      <CardDescription>
                        {t('ratingDistributionDescription')}
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <ResponsiveContainer width="100%" height={250}>
                        <PieChart>
                          <Pie
                            data={analyticsData.ratingDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={({ rating, count }) => `${rating}★ (${count})`}
                            outerRadius={80}
                            fill="#8884d8"
                            dataKey="count"
                          >
                            {analyticsData.ratingDistribution.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>

            {/* Top Services */}
            <Card className="border-0 shadow-soft">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-purple-600" />
                  {t('topServices')}
                </CardTitle>
                <CardDescription>
                  {t('topServicesDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topServices.map((service, index) => (
                    <div key={service.name} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <div>
                          <h4 className="font-semibold">{service.name}</h4>
                          <p className="text-sm text-muted-foreground">
                            {service.count} {t('bookings')}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-primary">
                          ₱{service.revenue.toLocaleString()}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {t('totalRevenue')}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AnalyticsGuard>
  );
}