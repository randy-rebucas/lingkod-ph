/**
 * Notification Integration Examples
 * 
 * This file demonstrates how to integrate the comprehensive notification system
 * into your application. Copy and adapt these examples for your specific use cases.
 */

import { NotificationManager } from './notification-manager';
import { NotificationPreferencesService, NotificationPreferences } from './notification-preferences';

// ============================================================================
// USER ACCOUNT NOTIFICATIONS
// ============================================================================

/**
 * Example: Send welcome notification when user registers
 */
export async function handleUserRegistration(userData: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  try {
    // Send welcome notification
    await NotificationManager.sendWelcomeNotification(userData);
    
    // Set default notification preferences
    await NotificationPreferencesService.setDefaultPreferences(userData.userId);
    
    console.log('User registration notifications sent successfully');
  } catch (error) {
    console.error('Error sending user registration notifications:', error);
  }
}

/**
 * Example: Send account verification notification
 */
export async function handleAccountVerification(userData: {
  userId: string;
  userEmail: string;
  userName: string;
}) {
  try {
    await NotificationManager.sendAccountVerificationNotification(userData);
    console.log('Account verification notification sent');
  } catch (error) {
    console.error('Error sending account verification notification:', error);
  }
}

/**
 * Example: Send account suspension notification
 */
export async function handleAccountSuspension(userData: {
  userId: string;
  userEmail: string;
  userName: string;
  reason: string;
}) {
  try {
    await NotificationManager.sendAccountSuspensionNotification(userData);
    console.log('Account suspension notification sent');
  } catch (error) {
    console.error('Error sending account suspension notification:', error);
  }
}

// ============================================================================
// BOOKING NOTIFICATIONS
// ============================================================================

/**
 * Example: Send booking created notification
 */
export async function handleBookingCreated(bookingData: {
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
  try {
    await NotificationManager.sendBookingCreatedNotification(bookingData);
    console.log('Booking created notifications sent');
  } catch (error) {
    console.error('Error sending booking created notifications:', error);
  }
}

/**
 * Example: Send booking confirmed notification
 */
export async function handleBookingConfirmed(bookingData: {
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
  try {
    await NotificationManager.sendBookingConfirmedNotification(bookingData);
    console.log('Booking confirmed notification sent');
  } catch (error) {
    console.error('Error sending booking confirmed notification:', error);
  }
}

/**
 * Example: Send booking reminder notification
 */
export async function handleBookingReminder(bookingData: {
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
  try {
    await NotificationManager.sendBookingReminderNotification(bookingData);
    console.log('Booking reminder notifications sent');
  } catch (error) {
    console.error('Error sending booking reminder notifications:', error);
  }
}

// ============================================================================
// PAYMENT NOTIFICATIONS
// ============================================================================

/**
 * Example: Send payment approval notification
 */
export async function handlePaymentApproval(paymentData: {
  clientEmail: string;
  clientName: string;
  amount: number;
  serviceName: string;
  bookingId: string;
  paymentMethod?: string;
}) {
  try {
    await NotificationManager.sendPaymentApprovalNotification(paymentData);
    console.log('Payment approval notification sent');
  } catch (error) {
    console.error('Error sending payment approval notification:', error);
  }
}

/**
 * Example: Send payment rejection notification
 */
export async function handlePaymentRejection(paymentData: {
  clientEmail: string;
  clientName: string;
  amount: number;
  serviceName: string;
  bookingId: string;
  rejectionReason: string;
}) {
  try {
    await NotificationManager.sendPaymentRejectionNotification(paymentData);
    console.log('Payment rejection notification sent');
  } catch (error) {
    console.error('Error sending payment rejection notification:', error);
  }
}

// ============================================================================
// SYSTEM NOTIFICATIONS
// ============================================================================

/**
 * Example: Send maintenance notification
 */
export async function handleScheduledMaintenance(maintenanceData: {
  title: string;
  message: string;
  scheduledFor: Date;
  duration: number; // in hours
}) {
  try {
    await NotificationManager.sendMaintenanceNotification({
      title: maintenanceData.title,
      message: maintenanceData.message,
      priority: 'medium',
      targetAudience: 'all',
      scheduledFor: maintenanceData.scheduledFor,
      duration: maintenanceData.duration,
      actionUrl: '/status',
      actionText: 'Check Status'
    });
    console.log('Maintenance notification sent');
  } catch (error) {
    console.error('Error sending maintenance notification:', error);
  }
}

/**
 * Example: Send security alert
 */
export async function handleSecurityAlert(alertData: {
  title: string;
  message: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
}) {
  try {
    await NotificationManager.sendSecurityAlertNotification({
      title: alertData.title,
      message: alertData.message,
      priority: alertData.priority,
      targetAudience: 'all',
      actionUrl: '/security',
      actionText: 'Review Security'
    });
    console.log('Security alert notification sent');
  } catch (error) {
    console.error('Error sending security alert notification:', error);
  }
}

/**
 * Example: Send feature announcement
 */
export async function handleFeatureAnnouncement(announcementData: {
  title: string;
  message: string;
  actionUrl?: string;
  actionText?: string;
}) {
  try {
    await NotificationManager.sendFeatureAnnouncementNotification({
      title: announcementData.title,
      message: announcementData.message,
      priority: 'medium',
      targetAudience: 'all',
      actionUrl: announcementData.actionUrl,
      actionText: announcementData.actionText
    });
    console.log('Feature announcement notification sent');
  } catch (error) {
    console.error('Error sending feature announcement notification:', error);
  }
}

// ============================================================================
// NOTIFICATION PREFERENCES
// ============================================================================

/**
 * Example: Check if user should receive notification
 */
export async function shouldSendNotificationToUser(
  userId: string,
  notificationType: 'booking' | 'payment' | 'account' | 'system' | 'security' | 'marketing' | 'message' | 'review',
  channel: 'email' | 'inApp' | 'push' = 'email'
): Promise<boolean> {
  try {
    const shouldSend = await NotificationPreferencesService.shouldSendNotification(
      userId,
      notificationType,
      channel
    );
    
    // Check if it's quiet hours
    if (shouldSend && channel === 'email') {
      const isQuietHours = await NotificationPreferencesService.isQuietHours(userId);
      if (isQuietHours && notificationType !== 'security') {
        return false; // Don't send non-security notifications during quiet hours
      }
    }
    
    return shouldSend;
  } catch (error) {
    console.error('Error checking notification preferences:', error);
    return true; // Default to sending notifications if there's an error
  }
}

/**
 * Example: Update user notification preferences
 */
export async function updateUserNotificationPreferences(
  userId: string,
  preferences: Partial<NotificationPreferences>
) {
  try {
    const result = await NotificationPreferencesService.updateUserPreferences(userId, preferences);
    
    if (result.success) {
      console.log('Notification preferences updated successfully');
    } else {
      console.error('Failed to update notification preferences:', result.error);
    }
    
    return result;
  } catch (error) {
    console.error('Error updating notification preferences:', error);
    return { success: false, error: 'Failed to update preferences' };
  }
}

// ============================================================================
// BATCH NOTIFICATIONS
// ============================================================================

/**
 * Example: Send notifications to multiple users
 */
export async function sendBatchNotifications(
  userIds: string[],
  notificationData: {
    type: string;
    title: string;
    message: string;
    link?: string;
  }
) {
  try {
    const results = await NotificationManager.sendBatchNotifications(userIds, notificationData);
    
    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    
    console.log(`Batch notification sent: ${successful} successful, ${failed} failed`);
    
    return results;
  } catch (error) {
    console.error('Error sending batch notifications:', error);
    return [];
  }
}

// ============================================================================
// INTEGRATION WITH EXISTING SYSTEMS
// ============================================================================

/**
 * Example: Integrate with existing booking system
 */
export async function integrateWithBookingSystem(bookingId: string, action: 'created' | 'confirmed' | 'cancelled' | 'completed') {
  try {
    // Get booking data from your existing system
    // const booking = await getBookingById(bookingId);
    // const client = await getUserById(booking.clientId);
    // const provider = await getUserById(booking.providerId);
    
    // Example booking data structure
    const bookingData = {
      bookingId,
      clientId: 'client-id',
      providerId: 'provider-id',
      clientName: 'Client Name',
      providerName: 'Provider Name',
      clientEmail: 'client@example.com',
      providerEmail: 'provider@example.com',
      serviceName: 'Service Name',
      date: '2024-01-15',
      time: '10:00',
      price: 500,
      location: 'Location'
    };
    
    switch (action) {
      case 'created':
        await NotificationManager.sendBookingCreatedNotification(bookingData);
        break;
      case 'confirmed':
        await NotificationManager.sendBookingConfirmedNotification(bookingData);
        break;
      case 'cancelled':
        await NotificationManager.sendBookingCancelledNotification({
          ...bookingData,
          reason: 'Booking cancelled by user'
        });
        break;
      case 'completed':
        await NotificationManager.sendBookingCompletedNotification(bookingData);
        break;
    }
    
    console.log(`Booking ${action} notification sent for booking ${bookingId}`);
  } catch (error) {
    console.error(`Error sending booking ${action} notification:`, error);
  }
}

/**
 * Example: Integrate with existing payment system
 */
export async function integrateWithPaymentSystem(paymentId: string, status: 'approved' | 'rejected' | 'uploaded') {
  try {
    // Get payment data from your existing system
    // const payment = await getPaymentById(paymentId);
    // const client = await getUserById(payment.clientId);
    
    // Example payment data structure
    const paymentData = {
      clientEmail: 'client@example.com',
      clientName: 'Client Name',
      amount: 500,
      serviceName: 'Service Name',
      bookingId: 'booking-id',
      paymentMethod: 'PayPal'
    };
    
    switch (status) {
      case 'approved':
        await NotificationManager.sendPaymentApprovalNotification(paymentData);
        break;
      case 'rejected':
        await NotificationManager.sendPaymentRejectionNotification({
          ...paymentData,
          rejectionReason: 'Payment proof not clear'
        });
        break;
      case 'uploaded':
        await NotificationManager.sendPaymentUploadNotification(paymentData);
        break;
    }
    
    console.log(`Payment ${status} notification sent for payment ${paymentId}`);
  } catch (error) {
    console.error(`Error sending payment ${status} notification:`, error);
  }
}

// ============================================================================
// SCHEDULED NOTIFICATIONS
// ============================================================================

/**
 * Example: Schedule booking reminders
 */
export async function scheduleBookingReminders() {
  try {
    // Get all upcoming bookings (this would typically query your database)
    // const upcomingBookings = await getUpcomingBookings();
    
    // Example: Check for bookings happening in 24 hours
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    // For each booking, send reminder if it's within 24 hours
    // for (const booking of upcomingBookings) {
    //   if (isWithin24Hours(booking.date)) {
    //     await NotificationManager.sendBookingReminderNotification(booking);
    //   }
    // }
    
    console.log('Booking reminders scheduled');
  } catch (error) {
    console.error('Error scheduling booking reminders:', error);
  }
}

/**
 * Example: Send digest emails
 */
export async function sendDigestEmails() {
  try {
    // Get users who have digest emails enabled
    // const usersWithDigest = await getUsersWithDigestEnabled();
    
    // For each user, collect their notifications and send digest
    // for (const user of usersWithDigest) {
    //   const notifications = await getUserNotifications(user.id, 'weekly');
    //   if (notifications.length > 0) {
    //     await sendDigestEmail(user, notifications);
    //   }
    // }
    
    console.log('Digest emails sent');
  } catch (error) {
    console.error('Error sending digest emails:', error);
  }
}
