'use server';

import { getDb } from './firebase';
import { collection, addDoc, serverTimestamp, doc, getDoc, query, where, getDocs, orderBy, limit, updateDoc } from 'firebase/firestore';
import { SMSService } from './sms-service';
import { getUserSettings } from './user-settings-service';
import { sendEmail } from './email-service';

export interface NotificationDeliveryData {
  userId: string;
  type: 'email' | 'sms' | 'in_app' | 'push';
  category: 'booking' | 'payment' | 'message' | 'system' | 'security' | 'promotional';
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  actionUrl?: string;
  actionText?: string;
  metadata?: Record<string, any>;
  scheduledAt?: Date;
}

export interface DeliveryResult {
  success: boolean;
  deliveryId?: string;
  error?: string;
  cost?: number;
}

export interface NotificationPreferences {
  email: {
    enabled: boolean;
    categories: string[];
    frequency: 'immediate' | 'daily' | 'weekly';
  };
  sms: {
    enabled: boolean;
    phoneNumber?: string;
    phoneVerified: boolean;
    categories: string[];
  };
  inApp: {
    enabled: boolean;
    categories: string[];
    soundEnabled: boolean;
    vibrationEnabled: boolean;
  };
  push: {
    enabled: boolean;
    categories: string[];
  };
}

export class NotificationDeliveryService {
  private static readonly COLLECTION = 'notifications';
  private static readonly DELIVERY_LOG_COLLECTION = 'notificationDeliveries';

  /**
   * Send notification to user
   */
  static async sendNotification(data: NotificationDeliveryData): Promise<DeliveryResult> {
    try {
      // Get user settings
      const userSettings = await getUserSettings(data.userId);
      
      // Check if notification type is enabled for this category
      const isEnabled = this.isNotificationEnabled(userSettings, data.type, data.category);
      if (!isEnabled) {
        return { success: false, error: 'Notification type disabled for this category' };
      }

      // Send based on type
      switch (data.type) {
        case 'email':
          return await this.sendEmailNotification(data, userSettings);
        case 'sms':
          return await this.sendSMSNotification(data, userSettings);
        case 'in_app':
          return await this.sendInAppNotification(data, userSettings);
        case 'push':
          return await this.sendPushNotification(data, userSettings);
        default:
          return { success: false, error: 'Invalid notification type' };
      }

    } catch (error) {
      console.error('Error sending notification:', error);
      return { success: false, error: 'Failed to send notification' };
    }
  }

  /**
   * Send multiple notifications
   */
  static async sendBulkNotifications(notifications: NotificationDeliveryData[]): Promise<{
    success: boolean;
    results: DeliveryResult[];
    errors: string[];
  }> {
    const results: DeliveryResult[] = [];
    const errors: string[] = [];

    for (const notification of notifications) {
      try {
        const result = await this.sendNotification(notification);
        results.push(result);
        
        if (!result.success) {
          errors.push(`Failed to send notification to user ${notification.userId}: ${result.error}`);
        }
      } catch (error) {
        const errorMessage = `Error sending notification to user ${notification.userId}: ${error}`;
        errors.push(errorMessage);
        results.push({ success: false, error: errorMessage });
      }
    }

    return {
      success: errors.length === 0,
      results,
      errors
    };
  }

  /**
   * Schedule notification for later delivery
   */
  static async scheduleNotification(data: NotificationDeliveryData): Promise<DeliveryResult> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const scheduledNotification = {
        ...data,
        status: 'scheduled',
        createdAt: serverTimestamp(),
        scheduledFor: data.scheduledAt || new Date()
      };

      const docRef = await addDoc(collection(getDb(), this.COLLECTION), scheduledNotification);

      return { success: true, deliveryId: docRef.id };

    } catch (error) {
      console.error('Error scheduling notification:', error);
      return { success: false, error: 'Failed to schedule notification' };
    }
  }

  /**
   * Process scheduled notifications
   */
  static async processScheduledNotifications(): Promise<{
    processed: number;
    errors: string[];
  }> {
    try {
      if (!getDb()) {
        return { processed: 0, errors: ['Database not initialized'] };
      }

      const now = new Date();
      const scheduledQuery = query(
        collection(getDb(), this.COLLECTION),
        where('status', '==', 'scheduled'),
        where('scheduledFor', '<=', now),
        limit(100) // Process in batches
      );

      const scheduledSnap = await getDocs(scheduledQuery);
      const errors: string[] = [];
      let processed = 0;

      for (const doc of scheduledSnap.docs) {
        try {
          const notificationData = doc.data() as NotificationDeliveryData;
          const result = await this.sendNotification(notificationData);

          if (result.success) {
            // Update status to sent
            await updateDoc(doc.ref, {
              status: 'sent',
              sentAt: serverTimestamp(),
              deliveryId: result.deliveryId
            });
            processed++;
          } else {
            // Update status to failed
            await updateDoc(doc.ref, {
              status: 'failed',
              error: result.error,
              failedAt: serverTimestamp()
            });
            errors.push(`Failed to send scheduled notification ${doc.id}: ${result.error}`);
          }
        } catch (error) {
          errors.push(`Error processing scheduled notification ${doc.id}: ${error}`);
        }
      }

      return { processed, errors };

    } catch (error) {
      console.error('Error processing scheduled notifications:', error);
      return { processed: 0, errors: ['Failed to process scheduled notifications'] };
    }
  }

  /**
   * Get notification delivery history
   */
  static async getDeliveryHistory(userId: string, limitCount: number = 50): Promise<{
    success: boolean;
    notifications?: any[];
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const historyQuery = query(
        collection(getDb(), this.COLLECTION),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc'),
        limit(limitCount)
      );

      const historySnap = await getDocs(historyQuery);
      const notifications = historySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      return { success: true, notifications };

    } catch (error) {
      console.error('Error getting delivery history:', error);
      return { success: false, error: 'Failed to get delivery history' };
    }
  }

  /**
   * Mark notification as read
   */
  static async markAsRead(notificationId: string, userId: string): Promise<DeliveryResult> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const notificationRef = doc(getDb(), this.COLLECTION, notificationId);
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        return { success: false, error: 'Notification not found' };
      }

      const notificationData = notificationDoc.data();
      if (notificationData.userId !== userId) {
        return { success: false, error: 'Unauthorized' };
      }

      await updateDoc(notificationRef, {
        read: true,
        readAt: serverTimestamp()
      });

      return { success: true };

    } catch (error) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: 'Failed to mark notification as read' };
    }
  }

  /**
   * Get notification statistics
   */
  static async getNotificationStats(timeRange: 'day' | 'week' | 'month' = 'month'): Promise<{
    success: boolean;
    stats?: {
      totalSent: number;
      totalDelivered: number;
      totalFailed: number;
      totalRead: number;
      averageDeliveryTime: number;
      costByType: Record<string, number>;
    };
    error?: string;
  }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const startDate = new Date();
      switch (timeRange) {
        case 'day':
          startDate.setDate(startDate.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(startDate.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
      }

      const statsQuery = query(
        collection(getDb(), this.COLLECTION),
        where('createdAt', '>=', startDate)
      );

      const statsSnap = await getDocs(statsQuery);
      const notifications = statsSnap.docs.map(doc => doc.data());

      const stats = {
        totalSent: notifications.length,
        totalDelivered: notifications.filter(n => n.status === 'delivered').length,
        totalFailed: notifications.filter(n => n.status === 'failed').length,
        totalRead: notifications.filter(n => n.read).length,
        averageDeliveryTime: 0, // Would calculate from delivery logs
        costByType: {
          email: 0,
          sms: notifications.filter(n => n.type === 'sms').reduce((sum, n) => sum + (n.cost || 0), 0),
          in_app: 0,
          push: 0
        }
      };

      return { success: true, stats };

    } catch (error) {
      console.error('Error getting notification stats:', error);
      return { success: false, error: 'Failed to get notification stats' };
    }
  }

  /**
   * Send email notification
   */
  private static async sendEmailNotification(
    data: NotificationDeliveryData,
    userSettings: any
  ): Promise<DeliveryResult> {
    try {
      const emailResult = await sendEmail({
        to: userSettings.account.email,
        subject: data.title,
        html: this.formatEmailMessage(data)
      });

      if (emailResult.success) {
        await this.logDelivery({
          ...data,
          status: 'sent',
          deliveryMethod: 'email',
          cost: 0
        });
      }

      return emailResult;

    } catch (error) {
      console.error('Error sending email notification:', error);
      return { success: false, error: 'Failed to send email notification' };
    }
  }

  /**
   * Send SMS notification
   */
  private static async sendSMSNotification(
    data: NotificationDeliveryData,
    userSettings: any
  ): Promise<DeliveryResult> {
    try {
      if (!userSettings.notifications.sms.phoneVerified) {
        return { success: false, error: 'Phone number not verified' };
      }

      const smsResult = await SMSService.sendSMS({
        type: this.mapCategoryToSMSType(data.category),
        phoneNumber: userSettings.notifications.sms.phoneNumber!,
        message: data.message,
        priority: data.priority
      });

      if (smsResult.success) {
        await this.logDelivery({
          ...data,
          status: 'sent',
          deliveryMethod: 'sms',
          cost: smsResult.cost
        });
      }

      return smsResult;

    } catch (error) {
      console.error('Error sending SMS notification:', error);
      return { success: false, error: 'Failed to send SMS notification' };
    }
  }

  /**
   * Send in-app notification
   */
  private static async sendInAppNotification(
    data: NotificationDeliveryData,
    userSettings: any
  ): Promise<DeliveryResult> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Database not initialized' };
      }

      const inAppNotification = {
        ...data,
        status: 'delivered',
        deliveredAt: serverTimestamp(),
        read: false,
        soundEnabled: userSettings.notifications.inApp.soundEnabled,
        vibrationEnabled: userSettings.notifications.inApp.vibrationEnabled
      };

      const docRef = await addDoc(collection(getDb(), this.COLLECTION), inAppNotification);

      return { success: true, deliveryId: docRef.id };

    } catch (error) {
      console.error('Error sending in-app notification:', error);
      return { success: false, error: 'Failed to send in-app notification' };
    }
  }

  /**
   * Send push notification
   */
  private static async sendPushNotification(
    data: NotificationDeliveryData,
    userSettings: any
  ): Promise<DeliveryResult> {
    try {
      // TODO: Implement push notification service (Firebase Cloud Messaging)
      // For now, return success
      return { success: true, deliveryId: `push_${Date.now()}` };

    } catch (error) {
      console.error('Error sending push notification:', error);
      return { success: false, error: 'Failed to send push notification' };
    }
  }

  /**
   * Check if notification type is enabled for category
   */
  private static isNotificationEnabled(
    userSettings: any,
    type: string,
    category: string
  ): boolean {
    if (!userSettings?.notifications) return false;

    switch (type) {
      case 'email':
        if (!userSettings.notifications.email.enabled) return false;
        return this.isCategoryEnabled(userSettings.notifications.email, category);
      case 'sms':
        if (!userSettings.notifications.sms.enabled || !userSettings.notifications.sms.phoneVerified) return false;
        return this.isCategoryEnabled(userSettings.notifications.sms, category);
      case 'in_app':
        if (!userSettings.notifications.inApp.enabled) return false;
        return this.isCategoryEnabled(userSettings.notifications.inApp, category);
      case 'push':
        if (!userSettings.notifications.push.enabled) return false;
        return this.isCategoryEnabled(userSettings.notifications.push, category);
      default:
        return false;
    }
  }

  private static isCategoryEnabled(notificationSettings: any, category: string): boolean {
    switch (category) {
      case 'booking':
        return notificationSettings.bookingUpdates || false;
      case 'payment':
        return notificationSettings.paymentUpdates || false;
      case 'message':
        return notificationSettings.newMessages || false;
      case 'system':
        return notificationSettings.systemUpdates || false;
      case 'security':
        return notificationSettings.securityAlerts || false;
      case 'promotional':
        return notificationSettings.promotionalEmails || false;
      default:
        return false;
    }
  }

  /**
   * Format email message
   */
  private static formatEmailMessage(data: NotificationDeliveryData): string {
    return `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #059669;">${data.title}</h2>
        <p>${data.message}</p>
        ${data.actionUrl ? `
          <div style="margin: 20px 0;">
            <a href="${data.actionUrl}" style="background-color: #059669; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
              ${data.actionText || 'View Details'}
            </a>
          </div>
        ` : ''}
        <hr style="margin: 20px 0; border: none; border-top: 1px solid #eee;">
        <p style="color: #666; font-size: 12px;">
          This is an automated message from LocalPro. Please do not reply to this email.
        </p>
      </div>
    `;
  }

  /**
   * Map category to SMS type
   */
  private static mapCategoryToSMSType(category: string): any {
    switch (category) {
      case 'booking':
        return 'booking_update';
      case 'payment':
        return 'payment_update';
      case 'message':
        return 'account_update';
      case 'system':
        return 'system_alert';
      case 'security':
        return 'system_alert';
      case 'promotional':
        return 'account_update';
      default:
        return 'account_update';
    }
  }

  /**
   * Log delivery
   */
  private static async logDelivery(data: any): Promise<void> {
    try {
      if (!getDb()) return;

      await addDoc(collection(getDb(), this.DELIVERY_LOG_COLLECTION), {
        ...data,
        timestamp: serverTimestamp()
      });
    } catch (error) {
      console.error('Error logging delivery:', error);
    }
  }
}
