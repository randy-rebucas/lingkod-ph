import { db } from './firebase';
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

export interface AgencyRanking {
  agencyId: string;
  agencyName: string;
  overallScore: number;
  ranking: number;
  level: 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond';
  
  // Category Scores
  revenueScore: number;
  providerScore: number;
  customerScore: number;
  operationalScore: number;
  growthScore: number;
  
  // Metrics
  totalRevenue: number;
  totalProviders: number;
  totalBookings: number;
  customerSatisfaction: number;
  providerRetention: number;
  
  // Rankings
  revenueRanking: number;
  providerRanking: number;
  customerRanking: number;
  operationalRanking: number;
  growthRanking: number;
  
  // Achievements
  badges: AgencyBadge[];
  achievements: AgencyAchievement[];
  
  // Trends
  trend: 'up' | 'down' | 'stable';
  changePercentage: number;
  lastUpdated: Timestamp;
}

export interface AgencyBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'revenue' | 'provider' | 'customer' | 'growth' | 'special';
  earnedAt: Timestamp;
  criteria: string;
}

export interface AgencyAchievement {
  id: string;
  name: string;
  description: string;
  category: 'milestone' | 'performance' | 'growth' | 'special';
  earnedAt: Timestamp;
  progress: number;
  target: number;
  completed: boolean;
}

export interface RankingCriteria {
  category?: string;
  location?: string;
  timePeriod?: 'monthly' | 'quarterly' | 'yearly';
  limit?: number;
}

export interface AgencyLeaderboard {
  category: string;
  rankings: AgencyRanking[];
  lastUpdated: Timestamp;
  totalAgencies: number;
}

export class AgencyRankingService {
  private agencyId: string;
  private agencyName: string;

  constructor(agencyId: string, agencyName: string) {
    this.agencyId = agencyId;
    this.agencyName = agencyName;
  }

  /**
   * Calculate comprehensive ranking for an agency
   */
  async calculateAgencyRanking(
    timePeriod: 'monthly' | 'quarterly' | 'yearly' = 'monthly'
  ): Promise<AgencyRanking> {
    try {
      // Get date range based on time period
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timePeriod) {
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get agency data
      const agencyData = await this.getAgencyData(startDate, endDate);
      
      // Get all agencies for comparison
      const allAgencies = await this.getAllAgenciesData(startDate, endDate);
      
      // Calculate scores
      const scores = this.calculateScores(agencyData, allAgencies);
      
      // Calculate rankings
      const rankings = this.calculateRankings(agencyData, allAgencies);
      
      // Get achievements and badges
      const badges = await this.getAgencyBadges(agencyData);
      const achievements = await this.getAgencyAchievements(agencyData);
      
      // Calculate overall score and level
      const overallScore = this.calculateOverallScore(scores);
      const level = this.calculateLevel(overallScore);
      
      // Calculate trend
      const trend = await this.calculateTrend(agencyData);
      
      return {
        agencyId: this.agencyId,
        agencyName: this.agencyName,
        overallScore,
        ranking: rankings.overall,
        level,
        revenueScore: scores.revenue,
        providerScore: scores.provider,
        customerScore: scores.customer,
        operationalScore: scores.operational,
        growthScore: scores.growth,
        totalRevenue: agencyData.totalRevenue,
        totalProviders: agencyData.totalProviders,
        totalBookings: agencyData.totalBookings,
        customerSatisfaction: agencyData.customerSatisfaction,
        providerRetention: agencyData.providerRetention,
        revenueRanking: rankings.revenue,
        providerRanking: rankings.provider,
        customerRanking: rankings.customer,
        operationalRanking: rankings.operational,
        growthRanking: rankings.growth,
        badges,
        achievements,
        trend: trend.direction,
        changePercentage: trend.changePercentage,
        lastUpdated: new Date() as any,
      };
    } catch (error) {
      console.error('Error calculating agency ranking:', error);
      throw error;
    }
  }

  /**
   * Get agency leaderboard
   */
  async getAgencyLeaderboard(
    criteria: RankingCriteria = {}
  ): Promise<AgencyLeaderboard> {
    try {
      const timePeriod = criteria.timePeriod || 'monthly';
      const limit = criteria.limit || 10;
      
      // Get date range
      const endDate = new Date();
      const startDate = new Date();
      
      switch (timePeriod) {
        case 'monthly':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarterly':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'yearly':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      // Get all agencies data
      const allAgencies = await this.getAllAgenciesData(startDate, endDate);
      
      // Calculate rankings for all agencies
      const rankings: AgencyRanking[] = [];
      
      for (const agency of allAgencies) {
        const scores = this.calculateScores(agency, allAgencies);
        const agencyRankings = this.calculateRankings(agency, allAgencies);
        const overallScore = this.calculateOverallScore(scores);
        const level = this.calculateLevel(overallScore);
        
        rankings.push({
          agencyId: agency.agencyId,
          agencyName: agency.agencyName,
          overallScore,
          ranking: agencyRankings.overall,
          level,
          revenueScore: scores.revenue,
          providerScore: scores.provider,
          customerScore: scores.customer,
          operationalScore: scores.operational,
          growthScore: scores.growth,
          totalRevenue: agency.totalRevenue,
          totalProviders: agency.totalProviders,
          totalBookings: agency.totalBookings,
          customerSatisfaction: agency.customerSatisfaction,
          providerRetention: agency.providerRetention,
          revenueRanking: agencyRankings.revenue,
          providerRanking: agencyRankings.provider,
          customerRanking: agencyRankings.customer,
          operationalRanking: agencyRankings.operational,
          growthRanking: agencyRankings.growth,
          badges: [],
          achievements: [],
          trend: 'stable',
          changePercentage: 0,
          lastUpdated: new Date() as any,
        });
      }
      
      // Sort by overall score and limit results
      rankings.sort((a, b) => b.overallScore - a.overallScore);
      const limitedRankings = rankings.slice(0, limit);
      
      // Update rankings
      limitedRankings.forEach((ranking, index) => {
        ranking.ranking = index + 1;
      });
      
      return {
        category: criteria.category || 'Overall',
        rankings: limitedRankings,
        lastUpdated: new Date() as any,
        totalAgencies: allAgencies.length,
      };
    } catch (error) {
      console.error('Error getting agency leaderboard:', error);
      throw error;
    }
  }

  /**
   * Get agency badges
   */
  async getAgencyBadges(agencyData: any): Promise<AgencyBadge[]> {
    const badges: AgencyBadge[] = [];
    
    // Revenue badges
    if (agencyData.totalRevenue >= 100000) {
      badges.push({
        id: 'revenue_100k',
        name: 'Revenue Champion',
        description: 'Achieved ₱100,000+ in revenue',
        icon: '💰',
        category: 'revenue',
        earnedAt: new Date() as any,
        criteria: 'Total revenue ≥ ₱100,000',
      });
    }
    
    if (agencyData.totalRevenue >= 500000) {
      badges.push({
        id: 'revenue_500k',
        name: 'Revenue Master',
        description: 'Achieved ₱500,000+ in revenue',
        icon: '💎',
        category: 'revenue',
        earnedAt: new Date() as any,
        criteria: 'Total revenue ≥ ₱500,000',
      });
    }
    
    // Provider badges
    if (agencyData.totalProviders >= 10) {
      badges.push({
        id: 'provider_10',
        name: 'Provider Network',
        description: 'Managed 10+ providers',
        icon: '👥',
        category: 'provider',
        earnedAt: new Date() as any,
        criteria: 'Total providers ≥ 10',
      });
    }
    
    if (agencyData.providerRetention >= 90) {
      badges.push({
        id: 'retention_90',
        name: 'Retention Expert',
        description: '90%+ provider retention rate',
        icon: '🎯',
        category: 'provider',
        earnedAt: new Date() as any,
        criteria: 'Provider retention ≥ 90%',
      });
    }
    
    // Customer badges
    if (agencyData.customerSatisfaction >= 4.5) {
      badges.push({
        id: 'satisfaction_4_5',
        name: 'Customer Favorite',
        description: '4.5+ customer satisfaction rating',
        icon: '⭐',
        category: 'customer',
        earnedAt: new Date() as any,
        criteria: 'Customer satisfaction ≥ 4.5',
      });
    }
    
    // Growth badges
    if (agencyData.growthRate >= 50) {
      badges.push({
        id: 'growth_50',
        name: 'Growth Leader',
        description: '50%+ growth rate',
        icon: '📈',
        category: 'growth',
        earnedAt: new Date() as any,
        criteria: 'Growth rate ≥ 50%',
      });
    }
    
    return badges;
  }

  /**
   * Get agency achievements
   */
  async getAgencyAchievements(agencyData: any): Promise<AgencyAchievement[]> {
    const achievements: AgencyAchievement[] = [];
    
    // Revenue achievements
    achievements.push({
      id: 'revenue_1m',
      name: 'Millionaire Agency',
      description: 'Reach ₱1,000,000 in total revenue',
      category: 'milestone',
      earnedAt: new Date() as any,
      progress: Math.min(agencyData.totalRevenue, 1000000),
      target: 1000000,
      completed: agencyData.totalRevenue >= 1000000,
    });
    
    // Provider achievements
    achievements.push({
      id: 'provider_50',
      name: 'Provider Empire',
      description: 'Manage 50+ providers',
      category: 'milestone',
      earnedAt: new Date() as any,
      progress: Math.min(agencyData.totalProviders, 50),
      target: 50,
      completed: agencyData.totalProviders >= 50,
    });
    
    // Booking achievements
    achievements.push({
      id: 'booking_1000',
      name: 'Booking Master',
      description: 'Complete 1,000+ bookings',
      category: 'milestone',
      earnedAt: new Date() as any,
      progress: Math.min(agencyData.totalBookings, 1000),
      target: 1000,
      completed: agencyData.totalBookings >= 1000,
    });
    
    return achievements;
  }

  /**
   * Get agency data for ranking calculation
   */
  private async getAgencyData(startDate: Date, endDate: Date): Promise<any> {
    // Get providers
    const providersQuery = query(
      collection(db, 'users'),
      where('agencyId', '==', this.agencyId),
      where('role', '==', 'provider')
    );
    const providersSnapshot = await getDocs(providersQuery);
    const providerIds = providersSnapshot.docs.map(doc => doc.id);
    const providers = providersSnapshot.docs.map(doc => doc.data());

    // Get bookings
    const bookingsQuery = query(
      collection(db, 'bookings'),
      where('providerId', 'in', providerIds),
      where('createdAt', '>=', startDate),
      where('createdAt', '<=', endDate)
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    const bookings = bookingsSnapshot.docs.map(doc => doc.data());

    // Calculate metrics
    const totalRevenue = bookings
      .filter(b => b.status === 'Completed')
      .reduce((sum, b) => sum + (b.price || 0), 0);
    
    const totalProviders = providers.length;
    const activeProviders = providers.filter(p => p.status === 'active').length;
    const totalBookings = bookings.length;
    const completedBookings = bookings.filter(b => b.status === 'Completed').length;
    
    const customerSatisfaction = bookings.length > 0 ? 
      bookings.reduce((sum, b) => sum + (b.rating || 0), 0) / bookings.length : 0;
    
    const providerRetention = totalProviders > 0 ? (activeProviders / totalProviders) * 100 : 0;
    
    return {
      agencyId: this.agencyId,
      agencyName: this.agencyName,
      totalRevenue,
      totalProviders,
      activeProviders,
      totalBookings,
      completedBookings,
      customerSatisfaction,
      providerRetention,
      growthRate: 15, // Placeholder
    };
  }

  /**
   * Get all agencies data for comparison
   */
  private async getAllAgenciesData(startDate: Date, endDate: Date): Promise<any[]> {
    // Get all agencies
    const agenciesQuery = query(
      collection(db, 'users'),
      where('role', '==', 'agency')
    );
    const agenciesSnapshot = await getDocs(agenciesQuery);
    const agencies = agenciesSnapshot.docs.map(doc => doc.data());

    // Get data for each agency
    const agenciesData = [];
    for (const agency of agencies) {
      const agencyData = await this.getAgencyData(startDate, endDate);
      agenciesData.push(agencyData);
    }

    return agenciesData;
  }

  /**
   * Calculate scores for different categories
   */
  private calculateScores(agencyData: any, allAgencies: any[]): {
    revenue: number;
    provider: number;
    customer: number;
    operational: number;
    growth: number;
  } {
    // Revenue score (0-100)
    const maxRevenue = Math.max(...allAgencies.map(a => a.totalRevenue));
    const revenueScore = maxRevenue > 0 ? (agencyData.totalRevenue / maxRevenue) * 100 : 0;

    // Provider score (0-100)
    const maxProviders = Math.max(...allAgencies.map(a => a.totalProviders));
    const providerScore = maxProviders > 0 ? (agencyData.totalProviders / maxProviders) * 100 : 0;

    // Customer score (0-100)
    const customerScore = agencyData.customerSatisfaction * 20; // Convert 5-star to 100-point scale

    // Operational score (0-100)
    const completionRate = agencyData.totalBookings > 0 ? 
      (agencyData.completedBookings / agencyData.totalBookings) * 100 : 0;
    const operationalScore = (completionRate + agencyData.providerRetention) / 2;

    // Growth score (0-100)
    const growthScore = Math.min(agencyData.growthRate, 100);

    return {
      revenue: revenueScore,
      provider: providerScore,
      customer: customerScore,
      operational: operationalScore,
      growth: growthScore,
    };
  }

  /**
   * Calculate rankings for different categories
   */
  private calculateRankings(agencyData: any, allAgencies: any[]): {
    overall: number;
    revenue: number;
    provider: number;
    customer: number;
    operational: number;
    growth: number;
  } {
    // Sort agencies by different metrics
    const revenueSorted = [...allAgencies].sort((a, b) => b.totalRevenue - a.totalRevenue);
    const providerSorted = [...allAgencies].sort((a, b) => b.totalProviders - a.totalProviders);
    const customerSorted = [...allAgencies].sort((a, b) => b.customerSatisfaction - a.customerSatisfaction);
    const operationalSorted = [...allAgencies].sort((a, b) => {
      const aScore = (a.completedBookings / Math.max(a.totalBookings, 1)) * 100 + a.providerRetention;
      const bScore = (b.completedBookings / Math.max(b.totalBookings, 1)) * 100 + b.providerRetention;
      return bScore - aScore;
    });
    const growthSorted = [...allAgencies].sort((a, b) => b.growthRate - a.growthRate);

    // Find rankings
    const revenueRanking = revenueSorted.findIndex(a => a.agencyId === agencyData.agencyId) + 1;
    const providerRanking = providerSorted.findIndex(a => a.agencyId === agencyData.agencyId) + 1;
    const customerRanking = customerSorted.findIndex(a => a.agencyId === agencyData.agencyId) + 1;
    const operationalRanking = operationalSorted.findIndex(a => a.agencyId === agencyData.agencyId) + 1;
    const growthRanking = growthSorted.findIndex(a => a.agencyId === agencyData.agencyId) + 1;

    // Calculate overall ranking (average of all rankings)
    const overallRanking = Math.round(
      (revenueRanking + providerRanking + customerRanking + operationalRanking + growthRanking) / 5
    );

    return {
      overall: overallRanking,
      revenue: revenueRanking,
      provider: providerRanking,
      customer: customerRanking,
      operational: operationalRanking,
      growth: growthRanking,
    };
  }

  /**
   * Calculate overall score
   */
  private calculateOverallScore(scores: {
    revenue: number;
    provider: number;
    customer: number;
    operational: number;
    growth: number;
  }): number {
    // Weighted average of all scores
    const weights = {
      revenue: 0.3,
      provider: 0.25,
      customer: 0.2,
      operational: 0.15,
      growth: 0.1,
    };

    return (
      scores.revenue * weights.revenue +
      scores.provider * weights.provider +
      scores.customer * weights.customer +
      scores.operational * weights.operational +
      scores.growth * weights.growth
    );
  }

  /**
   * Calculate agency level based on overall score
   */
  private calculateLevel(overallScore: number): 'Bronze' | 'Silver' | 'Gold' | 'Platinum' | 'Diamond' {
    if (overallScore >= 90) return 'Diamond';
    if (overallScore >= 80) return 'Platinum';
    if (overallScore >= 70) return 'Gold';
    if (overallScore >= 60) return 'Silver';
    return 'Bronze';
  }

  /**
   * Calculate trend for the agency
   */
  private async calculateTrend(agencyData: any): Promise<{
    direction: 'up' | 'down' | 'stable';
    changePercentage: number;
  }> {
    // This would typically compare with previous period data
    // For now, we'll return a placeholder
    return {
      direction: 'stable',
      changePercentage: 0,
    };
  }
}
