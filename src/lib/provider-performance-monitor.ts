'use server';

import { db } from './firebase';
import { collection, query, where, getDocs, doc, updateDoc, addDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';
import { financialAuditLogger } from './financial-audit-logger';

export interface PerformanceMetrics {
  providerId: string;
  period: 'daily' | 'weekly' | 'monthly';
  date: Date;
  metrics: {
    // Booking metrics
    totalBookings: number;
    completedBookings: number;
    cancelledBookings: number;
    completionRate: number;
    
    // Revenue metrics
    totalRevenue: number;
    averageBookingValue: number;
    
    // Client metrics
    totalClients: number;
    repeatClients: number;
    clientRetentionRate: number;
    
    // Review metrics
    totalReviews: number;
    averageRating: number;
    positiveReviews: number;
    negativeReviews: number;
    
    // Response metrics
    averageResponseTime: number; // in hours
    responseRate: number; // percentage
    
    // Activity metrics
    activeDays: number;
    servicesOffered: number;
    jobApplications: number;
    
    // Quality metrics
    onTimeRate: number;
    qualityScore: number;
  };
  trends: {
    revenueGrowth: number;
    bookingGrowth: number;
    ratingTrend: number;
    clientGrowth: number;
  };
}

export interface PerformanceAlert {
  id: string;
  providerId: string;
  type: 'performance_decline' | 'suspicious_activity' | 'quality_issue' | 'revenue_drop';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  details: any;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export class ProviderPerformanceMonitor {
  private static instance: ProviderPerformanceMonitor;

  private constructor() {}

  public static getInstance(): ProviderPerformanceMonitor {
    if (!ProviderPerformanceMonitor.instance) {
      ProviderPerformanceMonitor.instance = new ProviderPerformanceMonitor();
    }
    return ProviderPerformanceMonitor.instance;
  }

  async calculatePerformanceMetrics(
    providerId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly'
  ): Promise<PerformanceMetrics> {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(endDate, period);

      // Get all relevant data
      const [bookings, reviews, messages, services, jobApplications] = await Promise.all([
        this.getBookings(providerId, startDate, endDate),
        this.getReviews(providerId, startDate, endDate),
        this.getMessages(providerId, startDate, endDate),
        this.getServices(providerId),
        this.getJobApplications(providerId, startDate, endDate)
      ]);

      // Calculate metrics
      const metrics = this.calculateMetrics(bookings, reviews, messages, services, jobApplications, period);
      
      // Calculate trends
      const trends = await this.calculateTrends(providerId, period, metrics);

      const performanceMetrics: PerformanceMetrics = {
        providerId,
        period,
        date: endDate,
        metrics,
        trends
      };

      // Store metrics
      await this.storePerformanceMetrics(performanceMetrics);

      // Check for alerts
      await this.checkPerformanceAlerts(providerId, performanceMetrics);

      return performanceMetrics;

    } catch (error) {
      console.error('Calculate performance metrics error:', error);
      throw error;
    }
  }

  async getPerformanceHistory(
    providerId: string,
    period: 'daily' | 'weekly' | 'monthly' = 'weekly',
    limitCount: number = 12
  ): Promise<PerformanceMetrics[]> {
    try {
      const metricsQuery = query(
        collection(db, 'performanceMetrics'),
        where('providerId', '==', providerId),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(metricsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate()
      } as PerformanceMetrics));

    } catch (error) {
      console.error('Get performance history error:', error);
      return [];
    }
  }

  async getPerformanceAlerts(providerId: string): Promise<PerformanceAlert[]> {
    try {
      const alertsQuery = query(
        collection(db, 'performanceAlerts'),
        where('providerId', '==', providerId),
        where('resolved', '==', false),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(alertsQuery);
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp.toDate(),
        resolvedAt: doc.data().resolvedAt?.toDate()
      } as PerformanceAlert));

    } catch (error) {
      console.error('Get performance alerts error:', error);
      return [];
    }
  }

  async resolveAlert(alertId: string, resolvedBy: string): Promise<void> {
    try {
      await updateDoc(doc(db, 'performanceAlerts', alertId), {
        resolved: true,
        resolvedAt: serverTimestamp(),
        resolvedBy
      });
    } catch (error) {
      console.error('Resolve alert error:', error);
    }
  }

  private async getBookings(providerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(booking => {
        const bookingDate = (booking as any).date?.toDate();
        return bookingDate && bookingDate >= startDate && bookingDate <= endDate;
      });
  }

  private async getReviews(providerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    const reviewsQuery = query(
      collection(db, 'reviews'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(review => {
        const reviewDate = (review as any).createdAt?.toDate();
        return reviewDate >= startDate && reviewDate <= endDate;
      });
  }

  private async getMessages(providerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Get conversations where provider is a participant
    const conversationsQuery = query(
      collection(db, 'conversations'),
      where('participants', 'array-contains', providerId)
    );

    const conversationsSnapshot = await getDocs(conversationsQuery);
    const conversationIds = conversationsSnapshot.docs.map(doc => doc.id);

    // Get messages from these conversations
    const allMessages: any[] = [];
    for (const conversationId of conversationIds) {
      const messagesQuery = query(
        collection(db, 'conversations', conversationId, 'messages'),
        where('senderId', '==', providerId)
      );

      const messagesSnapshot = await getDocs(messagesQuery);
      const messages = messagesSnapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(message => {
          const messageDate = (message as any).timestamp?.toDate();
          return messageDate >= startDate && messageDate <= endDate;
        });

      allMessages.push(...messages);
    }

    return allMessages;
  }

  private async getServices(providerId: string): Promise<any[]> {
    const servicesQuery = query(
      collection(db, 'services'),
      where('userId', '==', providerId)
    );

    const snapshot = await getDocs(servicesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getJobApplications(providerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Note: This is a simplified implementation. In a real application, you would need
    // to track application timestamps separately, as the current structure doesn't
    // support filtering by application date.
    const jobsQuery = query(
      collection(db, 'jobs'),
      where('applications', 'array-contains', providerId)
    );

    const snapshot = await getDocs(jobsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(job => {
        // Filter by job creation date as a proxy for application date
        // In production, consider adding an applications subcollection with timestamps
        const jobDate = (job as any).createdAt?.toDate();
        return jobDate && jobDate >= startDate && jobDate <= endDate;
      });
  }

  private calculateMetrics(
    bookings: any[],
    reviews: any[],
    messages: any[],
    services: any[],
    jobApplications: any[],
    period: string
  ): any {
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
    const completionRate = totalBookings > 0 ? completedBookings / totalBookings : 0;

    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

    const uniqueClients = new Set(bookings.map(b => b.clientId)).size;
    const repeatClients = bookings
      .reduce((acc, b) => {
        acc[b.clientId] = (acc[b.clientId] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
    const repeatClientCount = Object.values(repeatClients).filter(count => (count as number) > 1).length;
    const clientRetentionRate = uniqueClients > 0 ? repeatClientCount / uniqueClients : 0;

    const totalReviews = reviews.length;
    const averageRating = totalReviews > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / totalReviews 
      : 0;
    const positiveReviews = reviews.filter(r => r.rating >= 4).length;
    const negativeReviews = reviews.filter(r => r.rating <= 2).length;

    // Calculate response time (simplified)
    const averageResponseTime = messages.length > 0 ? 2 : 0; // Placeholder
    const responseRate = 0.95; // Placeholder

    // Calculate active days
    const activeDays = new Set(
      bookings.map(b => (b as any).date?.toDate().toDateString())
    ).size;

    const servicesOffered = services.length;
    const jobApplicationsCount = jobApplications.length;

    // Calculate on-time rate (simplified)
    const onTimeRate = 0.9; // Placeholder
    const qualityScore = (averageRating * 20) + (completionRate * 30) + (onTimeRate * 20) + (clientRetentionRate * 30);

    return {
      totalBookings,
      completedBookings,
      cancelledBookings,
      completionRate,
      totalRevenue,
      averageBookingValue,
      totalClients: uniqueClients,
      repeatClients: repeatClientCount,
      clientRetentionRate,
      totalReviews,
      averageRating,
      positiveReviews,
      negativeReviews,
      averageResponseTime,
      responseRate,
      activeDays,
      servicesOffered,
      jobApplications: jobApplicationsCount,
      onTimeRate,
      qualityScore
    };
  }

  private async calculateTrends(
    providerId: string,
    period: string,
    currentMetrics: any
  ): Promise<any> {
    // Get previous period metrics for comparison
    const previousMetrics = await this.getPreviousPeriodMetrics(providerId, period);
    
    if (!previousMetrics) {
      return {
        revenueGrowth: 0,
        bookingGrowth: 0,
        ratingTrend: 0,
        clientGrowth: 0
      };
    }

    const revenueGrowth = previousMetrics.totalRevenue > 0 
      ? ((currentMetrics.totalRevenue - previousMetrics.totalRevenue) / previousMetrics.totalRevenue) * 100
      : 0;

    const bookingGrowth = previousMetrics.totalBookings > 0
      ? ((currentMetrics.totalBookings - previousMetrics.totalBookings) / previousMetrics.totalBookings) * 100
      : 0;

    const ratingTrend = currentMetrics.averageRating - previousMetrics.averageRating;

    const clientGrowth = previousMetrics.totalClients > 0
      ? ((currentMetrics.totalClients - previousMetrics.totalClients) / previousMetrics.totalClients) * 100
      : 0;

    return {
      revenueGrowth,
      bookingGrowth,
      ratingTrend,
      clientGrowth
    };
  }

  private async getPreviousPeriodMetrics(providerId: string, period: string): Promise<any> {
    try {
      const metricsQuery = query(
        collection(db, 'performanceMetrics'),
        where('providerId', '==', providerId),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(2)
      );

      const snapshot = await getDocs(metricsQuery);
      const metrics = snapshot.docs.map(doc => doc.data());
      
      return metrics.length > 1 ? metrics[1] : null;
    } catch (error) {
      return null;
    }
  }

  private async storePerformanceMetrics(metrics: PerformanceMetrics): Promise<void> {
    try {
      await addDoc(collection(db, 'performanceMetrics'), {
        ...metrics,
        date: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error('Store performance metrics error:', error);
    }
  }

  private async checkPerformanceAlerts(providerId: string, metrics: PerformanceMetrics): Promise<void> {
    const alerts: Omit<PerformanceAlert, 'id'>[] = [];

    // Check for performance decline
    if (metrics.metrics.completionRate < 0.7) {
      alerts.push({
        providerId,
        type: 'performance_decline',
        severity: 'high',
        message: 'Completion rate is below 70%',
        details: { completionRate: metrics.metrics.completionRate },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for quality issues
    if (metrics.metrics.averageRating < 3.0) {
      alerts.push({
        providerId,
        type: 'quality_issue',
        severity: 'high',
        message: 'Average rating is below 3.0',
        details: { averageRating: metrics.metrics.averageRating },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for revenue drop
    if (metrics.trends.revenueGrowth < -20) {
      alerts.push({
        providerId,
        type: 'revenue_drop',
        severity: 'medium',
        message: 'Revenue has dropped by more than 20%',
        details: { revenueGrowth: metrics.trends.revenueGrowth },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Check for suspicious activity
    if (metrics.metrics.cancelledBookings > metrics.metrics.completedBookings) {
      alerts.push({
        providerId,
        type: 'suspicious_activity',
        severity: 'critical',
        message: 'More bookings cancelled than completed',
        details: { 
          cancelledBookings: metrics.metrics.cancelledBookings,
          completedBookings: metrics.metrics.completedBookings
        },
        timestamp: new Date(),
        resolved: false
      });
    }

    // Store alerts
    for (const alert of alerts) {
      await addDoc(collection(db, 'performanceAlerts'), {
        ...alert,
        timestamp: serverTimestamp() as Timestamp
      });

      // Log alert
      await financialAuditLogger.logSecurityEvent(
        `performance_alert_${alert.type}`,
        { ...alert.details, severity: alert.severity, providerId }
      );
    }
  }

  private getStartDate(endDate: Date, period: string): Date {
    const startDate = new Date(endDate);
    
    switch (period) {
      case 'daily':
        startDate.setDate(startDate.getDate() - 1);
        break;
      case 'weekly':
        startDate.setDate(startDate.getDate() - 7);
        break;
      case 'monthly':
        startDate.setMonth(startDate.getMonth() - 1);
        break;
    }
    
    return startDate;
  }
}

export const providerPerformanceMonitor = ProviderPerformanceMonitor.getInstance();
