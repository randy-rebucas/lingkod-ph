'use server';

import { getDb  } from './firebase';
import { doc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { financialAuditLogger } from './financial-audit-logger';

export interface PayoutValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  availableAmount: number;
  minimumAmount: number;
  canRequest: boolean;
}

export interface PayoutDetails {
  method: 'bank_transfer' | 'gcash' | 'paymaya' | 'paypal';
  accountNumber?: string;
  accountName?: string;
  bankName?: string;
  gcashNumber?: string;
  paymayaNumber?: string;
  paypalEmail?: string;
  routingNumber?: string;
}

export class PayoutValidator {
  private static instance: PayoutValidator;
  private readonly MINIMUM_PAYOUT_AMOUNT = 400;
  private readonly MAXIMUM_PAYOUT_AMOUNT = 50000;
  private readonly PAYOUT_DAYS = [6]; // Saturday only

  private constructor() {}

  public static getInstance(): PayoutValidator {
    if (!PayoutValidator.instance) {
      PayoutValidator.instance = new PayoutValidator();
    }
    return PayoutValidator.instance;
  }

  async validatePayoutRequest(
    providerId: string,
    requestedAmount: number,
    requestMetadata: any
  ): Promise<PayoutValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let availableAmount = 0;
    let canRequest = true;

    try {
      // 1. Check if it's a valid payout day
      const today = new Date();
      if (!this.PAYOUT_DAYS.includes(today.getDay())) {
        errors.push('Payout requests are only allowed on Saturdays');
        canRequest = false;
      }

      // 2. Validate amount
      if (requestedAmount < this.MINIMUM_PAYOUT_AMOUNT) {
        errors.push(`Minimum payout amount is ₱${this.MINIMUM_PAYOUT_AMOUNT}`);
        canRequest = false;
      }

      if (requestedAmount > this.MAXIMUM_PAYOUT_AMOUNT) {
        errors.push(`Maximum payout amount is ₱${this.MAXIMUM_PAYOUT_AMOUNT}`);
        canRequest = false;
      }

      // 3. Check user payout details
      const userDoc = await getDoc(doc(getDb(), 'users', providerId));
      if (!userDoc.exists()) {
        errors.push('User not found');
        canRequest = false;
      } else {
        const userData = userDoc.data();
        if (!userData.payoutDetails || !userData.payoutDetails.method) {
          errors.push('Payout details not configured');
          canRequest = false;
        } else {
          // Validate payout details based on method
          const payoutDetails = userData.payoutDetails as PayoutDetails;
          const validationResult = this.validatePayoutDetails(payoutDetails);
          if (!validationResult.isValid) {
            errors.push(...validationResult.errors);
            canRequest = false;
          }
        }
      }

      // 4. Calculate available amount
      const earningsData = await this.calculateAvailableEarnings(providerId);
      availableAmount = earningsData.available;
      
      if (requestedAmount > availableAmount) {
        errors.push(`Requested amount (₱${requestedAmount}) exceeds available amount (₱${availableAmount})`);
        canRequest = false;
      }

      // 5. Check for recent payout requests
      const recentPayouts = await this.getRecentPayoutRequests(providerId);
      if (recentPayouts.length > 0) {
        const lastPayout = recentPayouts[0];
        const daysSinceLastPayout = Math.floor(
          (Date.now() - (lastPayout as any).requestedAt?.toMillis() || 0) / (1000 * 60 * 60 * 24)
        );
        
        if (daysSinceLastPayout < 7) {
          warnings.push(`Last payout was ${daysSinceLastPayout} days ago. Consider waiting for weekly payout cycle.`);
        }
      }

      // 6. Check for suspicious activity
      const suspiciousActivity = await this.checkSuspiciousActivity(providerId);
      if (suspiciousActivity.length > 0) {
        warnings.push('Unusual activity detected. Payout may be delayed for review.');
        await financialAuditLogger.logSuspiciousActivity(
          providerId,
          'payout_request',
          { requestedAmount, availableAmount, suspiciousActivity },
          requestMetadata
        );
      }

      // 7. Check account status
      const accountStatus = await this.checkAccountStatus(providerId);
      if (!accountStatus.isActive) {
        errors.push('Account is not active');
        canRequest = false;
      }

      if (accountStatus.isSuspended) {
        errors.push('Account is suspended');
        canRequest = false;
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        availableAmount,
        minimumAmount: this.MINIMUM_PAYOUT_AMOUNT,
        canRequest
      };

    } catch (error) {
      console.error('Payout validation error:', error);
      return {
        isValid: false,
        errors: ['Validation failed due to system error'],
        warnings: [],
        availableAmount: 0,
        minimumAmount: this.MINIMUM_PAYOUT_AMOUNT,
        canRequest: false
      };
    }
  }

  private validatePayoutDetails(details: PayoutDetails): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    switch (details.method) {
      case 'bank_transfer':
        if (!details.accountNumber || !details.accountName || !details.bankName) {
          errors.push('Bank transfer requires account number, account name, and bank name');
        }
        break;
      case 'gcash':
        if (!details.gcashNumber) {
          errors.push('GCash requires phone number');
        }
        break;
      case 'paymaya':
        if (!details.paymayaNumber) {
          errors.push('PayMaya requires phone number');
        }
        break;
      case 'paypal':
        if (!details.paypalEmail) {
          errors.push('PayPal requires email address');
        }
        break;
      default:
        errors.push('Invalid payout method');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  private async calculateAvailableEarnings(providerId: string): Promise<{ available: number; total: number; paid: number; pending: number }> {
    // Get completed bookings
    const bookingsQuery = query(
      collection(getDb(), 'bookings'),
      where('providerId', '==', providerId),
      where('status', '==', 'Completed')
    );
    const bookingsSnapshot = await getDocs(bookingsQuery);
    
    let totalRevenue = 0;
    bookingsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      totalRevenue += data.price || 0;
    });

    // Get payout history
    const payoutsQuery = query(
      collection(getDb(), 'payouts'),
      where('providerId', '==', providerId)
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    
    let totalPaidOut = 0;
    let totalPending = 0;
    payoutsSnapshot.docs.forEach(doc => {
      const data = doc.data();
      if (data.status === 'Paid') {
        totalPaidOut += data.amount || 0;
      } else if (data.status === 'Pending') {
        totalPending += data.amount || 0;
      }
    });

    const available = totalRevenue - totalPaidOut - totalPending;

    return {
      available: Math.max(0, available),
      total: totalRevenue,
      paid: totalPaidOut,
      pending: totalPending
    };
  }

  private async getRecentPayoutRequests(providerId: string): Promise<any[]> {
    const payoutsQuery = query(
      collection(getDb(), 'payouts'),
      where('providerId', '==', providerId)
    );
    const payoutsSnapshot = await getDocs(payoutsQuery);
    
    return payoutsSnapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .sort((a, b) => (b as any).requestedAt?.toMillis() - (a as any).requestedAt?.toMillis() || 0)
      .slice(0, 5); // Last 5 payouts
  }

  private async checkSuspiciousActivity(providerId: string): Promise<string[]> {
    const suspiciousActivities: string[] = [];
    
    // Check for multiple payout requests in short time
    const recentPayouts = await this.getRecentPayoutRequests(providerId);
    if (recentPayouts.length >= 3) {
      const lastThreePayouts = recentPayouts.slice(0, 3);
      const timeSpan = (lastThreePayouts[0] as any).requestedAt?.toMillis() - (lastThreePayouts[2] as any).requestedAt?.toMillis() || 0;
      const daysSpan = timeSpan / (1000 * 60 * 60 * 24);
      
      if (daysSpan < 14) {
        suspiciousActivities.push('Multiple payout requests in short time period');
      }
    }

    // Check for unusually large payout amounts
    const earningsData = await this.calculateAvailableEarnings(providerId);
    if (earningsData.available > 20000) {
      suspiciousActivities.push('Unusually large payout amount');
    }

    return suspiciousActivities;
  }

  private async checkAccountStatus(providerId: string): Promise<{ isActive: boolean; isSuspended: boolean }> {
    const userDoc = await getDoc(doc(getDb(), 'users', providerId));
    if (!userDoc.exists()) {
      return { isActive: false, isSuspended: true };
    }

    const userData = userDoc.data();
    return {
      isActive: userData.status === 'active',
      isSuspended: userData.status === 'suspended'
    };
  }
}

export const payoutValidator = PayoutValidator.getInstance();
