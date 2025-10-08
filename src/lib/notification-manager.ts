'use server';

import { UserNotificationService } from './user-notifications';
import { BookingNotificationService } from './booking-notifications';
import { PaymentNotificationService } from './payment-notifications';
import { ProviderNotificationService } from './provider-notifications';
import { SystemNotificationService } from './system-notifications';
import { AdminSecurityNotifications } from './admin-security-notifications';

/**
 * Comprehensive notification manager that handles all types of notifications
 */
export class NotificationManager {
  /**
   * User Account Notifications
   */
  static async sendWelcomeNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
  }) {
    return UserNotificationService.sendWelcomeNotification({
      type: 'welcome',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId
    });
  }

  static async sendAccountVerificationNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
  }) {
    return UserNotificationService.sendAccountVerificationNotification({
      type: 'account_verified',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId
    });
  }

  static async sendAccountSuspensionNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
    reason: string;
  }) {
    return UserNotificationService.sendAccountSuspensionNotification({
      type: 'account_suspended',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId,
      reason: userData.reason
    });
  }

  static async sendAccountActivationNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
  }) {
    return UserNotificationService.sendAccountActivationNotification({
      type: 'account_activated',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId
    });
  }

  static async sendPasswordChangeNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
  }) {
    return UserNotificationService.sendPasswordChangeNotification({
      type: 'password_changed',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId
    });
  }

  static async sendVerificationRequiredNotification(userData: {
    userId: string;
    userEmail: string;
    userName: string;
  }) {
    return UserNotificationService.sendVerificationRequiredNotification({
      type: 'verification_required',
      userEmail: userData.userEmail,
      userName: userData.userName,
      userId: userData.userId
    });
  }

  /**
   * Booking Notifications
   */
  static async sendBookingCreatedNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
  }) {
    return BookingNotificationService.sendBookingCreatedNotification({
      type: 'booking_created',
      ...bookingData
    });
  }

  static async sendBookingConfirmedNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
  }) {
    return BookingNotificationService.sendBookingConfirmedNotification({
      type: 'booking_confirmed',
      ...bookingData
    });
  }

  static async sendBookingCancelledNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
    reason?: string;
  }) {
    return BookingNotificationService.sendBookingCancelledNotification({
      type: 'booking_cancelled',
      ...bookingData
    });
  }

  static async sendBookingCompletedNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
  }) {
    return BookingNotificationService.sendBookingCompletedNotification({
      type: 'booking_completed',
      ...bookingData
    });
  }

  static async sendBookingReminderNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
  }) {
    return BookingNotificationService.sendBookingReminderNotification({
      type: 'booking_reminder',
      ...bookingData
    });
  }

  static async sendBookingRescheduledNotification(bookingData: {
    bookingId: string;
    clientId: string;
    providerId: string;
    clientName: string;
    providerName: string;
    clientEmail: string;
    providerEmail: string;
    serviceName: string;
    date: string;
    time: string;
    price: number;
    location?: string;
    reason?: string;
    rescheduledDate: string;
    rescheduledTime: string;
  }) {
    return BookingNotificationService.sendBookingRescheduledNotification({
      type: 'booking_rescheduled',
      ...bookingData
    });
  }

  /**
   * Payment Notifications
   */
  static async sendPaymentApprovalNotification(paymentData: {
    clientEmail: string;
    clientName: string;
    amount: number;
    serviceName: string;
    bookingId: string;
    paymentMethod?: string;
  }) {
    return PaymentNotificationService.sendPaymentApprovalNotification({
      type: 'payment_approved',
      ...paymentData
    });
  }

  static async sendPaymentRejectionNotification(paymentData: {
    clientEmail: string;
    clientName: string;
    amount: number;
    serviceName: string;
    bookingId: string;
    rejectionReason: string;
  }) {
    return PaymentNotificationService.sendPaymentRejectionNotification({
      type: 'payment_rejected',
      ...paymentData
    });
  }

  static async sendPaymentUploadNotification(paymentData: {
    clientEmail: string;
    clientName: string;
    amount: number;
    serviceName: string;
    bookingId: string;
  }) {
    return PaymentNotificationService.sendPaymentUploadNotification({
      type: 'payment_uploaded',
      ...paymentData
    });
  }

  static async sendRefundNotification(paymentData: {
    clientEmail: string;
    clientName: string;
    amount: number;
    serviceName: string;
    bookingId: string;
    refundReason: string;
  }) {
    return PaymentNotificationService.sendRefundNotification({
      type: 'refund_processed',
      ...paymentData
    });
  }

  static async sendAutomatedPaymentNotification(paymentData: {
    clientEmail: string;
    clientName: string;
    amount: number;
    serviceName: string;
    bookingId: string;
    paymentMethod?: string;
  }) {
    return PaymentNotificationService.sendAutomatedPaymentNotification({
      type: 'payment_completed_automated',
      ...paymentData
    });
  }

  /**
   * Provider Notifications
   */
  static async sendJobApplicationConfirmation(providerId: string, jobTitle: string, clientName: string) {
    return ProviderNotificationService.getInstance().sendJobApplicationConfirmation(providerId, jobTitle, clientName);
  }

  static async sendBookingConfirmation(providerId: string, bookingDetails: any) {
    return ProviderNotificationService.getInstance().sendBookingConfirmation(providerId, bookingDetails);
  }

  static async sendPayoutRequestConfirmation(providerId: string, payoutDetails: any) {
    return ProviderNotificationService.getInstance().sendPayoutRequestConfirmation(providerId, payoutDetails);
  }

  static async sendPayoutProcessedNotification(providerId: string, payoutDetails: any) {
    return ProviderNotificationService.getInstance().sendPayoutProcessedNotification(providerId, payoutDetails);
  }

  static async sendNewReviewNotification(providerId: string, reviewDetails: any) {
    return ProviderNotificationService.getInstance().sendNewReviewNotification(providerId, reviewDetails);
  }

  /**
   * System Notifications
   */
  static async sendMaintenanceNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    scheduledFor?: Date;
    duration?: number;
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendMaintenanceNotification({
      type: 'maintenance',
      ...data
    });
  }

  static async sendSystemUpdateNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendSystemUpdateNotification({
      type: 'system_update',
      ...data
    });
  }

  static async sendSecurityAlertNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendSecurityAlertNotification({
      type: 'security_alert',
      ...data
    });
  }

  static async sendFeatureAnnouncementNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendFeatureAnnouncementNotification({
      type: 'feature_announcement',
      ...data
    });
  }

  static async sendServiceOutageNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendServiceOutageNotification({
      type: 'service_outage',
      ...data
    });
  }

  static async sendPolicyUpdateNotification(data: {
    title: string;
    message: string;
    priority: 'low' | 'medium' | 'high' | 'urgent';
    targetAudience?: 'all' | 'clients' | 'providers' | 'agencies' | 'admins';
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendPolicyUpdateNotification({
      type: 'policy_update',
      ...data
    });
  }

  static async sendUrgentNotification(data: {
    title: string;
    message: string;
    actionUrl?: string;
    actionText?: string;
  }) {
    return SystemNotificationService.sendUrgentNotification({
      type: 'security_alert',
      priority: 'urgent',
      targetAudience: 'all',
      ...data
    });
  }

  /**
   * Admin Security Notifications
   */
  static async createSecurityEvent(event: {
    eventType: 'failed_login_attempt' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access' | 'data_breach_attempt' | 'admin_session_expired' | 'admin_session_locked' | 'critical_operation_attempt' | 'backup_verification_failed' | 'system_configuration_change' | 'user_privilege_escalation' | 'bulk_data_access' | 'unusual_login_location' | 'multiple_failed_attempts' | 'admin_account_compromise' | 'system_anomaly';
    severity: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    details: Record<string, any>;
    metadata: Record<string, any>;
    adminId?: string;
    adminName?: string;
    userId?: string;
    userName?: string;
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }) {
    return AdminSecurityNotifications.createSecurityEvent(event);
  }

  /**
   * Utility Methods
   */
  static async getUserEmail(userId: string): Promise<string | null> {
    return UserNotificationService.getUserEmail(userId);
  }

  /**
   * Batch notification sending for multiple users
   */
  static async sendBatchNotifications(
    userIds: string[],
    notificationData: {
      type: string;
      title: string;
      message: string;
      link?: string;
    }
  ) {
    const results = [];
    
    for (const userId of userIds) {
      try {
        const userEmail = await this.getUserEmail(userId);
        if (userEmail) {
          // Send email notification
          await SystemNotificationService.sendUrgentNotification({
            type: 'system_update',
            title: notificationData.title,
            message: notificationData.message,
            priority: 'medium',
            targetAudience: 'all'
          });
        }
        results.push({ userId, success: true });
      } catch (error) {
        console.error(`Error sending notification to user ${userId}:`, error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
        results.push({ userId, success: false, error: errorMessage });
      }
    }
    
    return results;
  }
}
