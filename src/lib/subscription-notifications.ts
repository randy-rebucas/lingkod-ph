/**
 * Subscription Payment Notification Service
 * Handles email notifications for subscription payment events
 */

import { adminDb as db } from './firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export interface SubscriptionPaymentNotification {
  type: 'payment_submitted' | 'payment_verified' | 'payment_rejected';
  userEmail: string;
  userName: string;
  planName: string;
  planType: 'provider' | 'agency';
  amount: number;
  paymentMethod: string;
  referenceNumber?: string;
  rejectionReason?: string;
}

export class SubscriptionNotificationService {
  /**
   * Send payment submitted notification
   */
  static async sendPaymentSubmittedNotification(data: SubscriptionPaymentNotification) {
    try {
      // Add in-app notification
      await db.collection(`users/${data.userEmail}/notifications`).add({
        type: 'info',
        message: `Your ${data.planName} subscription payment has been submitted for verification.`,
        link: '/subscription',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Send email notification (you can integrate with your email service here)
      console.log('Payment submitted notification sent to:', data.userEmail);
    } catch (error) {
      console.error('Error sending payment submitted notification:', error);
    }
  }

  /**
   * Send payment verified notification
   */
  static async sendPaymentVerifiedNotification(data: SubscriptionPaymentNotification) {
    try {
      // Add in-app notification
      await db.collection(`users/${data.userEmail}/notifications`).add({
        type: 'success',
        message: `Your ${data.planName} subscription payment has been verified! Your account has been upgraded.`,
        link: '/subscription',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Send email notification
      console.log('Payment verified notification sent to:', data.userEmail);
    } catch (error) {
      console.error('Error sending payment verified notification:', error);
    }
  }

  /**
   * Send payment rejected notification
   */
  static async sendPaymentRejectedNotification(data: SubscriptionPaymentNotification) {
    try {
      // Add in-app notification
      await db.collection(`users/${data.userEmail}/notifications`).add({
        type: 'error',
        message: `Your ${data.planName} subscription payment was rejected. Reason: ${data.rejectionReason}`,
        link: '/subscription',
        read: false,
        createdAt: FieldValue.serverTimestamp(),
      });

      // Send email notification
      console.log('Payment rejected notification sent to:', data.userEmail);
    } catch (error) {
      console.error('Error sending payment rejected notification:', error);
    }
  }

  /**
   * Send admin notification for new payment
   */
  static async sendAdminNotification(paymentData: any) {
    try {
      // Get all admin users
      const adminUsers = await db.collection('users')
        .where('role', '==', 'admin')
        .get();

      const notificationPromises = adminUsers.docs.map(doc => 
        db.collection(`users/${doc.id}/notifications`).add({
          type: 'info',
          message: `New subscription payment verification needed for ${paymentData.userName || paymentData.userEmail}`,
          link: '/admin/subscription-payments',
          read: false,
          createdAt: FieldValue.serverTimestamp(),
        })
      );

      await Promise.all(notificationPromises);
      console.log('Admin notifications sent for new subscription payment');
    } catch (error) {
      console.error('Error sending admin notifications:', error);
    }
  }
}
