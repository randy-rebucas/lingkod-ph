/**
 * Payment Monitoring Service
 * Tracks payment metrics and provides monitoring capabilities
 */

import { adminDb as db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface PaymentMetrics {
  totalPayments: number;
  successfulPayments: number;
  failedPayments: number;
  pendingPayments: number;
  totalAmount: number;
  averageAmount: number;
  successRate: number;
  averageProcessingTime: number;
}

export interface PaymentEvent {
  eventType: 'payment_created' | 'payment_success' | 'payment_failed' | 'payment_verified' | 'payment_rejected';
  bookingId: string;
  userId: string;
  amount: number;
  paymentMethod: string;
  timestamp: Date;
  metadata?: any;
}

export class PaymentMonitoringService {
  private static readonly METRICS_COLLECTION = 'paymentMetrics';
  private static readonly EVENTS_COLLECTION = 'paymentEvents';

  /**
   * Track payment event
   */
  static async trackPaymentEvent(event: PaymentEvent): Promise<void> {
    try {
      // Check if Firebase is properly configured
      if (!process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID) {
        console.warn('Firebase not configured - skipping payment event tracking');
        return;
      }

      await db.collection(this.EVENTS_COLLECTION).add({
        ...event,
        timestamp: FieldValue.serverTimestamp(),
        date: new Date().toISOString().split('T')[0], // YYYY-MM-DD format
        hour: new Date().getHours(),
      });

      // Update daily metrics
      await this.updateDailyMetrics(event);
    } catch (error) {
      console.error('Error tracking payment event:', error);
      // Don't throw error in development mode to prevent breaking the app
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }

  /**
   * Update daily metrics
   */
  private static async updateDailyMetrics(event: PaymentEvent): Promise<void> {
    try {
      const today = new Date().toISOString().split('T')[0];
      const metricsRef = db.collection(this.METRICS_COLLECTION).doc(today);

      const updateData: any = {
        date: today,
        lastUpdated: FieldValue.serverTimestamp(),
      };

      // Increment counters based on event type
      switch (event.eventType) {
        case 'payment_created':
          updateData.totalPayments = FieldValue.increment(1);
          updateData.totalAmount = FieldValue.increment(event.amount);
          break;
        case 'payment_success':
          updateData.successfulPayments = FieldValue.increment(1);
          break;
        case 'payment_failed':
          updateData.failedPayments = FieldValue.increment(1);
          break;
        case 'payment_verified':
          updateData.verifiedPayments = FieldValue.increment(1);
          break;
        case 'payment_rejected':
          updateData.rejectedPayments = FieldValue.increment(1);
          break;
      }

      await metricsRef.set(updateData, { merge: true });
    } catch (error) {
      console.error('Error updating daily metrics:', error);
    }
  }

  /**
   * Get payment metrics for a date range
   */
  static async getPaymentMetrics(
    startDate: Date,
    endDate: Date
  ): Promise<PaymentMetrics> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const metricsQuery = await db.collection(this.METRICS_COLLECTION)
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr)
        .get();

      let totalPayments = 0;
      let successfulPayments = 0;
      let failedPayments = 0;
      let pendingPayments = 0;
      let totalAmount = 0;
      let verifiedPayments = 0;
      let rejectedPayments = 0;

      metricsQuery.docs.forEach(doc => {
        const data = doc.data();
        totalPayments += data.totalPayments || 0;
        successfulPayments += data.successfulPayments || 0;
        failedPayments += data.failedPayments || 0;
        verifiedPayments += data.verifiedPayments || 0;
        rejectedPayments += data.rejectedPayments || 0;
        totalAmount += data.totalAmount || 0;
      });

      pendingPayments = totalPayments - successfulPayments - failedPayments - verifiedPayments - rejectedPayments;

      const averageAmount = totalPayments > 0 ? totalAmount / totalPayments : 0;
      const successRate = totalPayments > 0 ? (successfulPayments / totalPayments) * 100 : 0;

      return {
        totalPayments,
        successfulPayments,
        failedPayments,
        pendingPayments,
        totalAmount,
        averageAmount,
        successRate,
        averageProcessingTime: 0 // TODO: Calculate from actual processing times
      };
    } catch (error) {
      console.error('Error getting payment metrics:', error);
      return {
        totalPayments: 0,
        successfulPayments: 0,
        failedPayments: 0,
        pendingPayments: 0,
        totalAmount: 0,
        averageAmount: 0,
        successRate: 0,
        averageProcessingTime: 0
      };
    }
  }

  /**
   * Get payment method statistics
   */
  static async getPaymentMethodStats(
    startDate: Date,
    endDate: Date
  ): Promise<Record<string, { count: number; amount: number; successRate: number }>> {
    try {
      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = endDate.toISOString().split('T')[0];

      const eventsQuery = await db.collection(this.EVENTS_COLLECTION)
        .where('date', '>=', startDateStr)
        .where('date', '<=', endDateStr)
        .get();

      const stats: Record<string, { count: number; amount: number; successCount: number }> = {};

      eventsQuery.docs.forEach(doc => {
        const data = doc.data();
        const method = data.paymentMethod;

        if (!stats[method]) {
          stats[method] = { count: 0, amount: 0, successCount: 0 };
        }

        if (data.eventType === 'payment_created') {
          stats[method].count++;
          stats[method].amount += data.amount;
        } else if (data.eventType === 'payment_success') {
          stats[method].successCount++;
        }
      });

      // Calculate success rates
      const result: Record<string, { count: number; amount: number; successRate: number }> = {};
      
      Object.keys(stats).forEach(method => {
        const stat = stats[method];
        result[method] = {
          count: stat.count,
          amount: stat.amount,
          successRate: stat.count > 0 ? (stat.successCount / stat.count) * 100 : 0
        };
      });

      return result;
    } catch (error) {
      console.error('Error getting payment method stats:', error);
      return {};
    }
  }

  /**
   * Check for payment anomalies
   */
  static async checkPaymentAnomalies(): Promise<{
    highFailureRate: boolean;
    unusualAmounts: boolean;
    duplicatePayments: boolean;
    slowProcessing: boolean;
  }> {
    try {
      const today = new Date();
      const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

      const metrics = await this.getPaymentMetrics(yesterday, today);
      
      // Check for high failure rate (>20%)
      const highFailureRate = metrics.totalPayments > 10 && 
        (metrics.failedPayments / metrics.totalPayments) > 0.2;

      // Check for unusual amounts (more than 3 standard deviations from mean)
      const unusualAmounts = await this.checkUnusualAmounts();

      // Check for duplicate payments
      const duplicatePayments = await this.checkDuplicatePayments();

      // Check for slow processing (pending payments older than 1 hour)
      const slowProcessing = await this.checkSlowProcessing();

      return {
        highFailureRate,
        unusualAmounts,
        duplicatePayments,
        slowProcessing
      };
    } catch (error) {
      console.error('Error checking payment anomalies:', error);
      return {
        highFailureRate: false,
        unusualAmounts: false,
        duplicatePayments: false,
        slowProcessing: false
      };
    }
  }

  /**
   * Check for unusual payment amounts
   */
  private static async checkUnusualAmounts(): Promise<boolean> {
    try {
      const today = new Date();
      const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

      const eventsQuery = await db.collection(this.EVENTS_COLLECTION)
        .where('eventType', '==', 'payment_created')
        .where('timestamp', '>=', lastWeek)
        .get();

      if (eventsQuery.empty) return false;

      const amounts = eventsQuery.docs.map(doc => doc.data().amount);
      const mean = amounts.reduce((sum, amount) => sum + amount, 0) / amounts.length;
      const variance = amounts.reduce((sum, amount) => sum + Math.pow(amount - mean, 2), 0) / amounts.length;
      const stdDev = Math.sqrt(variance);

      // Check if any recent payments are more than 3 standard deviations from mean
      const recentPayments = await db.collection(this.EVENTS_COLLECTION)
        .where('eventType', '==', 'payment_created')
        .where('timestamp', '>=', new Date(today.getTime() - 24 * 60 * 60 * 1000))
        .get();

      return recentPayments.docs.some(doc => {
        const amount = doc.data().amount;
        return Math.abs(amount - mean) > 3 * stdDev;
      });
    } catch (error) {
      console.error('Error checking unusual amounts:', error);
      return false;
    }
  }

  /**
   * Check for duplicate payments
   */
  private static async checkDuplicatePayments(): Promise<boolean> {
    try {
      const today = new Date();
      const lastHour = new Date(today.getTime() - 60 * 60 * 1000);

      const eventsQuery = await db.collection(this.EVENTS_COLLECTION)
        .where('eventType', '==', 'payment_created')
        .where('timestamp', '>=', lastHour)
        .get();

      const paymentMap = new Map<string, number>();
      let duplicates = 0;

      eventsQuery.docs.forEach(doc => {
        const data = doc.data();
        const key = `${data.bookingId}_${data.amount}_${data.paymentMethod}`;
        const count = paymentMap.get(key) || 0;
        paymentMap.set(key, count + 1);
        
        if (count > 0) {
          duplicates++;
        }
      });

      return duplicates > 0;
    } catch (error) {
      console.error('Error checking duplicate payments:', error);
      return false;
    }
  }

  /**
   * Check for slow processing
   */
  private static async checkSlowProcessing(): Promise<boolean> {
    try {
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const pendingQuery = await db.collection('bookings')
        .where('status', '==', 'Pending Verification')
        .where('paymentProofUploadedAt', '<=', oneHourAgo)
        .limit(1)
        .get();

      return !pendingQuery.empty;
    } catch (error) {
      console.error('Error checking slow processing:', error);
      return false;
    }
  }

  /**
   * Send alert for payment anomalies
   */
  static async sendPaymentAlert(anomalies: any): Promise<void> {
    try {
      // TODO: Implement alert sending (email, Slack, etc.)
      console.log('Payment anomalies detected:', anomalies);
      
      // For now, just log to database
      await db.collection('paymentAlerts').add({
        anomalies,
        timestamp: FieldValue.serverTimestamp(),
        resolved: false
      });
    } catch (error) {
      console.error('Error sending payment alert:', error);
    }
  }
}
