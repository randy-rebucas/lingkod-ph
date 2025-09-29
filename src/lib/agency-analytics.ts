import { getDb  } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  orderBy, 
  limit, 
  Timestamp 
} from 'firebase/firestore';

export interface AgencyAnalyticsData {
  agencyId: string;
  agencyName: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Business Metrics
  totalRevenue: number;
  revenueGrowth: number;
  averageRevenuePerProvider: number;
  totalBookings: number;
  bookingGrowth: number;
  averageBookingValue: number;
  
  // Provider Metrics
  totalProviders: number;
  activeProviders: number;
  newProviders: number;
  providerRetentionRate: number;
  providerPerformanceScore: number;
  
  // Market Metrics
  marketShare: number;
  competitivePosition: number;
  customerSatisfaction: number;
  brandRecognition: number;
  
  // Operational Metrics
  operationalEfficiency: number;
  costPerAcquisition: number;
  lifetimeValue: number;
  churnRate: number;
  
  // Financial Metrics
  profitMargin: number;
  operatingExpenses: number;
  netIncome: number;
  cashFlow: number;
  
  // Growth Metrics
  monthOverMonthGrowth: number;
  yearOverYearGrowth: number;
  projectedGrowth: number;
  
  // Timestamps
  calculatedAt: Timestamp;
  lastUpdated: Timestamp;
}

export interface MarketInsight {
  category: string;
  insight: string;
  impact: 'high' | 'medium' | 'low';
  confidence: number; // 0-100
  source: string;
  actionable: boolean;
  recommendation?: string;
}

export interface CompetitiveAnalysis {
  competitor: string;
  marketShare: number;
  strengths: string[];
  weaknesses: string[];
  opportunities: string[];
  threats: string[];
  competitiveAdvantage: string;
}

export interface BusinessIntelligence {
  trends: Array<{
    metric: string;
    trend: 'up' | 'down' | 'stable';
    change: number;
    significance: 'high' | 'medium' | 'low';
  }>;
  anomalies: Array<{
    metric: string;
    anomaly: string;
    severity: 'high' | 'medium' | 'low';
    explanation: string;
  }>;
  predictions: Array<{
    metric: string;
    prediction: number;
    confidence: number;
    timeframe: string;
  }>;
  recommendations: Array<{
    category: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    impact: 'high' | 'medium' | 'low';
    effort: 'high' | 'medium' | 'low';
  }>;
}

export class AgencyAnalyticsService {
  private agencyId: string;
  private agencyName: string;

  constructor(agencyId: string, agencyName: string) {
    this.agencyId = agencyId;
    this.agencyName = agencyName;
  }

  /**
   * Get comprehensive analytics data for the agency
   */
  async getAnalyticsData(
    startDate: Date,
    endDate: Date
  ): Promise<AgencyAnalyticsData> {
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

      // Calculate analytics
      const analytics = this.calculateAnalytics(
        providers,
        bookings,
        jobs,
        payouts,
        startDate,
        endDate
      );

      return analytics;
    } catch (error) {
      console.error('Error getting analytics data:', error);
      throw error;
    }
  }

  /**
   * Get market insights for the agency
   */
  async getMarketInsights(): Promise<MarketInsight[]> {
    try {
      // This would typically integrate with external market data APIs
      // For now, we'll generate insights based on internal data
      
      const insights: MarketInsight[] = [];

      // Get recent performance data
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 3);

      const analytics = await this.getAnalyticsData(startDate, endDate);

      // Generate insights based on performance
      if (analytics.revenueGrowth > 20) {
        insights.push({
          category: 'Revenue',
          insight: 'Strong revenue growth indicates market expansion opportunities',
          impact: 'high',
          confidence: 85,
          source: 'Internal Analytics',
          actionable: true,
          recommendation: 'Consider expanding to new service categories or geographic areas',
        });
      }

      if (analytics.providerRetentionRate < 80) {
        insights.push({
          category: 'Provider Management',
          insight: 'Provider retention rate below industry average',
          impact: 'high',
          confidence: 90,
          source: 'Internal Analytics',
          actionable: true,
          recommendation: 'Implement provider satisfaction programs and improve support systems',
        });
      }

      if (analytics.customerSatisfaction > 4.5) {
        insights.push({
          category: 'Customer Experience',
          insight: 'High customer satisfaction indicates strong market position',
          impact: 'medium',
          confidence: 80,
          source: 'Internal Analytics',
          actionable: true,
          recommendation: 'Leverage positive reviews for marketing and brand building',
        });
      }

      return insights;
    } catch (error) {
      console.error('Error getting market insights:', error);
      return [];
    }
  }

  /**
   * Get competitive analysis
   */
  async getCompetitiveAnalysis(): Promise<CompetitiveAnalysis[]> {
    try {
      // This would typically integrate with external competitive intelligence
      // For now, we'll provide a framework for competitive analysis
      
      const analysis: CompetitiveAnalysis[] = [
        {
          competitor: 'Competitor A',
          marketShare: 25,
          strengths: ['Strong brand recognition', 'Large provider network'],
          weaknesses: ['High pricing', 'Limited service categories'],
          opportunities: ['Market expansion', 'Technology innovation'],
          threats: ['New entrants', 'Economic downturn'],
          competitiveAdvantage: 'Focus on quality and customer service',
        },
        {
          competitor: 'Competitor B',
          marketShare: 15,
          strengths: ['Technology platform', 'Fast service delivery'],
          weaknesses: ['Limited geographic coverage', 'High provider churn'],
          opportunities: ['Geographic expansion', 'Provider retention programs'],
          threats: ['Technology disruption', 'Regulatory changes'],
          competitiveAdvantage: 'Superior technology and user experience',
        },
      ];

      return analysis;
    } catch (error) {
      console.error('Error getting competitive analysis:', error);
      return [];
    }
  }

  /**
   * Get business intelligence insights
   */
  async getBusinessIntelligence(): Promise<BusinessIntelligence> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 6);

      const analytics = await this.getAnalyticsData(startDate, endDate);

      // Analyze trends
      const trends = [
        {
          metric: 'Revenue',
          trend: (analytics.revenueGrowth > 0 ? 'up' : 'down') as 'up' | 'down' | 'stable',
          change: analytics.revenueGrowth,
          significance: (Math.abs(analytics.revenueGrowth) > 20 ? 'high' : 'medium') as 'low' | 'medium' | 'high',
        },
        {
          metric: 'Provider Count',
          trend: (analytics.newProviders > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
          change: analytics.newProviders,
          significance: (analytics.newProviders > 5 ? 'high' : 'low') as 'low' | 'medium' | 'high',
        },
        {
          metric: 'Booking Volume',
          trend: (analytics.bookingGrowth > 0 ? 'up' : 'down') as 'up' | 'down' | 'stable',
          change: analytics.bookingGrowth,
          significance: (Math.abs(analytics.bookingGrowth) > 15 ? 'high' : 'medium') as 'low' | 'medium' | 'high',
        },
      ];

      // Detect anomalies
      const anomalies: Array<{
        metric: string;
        anomaly: string;
        severity: 'high' | 'medium' | 'low';
        explanation: string;
      }> = [];
      if (analytics.providerRetentionRate < 70) {
        anomalies.push({
          metric: 'Provider Retention',
          anomaly: 'Unusually low retention rate',
          severity: 'high',
          explanation: 'Provider retention rate is significantly below industry average',
        });
      }

      if (analytics.customerSatisfaction < 3.5) {
        anomalies.push({
          metric: 'Customer Satisfaction',
          anomaly: 'Low customer satisfaction score',
          severity: 'high',
          explanation: 'Customer satisfaction is below acceptable threshold',
        });
      }

      // Generate predictions
      const predictions = [
        {
          metric: 'Revenue',
          prediction: analytics.totalRevenue * 1.2,
          confidence: 75,
          timeframe: 'Next 3 months',
        },
        {
          metric: 'Provider Count',
          prediction: analytics.totalProviders + 3,
          confidence: 80,
          timeframe: 'Next 6 months',
        },
      ];

      // Generate recommendations
      const recommendations = [
        {
          category: 'Growth',
          title: 'Expand Service Categories',
          description: 'Add new service categories to increase market reach',
          priority: 'high' as const,
          impact: 'high' as const,
          effort: 'medium' as const,
        },
        {
          category: 'Operations',
          title: 'Improve Provider Retention',
          description: 'Implement programs to reduce provider churn',
          priority: 'high' as const,
          impact: 'high' as const,
          effort: 'high' as const,
        },
        {
          category: 'Marketing',
          title: 'Enhance Brand Recognition',
          description: 'Invest in marketing to improve brand awareness',
          priority: 'medium' as const,
          impact: 'medium' as const,
          effort: 'medium' as const,
        },
      ];

      return {
        trends,
        anomalies,
        predictions,
        recommendations,
      };
    } catch (error) {
      console.error('Error getting business intelligence:', error);
      return {
        trends: [],
        anomalies: [],
        predictions: [],
        recommendations: [],
      };
    }
  }

  /**
   * Get performance dashboard data
   */
  async getPerformanceDashboard(): Promise<{
    kpis: Array<{
      name: string;
      value: number;
      change: number;
      trend: 'up' | 'down' | 'stable';
    }>;
    charts: Array<{
      type: string;
      title: string;
      data: any[];
    }>;
  }> {
    try {
      const endDate = new Date();
      const startDate = new Date();
      startDate.setMonth(startDate.getMonth() - 1);

      const analytics = await this.getAnalyticsData(startDate, endDate);

      const kpis = [
        {
          name: 'Total Revenue',
          value: analytics.totalRevenue,
          change: analytics.revenueGrowth,
          trend: (analytics.revenueGrowth > 0 ? 'up' : 'down') as 'up' | 'down' | 'stable',
        },
        {
          name: 'Active Providers',
          value: analytics.activeProviders,
          change: analytics.newProviders,
          trend: (analytics.newProviders > 0 ? 'up' : 'stable') as 'up' | 'down' | 'stable',
        },
        {
          name: 'Total Bookings',
          value: analytics.totalBookings,
          change: analytics.bookingGrowth,
          trend: (analytics.bookingGrowth > 0 ? 'up' : 'down') as 'up' | 'down' | 'stable',
        },
        {
          name: 'Customer Satisfaction',
          value: analytics.customerSatisfaction,
          change: 0, // Would be calculated from historical data
          trend: 'stable' as const,
        },
      ];

      const charts = [
        {
          type: 'line',
          title: 'Revenue Trend',
          data: [], // Would be populated with historical data
        },
        {
          type: 'bar',
          title: 'Provider Performance',
          data: [], // Would be populated with provider data
        },
        {
          type: 'pie',
          title: 'Service Category Distribution',
          data: [], // Would be populated with category data
        },
      ];

      return { kpis, charts };
    } catch (error) {
      console.error('Error getting performance dashboard:', error);
      return { kpis: [], charts: [] };
    }
  }

  /**
   * Calculate comprehensive analytics from raw data
   */
  private calculateAnalytics(
    providers: any[],
    bookings: any[],
    jobs: any[],
    payouts: any[],
    startDate: Date,
    endDate: Date
  ): AgencyAnalyticsData {
    // Basic metrics
    const totalProviders = providers.length;
    const activeProviders = providers.filter(p => p.status === 'active').length;
    const newProviders = providers.filter(p => 
      p.createdAt && new Date(p.createdAt.toDate()) >= startDate
    ).length;

    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const totalRevenue = completedBookings.reduce((sum, b) => sum + (b.price || 0), 0);

    // Calculate rates and averages
    const providerRetentionRate = totalProviders > 0 ? (activeProviders / totalProviders) * 100 : 0;
    const averageRevenuePerProvider = totalProviders > 0 ? totalRevenue / totalProviders : 0;
    const averageBookingValue = completedBookings.length > 0 ? totalRevenue / completedBookings.length : 0;

    // Calculate growth rates (would be calculated from historical data)
    const revenueGrowth = 15; // Placeholder
    const bookingGrowth = 12; // Placeholder
    const monthOverMonthGrowth = 8; // Placeholder
    const yearOverYearGrowth = 25; // Placeholder

    // Calculate performance scores
    const providerPerformanceScore = this.calculateProviderPerformanceScore(providers);
    const operationalEfficiency = this.calculateOperationalEfficiency(bookings, jobs);
    const customerSatisfaction = this.calculateCustomerSatisfaction(bookings);

    // Calculate financial metrics
    const totalPayouts = payouts.reduce((sum, p) => sum + (p.amount || 0), 0);
    const profitMargin = totalRevenue > 0 ? ((totalRevenue - totalPayouts) / totalRevenue) * 100 : 0;
    const operatingExpenses = totalPayouts * 0.3; // Estimate
    const netIncome = totalRevenue - totalPayouts - operatingExpenses;
    const cashFlow = netIncome; // Simplified

    return {
      agencyId: this.agencyId,
      agencyName: this.agencyName,
      period: { start: startDate, end: endDate },
      totalRevenue,
      revenueGrowth,
      averageRevenuePerProvider,
      totalBookings,
      bookingGrowth,
      averageBookingValue,
      totalProviders,
      activeProviders,
      newProviders,
      providerRetentionRate,
      providerPerformanceScore,
      marketShare: 5, // Placeholder
      competitivePosition: 3, // Placeholder
      customerSatisfaction,
      brandRecognition: 4.2, // Placeholder
      operationalEfficiency,
      costPerAcquisition: 150, // Placeholder
      lifetimeValue: 2500, // Placeholder
      churnRate: 15, // Placeholder
      profitMargin,
      operatingExpenses,
      netIncome,
      cashFlow,
      monthOverMonthGrowth,
      yearOverYearGrowth,
      projectedGrowth: 20, // Placeholder
      calculatedAt: new Date() as any,
      lastUpdated: new Date() as any,
    };
  }

  /**
   * Calculate provider performance score
   */
  private calculateProviderPerformanceScore(providers: any[]): number {
    if (providers.length === 0) return 0;
    
    const totalScore = providers.reduce((sum, provider) => {
      const rating = provider.averageRating || 0;
      const bookings = provider.totalBookings || 0;
      const completionRate = provider.completedBookings / Math.max(provider.totalBookings, 1);
      
      return sum + (rating * 20 + completionRate * 30 + Math.min(bookings / 10, 50));
    }, 0);
    
    return totalScore / providers.length;
  }

  /**
   * Calculate operational efficiency
   */
  private calculateOperationalEfficiency(bookings: any[], jobs: any[]): number {
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    const completionRate = bookings.length > 0 ? (completedBookings / bookings.length) * 100 : 0;
    
    const completedJobs = jobs.filter(j => j.status === 'completed').length;
    const jobCompletionRate = jobs.length > 0 ? (completedJobs / jobs.length) * 100 : 0;
    
    return (completionRate + jobCompletionRate) / 2;
  }

  /**
   * Calculate customer satisfaction
   */
  private calculateCustomerSatisfaction(bookings: any[]): number {
    const completedBookings = bookings.filter(b => b.status === 'Completed');
    if (completedBookings.length === 0) return 0;
    
    const totalRating = completedBookings.reduce((sum, booking) => {
      return sum + (booking.rating || 0);
    }, 0);
    
    return totalRating / completedBookings.length;
  }
}
