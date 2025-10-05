'use server';

import { getDb  } from './firebase';
import { collection, query, where, getDocs, doc, getDoc, updateDoc, setDoc, orderBy, limit, serverTimestamp } from 'firebase/firestore';
import { providerVerificationService } from './provider-verification';
import { providerPerformanceMonitor } from './provider-performance-monitor';

export interface ProviderRanking {
  providerId: string;
  rank: number;
  score: number;
  level: 'beginner' | 'intermediate' | 'experienced' | 'professional' | 'expert';
  category: string;
  subcategory?: string;
  location: string;
  metrics: {
    // Core metrics
    qualityScore: number;
    reliabilityScore: number;
    responsivenessScore: number;
    professionalismScore: number;
    
    // Performance metrics
    completionRate: number;
    onTimeRate: number;
    customerSatisfaction: number;
    repeatClientRate: number;
    
    // Business metrics
    totalBookings: number;
    totalRevenue: number;
    averageRating: number;
    totalReviews: number;
    
    // Growth metrics
    growthRate: number;
    marketShare: number;
    competitivePosition: number;
    
    // Verification metrics
    verificationLevel: string;
    verificationScore: number;
    documentCompleteness: number;
  };
  badges: {
    id: string;
    name: string;
    description: string;
    earnedAt: Date;
    category: 'quality' | 'performance' | 'growth' | 'special';
  }[];
  achievements: {
    id: string;
    name: string;
    description: string;
    earnedAt: Date;
    value: number;
  }[];
  trends: {
    rankChange: number;
    scoreChange: number;
    period: string;
  };
  lastUpdated: Date;
}

export interface RankingCriteria {
  category: string;
  subcategory?: string;
  location?: string;
  minScore?: number;
  maxScore?: number;
  level?: string;
  limit?: number;
}

export class ProviderRankingService {
  private static instance: ProviderRankingService;

  private constructor() {}

  public static getInstance(): ProviderRankingService {
    if (!ProviderRankingService.instance) {
      ProviderRankingService.instance = new ProviderRankingService();
    }
    return ProviderRankingService.instance;
  }

  async calculateProviderRanking(providerId: string): Promise<ProviderRanking> {
    try {
      // Get provider data
      const providerData = await this.getProviderData(providerId);
      if (!providerData) {
        throw new Error('Provider not found');
      }

      // Get performance metrics
      const performanceMetrics = await providerPerformanceMonitor.calculatePerformanceMetrics(providerId);
      
      // Get verification status
      const verificationStatus = await providerVerificationService.getVerificationStatus(providerId);
      
      // Get additional metrics
      const additionalMetrics = await this.getAdditionalMetrics(providerId);

      // Calculate ranking score
      const rankingScore = this.calculateRankingScore(
        performanceMetrics,
        verificationStatus,
        additionalMetrics
      );

      // Determine level
      const level = this.determineLevel(rankingScore);

      // Get badges and achievements
      const badges = await this.calculateBadges(providerId, rankingScore, performanceMetrics);
      const achievements = await this.calculateAchievements(providerId, performanceMetrics);

      // Get trends
      const trends = await this.calculateTrends(providerId, rankingScore);

      const ranking: ProviderRanking = {
        providerId,
        rank: 0, // Will be set after ranking calculation
        score: rankingScore,
        level,
        category: providerData.category || 'general',
        subcategory: providerData.subcategory,
        location: providerData.location || 'unknown',
        metrics: {
          qualityScore: this.calculateQualityScore(performanceMetrics, additionalMetrics),
          reliabilityScore: this.calculateReliabilityScore(performanceMetrics),
          responsivenessScore: this.calculateResponsivenessScore(performanceMetrics, additionalMetrics),
          professionalismScore: this.calculateProfessionalismScore(verificationStatus, additionalMetrics),
          completionRate: performanceMetrics.metrics.completionRate,
          onTimeRate: performanceMetrics.metrics.onTimeRate,
          customerSatisfaction: performanceMetrics.metrics.averageRating,
          repeatClientRate: performanceMetrics.metrics.clientRetentionRate,
          totalBookings: performanceMetrics.metrics.totalBookings,
          totalRevenue: performanceMetrics.metrics.totalRevenue,
          averageRating: performanceMetrics.metrics.averageRating,
          totalReviews: performanceMetrics.metrics.totalReviews,
          growthRate: performanceMetrics.trends.revenueGrowth,
          marketShare: 0, // Will be calculated separately
          competitivePosition: 0, // Will be calculated separately
          verificationLevel: verificationStatus?.verificationLevel || 'unverified',
          verificationScore: verificationStatus?.score || 0,
          documentCompleteness: this.calculateDocumentCompleteness(verificationStatus)
        },
        badges,
        achievements,
        trends,
        lastUpdated: new Date()
      };

      // Update provider ranking
      await this.updateProviderRanking(ranking);

      return ranking;

    } catch (error) {
      console.error('Calculate provider ranking error:', error);
      throw error;
    }
  }

  async getProviderRankings(criteria: RankingCriteria): Promise<ProviderRanking[]> {
    try {
      let rankingsQuery = query(collection(getDb(), 'providerRankings'));

      // Apply filters
      if (criteria.category) {
        rankingsQuery = query(rankingsQuery, where('category', '==', criteria.category));
      }
      if (criteria.subcategory) {
        rankingsQuery = query(rankingsQuery, where('subcategory', '==', criteria.subcategory));
      }
      if (criteria.location) {
        rankingsQuery = query(rankingsQuery, where('location', '==', criteria.location));
      }
      if (criteria.level) {
        rankingsQuery = query(rankingsQuery, where('level', '==', criteria.level));
      }
      if (criteria.minScore) {
        rankingsQuery = query(rankingsQuery, where('score', '>=', criteria.minScore));
      }
      if (criteria.maxScore) {
        rankingsQuery = query(rankingsQuery, where('score', '<=', criteria.maxScore));
      }

      // Order by score and limit
      rankingsQuery = query(rankingsQuery, orderBy('score', 'desc'));
      if (criteria.limit) {
        rankingsQuery = query(rankingsQuery, limit(criteria.limit));
      }

      const snapshot = await getDocs(rankingsQuery);
      const rankings = snapshot.docs.map((doc, index) => ({
        ...doc.data(),
        rank: index + 1,
        lastUpdated: doc.data().lastUpdated.toDate()
      } as ProviderRanking));

      return rankings;

    } catch (error) {
      console.error('Get provider rankings error:', error);
      return [];
    }
  }

  async getProviderRanking(providerId: string): Promise<ProviderRanking | null> {
    try {
      const rankingQuery = query(
        collection(getDb(), 'providerRankings'),
        where('providerId', '==', providerId)
      );

      const snapshot = await getDocs(rankingQuery);
      if (snapshot.empty) {
        return null;
      }

      const ranking = snapshot.docs[0].data() as ProviderRanking;
      ranking.lastUpdated = new Date(ranking.lastUpdated);

      return ranking;

    } catch (error) {
      console.error('Get provider ranking error:', error);
      return null;
    }
  }

  async updateAllRankings(): Promise<void> {
    try {
      // Get all providers
      const providersQuery = query(collection(getDb(), 'users'), where('role', '==', 'provider'));
      const providersSnapshot = await getDocs(providersQuery);

      // Calculate rankings for all providers
      const rankingPromises = providersSnapshot.docs.map(doc => 
        this.calculateProviderRanking(doc.id)
      );

      await Promise.all(rankingPromises);

      // Update global rankings
      await this.updateGlobalRankings();

    } catch (error) {
      console.error('Update all rankings error:', error);
    }
  }

  async getRankingLeaderboard(
    category?: string,
    location?: string,
    limit: number = 10
  ): Promise<ProviderRanking[]> {
    const criteria: RankingCriteria = {
      category: category || '',
      location: location || '',
      limit
    };

    return this.getProviderRankings(criteria);
  }

  private async getProviderData(providerId: string): Promise<any> {
    const userDoc = await getDoc(doc(getDb(), 'users', providerId));
    return userDoc.exists() ? userDoc.data() : null;
  }

  private async getAdditionalMetrics(_providerId: string): Promise<any> {
    // Get additional metrics like response time, communication quality, etc.
    return {
      responseTime: 2.5, // hours
      communicationQuality: 4.2,
      professionalism: 4.5,
      punctuality: 4.3
    };
  }

  private calculateRankingScore(
    performanceMetrics: any,
    verificationStatus: any,
    additionalMetrics: any
  ): number {
    let score = 0;

    // Quality metrics (30% weight)
    const qualityScore = this.calculateQualityScore(performanceMetrics, additionalMetrics);
    score += qualityScore * 0.3;

    // Performance metrics (25% weight)
    const performanceScore = (
      performanceMetrics.metrics.completionRate * 30 +
      performanceMetrics.metrics.onTimeRate * 25 +
      performanceMetrics.metrics.averageRating * 20 +
      performanceMetrics.metrics.clientRetentionRate * 25
    );
    score += performanceScore * 0.25;

    // Business metrics (20% weight)
    const businessScore = (
      Math.min(performanceMetrics.metrics.totalBookings * 0.5, 30) +
      Math.min(performanceMetrics.metrics.totalRevenue * 0.001, 25) +
      Math.min(performanceMetrics.metrics.totalReviews * 2, 25) +
      Math.min(performanceMetrics.trends.revenueGrowth * 0.5, 20)
    );
    score += businessScore * 0.2;

    // Verification metrics (15% weight)
    const verificationScore = verificationStatus?.score || 0;
    score += verificationScore * 0.15;

    // Additional metrics (10% weight)
    const additionalScore = (
      additionalMetrics.responseTime * 10 +
      additionalMetrics.communicationQuality * 20 +
      additionalMetrics.professionalism * 20 +
      additionalMetrics.punctuality * 20
    );
    score += additionalScore * 0.1;

    return Math.min(Math.round(score), 100);
  }

  private calculateQualityScore(performanceMetrics: any, additionalMetrics: any): number {
    return (
      performanceMetrics.metrics.averageRating * 20 +
      additionalMetrics.communicationQuality * 20 +
      additionalMetrics.professionalism * 20 +
      additionalMetrics.punctuality * 20 +
      performanceMetrics.metrics.completionRate * 20
    );
  }

  private calculateReliabilityScore(performanceMetrics: any): number {
    return (
      performanceMetrics.metrics.completionRate * 40 +
      performanceMetrics.metrics.onTimeRate * 30 +
      performanceMetrics.metrics.clientRetentionRate * 30
    );
  }

  private calculateResponsivenessScore(performanceMetrics: any, additionalMetrics: any): number {
    const responseTimeScore = Math.max(0, 100 - (additionalMetrics.responseTime * 10));
    return responseTimeScore;
  }

  private calculateProfessionalismScore(verificationStatus: any, additionalMetrics: any): number {
    const verificationScore = verificationStatus?.score || 0;
    const professionalismScore = additionalMetrics.professionalism * 20;
    return verificationScore + professionalismScore;
  }

  private calculateDocumentCompleteness(verificationStatus: any): number {
    if (!verificationStatus?.documents) return 0;
    const totalDocs = verificationStatus.documents.length;
    const approvedDocs = verificationStatus.documents.filter((doc: any) => doc.status === 'approved').length;
    return totalDocs > 0 ? (approvedDocs / totalDocs) * 100 : 0;
  }

  private determineLevel(score: number): 'beginner' | 'intermediate' | 'experienced' | 'professional' | 'expert' {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'professional';
    if (score >= 60) return 'experienced';
    if (score >= 40) return 'intermediate';
    return 'beginner';
  }

  private async calculateBadges(providerId: string, score: number, performanceMetrics: any): Promise<any[]> {
    const badges: any[] = [];

    // Quality badges
    if (performanceMetrics.metrics.averageRating >= 4.5) {
      badges.push({
        id: 'high_quality',
        name: 'High Quality',
        description: 'Maintains excellent quality standards',
        earnedAt: new Date(),
        category: 'quality'
      });
    }

    // Performance badges
    if (performanceMetrics.metrics.completionRate >= 0.95) {
      badges.push({
        id: 'reliable',
        name: 'Reliable',
        description: 'Consistently completes jobs on time',
        earnedAt: new Date(),
        category: 'performance'
      });
    }

    // Growth badges
    if (performanceMetrics.trends.revenueGrowth >= 20) {
      badges.push({
        id: 'growing',
        name: 'Growing',
        description: 'Shows strong growth in revenue',
        earnedAt: new Date(),
        category: 'growth'
      });
    }

    // Special badges
    if (score >= 90) {
      badges.push({
        id: 'expert',
        name: 'Expert',
        description: 'Top-tier provider with exceptional performance',
        earnedAt: new Date(),
        category: 'special'
      });
    }

    return badges;
  }

  private async calculateAchievements(providerId: string, performanceMetrics: any): Promise<any[]> {
    const achievements: any[] = [];

    // Booking achievements
    if (performanceMetrics.metrics.totalBookings >= 100) {
      achievements.push({
        id: 'century_bookings',
        name: 'Century Bookings',
        description: 'Completed 100+ bookings',
        earnedAt: new Date(),
        value: performanceMetrics.metrics.totalBookings
      });
    }

    // Revenue achievements
    if (performanceMetrics.metrics.totalRevenue >= 100000) {
      achievements.push({
        id: 'high_earner',
        name: 'High Earner',
        description: 'Earned ₱100,000+ in revenue',
        earnedAt: new Date(),
        value: performanceMetrics.metrics.totalRevenue
      });
    }

    // Review achievements
    if (performanceMetrics.metrics.totalReviews >= 50) {
      achievements.push({
        id: 'reviewed',
        name: 'Well Reviewed',
        description: 'Received 50+ reviews',
        earnedAt: new Date(),
        value: performanceMetrics.metrics.totalReviews
      });
    }

    return achievements;
  }

  private async calculateTrends(providerId: string, currentScore: number): Promise<any> {
    // Get previous ranking for comparison
    const previousRanking = await this.getPreviousRanking(providerId);
    
    if (!previousRanking) {
      return {
        rankChange: 0,
        scoreChange: 0,
        period: 'new'
      };
    }

    // Note: rankChange calculation is simplified here
    // In production, you would need to recalculate global rankings to get accurate rank changes
    const rankChange = 0; // Placeholder - would need global ranking recalculation
    const scoreChange = currentScore - previousRanking.score;

    return {
      rankChange,
      scoreChange,
      period: 'weekly'
    };
  }

  private async getPreviousRanking(providerId: string): Promise<any> {
    // Get previous ranking from history
    const historyQuery = query(
      collection(getDb(), 'rankingHistory'),
      where('providerId', '==', providerId),
      orderBy('date', 'desc'),
      limit(1)
    );

    const snapshot = await getDocs(historyQuery);
    return snapshot.docs[0]?.data() || null;
  }

  private async updateProviderRanking(ranking: ProviderRanking): Promise<void> {
    try {
      await updateDoc(doc(getDb(), 'users', ranking.providerId), {
        ranking: {
          score: ranking.score,
          level: ranking.level,
          lastUpdated: new Date()
        }
      });

      // Store in rankings collection
      await setDoc(doc(getDb(), 'providerRankings', ranking.providerId), {
        ...ranking,
        lastUpdated: serverTimestamp()
      });

      // Store in history
      await setDoc(doc(getDb(), 'rankingHistory', `${ranking.providerId}_${Date.now()}`), {
        ...ranking,
        date: new Date()
      });

    } catch (error) {
      console.error('Update provider ranking error:', error);
    }
  }

  private async updateGlobalRankings(): Promise<void> {
    try {
      // Get all rankings and update ranks
      const rankingsQuery = query(
        collection(getDb(), 'providerRankings'),
        orderBy('score', 'desc')
      );

      const snapshot = await getDocs(rankingsQuery);
      const updatePromises = snapshot.docs.map((doc, index) => 
        updateDoc(doc.ref, { rank: index + 1 })
      );

      await Promise.all(updatePromises);

    } catch (error) {
      console.error('Update global rankings error:', error);
    }
  }
}

export const providerRankingService = ProviderRankingService.getInstance();
