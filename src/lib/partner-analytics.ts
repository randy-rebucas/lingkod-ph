import { getDb  } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  orderBy, 
  limit,
  Timestamp,
  serverTimestamp,
  addDoc,
  updateDoc,
  setDoc
} from 'firebase/firestore';

/**
 * Partner analytics data structure
 */
export interface PartnerAnalytics {
  partnerId: string;
  partnerName: string;  
  totalReferrals: number;
  activeReferrals: number;
  completedJobs: number;
  totalRevenue: number;
  partnerCommission: number;
  conversionRate: number;
  averageJobValue: number;
  topPerformingCategories: string[];
  monthlyStats: MonthlyStats[];
  lastUpdated: Timestamp;
}

export interface MonthlyStats {
  month: string;
  year: number;
  referrals: number;
  completedJobs: number;
  revenue: number;
  commission: number;
}

export interface ReferralData {
  id: string;
  partnerId: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserRole: 'provider' | 'client' | 'agency';
  referralDate: Timestamp;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalJobs: number;
  completedJobs: number;
  totalRevenue: number;
  commissionEarned: number;
  lastActivity: Timestamp;
}

export interface PartnerCommission {
  id: string;
  partnerId: string;
  referralId: string;
  jobId: string;
  bookingId: string;
  commissionAmount: number;
  commissionRate: number;
  jobValue: number;
  status: 'pending' | 'paid' | 'cancelled';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  paymentMethod?: string;
}

/**
 * Partner analytics service
 */
export class PartnerAnalyticsService {
  private static readonly PARTNERS_COLLECTION = 'partners';
  private static readonly REFERRALS_COLLECTION = 'referrals';
  private static readonly COMMISSIONS_COLLECTION = 'partnerCommissions';
  private static readonly ANALYTICS_COLLECTION = 'partnerAnalytics';

  /**
   * Get partner analytics
   */
  static async getPartnerAnalytics(partnerId: string): Promise<PartnerAnalytics | null> {
    try {
      // Get partner document
      const partnerDoc = await getDoc(doc(getDb(), this.PARTNERS_COLLECTION, partnerId));
      if (!partnerDoc.exists()) {
        return null;
      }

      const partnerData = partnerDoc.data();
      
      // Get referrals data
      const referralsQuery = query(
        collection(getDb(), this.REFERRALS_COLLECTION),
        where('partnerId', '==', partnerId)
      );
      const referralsSnapshot = await getDocs(referralsQuery);
      const referrals = referralsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralData));

      // Get commissions data
      const commissionsQuery = query(
        collection(getDb(), this.COMMISSIONS_COLLECTION),
        where('partnerId', '==', partnerId)
      );
      const commissionsSnapshot = await getDocs(commissionsQuery);
      const commissions = commissionsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCommission));

      // Calculate analytics
      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;
      const completedJobs = referrals.reduce((sum, r) => sum + r.completedJobs, 0);
      const totalRevenue = referrals.reduce((sum, r) => sum + r.totalRevenue, 0);
      const partnerCommission = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commissionAmount, 0);
      
      const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;
      const averageJobValue = completedJobs > 0 ? totalRevenue / completedJobs : 0;

      // Get top performing categories
      const categoryStats = new Map<string, number>();
      referrals.forEach(referral => {
        // This would need to be enhanced with actual category data
        categoryStats.set('General', (categoryStats.get('General') || 0) + 1);
      });
      const topPerformingCategories = Array.from(categoryStats.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 5)
        .map(([category]) => category);

      // Generate monthly stats
      const monthlyStats = this.generateMonthlyStats(referrals, commissions);

      const analytics: PartnerAnalytics = {
        partnerId,
        partnerName: partnerData.displayName || partnerData.name || 'Unknown Partner',
        totalReferrals,
        activeReferrals,
        completedJobs,
        totalRevenue,
        partnerCommission,
        conversionRate,
        averageJobValue,
        topPerformingCategories,
        monthlyStats,
        lastUpdated: serverTimestamp() as Timestamp
      };

      // Cache analytics
      await this.cacheAnalytics(analytics);

      return analytics;
    } catch (error) {
      console.error('Error getting partner analytics:', error);
      return null;
    }
  }

  /**
   * Get partner referrals
   */
  static async getPartnerReferrals(
    partnerId: string, 
    limitCount: number = 50
  ): Promise<ReferralData[]> {
    try {
      const referralsQuery = query(
        collection(getDb(), this.REFERRALS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('referralDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(referralsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralData));
    } catch (error) {
      console.error('Error getting partner referrals:', error);
      return [];
    }
  }

  /**
   * Get partner commissions
   */
  static async getPartnerCommissions(
    partnerId: string,
    status?: 'pending' | 'paid' | 'cancelled',
    limitCount: number = 50
  ): Promise<PartnerCommission[]> {
    try {
      let commissionsQuery = query(
        collection(getDb(), this.COMMISSIONS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      if (status) {
        commissionsQuery = query(
          collection(getDb(), this.COMMISSIONS_COLLECTION),
          where('partnerId', '==', partnerId),
          where('status', '==', status),
          orderBy('createdAt', 'desc'),
          limit(limitCount)
        );
      }

      const snapshot = await getDocs(commissionsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCommission));
    } catch (error) {
      console.error('Error getting partner commissions:', error);
      return [];
    }
  }

  /**
   * Create referral
   */
  static async createReferral(
    partnerId: string,
    referredUserId: string,
    referredUserData: {
      name: string;
      email: string;
      role: 'provider' | 'client' | 'agency';
    }
  ): Promise<{ success: boolean; referralId?: string; error?: string }> {
    try {
      const referralData: Omit<ReferralData, 'id'> = {
        partnerId,
        referredUserId,
        referredUserName: referredUserData.name,
        referredUserEmail: referredUserData.email,
        referredUserRole: referredUserData.role,
        referralDate: serverTimestamp() as Timestamp,
        status: 'pending',
        totalJobs: 0,
        completedJobs: 0,
        totalRevenue: 0,
        commissionEarned: 0,
        lastActivity: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(getDb(), this.REFERRALS_COLLECTION), referralData);
      
      return { success: true, referralId: docRef.id };
    } catch (error) {
      console.error('Error creating referral:', error);
      return { success: false, error: 'Failed to create referral' };
    }
  }

  /**
   * Update referral status
   */
  static async updateReferralStatus(
    referralId: string,
    status: 'pending' | 'active' | 'completed' | 'cancelled'
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(getDb(), this.REFERRALS_COLLECTION, referralId), {
        status,
        lastActivity: serverTimestamp() as Timestamp
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating referral status:', error);
      return { success: false, error: 'Failed to update referral status' };
    }
  }

  /**
   * Record commission
   */
  static async recordCommission(
    partnerId: string,
    referralId: string,
    jobId: string,
    bookingId: string,
    jobValue: number,
    commissionRate: number = 0.05 // 5% default commission
  ): Promise<{ success: boolean; commissionId?: string; error?: string }> {
    try {
      const commissionAmount = jobValue * commissionRate;
      
      const commissionData: Omit<PartnerCommission, 'id'> = {
        partnerId,
        referralId,
        jobId,
        bookingId,
        commissionAmount,
        commissionRate,
        jobValue,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp
      };

      const docRef = await addDoc(collection(getDb(), this.COMMISSIONS_COLLECTION), commissionData);
      
      return { success: true, commissionId: docRef.id };
    } catch (error) {
      console.error('Error recording commission:', error);
      return { success: false, error: 'Failed to record commission' };
    }
  }

  /**
   * Mark commission as paid
   */
  static async markCommissionAsPaid(
    commissionId: string,
    paymentMethod: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(getDb(), this.COMMISSIONS_COLLECTION, commissionId), {
        status: 'paid',
        paidAt: serverTimestamp() as Timestamp,
        paymentMethod
      });

      return { success: true };
    } catch (error) {
      console.error('Error marking commission as paid:', error);
      return { success: false, error: 'Failed to mark commission as paid' };
    }
  }

  /**
   * Get partner performance metrics
   */
  static async getPartnerPerformanceMetrics(partnerId: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    conversionRate: number;
    totalRevenue: number;
    totalCommission: number;
    averageJobValue: number;
    topCategories: string[];
    monthlyGrowth: number;
  }> {
    try {
      const analytics = await this.getPartnerAnalytics(partnerId);
      if (!analytics) {
        return {
          totalReferrals: 0,
          activeReferrals: 0,
          conversionRate: 0,
          totalRevenue: 0,
          totalCommission: 0,
          averageJobValue: 0,
          topCategories: [],
          monthlyGrowth: 0
        };
      }

      // Calculate monthly growth
      const monthlyGrowth = this.calculateMonthlyGrowth(analytics.monthlyStats);

      return {
        totalReferrals: analytics.totalReferrals,
        activeReferrals: analytics.activeReferrals,
        conversionRate: analytics.conversionRate,
        totalRevenue: analytics.totalRevenue,
        totalCommission: analytics.partnerCommission,
        averageJobValue: analytics.averageJobValue,
        topCategories: analytics.topPerformingCategories,
        monthlyGrowth
      };
    } catch (error) {
      console.error('Error getting partner performance metrics:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        conversionRate: 0,
        totalRevenue: 0,
        totalCommission: 0,
        averageJobValue: 0,
        topCategories: [],
        monthlyGrowth: 0
      };
    }
  }

  /**
   * Generate monthly stats
   */
  private static generateMonthlyStats(
    referrals: ReferralData[],
    commissions: PartnerCommission[]
  ): MonthlyStats[] {
    const monthlyData = new Map<string, MonthlyStats>();

    // Process referrals
    referrals.forEach(referral => {
      const date = (referral as any).referralDate?.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (!monthlyData.has(monthKey)) {
        monthlyData.set(monthKey, {
          month: date.toLocaleString('default', { month: 'long' }),
          year: date.getFullYear(),
          referrals: 0,
          completedJobs: 0,
          revenue: 0,
          commission: 0
        });
      }

      const monthData = monthlyData.get(monthKey)!;
      monthData.referrals += 1;
      monthData.completedJobs += referral.completedJobs;
      monthData.revenue += referral.totalRevenue;
    });

    // Process commissions
    commissions.forEach(commission => {
      const date = (commission as any).createdAt?.toDate();
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      
      if (monthlyData.has(monthKey)) {
        const monthData = monthlyData.get(monthKey)!;
        monthData.commission += (commission as any).commissionAmount || 0;
      }
    });

    return Array.from(monthlyData.values()).sort((a, b) => {
      if (a.year !== b.year) return b.year - a.year;
      return b.month.localeCompare(a.month);
    });
  }

  /**
   * Calculate monthly growth
   */
  private static calculateMonthlyGrowth(monthlyStats: MonthlyStats[]): number {
    if (monthlyStats.length < 2) return 0;

    const currentMonth = monthlyStats[0];
    const previousMonth = monthlyStats[1];

    if ((previousMonth as any).revenue === 0) return 0;

    return ((currentMonth.revenue - (previousMonth as any).revenue) / (previousMonth as any).revenue) * 100;
  }

  /**
   * Cache analytics data
   */
  private static async cacheAnalytics(analytics: PartnerAnalytics): Promise<void> {
    try {
      await setDoc(doc(getDb(), this.ANALYTICS_COLLECTION, analytics.partnerId), analytics);
    } catch (error) {
      console.error('Error caching analytics:', error);
    }
  }
}
