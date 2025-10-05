import { getDb  } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  doc, 
  getDoc, 
  addDoc, 
  updateDoc,
  serverTimestamp,
  Timestamp,
  orderBy
} from 'firebase/firestore';
import { generatePartnerReferralCode } from './referral-code-generator';

/**
 * Referral tracking data structures
 */
export interface ReferralTracking {
  id: string;
  partnerId: string;
  partnerName: string;
  referredUserId: string;
  referredUserName: string;
  referredUserEmail: string;
  referredUserRole: 'provider' | 'client' | 'agency';
  referralCode: string;
  referralLink: string;
  referralDate: Timestamp;
  status: 'pending' | 'active' | 'completed' | 'cancelled';
  totalJobs: number;
  completedJobs: number;
  totalRevenue: number;
  commissionEarned: number;
  lastActivity: Timestamp;
  metadata: {
    source: string; // 'email', 'social', 'direct', 'website'
    campaign?: string;
    utm_source?: string;
    utm_medium?: string;
    utm_campaign?: string;
  };
}

export interface ReferralCode {
  id: string;
  partnerId: string;
  code: string;
  description: string;
  isActive: boolean;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
  usageCount: number;
  maxUsage?: number;
  discountPercentage?: number;
  discountAmount?: number;
}

export interface ReferralCampaign {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  startDate: Timestamp;
  endDate: Timestamp;
  isActive: boolean;
  targetAudience: string[];
  commissionRate: number;
  bonusAmount?: number;
  totalReferrals: number;
  successfulReferrals: number;
  totalCommission: number;
}

/**
 * Partner referral tracking service
 */
export class PartnerReferralTracker {
  private static readonly REFERRALS_COLLECTION = 'referrals';
  private static readonly REFERRAL_CODES_COLLECTION = 'referralCodes';
  private static readonly REFERRAL_CAMPAIGNS_COLLECTION = 'referralCampaigns';
  private static readonly USERS_COLLECTION = 'users';

  /**
   * Generate unique referral code
   */
  static generateReferralCode(partnerId: string, partnerName: string): string {
    return generatePartnerReferralCode(partnerId, partnerName);
  }

  /**
   * Create referral code
   */
  static async createReferralCode(
    partnerId: string,
    description: string,
    options: {
      expiresAt?: Date;
      maxUsage?: number;
      discountPercentage?: number;
      discountAmount?: number;
    } = {}
  ): Promise<{ success: boolean; referralCode?: ReferralCode; error?: string }> {
    try {
      // Get partner data
      const partnerDoc = await getDoc(doc(getDb(), this.USERS_COLLECTION, partnerId));
      if (!partnerDoc.exists()) {
        return { success: false, error: 'Partner not found' };
      }

      const partnerData = partnerDoc.data();
      const partnerName = partnerData.displayName || partnerData.name || 'Partner';

      // Generate unique code
      const code = this.generateReferralCode(partnerId, partnerName);

      const referralCodeData: Omit<ReferralCode, 'id'> = {
        partnerId,
        code,
        description,
        isActive: true,
        createdAt: serverTimestamp() as Timestamp,
        expiresAt: options.expiresAt ? Timestamp.fromDate(options.expiresAt) : undefined,
        usageCount: 0,
        maxUsage: options.maxUsage,
        discountPercentage: options.discountPercentage,
        discountAmount: options.discountAmount
      };

      const docRef = await addDoc(collection(getDb(), this.REFERRAL_CODES_COLLECTION), referralCodeData);
      
      const referralCode: ReferralCode = {
        id: docRef.id,
        ...referralCodeData
      };

      return { success: true, referralCode };
    } catch (error) {
      console.error('Error creating referral code:', error);
      return { success: false, error: 'Failed to create referral code' };
    }
  }

  /**
   * Get partner referral codes
   */
  static async getPartnerReferralCodes(partnerId: string): Promise<ReferralCode[]> {
    try {
      const codesQuery = query(
        collection(getDb(), this.REFERRAL_CODES_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(codesQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralCode));
    } catch (error) {
      console.error('Error getting referral codes:', error);
      return [];
    }
  }

  /**
   * Track referral
   */
  static async trackReferral(
    partnerId: string,
    referralCode: string,
    referredUserData: {
      userId: string;
      name: string;
      email: string;
      role: 'provider' | 'client' | 'agency';
    },
    metadata: {
      source: string;
      campaign?: string;
      utm_source?: string;
      utm_medium?: string;
      utm_campaign?: string;
    }
  ): Promise<{ success: boolean; referralId?: string; error?: string }> {
    try {
      // Verify referral code
      const codeQuery = query(
        collection(getDb(), this.REFERRAL_CODES_COLLECTION),
        where('code', '==', referralCode),
        where('isActive', '==', true)
      );
      const codeSnapshot = await getDocs(codeQuery);
      
      if (codeSnapshot.empty) {
        return { success: false, error: 'Invalid or inactive referral code' };
      }

      const codeDoc = codeSnapshot.docs[0];
      const codeData = codeDoc.data() as ReferralCode;

      // Check if code has expired
      if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
        return { success: false, error: 'Referral code has expired' };
      }

      // Check usage limit
      if (codeData.maxUsage && codeData.usageCount >= codeData.maxUsage) {
        return { success: false, error: 'Referral code usage limit reached' };
      }

      // Get partner data
      const partnerDoc = await getDoc(doc(getDb(), this.USERS_COLLECTION, partnerId));
      if (!partnerDoc.exists()) {
        return { success: false, error: 'Partner not found' };
      }

      const partnerData = partnerDoc.data();
      const partnerName = partnerData.displayName || partnerData.name || 'Partner';

      // Create referral tracking record
      const referralData: Omit<ReferralTracking, 'id'> = {
        partnerId,
        partnerName,
        referredUserId: referredUserData.userId,
        referredUserName: referredUserData.name,
        referredUserEmail: referredUserData.email,
        referredUserRole: referredUserData.role,
        referralCode,
        referralLink: `${process.env.NEXT_PUBLIC_APP_URL}/signup?ref=${referralCode}`,
        referralDate: serverTimestamp() as Timestamp,
        status: 'pending',
        totalJobs: 0,
        completedJobs: 0,
        totalRevenue: 0,
        commissionEarned: 0,
        lastActivity: serverTimestamp() as Timestamp,
        metadata
      };

      const docRef = await addDoc(collection(getDb(), this.REFERRALS_COLLECTION), referralData);

      // Update referral code usage count
      await updateDoc(doc(getDb(), this.REFERRAL_CODES_COLLECTION, codeDoc.id), {
        usageCount: codeData.usageCount + 1
      });

      return { success: true, referralId: docRef.id };
    } catch (error) {
      console.error('Error tracking referral:', error);
      return { success: false, error: 'Failed to track referral' };
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
        lastActivity: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating referral status:', error);
      return { success: false, error: 'Failed to update referral status' };
    }
  }

  /**
   * Record referral activity
   */
  static async recordReferralActivity(
    referralId: string,
    activity: {
      type: 'job_created' | 'job_completed' | 'revenue_generated' | 'commission_earned';
      amount?: number;
      jobId?: string;
      bookingId?: string;
    }
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const referralDoc = await getDoc(doc(getDb(), this.REFERRALS_COLLECTION, referralId));
      if (!referralDoc.exists()) {
        return { success: false, error: 'Referral not found' };
      }

      const referralData = referralDoc.data() as ReferralTracking;
      const updates: any = {
        lastActivity: serverTimestamp()
      };

      switch (activity.type) {
        case 'job_created':
          updates.totalJobs = referralData.totalJobs + 1;
          break;
        case 'job_completed':
          updates.completedJobs = referralData.completedJobs + 1;
          break;
        case 'revenue_generated':
          if (activity.amount) {
            updates.totalRevenue = referralData.totalRevenue + activity.amount;
          }
          break;
        case 'commission_earned':
          if (activity.amount) {
            updates.commissionEarned = referralData.commissionEarned + activity.amount;
          }
          break;
      }

      await updateDoc(doc(getDb(), this.REFERRALS_COLLECTION, referralId), updates);

      return { success: true };
    } catch (error) {
      console.error('Error recording referral activity:', error);
      return { success: false, error: 'Failed to record referral activity' };
    }
  }

  /**
   * Get referral statistics
   */
  static async getReferralStatistics(partnerId: string): Promise<{
    totalReferrals: number;
    activeReferrals: number;
    completedReferrals: number;
    totalRevenue: number;
    totalCommission: number;
    conversionRate: number;
    topSources: Array<{ source: string; count: number }>;
    monthlyReferrals: Array<{ month: string; count: number }>;
  }> {
    try {
      const referralsQuery = query(
        collection(getDb(), this.REFERRALS_COLLECTION),
        where('partnerId', '==', partnerId)
      );

      const snapshot = await getDocs(referralsQuery);
      const referrals = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralTracking));

      const totalReferrals = referrals.length;
      const activeReferrals = referrals.filter(r => r.status === 'active').length;
      const completedReferrals = referrals.filter(r => r.status === 'completed').length;
      const totalRevenue = referrals.reduce((sum, r) => sum + r.totalRevenue, 0);
      const totalCommission = referrals.reduce((sum, r) => sum + r.commissionEarned, 0);
      const conversionRate = totalReferrals > 0 ? (activeReferrals / totalReferrals) * 100 : 0;

      // Calculate top sources
      const sourceStats = new Map<string, number>();
      referrals.forEach(referral => {
        const source = referral.metadata.source;
        sourceStats.set(source, (sourceStats.get(source) || 0) + 1);
      });
      const topSources = Array.from(sourceStats.entries())
        .map(([source, count]) => ({ source, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Calculate monthly referrals
      const monthlyStats = new Map<string, number>();
      referrals.forEach(referral => {
        const date = referral.referralDate.toDate();
        const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        monthlyStats.set(monthKey, (monthlyStats.get(monthKey) || 0) + 1);
      });
      const monthlyReferrals = Array.from(monthlyStats.entries())
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => b.month.localeCompare(a.month))
        .slice(0, 12);

      return {
        totalReferrals,
        activeReferrals,
        completedReferrals,
        totalRevenue,
        totalCommission,
        conversionRate,
        topSources,
        monthlyReferrals
      };
    } catch (error) {
      console.error('Error getting referral statistics:', error);
      return {
        totalReferrals: 0,
        activeReferrals: 0,
        completedReferrals: 0,
        totalRevenue: 0,
        totalCommission: 0,
        conversionRate: 0,
        topSources: [],
        monthlyReferrals: []
      };
    }
  }

  /**
   * Create referral campaign
   */
  static async createReferralCampaign(
    partnerId: string,
    campaignData: {
      name: string;
      description: string;
      startDate: Date;
      endDate: Date;
      targetAudience: string[];
      commissionRate: number;
      bonusAmount?: number;
    }
  ): Promise<{ success: boolean; campaignId?: string; error?: string }> {
    try {
      const campaign: Omit<ReferralCampaign, 'id'> = {
        partnerId,
        name: campaignData.name,
        description: campaignData.description,
        startDate: Timestamp.fromDate(campaignData.startDate),
        endDate: Timestamp.fromDate(campaignData.endDate),
        isActive: true,
        targetAudience: campaignData.targetAudience,
        commissionRate: campaignData.commissionRate,
        bonusAmount: campaignData.bonusAmount,
        totalReferrals: 0,
        successfulReferrals: 0,
        totalCommission: 0
      };

      const docRef = await addDoc(collection(getDb(), this.REFERRAL_CAMPAIGNS_COLLECTION), campaign);
      
      return { success: true, campaignId: docRef.id };
    } catch (error) {
      console.error('Error creating referral campaign:', error);
      return { success: false, error: 'Failed to create referral campaign' };
    }
  }

  /**
   * Get partner campaigns
   */
  static async getPartnerCampaigns(partnerId: string): Promise<ReferralCampaign[]> {
    try {
      const campaignsQuery = query(
        collection(getDb(), this.REFERRAL_CAMPAIGNS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('startDate', 'desc')
      );

      const snapshot = await getDocs(campaignsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ReferralCampaign));
    } catch (error) {
      console.error('Error getting partner campaigns:', error);
      return [];
    }
  }

  /**
   * Validate referral code
   */
  static async validateReferralCode(code: string): Promise<{
    valid: boolean;
    codeData?: ReferralCode;
    error?: string;
  }> {
    try {
      const codeQuery = query(
        collection(getDb(), this.REFERRAL_CODES_COLLECTION),
        where('code', '==', code),
        where('isActive', '==', true)
      );
      const codeSnapshot = await getDocs(codeQuery);
      
      if (codeSnapshot.empty) {
        return { valid: false, error: 'Invalid referral code' };
      }

      const codeDoc = codeSnapshot.docs[0];
      const codeData = { id: codeDoc.id, ...codeDoc.data() } as ReferralCode;

      // Check if code has expired
      if (codeData.expiresAt && codeData.expiresAt.toDate() < new Date()) {
        return { valid: false, error: 'Referral code has expired' };
      }

      // Check usage limit
      if (codeData.maxUsage && codeData.usageCount >= codeData.maxUsage) {
        return { valid: false, error: 'Referral code usage limit reached' };
      }

      return { valid: true, codeData };
    } catch (error) {
      console.error('Error validating referral code:', error);
      return { valid: false, error: 'Failed to validate referral code' };
    }
  }
}
