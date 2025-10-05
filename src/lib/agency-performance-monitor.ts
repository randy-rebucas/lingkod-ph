import { getDb  } from './firebase';
import { collection, query, where, getDocs, Timestamp } from 'firebase/firestore';

export interface AgencyPerformanceMetrics {
  agencyId: string;
  agencyName: string;
  period: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly';
  startDate: Date;
  endDate: Date;
  
  // Provider Metrics
  totalProviders: number;
  activeProviders: number;
  newProviders: number;
  providerRetentionRate: number;
  
  // Booking Metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  bookingCompletionRate: number;
  averageBookingValue: number;
  totalRevenue: number;
  
  // Job Metrics
  totalJobsPosted: number;
  activeJobs: number;
  completedJobs: number;
  jobCompletionRate: number;
  
  // Financial Metrics
  totalPayouts: number;
  pendingPayouts: number;
  averagePayoutAmount: number;
  payoutProcessingTime: number; // in hours
  
  // Performance Scores
  overallScore: number; // 0-100
  providerManagementScore: number;
  financialManagementScore: number;
  operationalEfficiencyScore: number;
  customerSatisfactionScore: number;
  
  // Trends
  revenueGrowth: number; // percentage
  providerGrowth: number; // percentage
  bookingGrowth: number; // percentage
  
  // Timestamps
  calculatedAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface AgencyPerformanceTrend {
  period: string;
  metrics: Partial<AgencyPerformanceMetrics>;
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
}

export interface AgencyBenchmark {
  metric: string;
  agencyValue: number;
  industryAverage: number;
  percentile: number; // 0-100
  status: 'above_average' | 'average' | 'below_average';
}

export class AgencyPerformanceMonitor {
  private agencyId: string;
  private agencyName: string;

  constructor(agencyId: string, agencyName: string) {
    this.agencyId = agencyId;
    this.agencyName = agencyName;
  }

  /**
   * Calculate comprehensive performance metrics for a period
   */
  async calculatePerformanceMetrics(
    period: AgencyPerformanceMetrics['period'],
    startDate: Date,
    endDate: Date
  ): Promise<AgencyPerformanceMetrics> {
    try {
      // Get all providers for this agency
      const providersQuery = query(
        collection(getDb(), 'users'),
        where('agencyId', '==', this.agencyId),
        where('role', '==', 'provider')
      );
      const providersSnapshot = await getDocs(providersQuery);
      const providerIds = providersSnapshot.docs.map(doc => doc.id);
      const providers = providersSnapshot.docs.map(doc => doc.data());

      // Get bookings for the period
      const bookingsQuery = query(
        collection(getDb(), 'bookings'),
        where('providerId', 'in', providerIds),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());

      // Get jobs posted by agency
      const jobsQuery = query(
        collection(getDb(), 'jobs'),
        where('agencyId', '==', this.agencyId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const jobsSnapshot = await getDocs(jobsQuery);
      const jobs = jobsSnapshot.docs.map(doc => doc.data());

      // Get payouts for the period
      const payoutsQuery = query(
        collection(getDb(), 'payouts'),
        where('agencyId', '==', this.agencyId),
        where('requestedAt', '>=', startDate),
        where('requestedAt', '<=', endDate)
      );
      const payoutsSnapshot = await getDocs(payoutsQuery);
      const payouts = payoutsSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const metrics = this.calculateMetrics(
        providers,
        bookings,
        jobs,
        payouts,
        period,
        startDate,
        endDate
      );

      return metrics;
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Get performance trends over time
   */
  async getPerformanceTrends(
    metric: keyof AgencyPerformanceMetrics,
    periods: number = 12
  ): Promise<AgencyPerformanceTrend[]> {
    try {
      const trends: AgencyPerformanceTrend[] = [];
      const now = new Date();

      for (let i = periods - 1; i >= 0; i--) {
        const endDate = new Date(now);
        const startDate = new Date(now);

        // Adjust dates based on period
        if (metric.includes('daily') || metric.includes('booking') || metric.includes('revenue')) {
          endDate.setDate(endDate.getDate() - (i * 7)); // Weekly periods
          startDate.setDate(startDate.getDate() - ((i + 1) * 7));
        } else {
          endDate.setMonth(endDate.getMonth() - i);
          startDate.setMonth(startDate.getMonth() - (i + 1));
        }

        const periodMetrics = await this.calculatePerformanceMetrics(
          'monthly',
          startDate,
          endDate
        );

        const periodName = `${startDate.getMonth() + 1}/${startDate.getFullYear()}`;
        
        trends.push({
          period: periodName,
          metrics: { [metric]: periodMetrics[metric] },
          trend: this.calculateTrend(trends, periodMetrics[metric] as number),
          changePercentage: this.calculateChangePercentage(trends, periodMetrics[metric] as number),
        });
      }

      return trends;
    } catch (error) {
      console.error('Error getting performance trends:', error);
      return [];
    }
  }

  /**
   * Get performance benchmarks against industry standards
   */
  async getPerformanceBenchmarks(
    metrics: AgencyPerformanceMetrics
  ): Promise<AgencyBenchmark[]> {
    // Industry benchmarks (these would typically come from a database or external API)
    const industryBenchmarks = {
      providerRetentionRate: 85,
      bookingCompletionRate: 90,
      jobCompletionRate: 80,
      averageBookingValue: 2500,
      payoutProcessingTime: 24,
      overallScore: 75,
    };

    const benchmarks: AgencyBenchmark[] = [];

    // Calculate benchmarks for key metrics
    Object.entries(industryBenchmarks).forEach(([metric, industryAverage]) => {
      const agencyValue = metrics[metric as keyof AgencyPerformanceMetrics] as number;
      const percentile = this.calculatePercentile(agencyValue, industryAverage);
      
      benchmarks.push({
        metric,
        agencyValue,
        industryAverage,
        percentile,
        status: this.getBenchmarkStatus(percentile),
      });
    });

    return benchmarks;
  }

  /**
   * Get performance alerts and recommendations
   */
  async getPerformanceAlerts(metrics: AgencyPerformanceMetrics): Promise<{
    alerts: Array<{
      type: 'warning' | 'error' | 'info';
      message: string;
      metric: string;
      currentValue: number;
      recommendedValue: number;
    }>;
    recommendations: Array<{
      category: string;
      title: string;
      description: string;
      priority: 'high' | 'medium' | 'low';
    }>;
  }> {
    const alerts: any[] = [];
    const recommendations: any[] = [];

    // Check for low performance metrics
    if (metrics.providerRetentionRate < 70) {
      alerts.push({
        type: 'warning',
        message: 'Provider retention rate is below industry average',
        metric: 'providerRetentionRate',
        currentValue: metrics.providerRetentionRate,
        recommendedValue: 85,
      });

      recommendations.push({
        category: 'Provider Management',
        title: 'Improve Provider Retention',
        description: 'Focus on provider satisfaction and support to improve retention rates',
        priority: 'high',
      });
    }

    if (metrics.bookingCompletionRate < 80) {
      alerts.push({
        type: 'warning',
        message: 'Booking completion rate needs improvement',
        metric: 'bookingCompletionRate',
        currentValue: metrics.bookingCompletionRate,
        recommendedValue: 90,
      });

      recommendations.push({
        category: 'Operations',
        title: 'Optimize Booking Process',
        description: 'Review and improve the booking workflow to reduce cancellations',
        priority: 'medium',
      });
    }

    if (metrics.payoutProcessingTime > 48) {
      alerts.push({
        type: 'error',
        message: 'Payout processing time is too long',
        metric: 'payoutProcessingTime',
        currentValue: metrics.payoutProcessingTime,
        recommendedValue: 24,
      });

      recommendations.push({
        category: 'Financial Management',
        title: 'Streamline Payout Process',
        description: 'Implement automated payout processing to reduce delays',
        priority: 'high',
      });
    }

    return { alerts, recommendations };
  }

  /**
   * Calculate comprehensive metrics from raw data
   */
  private calculateMetrics(
    providers: any[],
    bookings: any[],
    jobs: any[],
    payouts: any[],
    period: AgencyPerformanceMetrics['period'],
    startDate: Date,
    endDate: Date
  ): AgencyPerformanceMetrics {
    // Provider metrics
    const totalProviders = providers.length;
    const activeProviders = providers.filter(p => p.status === 'active').length;
    const newProviders = providers.filter(p => 
      p.createdAt && new Date(p.createdAt.toDate()) >= startDate
    ).length;

    // Booking metrics
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
    const totalRevenue = bookings.filter(b => b.status === 'Completed').reduce((sum: number, b: any) => sum + (b.price || 0), 0);

    // Job metrics
    const totalJobsPosted = jobs.length;
    const activeJobs = jobs.filter(j => j.status === 'active').length;
    const completedJobs = jobs.filter(j => j.status === 'completed').length;

    // Financial metrics
    const totalPayouts = payouts.length;
    const pendingPayouts = payouts.filter(p => p.status === 'Pending').length;
    const totalPayoutAmount = payouts.reduce((sum: number, p: any) => sum + (p.amount || 0), 0);

    // Calculate rates and averages
    const providerRetentionRate = totalProviders > 0 ? (activeProviders / totalProviders) * 100 : 0;
    const bookingCompletionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
    const jobCompletionRate = totalJobsPosted > 0 ? (completedJobs / totalJobsPosted) * 100 : 0;
    const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;
    const averagePayoutAmount = totalPayouts > 0 ? totalPayoutAmount / totalPayouts : 0;

    // Calculate performance scores
    const providerManagementScore = this.calculateProviderManagementScore(
      providerRetentionRate,
      newProviders,
      totalProviders
    );

    const financialManagementScore = this.calculateFinancialManagementScore(
      totalRevenue,
      averagePayoutAmount,
      pendingPayouts
    );

    const operationalEfficiencyScore = this.calculateOperationalEfficiencyScore(
      bookingCompletionRate,
      jobCompletionRate,
      averageBookingValue
    );

    const customerSatisfactionScore = this.calculateCustomerSatisfactionScore(
      bookingCompletionRate,
      cancelledBookings,
      totalBookings
    );

    const overallScore = (
      providerManagementScore +
      financialManagementScore +
      operationalEfficiencyScore +
      customerSatisfactionScore
    ) / 4;

    return {
      agencyId: this.agencyId,
      agencyName: this.agencyName,
      period,
      startDate,
      endDate,
      totalProviders,
      activeProviders,
      newProviders,
      providerRetentionRate,
      totalBookings,
      completedBookings,
      cancelledBookings,
      bookingCompletionRate,
      averageBookingValue,
      totalRevenue,
      totalJobsPosted,
      activeJobs,
      completedJobs,
      jobCompletionRate,
      totalPayouts,
      pendingPayouts,
      averagePayoutAmount,
      payoutProcessingTime: 24, // Default value, would be calculated from actual data
      overallScore,
      providerManagementScore,
      financialManagementScore,
      operationalEfficiencyScore,
      customerSatisfactionScore,
      revenueGrowth: 0, // Would be calculated from historical data
      providerGrowth: 0, // Would be calculated from historical data
      bookingGrowth: 0, // Would be calculated from historical data
      calculatedAt: new Date() as any,
      lastUpdated: new Date() as any,
    };
  }

  /**
   * Calculate provider management score
   */
  private calculateProviderManagementScore(
    retentionRate: number,
    newProviders: number,
    totalProviders: number
  ): number {
    const retentionScore = Math.min(retentionRate, 100);
    const growthScore = totalProviders > 0 ? Math.min((newProviders / totalProviders) * 100, 100) : 0;
    
    return (retentionScore + growthScore) / 2;
  }

  /**
   * Calculate financial management score
   */
  private calculateFinancialManagementScore(
    totalRevenue: number,
    averagePayoutAmount: number,
    pendingPayouts: number
  ): number {
    const revenueScore = Math.min(totalRevenue / 10000 * 100, 100); // Scale based on 10k revenue
    const payoutScore = pendingPayouts === 0 ? 100 : Math.max(100 - pendingPayouts * 10, 0);
    
    return (revenueScore + payoutScore) / 2;
  }

  /**
   * Calculate operational efficiency score
   */
  private calculateOperationalEfficiencyScore(
    bookingCompletionRate: number,
    jobCompletionRate: number,
    averageBookingValue: number
  ): number {
    const completionScore = (bookingCompletionRate + jobCompletionRate) / 2;
    const valueScore = Math.min(averageBookingValue / 1000 * 100, 100); // Scale based on 1k average
    
    return (completionScore + valueScore) / 2;
  }

  /**
   * Calculate customer satisfaction score
   */
  private calculateCustomerSatisfactionScore(
    bookingCompletionRate: number,
    cancelledBookings: number,
    totalBookings: number
  ): number {
    const completionScore = bookingCompletionRate;
    const cancellationScore = totalBookings > 0 ? 
      Math.max(100 - (cancelledBookings / totalBookings) * 100, 0) : 100;
    
    return (completionScore + cancellationScore) / 2;
  }

  /**
   * Calculate trend direction
   */
  private calculateTrend(trends: AgencyPerformanceTrend[], currentValue: number): 'up' | 'down' | 'stable' {
    if (trends.length === 0) return 'stable';
    
    const previousValue = trends[trends.length - 1].metrics.overallScore || 0;
    const change = currentValue - previousValue;
    
    if (change > 5) return 'up';
    if (change < -5) return 'down';
    return 'stable';
  }

  /**
   * Calculate change percentage
   */
  private calculateChangePercentage(trends: AgencyPerformanceTrend[], currentValue: number): number {
    if (trends.length === 0) return 0;
    
    const previousValue = trends[trends.length - 1].metrics.overallScore || 0;
    if (previousValue === 0) return 0;
    
    return ((currentValue - previousValue) / previousValue) * 100;
  }

  /**
   * Calculate percentile ranking
   */
  private calculatePercentile(agencyValue: number, industryAverage: number): number {
    if (industryAverage === 0) return 50;
    
    const ratio = agencyValue / industryAverage;
    return Math.min(Math.max(ratio * 50, 0), 100);
  }

  /**
   * Get benchmark status
   */
  private getBenchmarkStatus(percentile: number): 'above_average' | 'average' | 'below_average' {
    if (percentile >= 70) return 'above_average';
    if (percentile >= 30) return 'average';
    return 'below_average';
  }
}
