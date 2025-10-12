/**
 * PayMaya Analytics Service
 * Tracks payment metrics, success rates, and performance analytics
 */

import { getDb } from './firebase';
import { collection, addDoc, query, where, orderBy, limit, getDocs, serverTimestamp } from 'firebase/firestore';

export interface PayMayaPaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  successRate: number;
  averageProcessingTime: number;
  totalRevenue: number;
  averagePaymentAmount: number;
}

export interface PayMayaPaymentEvent {
  eventType: 'payment_created' | 'payment_success' | 'payment_failed' | 'payment_cancelled';
  paymentId: string;
  userId: string;
  planId: string;
  amount: number;
  currency: string;
  processingTime?: number;
  errorMessage?: string;
  timestamp: Date;
  metadata?: any;
}

export class PayMayaAnalytics {
  private static readonly COLLECTION_NAME = 'paymayaAnalytics';

  /**
   * Track a payment event
   */
  static async trackPaymentEvent(event: PayMayaPaymentEvent): Promise<void> {
    try {
      const db = getDb();
      await addDoc(collection(db, this.COLLECTION_NAME), {
        ...event,
        timestamp: serverTimestamp(),
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error tracking PayMaya payment event:', error);
    }
  }

  /**
   * Get payment metrics for a specific time period
   */
  static async getPaymentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PayMayaPaymentMetrics> {
    try {
      const db = getDb();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        where('timestamp', '>=', startDate),
        where('timestamp', '<=', endDate),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data());

      const totalPayments = events.length;
      const successfulPayments = events.filter(e => e.eventType === 'payment_success').length;
      const failedPayments = events.filter(e => e.eventType === 'payment_failed').length;
      const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      const processingTimes = events
        .filter(e => e.processingTime)
        .map(e => e.processingTime);
      const averageProcessingTime = processingTimes.length > 0 
        ? processingTimes.reduce((a, b) => a + b, 0) / processingTimes.length 
        : 0;

      const successfulEvents = events.filter(e => e.eventType === 'payment_success');
      const totalRevenue = successfulEvents.reduce((sum, e) => sum + (e.amount || 0), 0);
      const averagePaymentAmount = successfulEvents.length > 0 
        ? totalRevenue / successfulEvents.length 
        : 0;

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        successRate,
        averageProcessingTime,
        totalRevenue,
        averagePaymentAmount,
      };
    } catch (error) {
      console.error('Error getting PayMaya payment metrics:', error);
      return {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        successRate: 0,
        averageProcessingTime: 0,
        totalRevenue: 0,
        averagePaymentAmount: 0,
      };
    }
  }

  /**
   * Get recent payment events
   */
  static async getRecentPaymentEvents(limitCount: number = 50): Promise<PayMayaPaymentEvent[]> {
    try {
      const db = getDb();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('timestamp', 'desc'),
        limit(limitCount)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() || new Date(),
      })) as PayMayaPaymentEvent[];
    } catch (error) {
      console.error('Error getting recent PayMaya payment events:', error);
      return [];
    }
  }

  /**
   * Get payment success rate by plan
   */
  static async getSuccessRateByPlan(): Promise<{ [planId: string]: number }> {
    try {
      const db = getDb();
      const q = query(
        collection(db, this.COLLECTION_NAME),
        orderBy('timestamp', 'desc')
      );

      const snapshot = await getDocs(q);
      const events = snapshot.docs.map(doc => doc.data());

      const planStats: { [planId: string]: { total: number; successful: number } } = {};

      events.forEach(event => {
        const planId = event.planId;
        if (!planStats[planId]) {
          planStats[planId] = { total: 0, successful: 0 };
        }
        
        planStats[planId].total++;
        if (event.eventType === 'payment_success') {
          planStats[planId].successful++;
        }
      });

      const successRates: { [planId: string]: number } = {};
      Object.keys(planStats).forEach(planId => {
        const stats = planStats[planId];
        successRates[planId] = stats.total > 0 ? (stats.successful / stats.total) * 100 : 0;
      });

      return successRates;
    } catch (error) {
      console.error('Error getting success rate by plan:', error);
      return {};
    }
  }

  /**
   * Track payment creation
   */
  static async trackPaymentCreated(
    paymentId: string,
    userId: string,
    planId: string,
    amount: number,
    currency: string = 'PHP'
  ): Promise<void> {
    await this.trackPaymentEvent({
      eventType: 'payment_created',
      paymentId,
      userId,
      planId,
      amount,
      currency,
      timestamp: new Date(),
    });
  }

  /**
   * Track payment success
   */
  static async trackPaymentSuccess(
    paymentId: string,
    userId: string,
    planId: string,
    amount: number,
    processingTime: number,
    currency: string = 'PHP'
  ): Promise<void> {
    await this.trackPaymentEvent({
      eventType: 'payment_success',
      paymentId,
      userId,
      planId,
      amount,
      currency,
      processingTime,
      timestamp: new Date(),
    });
  }

  /**
   * Track payment failure
   */
  static async trackPaymentFailed(
    paymentId: string,
    userId: string,
    planId: string,
    amount: number,
    errorMessage: string,
    currency: string = 'PHP'
  ): Promise<void> {
    await this.trackPaymentEvent({
      eventType: 'payment_failed',
      paymentId,
      userId,
      planId,
      amount,
      currency,
      errorMessage,
      timestamp: new Date(),
    });
  }

  /**
   * Track payment cancellation
   */
  static async trackPaymentCancelled(
    paymentId: string,
    userId: string,
    planId: string,
    amount: number,
    currency: string = 'PHP'
  ): Promise<void> {
    await this.trackPaymentEvent({
      eventType: 'payment_cancelled',
      paymentId,
      userId,
      planId,
      amount,
      currency,
      timestamp: new Date(),
    });
  }
}
