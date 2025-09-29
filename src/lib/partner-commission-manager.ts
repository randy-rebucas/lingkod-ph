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
  orderBy,
  limit,
  writeBatch
} from 'firebase/firestore';

/**
 * Commission management data structures
 */
export interface PartnerCommission {
  id: string;
  partnerId: string;
  partnerName: string;
  referralId: string;
  jobId: string;
  bookingId: string;
  commissionAmount: number;
  commissionRate: number;
  jobValue: number;
  status: 'pending' | 'paid' | 'cancelled' | 'disputed';
  createdAt: Timestamp;
  paidAt?: Timestamp;
  paymentMethod?: string;
  paymentReference?: string;
  notes?: string;
  metadata: {
    jobCategory: string;
    jobLocation: string;
    clientId: string;
    providerId: string;
    completionDate: Timestamp;
  };
}

export interface CommissionTier {
  id: string;
  partnerId: string;
  name: string;
  description: string;
  minReferrals: number;
  maxReferrals?: number;
  commissionRate: number;
  bonusAmount?: number;
  isActive: boolean;
  effectiveDate: Timestamp;
  expiryDate?: Timestamp;
}

export interface CommissionPayment {
  id: string;
  partnerId: string;
  paymentDate: Timestamp;
  totalAmount: number;
  commissionCount: number;
  paymentMethod: 'bank_transfer' | 'paypal' | 'gcash' | 'paymaya';
  paymentReference: string;
  status: 'pending' | 'completed' | 'failed';
  bankDetails?: {
    accountName: string;
    accountNumber: string;
    bankName: string;
    routingNumber?: string;
  };
  paypalDetails?: {
    email: string;
    transactionId: string;
  };
  notes?: string;
}

export interface CommissionSummary {
  partnerId: string;
  totalCommissions: number;
  paidCommissions: number;
  pendingCommissions: number;
  cancelledCommissions: number;
  disputedCommissions: number;
  totalEarnings: number;
  pendingEarnings: number;
  averageCommission: number;
  commissionRate: number;
  lastPaymentDate?: Timestamp;
  nextPaymentDate?: Timestamp;
}

/**
 * Partner commission management service
 */
export class PartnerCommissionManager {
  private static readonly COMMISSIONS_COLLECTION = 'partnerCommissions';
  private static readonly COMMISSION_TIERS_COLLECTION = 'commissionTiers';
  private static readonly COMMISSION_PAYMENTS_COLLECTION = 'commissionPayments';
  private static readonly USERS_COLLECTION = 'users';

  /**
   * Calculate commission amount
   */
  static calculateCommission(
    jobValue: number,
    commissionRate: number,
    bonusAmount: number = 0
  ): number {
    const baseCommission = jobValue * commissionRate;
    return baseCommission + bonusAmount;
  }

  /**
   * Get commission tier for partner
   */
  static async getCommissionTier(
    partnerId: string,
    totalReferrals: number
  ): Promise<CommissionTier | null> {
    try {
      const tiersQuery = query(
        collection(getDb(), this.COMMISSION_TIERS_COLLECTION),
        where('partnerId', '==', partnerId),
        where('isActive', '==', true),
        where('minReferrals', '<=', totalReferrals),
        orderBy('minReferrals', 'desc'),
        limit(1)
      );

      const snapshot = await getDocs(tiersQuery);
      if (snapshot.empty) {
        return null;
      }

      const tierDoc = snapshot.docs[0];
      const tierData = tierDoc.data() as CommissionTier;

      // Check if tier has max referrals limit
      if (tierData.maxReferrals && totalReferrals > tierData.maxReferrals) {
        return null;
      }

      // Check if tier is within effective date range
      const now = new Date();
      if (tierData.effectiveDate.toDate() > now) {
        return null;
      }

      if (tierData.expiryDate && tierData.expiryDate.toDate() < now) {
        return null;
      }

      return { ...tierData, id: tierDoc.id };
    } catch (error) {
      console.error('Error getting commission tier:', error);
      return null;
    }
  }

  /**
   * Create commission record
   */
  static async createCommission(
    partnerId: string,
    referralId: string,
    jobData: {
      jobId: string;
      bookingId: string;
      jobValue: number;
      jobCategory: string;
      jobLocation: string;
      clientId: string;
      providerId: string;
      completionDate: Date;
    },
    totalReferrals: number
  ): Promise<{ success: boolean; commissionId?: string; error?: string }> {
    try {
      // Get partner data
      const partnerDoc = await getDoc(doc(getDb(), this.USERS_COLLECTION, partnerId));
      if (!partnerDoc.exists()) {
        return { success: false, error: 'Partner not found' };
      }

      const partnerData = partnerDoc.data();
      const partnerName = partnerData.displayName || partnerData.name || 'Partner';

      // Get commission tier
      const commissionTier = await this.getCommissionTier(partnerId, totalReferrals);
      if (!commissionTier) {
        return { success: false, error: 'No valid commission tier found' };
      }

      // Calculate commission
      const commissionAmount = this.calculateCommission(
        jobData.jobValue,
        commissionTier.commissionRate,
        commissionTier.bonusAmount
      );

      const commissionData: Omit<PartnerCommission, 'id'> = {
        partnerId,
        partnerName,
        referralId,
        jobId: jobData.jobId,
        bookingId: jobData.bookingId,
        commissionAmount,
        commissionRate: commissionTier.commissionRate,
        jobValue: jobData.jobValue,
        status: 'pending',
        createdAt: serverTimestamp() as Timestamp,
        metadata: {
          jobCategory: jobData.jobCategory,
          jobLocation: jobData.jobLocation,
          clientId: jobData.clientId,
          providerId: jobData.providerId,
          completionDate: Timestamp.fromDate(jobData.completionDate)
        }
      };

      const docRef = await addDoc(collection(getDb(), this.COMMISSIONS_COLLECTION), commissionData);
      
      return { success: true, commissionId: docRef.id };
    } catch (error) {
      console.error('Error creating commission:', error);
      return { success: false, error: 'Failed to create commission' };
    }
  }

  /**
   * Get partner commissions
   */
  static async getPartnerCommissions(
    partnerId: string,
    filters: {
      status?: 'pending' | 'paid' | 'cancelled' | 'disputed';
      startDate?: Date;
      endDate?: Date;
      limit?: number;
    } = {}
  ): Promise<PartnerCommission[]> {
    try {
      let commissionsQuery = query(
        collection(getDb(), this.COMMISSIONS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('createdAt', 'desc')
      );

      if (filters.status) {
        commissionsQuery = query(
          collection(getDb(), this.COMMISSIONS_COLLECTION),
          where('partnerId', '==', partnerId),
          where('status', '==', filters.status),
          orderBy('createdAt', 'desc')
        );
      }

      if (filters.limit) {
        commissionsQuery = query(commissionsQuery, limit(filters.limit));
      }

      const snapshot = await getDocs(commissionsQuery);
      let commissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCommission));

      // Apply date filters if provided
      if (filters.startDate || filters.endDate) {
        commissions = commissions.filter(commission => {
          const commissionDate = (commission as any).createdAt?.toDate();
          if (filters.startDate && commissionDate < filters.startDate) return false;
          if (filters.endDate && commissionDate > filters.endDate) return false;
          return true;
        });
      }

      return commissions;
    } catch (error) {
      console.error('Error getting partner commissions:', error);
      return [];
    }
  }

  /**
   * Update commission status
   */
  static async updateCommissionStatus(
    commissionId: string,
    status: 'pending' | 'paid' | 'cancelled' | 'disputed',
    notes?: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const updates: any = {
        status
      };

      if (status === 'paid') {
        updates.paidAt = serverTimestamp() as Timestamp;
      }

      if (notes) {
        updates.notes = notes;
      }

      await updateDoc(doc(getDb(), this.COMMISSIONS_COLLECTION, commissionId), updates);

      return { success: true };
    } catch (error) {
      console.error('Error updating commission status:', error);
      return { success: false, error: 'Failed to update commission status' };
    }
  }

  /**
   * Process commission payment
   */
  static async processCommissionPayment(
    partnerId: string,
    commissionIds: string[],
    paymentData: {
      paymentMethod: 'bank_transfer' | 'paypal' | 'gcash' | 'paymaya';
      paymentReference: string;
      bankDetails?: {
        accountName: string;
        accountNumber: string;
        bankName: string;
        routingNumber?: string;
      };
      paypalDetails?: {
        email: string;
        transactionId: string;
      };
      notes?: string;
    }
  ): Promise<{ success: boolean; paymentId?: string; error?: string }> {
    try {
      // Get commissions to be paid
      const commissions = await Promise.all(
        commissionIds.map(id => getDoc(doc(getDb(), this.COMMISSIONS_COLLECTION, id)))
      );

      const validCommissions = commissions
        .filter(doc => doc.exists() && doc.data()?.status === 'pending')
        .map(doc => ({ id: doc.id, ...doc.data() } as PartnerCommission));

      if (validCommissions.length === 0) {
        return { success: false, error: 'No valid commissions found for payment' };
      }

      const totalAmount = validCommissions.reduce((sum, commission) => sum + commission.commissionAmount, 0);

      // Create payment record
      const paymentData_record: Omit<CommissionPayment, 'id'> = {
        partnerId,
        paymentDate: serverTimestamp() as Timestamp,
        totalAmount,
        commissionCount: validCommissions.length,
        paymentMethod: paymentData.paymentMethod,
        paymentReference: paymentData.paymentReference,
        status: 'pending',
        bankDetails: paymentData.bankDetails,
        paypalDetails: paymentData.paypalDetails,
        notes: paymentData.notes
      };

      const paymentDocRef = await addDoc(collection(getDb(), this.COMMISSION_PAYMENTS_COLLECTION), paymentData_record);

      // Update commission statuses
      const batch = writeBatch(getDb());
      validCommissions.forEach(commission => {
        const commissionRef = doc(getDb(), this.COMMISSIONS_COLLECTION, commission.id);
        batch.update(commissionRef, {
          status: 'paid',
          paidAt: serverTimestamp() as Timestamp,
          paymentMethod: paymentData.paymentMethod,
          paymentReference: paymentData.paymentReference
        });
      });

      await batch.commit();

      return { success: true, paymentId: paymentDocRef.id };
    } catch (error) {
      console.error('Error processing commission payment:', error);
      return { success: false, error: 'Failed to process commission payment' };
    }
  }

  /**
   * Get commission summary
   */
  static async getCommissionSummary(partnerId: string): Promise<CommissionSummary> {
    try {
      const commissionsQuery = query(
        collection(getDb(), this.COMMISSIONS_COLLECTION),
        where('partnerId', '==', partnerId)
      );

      const snapshot = await getDocs(commissionsQuery);
      const commissions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PartnerCommission));

      const totalCommissions = commissions.length;
      const paidCommissions = commissions.filter(c => c.status === 'paid').length;
      const pendingCommissions = commissions.filter(c => c.status === 'pending').length;
      const cancelledCommissions = commissions.filter(c => c.status === 'cancelled').length;
      const disputedCommissions = commissions.filter(c => c.status === 'disputed').length;

      const totalEarnings = commissions
        .filter(c => c.status === 'paid')
        .reduce((sum, c) => sum + c.commissionAmount, 0);

      const pendingEarnings = commissions
        .filter(c => c.status === 'pending')
        .reduce((sum, c) => sum + c.commissionAmount, 0);

      const averageCommission = totalCommissions > 0 
        ? commissions.reduce((sum, c) => sum + c.commissionAmount, 0) / totalCommissions 
        : 0;

      const commissionRate = totalCommissions > 0
        ? commissions.reduce((sum, c) => sum + c.commissionRate, 0) / totalCommissions
        : 0;

      // Get last payment date
      const lastPayment = commissions
        .filter(c => c.status === 'paid' && c.paidAt)
        .sort((a, b) => b.paidAt!.toDate().getTime() - a.paidAt!.toDate().getTime())[0];

      const lastPaymentDate = lastPayment?.paidAt;

      // Calculate next payment date (assuming monthly payments)
      const nextPaymentDate = lastPaymentDate 
        ? new Date((lastPaymentDate as any).toDate().getTime() + 30 * 24 * 60 * 60 * 1000)
        : undefined;

      return {
        partnerId,
        totalCommissions,
        paidCommissions,
        pendingCommissions,
        cancelledCommissions,
        disputedCommissions,
        totalEarnings,
        pendingEarnings,
        averageCommission,
        commissionRate,
        lastPaymentDate,
        nextPaymentDate: nextPaymentDate ? Timestamp.fromDate(nextPaymentDate) : undefined
      };
    } catch (error) {
      console.error('Error getting commission summary:', error);
      return {
        partnerId,
        totalCommissions: 0,
        paidCommissions: 0,
        pendingCommissions: 0,
        cancelledCommissions: 0,
        disputedCommissions: 0,
        totalEarnings: 0,
        pendingEarnings: 0,
        averageCommission: 0,
        commissionRate: 0
      };
    }
  }

  /**
   * Create commission tier
   */
  static async createCommissionTier(
    partnerId: string,
    tierData: {
      name: string;
      description: string;
      minReferrals: number;
      maxReferrals?: number;
      commissionRate: number;
      bonusAmount?: number;
      effectiveDate: Date;
      expiryDate?: Date;
    }
  ): Promise<{ success: boolean; tierId?: string; error?: string }> {
    try {
      const tier: Omit<CommissionTier, 'id'> = {
        partnerId,
        name: tierData.name,
        description: tierData.description,
        minReferrals: tierData.minReferrals,
        maxReferrals: tierData.maxReferrals,
        commissionRate: tierData.commissionRate,
        bonusAmount: tierData.bonusAmount,
        isActive: true,
        effectiveDate: Timestamp.fromDate(tierData.effectiveDate),
        expiryDate: tierData.expiryDate ? Timestamp.fromDate(tierData.expiryDate) : undefined
      };

      const docRef = await addDoc(collection(getDb(), this.COMMISSION_TIERS_COLLECTION), tier);
      
      return { success: true, tierId: docRef.id };
    } catch (error) {
      console.error('Error creating commission tier:', error);
      return { success: false, error: 'Failed to create commission tier' };
    }
  }

  /**
   * Get partner commission tiers
   */
  static async getPartnerCommissionTiers(partnerId: string): Promise<CommissionTier[]> {
    try {
      const tiersQuery = query(
        collection(getDb(), this.COMMISSION_TIERS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('minReferrals', 'asc')
      );

      const snapshot = await getDocs(tiersQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommissionTier));
    } catch (error) {
      console.error('Error getting commission tiers:', error);
      return [];
    }
  }

  /**
   * Get payment history
   */
  static async getPaymentHistory(
    partnerId: string,
    limitCount: number = 50
  ): Promise<CommissionPayment[]> {
    try {
      const paymentsQuery = query(
        collection(getDb(), this.COMMISSION_PAYMENTS_COLLECTION),
        where('partnerId', '==', partnerId),
        orderBy('paymentDate', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(paymentsQuery);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as CommissionPayment));
    } catch (error) {
      console.error('Error getting payment history:', error);
      return [];
    }
  }

  /**
   * Dispute commission
   */
  static async disputeCommission(
    commissionId: string,
    reason: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      await updateDoc(doc(getDb(), this.COMMISSIONS_COLLECTION, commissionId), {
        status: 'disputed',
        notes: reason
      });

      return { success: true };
    } catch (error) {
      console.error('Error disputing commission:', error);
      return { success: false, error: 'Failed to dispute commission' };
    }
  }
}
