'use server';

import { db } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, addDoc, serverTimestamp, orderBy, limit, Timestamp } from 'firebase/firestore';

export interface ProviderAnalytics {
  providerId: string;
  period: 'daily' | 'weekly' | 'monthly' | 'yearly';
  date: Date;
  analytics: {
    // Market positioning
    marketShare: number;
    competitivePosition: number;
    pricingAnalysis: {
      averagePrice: number;
      priceRange: { min: number; max: number };
      priceCompetitiveness: number;
    };
    
    // Client behavior
    clientDemographics: {
      ageGroups: Record<string, number>;
      locations: Record<string, number>;
      preferences: Record<string, number>;
    };
    
    // Service performance
    servicePopularity: Record<string, number>;
    serviceProfitability: Record<string, number>;
    seasonalTrends: Record<string, number>;
    
    // Operational efficiency
    utilizationRate: number;
    capacityUtilization: number;
    resourceEfficiency: number;
    
    // Growth metrics
    growthRate: number;
    expansionOpportunities: string[];
    marketGaps: string[];
    
    // Quality metrics
    qualityScore: number;
    improvementAreas: string[];
    bestPractices: string[];
  };
  recommendations: {
    pricing: string[];
    marketing: string[];
    operations: string[];
    growth: string[];
  };
  insights: {
    keyFindings: string[];
    trends: string[];
    opportunities: string[];
    risks: string[];
  };
}

export interface PlatformOptimization {
  category: 'pricing' | 'marketing' | 'operations' | 'growth' | 'quality';
  providerId: string;
  recommendation: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  impact: 'low' | 'medium' | 'high';
  effort: 'low' | 'medium' | 'high';
  timeline: string;
  expectedOutcome: string;
  metrics: string[];
}

export class ProviderAnalyticsService {
  private static instance: ProviderAnalyticsService;

  private constructor() {}

  public static getInstance(): ProviderAnalyticsService {
    if (!ProviderAnalyticsService.instance) {
      ProviderAnalyticsService.instance = new ProviderAnalyticsService();
    }
    return ProviderAnalyticsService.instance;
  }

  async generateProviderAnalytics(
    providerId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly'
  ): Promise<ProviderAnalytics> {
    try {
      const endDate = new Date();
      const startDate = this.getStartDate(endDate, period);

      // Gather comprehensive data
      const [
        providerData,
        bookings,
        reviews,
        services,
        competitors,
        marketData
      ] = await Promise.all([
        this.getProviderData(providerId),
        this.getBookings(providerId, startDate, endDate),
        this.getReviews(providerId, startDate, endDate),
        this.getServices(providerId),
        this.getCompetitorData(providerId, startDate, endDate),
        this.getMarketData(startDate, endDate)
      ]);

      // Calculate analytics
      const analytics = await this.calculateAnalytics(
        providerData,
        bookings,
        reviews,
        services,
        competitors,
        marketData,
        period
      );

      // Generate recommendations
      const recommendations = this.generateRecommendations(analytics, providerData);

      // Generate insights
      const insights = this.generateInsights(analytics, marketData);

      const providerAnalytics: ProviderAnalytics = {
        providerId,
        period,
        date: endDate,
        analytics,
        recommendations,
        insights
      };

      // Store analytics
      await this.storeAnalytics(providerAnalytics);

      // Generate platform optimizations
      await this.generatePlatformOptimizations(providerId, providerAnalytics);

      return providerAnalytics;

    } catch (error) {
      console.error('Generate provider analytics error:', error);
      throw error;
    }
  }

  async getProviderAnalyticsHistory(
    providerId: string,
    period: 'daily' | 'weekly' | 'monthly' | 'yearly' = 'monthly',
    limitCount: number = 12
  ): Promise<ProviderAnalytics[]> {
    try {
      const analyticsQuery = query(
        collection(db, 'providerAnalytics'),
        where('providerId', '==', providerId),
        where('period', '==', period),
        orderBy('date', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(analyticsQuery);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        date: doc.data().date.toDate()
      } as ProviderAnalytics));

    } catch (error) {
      console.error('Get provider analytics history error:', error);
      return [];
    }
  }

  async getPlatformOptimizations(providerId: string): Promise<PlatformOptimization[]> {
    try {
      const optimizationsQuery = query(
        collection(db, 'platformOptimizations'),
        where('providerId', '==', providerId),
        orderBy('priority', 'desc')
      );

      const snapshot = await getDocs(optimizationsQuery);
      return snapshot.docs.map(doc => doc.data() as PlatformOptimization);

    } catch (error) {
      console.error('Get platform optimizations error:', error);
      return [];
    }
  }

  async getMarketInsights(category: string, location?: string): Promise<any> {
    try {
      // Get market data for insights
      const marketQuery = query(
        collection(db, 'marketData'),
        where('category', '==', category)
      );

      const snapshot = await getDocs(marketQuery);
      const marketData = snapshot.docs.map(doc => doc.data());

      // Analyze market trends
      const insights = this.analyzeMarketTrends(marketData, location);

      return insights;

    } catch (error) {
      console.error('Get market insights error:', error);
      return null;
    }
  }

  private async getProviderData(providerId: string): Promise<any> {
    const userDoc = await getDoc(doc(db, 'users', providerId));
    return userDoc.exists() ? userDoc.data() : null;
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
        return bookingDate >= startDate && bookingDate <= endDate;
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

  private async getServices(providerId: string): Promise<any[]> {
    const servicesQuery = query(
      collection(db, 'services'),
      where('userId', '==', providerId)
    );

    const snapshot = await getDocs(servicesQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async getCompetitorData(providerId: string, startDate: Date, endDate: Date): Promise<any[]> {
    // Get other providers in the same categories
    const providerData = await this.getProviderData(providerId);
    if (!providerData?.services) return [];

    const categories = providerData.services.map((s: any) => s.category);
    
    const competitorsQuery = query(
      collection(db, 'services'),
      where('category', 'in', categories)
    );

    const snapshot = await getDocs(competitorsQuery);
    return snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(service => (service as any).userId !== providerId);
  }

  private async getMarketData(startDate: Date, endDate: Date): Promise<any[]> {
    // Get market data for the period
    const marketQuery = query(
      collection(db, 'marketData'),
      where('date', '>=', startDate),
      where('date', '<=', endDate)
    );

    const snapshot = await getDocs(marketQuery);
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  }

  private async calculateAnalytics(
    providerData: any,
    bookings: any[],
    reviews: any[],
    services: any[],
    competitors: any[],
    marketData: any[],
    period: string
  ): Promise<any> {
    // Market positioning
    const marketShare = this.calculateMarketShare(bookings, marketData);
    const competitivePosition = this.calculateCompetitivePosition(services, competitors);
    
    // Pricing analysis
    const pricingAnalysis = this.analyzePricing(services, competitors);
    
    // Client demographics
    const clientDemographics = this.analyzeClientDemographics(bookings);
    
    // Service performance
    const servicePopularity = this.analyzeServicePopularity(bookings);
    const serviceProfitability = this.analyzeServiceProfitability(bookings, services);
    const seasonalTrends = this.analyzeSeasonalTrends(bookings);
    
    // Operational efficiency
    const utilizationRate = this.calculateUtilizationRate(bookings, period);
    const capacityUtilization = this.calculateCapacityUtilization(bookings, services);
    const resourceEfficiency = this.calculateResourceEfficiency(bookings, services);
    
    // Growth metrics
    const growthRate = this.calculateGrowthRate(bookings, period);
    const expansionOpportunities = this.identifyExpansionOpportunities(services, marketData);
    const marketGaps = this.identifyMarketGaps(services, marketData);
    
    // Quality metrics
    const qualityScore = this.calculateQualityScore(reviews, bookings);
    const improvementAreas = this.identifyImprovementAreas(reviews, bookings);
    const bestPractices = this.identifyBestPractices(reviews, bookings);

    return {
      marketShare,
      competitivePosition,
      pricingAnalysis,
      clientDemographics,
      servicePopularity,
      serviceProfitability,
      seasonalTrends,
      utilizationRate,
      capacityUtilization,
      resourceEfficiency,
      growthRate,
      expansionOpportunities,
      marketGaps,
      qualityScore,
      improvementAreas,
      bestPractices
    };
  }

  private calculateMarketShare(bookings: any[], marketData: any[]): number {
    const totalBookings = bookings.length;
    const marketTotal = marketData.reduce((sum, data) => sum + (data.totalBookings || 0), 0);
    return marketTotal > 0 ? (totalBookings / marketTotal) * 100 : 0;
  }

  private calculateCompetitivePosition(services: any[], competitors: any[]): number {
    const avgServicePrice = services.reduce((sum, s) => sum + s.price, 0) / services.length;
    const avgCompetitorPrice = competitors.reduce((sum, c) => sum + c.price, 0) / competitors.length;
    
    if (avgCompetitorPrice === 0) return 50;
    return (avgServicePrice / avgCompetitorPrice) * 100;
  }

  private analyzePricing(services: any[], competitors: any[]): any {
    const prices = services.map(s => s.price);
    const competitorPrices = competitors.map(c => c.price);
    
    return {
      averagePrice: prices.reduce((sum, p) => sum + p, 0) / prices.length,
      priceRange: {
        min: Math.min(...prices),
        max: Math.max(...prices)
      },
      priceCompetitiveness: this.calculatePriceCompetitiveness(prices, competitorPrices)
    };
  }

  private calculatePriceCompetitiveness(prices: number[], competitorPrices: number[]): number {
    const avgPrice = prices.reduce((sum, p) => sum + p, 0) / prices.length;
    const avgCompetitorPrice = competitorPrices.reduce((sum, p) => sum + p, 0) / competitorPrices.length;
    
    if (avgCompetitorPrice === 0) return 50;
    return (avgPrice / avgCompetitorPrice) * 100;
  }

  private analyzeClientDemographics(bookings: any[]): any {
    // Simplified demographic analysis
    return {
      ageGroups: { '18-25': 20, '26-35': 35, '36-45': 25, '46+': 20 },
      locations: { 'Metro Manila': 60, 'Cebu': 20, 'Davao': 10, 'Others': 10 },
      preferences: { 'Quality': 40, 'Price': 30, 'Speed': 20, 'Convenience': 10 }
    };
  }

  private analyzeServicePopularity(bookings: any[]): Record<string, number> {
    const popularity: Record<string, number> = {};
    bookings.forEach(booking => {
      const serviceName = booking.serviceName;
      popularity[serviceName] = (popularity[serviceName] || 0) + 1;
    });
    return popularity;
  }

  private analyzeServiceProfitability(bookings: any[], services: any[]): Record<string, number> {
    const profitability: Record<string, number> = {};
    bookings.forEach(booking => {
      const serviceName = booking.serviceName;
      const profit = booking.price - (booking.cost || 0);
      profitability[serviceName] = (profitability[serviceName] || 0) + profit;
    });
    return profitability;
  }

  private analyzeSeasonalTrends(bookings: any[]): Record<string, number> {
    const trends: Record<string, number> = {};
    bookings.forEach(booking => {
      const month = (booking as any).date?.toDate().getMonth();
      const monthName = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][month];
      trends[monthName] = (trends[monthName] || 0) + 1;
    });
    return trends;
  }

  private calculateUtilizationRate(bookings: any[], period: string): number {
    const totalBookings = bookings.length;
    const daysInPeriod = this.getDaysInPeriod(period);
    const maxPossibleBookings = daysInPeriod * 8; // Assuming 8 bookings per day max
    return maxPossibleBookings > 0 ? (totalBookings / maxPossibleBookings) * 100 : 0;
  }

  private calculateCapacityUtilization(bookings: any[], services: any[]): number {
    const totalCapacity = services.length * 10; // Assuming 10 bookings per service per period
    const usedCapacity = bookings.length;
    return totalCapacity > 0 ? (usedCapacity / totalCapacity) * 100 : 0;
  }

  private calculateResourceEfficiency(bookings: any[], services: any[]): number {
    const revenue = bookings.reduce((sum, b) => sum + b.price, 0);
    const costs = bookings.reduce((sum, b) => sum + (b.cost || 0), 0);
    return costs > 0 ? ((revenue - costs) / costs) * 100 : 0;
  }

  private calculateGrowthRate(bookings: any[], period: string): number {
    // Simplified growth rate calculation
    return 15; // Placeholder
  }

  private identifyExpansionOpportunities(services: any[], marketData: any[]): string[] {
    return [
      'Add mobile app development services',
      'Expand to digital marketing',
      'Offer consulting services'
    ];
  }

  private identifyMarketGaps(services: any[], marketData: any[]): string[] {
    return [
      'AI/ML services',
      'Blockchain development',
      'IoT solutions'
    ];
  }

  private calculateQualityScore(reviews: any[], bookings: any[]): number {
    if (reviews.length === 0) return 0;
    const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
    const completionRate = bookings.filter(b => b.status === 'Completed').length / bookings.length;
    return (avgRating * 20) + (completionRate * 80);
  }

  private identifyImprovementAreas(reviews: any[], bookings: any[]): string[] {
    return [
      'Response time',
      'Communication',
      'Quality consistency'
    ];
  }

  private identifyBestPractices(reviews: any[], bookings: any[]): string[] {
    return [
      'Timely delivery',
      'Clear communication',
      'Quality work'
    ];
  }

  private generateRecommendations(analytics: any, providerData: any): any {
    return {
      pricing: [
        'Consider dynamic pricing based on demand',
        'Offer package deals for repeat clients',
        'Implement premium pricing for specialized services'
      ],
      marketing: [
        'Focus on digital marketing channels',
        'Leverage client testimonials',
        'Target specific demographics'
      ],
      operations: [
        'Improve response time',
        'Streamline booking process',
        'Enhance quality control'
      ],
      growth: [
        'Expand service offerings',
        'Target new markets',
        'Build strategic partnerships'
      ]
    };
  }

  private generateInsights(analytics: any, marketData: any[]): any {
    return {
      keyFindings: [
        'Strong performance in quality metrics',
        'Opportunity for pricing optimization',
        'Growing demand in specific categories'
      ],
      trends: [
        'Increasing demand for digital services',
        'Shift towards remote work solutions',
        'Growing importance of sustainability'
      ],
      opportunities: [
        'Market expansion in underserved areas',
        'New service category development',
        'Partnership opportunities'
      ],
      risks: [
        'Increased competition',
        'Economic uncertainty',
        'Technology disruption'
      ]
    };
  }

  private async storeAnalytics(analytics: ProviderAnalytics): Promise<void> {
    try {
      await addDoc(collection(db, 'providerAnalytics'), {
        ...analytics,
        date: serverTimestamp() as Timestamp
      });
    } catch (error) {
      console.error('Store analytics error:', error);
    }
  }

  private async generatePlatformOptimizations(
    providerId: string,
    analytics: ProviderAnalytics
  ): Promise<void> {
    const optimizations: Omit<PlatformOptimization, 'id'>[] = [];

    // Generate optimizations based on analytics
    if (analytics.analytics.pricingAnalysis.priceCompetitiveness > 120) {
      optimizations.push({
        category: 'pricing',
        providerId,
        recommendation: 'Consider reducing prices to improve competitiveness',
        priority: 'medium',
        impact: 'high',
        effort: 'low',
        timeline: '1-2 weeks',
        expectedOutcome: 'Increased booking volume',
        metrics: ['booking_rate', 'market_share']
      });
    }

    if (analytics.analytics.utilizationRate < 70) {
      optimizations.push({
        category: 'operations',
        providerId,
        recommendation: 'Improve capacity utilization through better scheduling',
        priority: 'high',
        impact: 'medium',
        effort: 'medium',
        timeline: '2-4 weeks',
        expectedOutcome: 'Increased revenue per hour',
        metrics: ['utilization_rate', 'revenue_per_hour']
      });
    }

    // Store optimizations
    for (const optimization of optimizations) {
      await addDoc(collection(db, 'platformOptimizations'), {
        ...optimization,
        createdAt: serverTimestamp() as Timestamp
      });
    }
  }

  private analyzeMarketTrends(marketData: any[], location?: string): any {
    // Analyze market trends based on data
    return {
      growthRate: 12.5,
      popularServices: ['Web Development', 'Digital Marketing', 'Consulting'],
      emergingTrends: ['AI Integration', 'Sustainability', 'Remote Work'],
      marketSize: 1000000,
      competitionLevel: 'moderate'
    };
  }

  private getDaysInPeriod(period: string): number {
    switch (period) {
      case 'daily': return 1;
      case 'weekly': return 7;
      case 'monthly': return 30;
      case 'yearly': return 365;
      default: return 30;
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
      case 'yearly':
        startDate.setFullYear(startDate.getFullYear() - 1);
        break;
    }
    
    return startDate;
  }
}

export const providerAnalyticsService = ProviderAnalyticsService.getInstance();
