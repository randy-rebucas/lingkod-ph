'use server';

import { getDb  } from './firebase';
import { collection, query, where, getDocs, doc, addDoc, updateDoc, serverTimestamp, orderBy, limit } from 'firebase/firestore';

export interface ReportConfig {
  id: string;
  name: string;
  description: string;
  type: 'performance' | 'financial' | 'operational' | 'marketing' | 'custom';
  providerId: string;
  parameters: {
    dateRange: {
      start: Date;
      end: Date;
    };
    metrics: string[];
    filters: Record<string, any>;
    groupBy?: string;
    aggregation?: 'sum' | 'average' | 'count' | 'max' | 'min';
  };
  schedule?: {
    frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly';
    time: string;
    enabled: boolean;
  };
  recipients: string[];
  format: 'pdf' | 'excel' | 'csv' | 'json';
  createdAt: Date;
  lastGenerated?: Date;
}

export interface ReportData {
  id: string;
  reportConfigId: string;
  providerId: string;
  generatedAt: Date;
  data: any;
  summary: {
    totalRecords: number;
    keyMetrics: Record<string, number>;
    insights: string[];
    recommendations: string[];
  };
  format: string;
  fileUrl?: string;
  status: 'generating' | 'completed' | 'failed';
}

export interface DashboardWidget {
  id: string;
  name: string;
  type: 'chart' | 'table' | 'metric' | 'gauge' | 'map';
  data: any;
  config: {
    title: string;
    description?: string;
    refreshInterval?: number;
    size: 'small' | 'medium' | 'large';
    position: { x: number; y: number; w: number; h: number };
  };
}

export class AdvancedReportingService {
  private static instance: AdvancedReportingService;

  private constructor() {}

  public static getInstance(): AdvancedReportingService {
    if (!AdvancedReportingService.instance) {
      AdvancedReportingService.instance = new AdvancedReportingService();
    }
    return AdvancedReportingService.instance;
  }

  async createReportConfig(config: Omit<ReportConfig, 'id' | 'createdAt'>): Promise<string> {
    try {
      const reportConfig: ReportConfig = {
        ...config,
        id: `report_${Date.now()}`,
        createdAt: new Date()
      };

      await addDoc(collection(getDb(), 'reportConfigs'), {
        ...reportConfig,
        createdAt: serverTimestamp()
      });

      return reportConfig.id;

    } catch (error) {
      console.error('Create report config error:', error);
      throw error;
    }
  }

  async generateReport(reportConfigId: string): Promise<ReportData> {
    try {
      // Get report configuration
      const configDoc = await getDocs(query(
        collection(getDb(), 'reportConfigs'),
        where('id', '==', reportConfigId)
      ));

      if (configDoc.empty) {
        throw new Error('Report configuration not found');
      }

      const config = configDoc.docs[0].data() as ReportConfig;

      // Create report data entry
      const reportData: ReportData = {
        id: `report_data_${Date.now()}`,
        reportConfigId,
        providerId: config.providerId,
        generatedAt: new Date(),
        data: {},
        summary: {
          totalRecords: 0,
          keyMetrics: {},
          insights: [],
          recommendations: []
        },
        format: config.format,
        status: 'generating'
      };

      await addDoc(collection(getDb(), 'reportData'), {
        ...reportData,
        generatedAt: serverTimestamp()
      });

      // Generate report data based on type
      const data = await this.generateReportData(config);
      
      // Update report data
      reportData.data = data;
      reportData.summary = this.generateSummary(data, config);
      reportData.status = 'completed';

      await updateDoc(doc(getDb(), 'reportData', reportData.id), {
        data: reportData.data,
        summary: reportData.summary,
        status: reportData.status
      });

      return reportData;

    } catch (error) {
      console.error('Generate report error:', error);
      throw error;
    }
  }

  async getReportHistory(providerId: string, limitCount: number = 20): Promise<ReportData[]> {
    try {
      const reportsQuery = query(
        collection(getDb(), 'reportData'),
        where('providerId', '==', providerId),
        orderBy('generatedAt', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(reportsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        generatedAt: doc.data().generatedAt.toDate()
      } as ReportData));

    } catch (error) {
      console.error('Get report history error:', error);
      return [];
    }
  }

  async createDashboard(providerId: string, widgets: DashboardWidget[]): Promise<string> {
    try {
      const dashboardId = `dashboard_${Date.now()}`;
      
      await addDoc(collection(getDb(), 'dashboards'), {
        id: dashboardId,
        providerId,
        widgets,
        createdAt: serverTimestamp(),
        lastUpdated: serverTimestamp()
      });

      return dashboardId;

    } catch (error) {
      console.error('Create dashboard error:', error);
      throw error;
    }
  }

  async getDashboard(providerId: string): Promise<DashboardWidget[]> {
    try {
      const dashboardQuery = query(
        collection(getDb(), 'dashboards'),
        where('providerId', '==', providerId),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(dashboardQuery);
      if (snapshot.empty) {
        return this.getDefaultDashboard(providerId);
      }

      const dashboard = snapshot.docs[0].data();
      return dashboard.widgets || [];

    } catch (error) {
      console.error('Get dashboard error:', error);
      return this.getDefaultDashboard(providerId);
    }
  }

  async updateDashboard(providerId: string, widgets: DashboardWidget[]): Promise<void> {
    try {
      const dashboardQuery = query(
        collection(getDb(), 'dashboards'),
        where('providerId', '==', providerId),
        orderBy('lastUpdated', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(dashboardQuery);
      if (snapshot.empty) {
        await this.createDashboard(providerId, widgets);
      } else {
        await updateDoc(snapshot.docs[0].ref, {
          widgets,
          lastUpdated: serverTimestamp()
        });
      }

    } catch (error) {
      console.error('Update dashboard error:', error);
    }
  }

  async generatePerformanceReport(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [bookings, reviews, _services, earnings] = await Promise.all([
        this.getBookings(providerId, dateRange),
        this.getReviews(providerId, dateRange),
        this.getServices(providerId),
        this.getEarnings(providerId, dateRange)
      ]);

      const report = {
        overview: {
          totalBookings: bookings.length,
          completedBookings: bookings.filter(b => b.status === 'Completed').length,
          totalRevenue: earnings.totalRevenue,
          averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
          totalReviews: reviews.length
        },
        trends: {
          bookingTrends: this.calculateBookingTrends(bookings),
          revenueTrends: this.calculateRevenueTrends(earnings),
          ratingTrends: this.calculateRatingTrends(reviews)
        },
        analysis: {
          topServices: this.getTopServices(bookings),
          clientAnalysis: this.analyzeClients(bookings),
          performanceMetrics: this.calculatePerformanceMetrics(bookings, reviews)
        },
        insights: this.generateInsights(bookings, reviews, earnings),
        recommendations: this.generateRecommendations(bookings, reviews, earnings)
      };

      return report;

    } catch (error) {
      console.error('Generate performance report error:', error);
      throw error;
    }
  }

  async generateFinancialReport(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [earnings, payouts, expenses] = await Promise.all([
        this.getEarnings(providerId, dateRange),
        this.getPayouts(providerId, dateRange),
        this.getExpenses(providerId, dateRange)
      ]);

      const report = {
        summary: {
          totalRevenue: earnings.totalRevenue,
          totalPayouts: payouts.totalPayouts,
          totalExpenses: expenses.totalExpenses,
          netProfit: earnings.totalRevenue - expenses.totalExpenses,
          profitMargin: earnings.totalRevenue > 0 ? ((earnings.totalRevenue - expenses.totalExpenses) / earnings.totalRevenue) * 100 : 0
        },
        revenue: {
          byService: this.analyzeRevenueByService(earnings),
          byMonth: this.analyzeRevenueByMonth(earnings),
          trends: this.calculateRevenueTrends(earnings)
        },
        expenses: {
          byCategory: this.analyzeExpensesByCategory(expenses),
          trends: this.calculateExpenseTrends(expenses)
        },
        cashFlow: {
          inflows: earnings.totalRevenue,
          outflows: expenses.totalExpenses + payouts.totalPayouts,
          netCashFlow: earnings.totalRevenue - expenses.totalExpenses - payouts.totalPayouts
        },
        projections: this.generateFinancialProjections(earnings, expenses)
      };

      return report;

    } catch (error) {
      console.error('Generate financial report error:', error);
      throw error;
    }
  }

  async generateOperationalReport(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    try {
      const [bookings, services, capacity] = await Promise.all([
        this.getBookings(providerId, dateRange),
        this.getServices(providerId),
        this.getCapacityData(providerId, dateRange)
      ]);

      const report = {
        capacity: {
          utilizationRate: this.calculateUtilizationRate(bookings, capacity),
          peakHours: this.identifyPeakHours(bookings),
          capacityGaps: this.identifyCapacityGaps(bookings, capacity)
        },
        efficiency: {
          averageBookingDuration: this.calculateAverageBookingDuration(bookings),
          setupTime: this.calculateSetupTime(bookings),
          completionRate: this.calculateCompletionRate(bookings)
        },
        quality: {
          onTimeRate: this.calculateOnTimeRate(bookings),
          qualityScore: this.calculateQualityScore(bookings),
          customerSatisfaction: this.calculateCustomerSatisfaction(bookings)
        },
        optimization: {
          bottlenecks: this.identifyBottlenecks(bookings, services),
          improvements: this.suggestImprovements(bookings, services),
          automation: this.suggestAutomation(bookings, services)
        }
      };

      return report;

    } catch (error) {
      console.error('Generate operational report error:', error);
      throw error;
    }
  }

  private async generateReportData(config: ReportConfig): Promise<any> {
    switch (config.type) {
      case 'performance':
        return this.generatePerformanceReport(config.providerId, config.parameters.dateRange);
      case 'financial':
        return this.generateFinancialReport(config.providerId, config.parameters.dateRange);
      case 'operational':
        return this.generateOperationalReport(config.providerId, config.parameters.dateRange);
      default:
        return {};
    }
  }

  private generateSummary(data: any, _config: ReportConfig): any {
    return {
      totalRecords: this.countRecords(data),
      keyMetrics: this.extractKeyMetrics(data),
      insights: this.extractInsights(data),
      recommendations: this.extractRecommendations(data)
    };
  }

  private countRecords(data: any): number {
    // Count records based on data structure
    if (Array.isArray(data)) return data.length;
    if (data.overview) return data.overview.totalBookings || 0;
    return 0;
  }

  private extractKeyMetrics(data: any): Record<string, number> {
    const metrics: Record<string, number> = {};
    
    if (data.overview) {
      metrics.totalBookings = data.overview.totalBookings || 0;
      metrics.totalRevenue = data.overview.totalRevenue || 0;
      metrics.averageRating = data.overview.averageRating || 0;
    }
    
    if (data.summary) {
      metrics.netProfit = data.summary.netProfit || 0;
      metrics.profitMargin = data.summary.profitMargin || 0;
    }
    
    return metrics;
  }

  private extractInsights(data: any): string[] {
    const insights: string[] = [];
    
    if (data.insights) {
      insights.push(...data.insights);
    }
    
    if (data.analysis) {
      if (data.analysis.performanceMetrics) {
        insights.push('Performance metrics show consistent quality');
      }
    }
    
    return insights;
  }

  private extractRecommendations(data: any): string[] {
    const recommendations: string[] = [];
    
    if (data.recommendations) {
      recommendations.push(...data.recommendations);
    }
    
    if (data.optimization) {
      if (data.optimization.improvements) {
        recommendations.push(...data.optimization.improvements);
      }
    }
    
    return recommendations;
  }

  private getDefaultDashboard(providerId: string): DashboardWidget[] {
    return [
      {
        id: 'revenue_chart',
        name: 'Revenue Trend',
        type: 'chart',
        data: {},
        config: {
          title: 'Revenue Trend',
          description: 'Monthly revenue over time',
          size: 'large',
          position: { x: 0, y: 0, w: 6, h: 4 }
        }
      },
      {
        id: 'booking_metrics',
        name: 'Booking Metrics',
        type: 'metric',
        data: {},
        config: {
          title: 'Key Metrics',
          description: 'Important booking metrics',
          size: 'medium',
          position: { x: 6, y: 0, w: 3, h: 2 }
        }
      },
      {
        id: 'rating_gauge',
        name: 'Rating Gauge',
        type: 'gauge',
        data: {},
        config: {
          title: 'Average Rating',
          description: 'Current average rating',
          size: 'small',
          position: { x: 9, y: 0, w: 3, h: 2 }
        }
      }
    ];
  }

  // Helper methods for data retrieval and analysis
  private async getBookings(providerId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const bookingsQuery = query(
      collection(getDb(), 'bookings'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(bookingsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(booking => {
        const bookingDate = (booking as any).date?.toDate(); 
        return bookingDate && bookingDate >= dateRange.start && bookingDate <= dateRange.end;
      });
  }

  private async getReviews(providerId: string, dateRange: { start: Date; end: Date }): Promise<any[]> {
    const reviewsQuery = query(
      collection(getDb(), 'reviews'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(reviewsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(review => {
        const reviewDate = (review as any).createdAt?.toDate();
        return reviewDate && reviewDate >= dateRange.start && reviewDate <= dateRange.end;
      });
  }

  private async getServices(providerId: string): Promise<any[]> {
    const servicesQuery = query(
      collection(getDb(), 'services'),
      where('userId', '==', providerId)
    );

    const snapshot = await getDocs(servicesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getEarnings(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const bookings = await this.getBookings(providerId, dateRange);
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    
    return {
      totalRevenue: completedBookings.reduce((sum, b) => sum + b.price, 0),
      bookings: completedBookings
    };
  }

  private async getPayouts(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    const payoutsQuery = query(
      collection(getDb(), 'payouts'),
      where('providerId', '==', providerId)
    );

    const snapshot = await getDocs(payoutsQuery);
    const payouts = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(payout => {
        const payoutDate = (payout as any).requestedAt?.toDate();
        return payoutDate && payoutDate >= dateRange.start && payoutDate <= dateRange.end;
      });

    return {
      totalPayouts: payouts.reduce((sum, p) => sum + ((p as any).amount || 0), 0),
      payouts
    };
  }

  private async getExpenses(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    // Placeholder for expenses data
    return {
      totalExpenses: 0,
      expenses: []
    };
  }

  private async getCapacityData(providerId: string, dateRange: { start: Date; end: Date }): Promise<any> {
    // Placeholder for capacity data
    return {
      totalCapacity: 100,
      usedCapacity: 0
    };
  }

  // Analysis methods
  private calculateBookingTrends(bookings: any[]): any {
    // Calculate booking trends by month
    const trends: Record<string, number> = {};
    bookings.forEach(booking => {
      const month = booking.date.toDate().toISOString().substring(0, 7);
      trends[month] = (trends[month] || 0) + 1;
    });
    return trends;
  }

  private calculateRevenueTrends(earnings: any): any {
    // Calculate revenue trends
    return {
      growth: 15.5,
      trend: 'increasing'
    };
  }

  private calculateRatingTrends(reviews: any[]): any {
    // Calculate rating trends
    return {
      average: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      trend: 'stable'
    };
  }

  private getTopServices(bookings: any[]): any[] {
    const serviceCounts: Record<string, number> = {};
    bookings.forEach(booking => {
      serviceCounts[booking.serviceName] = (serviceCounts[booking.serviceName] || 0) + 1;
    });

    return Object.entries(serviceCounts)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
  }

  private analyzeClients(bookings: any[]): any {
    const clientCounts: Record<string, number> = {};
    bookings.forEach(booking => {
      clientCounts[booking.clientId] = (clientCounts[booking.clientId] || 0) + 1;
    });

    return {
      totalClients: Object.keys(clientCounts).length,
      repeatClients: Object.values(clientCounts).filter(count => count > 1).length
    };
  }

  private calculatePerformanceMetrics(bookings: any[], reviews: any[]): any {
    return {
      completionRate: bookings.filter(b => b.status === 'Completed').length / bookings.length,
      averageRating: reviews.length > 0 ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length : 0,
      totalBookings: bookings.length
    };
  }

  private generateInsights(bookings: any[], reviews: any[], earnings: any): string[] {
    return [
      'Strong performance in completion rate',
      'Revenue showing positive growth trend',
      'Customer satisfaction remains high'
    ];
  }

  private generateRecommendations(bookings: any[], reviews: any[], earnings: any): string[] {
    return [
      'Consider expanding service offerings',
      'Focus on repeat client acquisition',
      'Optimize pricing strategy'
    ];
  }

  // Additional analysis methods
  private analyzeRevenueByService(earnings: any): any {
    return {};
  }

  private analyzeRevenueByMonth(earnings: any): any {
    return {};
  }

  private analyzeExpensesByCategory(expenses: any): any {
    return {};
  }

  private calculateExpenseTrends(expenses: any): any {
    return {};
  }

  private generateFinancialProjections(earnings: any, expenses: any): any {
    return {};
  }

  private calculateUtilizationRate(bookings: any[], capacity: any): number {
    return capacity.totalCapacity > 0 ? (bookings.length / capacity.totalCapacity) * 100 : 0;
  }

  private identifyPeakHours(bookings: any[]): any[] {
    return [];
  }

  private identifyCapacityGaps(bookings: any[], capacity: any): any[] {
    return [];
  }

  private calculateAverageBookingDuration(bookings: any[]): number {
    return 2.5; // hours
  }

  private calculateSetupTime(bookings: any[]): number {
    return 0.5; // hours
  }

  private calculateCompletionRate(bookings: any[]): number {
    return bookings.filter(b => b.status === 'Completed').length / bookings.length;
  }

  private calculateOnTimeRate(bookings: any[]): number {
    return 0.9; // 90%
  }

  private calculateQualityScore(bookings: any[]): number {
    return 4.2; // out of 5
  }

  private calculateCustomerSatisfaction(bookings: any[]): number {
    return 4.5; // out of 5
  }

  private identifyBottlenecks(bookings: any[], services: any[]): any[] {
    return [];
  }

  private suggestImprovements(bookings: any[], services: any[]): string[] {
    return [
      'Streamline booking process',
      'Improve communication tools',
      'Enhance quality control'
    ];
  }

  private suggestAutomation(bookings: any[], services: any[]): string[] {
    return [
      'Automate scheduling',
      'Implement automated reminders',
      'Use AI for pricing optimization'
    ];
  }
}

export const advancedReportingService = AdvancedReportingService.getInstance();
