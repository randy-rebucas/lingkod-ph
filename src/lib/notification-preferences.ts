'use server';

import { getDb } from './firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';

export interface NotificationPreferences {
  // Email notifications
  emailNotifications: {
    enabled: boolean;
    bookingUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    systemUpdates: boolean;
    marketingEmails: boolean;
    securityAlerts: boolean;
  };
  
  // In-app notifications
  inAppNotifications: {
    enabled: boolean;
    bookingUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
    newMessages: boolean;
    newReviews: boolean;
  };
  
  // Push notifications (for future implementation)
  pushNotifications: {
    enabled: boolean;
    bookingUpdates: boolean;
    paymentUpdates: boolean;
    accountUpdates: boolean;
    systemUpdates: boolean;
    securityAlerts: boolean;
  };
  
  // Frequency settings
  frequency: {
    digestEmails: 'never' | 'daily' | 'weekly' | 'monthly';
    quietHours: {
      enabled: boolean;
      startTime: string; // HH:MM format
      endTime: string;   // HH:MM format
      timezone: string;
    };
  };
  
  // Advanced settings
  advanced: {
    urgentNotificationsOnly: boolean;
    notificationSound: boolean;
    vibrationEnabled: boolean;
  };
}

export const DEFAULT_NOTIFICATION_PREFERENCES: NotificationPreferences = {
  emailNotifications: {
    enabled: true,
    bookingUpdates: true,
    paymentUpdates: true,
    accountUpdates: true,
    systemUpdates: true,
    marketingEmails: false,
    securityAlerts: true,
  },
  inAppNotifications: {
    enabled: true,
    bookingUpdates: true,
    paymentUpdates: true,
    accountUpdates: true,
    systemUpdates: true,
    securityAlerts: true,
    newMessages: true,
    newReviews: true,
  },
  pushNotifications: {
    enabled: false,
    bookingUpdates: true,
    paymentUpdates: true,
    accountUpdates: true,
    systemUpdates: false,
    securityAlerts: true,
  },
  frequency: {
    digestEmails: 'weekly',
    quietHours: {
      enabled: false,
      startTime: '22:00',
      endTime: '08:00',
      timezone: 'Asia/Manila',
    },
  },
  advanced: {
    urgentNotificationsOnly: false,
    notificationSound: true,
    vibrationEnabled: true,
  },
};

export class NotificationPreferencesService {
  /**
   * Get user's notification preferences
   */
  static async getUserPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      if (!getDb()) {
        console.warn('Firebase not initialized, returning default preferences');
        return DEFAULT_NOTIFICATION_PREFERENCES;
      }

      const userDoc = await getDoc(doc(getDb(), 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        const preferences = userData.notificationPreferences;
        
        if (preferences) {
          // Merge with defaults to ensure all fields exist
          return this.mergeWithDefaults(preferences);
        }
      }
      
      return DEFAULT_NOTIFICATION_PREFERENCES;
    } catch (error) {
      console.error('Error getting user notification preferences:', error);
      return DEFAULT_NOTIFICATION_PREFERENCES;
    }
  }

  /**
   * Update user's notification preferences
   */
  static async updateUserPreferences(
    userId: string, 
    preferences: Partial<NotificationPreferences>
  ): Promise<{ success: boolean; error?: string }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Firebase not initialized' };
      }

      const currentPreferences = await this.getUserPreferences(userId);
      const updatedPreferences = this.mergeWithDefaults({
        ...currentPreferences,
        ...preferences
      });

      await updateDoc(doc(getDb(), 'users', userId), {
        notificationPreferences: updatedPreferences,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error updating user notification preferences:', error);
      return { success: false, error: 'Failed to update preferences' };
    }
  }

  /**
   * Set default preferences for new user
   */
  static async setDefaultPreferences(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!getDb()) {
        return { success: false, error: 'Firebase not initialized' };
      }

      await updateDoc(doc(getDb(), 'users', userId), {
        notificationPreferences: DEFAULT_NOTIFICATION_PREFERENCES,
        updatedAt: serverTimestamp()
      });

      return { success: true };
    } catch (error) {
      console.error('Error setting default notification preferences:', error);
      return { success: false, error: 'Failed to set default preferences' };
    }
  }

  /**
   * Check if user should receive a specific type of notification
   */
  static async shouldSendNotification(
    userId: string,
    notificationType: 'booking' | 'payment' | 'account' | 'system' | 'security' | 'marketing' | 'message' | 'review',
    channel: 'email' | 'inApp' | 'push' = 'email'
  ): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      // Check if notifications are enabled for the channel
      if (channel === 'email' && !preferences.emailNotifications.enabled) {
        return false;
      }
      if (channel === 'inApp' && !preferences.inAppNotifications.enabled) {
        return false;
      }
      if (channel === 'push' && !preferences.pushNotifications.enabled) {
        return false;
      }

      // Check specific notification type
      switch (notificationType) {
        case 'booking':
          return channel === 'email' 
            ? preferences.emailNotifications.bookingUpdates
            : channel === 'inApp'
            ? preferences.inAppNotifications.bookingUpdates
            : preferences.pushNotifications.bookingUpdates;
            
        case 'payment':
          return channel === 'email'
            ? preferences.emailNotifications.paymentUpdates
            : channel === 'inApp'
            ? preferences.inAppNotifications.paymentUpdates
            : preferences.pushNotifications.paymentUpdates;
            
        case 'account':
          return channel === 'email'
            ? preferences.emailNotifications.accountUpdates
            : channel === 'inApp'
            ? preferences.inAppNotifications.accountUpdates
            : preferences.pushNotifications.accountUpdates;
            
        case 'system':
          return channel === 'email'
            ? preferences.emailNotifications.systemUpdates
            : channel === 'inApp'
            ? preferences.inAppNotifications.systemUpdates
            : preferences.pushNotifications.systemUpdates;
            
        case 'security':
          return channel === 'email'
            ? preferences.emailNotifications.securityAlerts
            : channel === 'inApp'
            ? preferences.inAppNotifications.securityAlerts
            : preferences.pushNotifications.securityAlerts;
            
        case 'marketing':
          return channel === 'email' ? preferences.emailNotifications.marketingEmails : false;
          
        case 'message':
          return channel === 'inApp' ? preferences.inAppNotifications.newMessages : false;
          
        case 'review':
          return channel === 'inApp' ? preferences.inAppNotifications.newReviews : false;
          
        default:
          return false;
      }
    } catch (error) {
      console.error('Error checking notification preferences:', error);
      return true; // Default to sending notifications if there's an error
    }
  }

  /**
   * Check if it's currently quiet hours for the user
   */
  static async isQuietHours(userId: string): Promise<boolean> {
    try {
      const preferences = await this.getUserPreferences(userId);
      
      if (!preferences.frequency.quietHours.enabled) {
        return false;
      }

      const now = new Date();
      const userTimezone = preferences.frequency.quietHours.timezone || 'Asia/Manila';
      
      // Convert current time to user's timezone
      const userTime = new Date(now.toLocaleString('en-US', { timeZone: userTimezone }));
      const currentTime = userTime.toTimeString().slice(0, 5); // HH:MM format
      
      const startTime = preferences.frequency.quietHours.startTime;
      const endTime = preferences.frequency.quietHours.endTime;
      
      // Handle quiet hours that span midnight
      if (startTime > endTime) {
        return currentTime >= startTime || currentTime <= endTime;
      } else {
        return currentTime >= startTime && currentTime <= endTime;
      }
    } catch (error) {
      console.error('Error checking quiet hours:', error);
      return false;
    }
  }

  /**
   * Get notification digest settings
   */
  static async getDigestSettings(userId: string): Promise<{
    enabled: boolean;
    frequency: 'never' | 'daily' | 'weekly' | 'monthly';
  }> {
    try {
      const preferences = await this.getUserPreferences(userId);
      return {
        enabled: preferences.frequency.digestEmails !== 'never',
        frequency: preferences.frequency.digestEmails
      };
    } catch (error) {
      console.error('Error getting digest settings:', error);
      return { enabled: false, frequency: 'never' };
    }
  }

  /**
   * Reset user preferences to defaults
   */
  static async resetToDefaults(userId: string): Promise<{ success: boolean; error?: string }> {
    return this.updateUserPreferences(userId, DEFAULT_NOTIFICATION_PREFERENCES);
  }

  /**
   * Get notification statistics for user
   */
  static async getNotificationStats(_userId: string): Promise<{
    totalNotifications: number;
    unreadNotifications: number;
    emailNotificationsSent: number;
    lastNotificationDate?: Date;
  }> {
    try {
      if (!getDb()) {
        return {
          totalNotifications: 0,
          unreadNotifications: 0,
          emailNotificationsSent: 0
        };
      }

      // This would typically query notification collections
      // For now, return placeholder data
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        emailNotificationsSent: 0
      };
    } catch (error) {
      console.error('Error getting notification stats:', error);
      return {
        totalNotifications: 0,
        unreadNotifications: 0,
        emailNotificationsSent: 0
      };
    }
  }

  /**
   * Merge preferences with defaults to ensure all fields exist
   */
  private static mergeWithDefaults(preferences: any): NotificationPreferences {
    const merged = { ...DEFAULT_NOTIFICATION_PREFERENCES };
    
    if (preferences.emailNotifications) {
      merged.emailNotifications = { ...merged.emailNotifications, ...preferences.emailNotifications };
    }
    
    if (preferences.inAppNotifications) {
      merged.inAppNotifications = { ...merged.inAppNotifications, ...preferences.inAppNotifications };
    }
    
    if (preferences.pushNotifications) {
      merged.pushNotifications = { ...merged.pushNotifications, ...preferences.pushNotifications };
    }
    
    if (preferences.frequency) {
      merged.frequency = { ...merged.frequency, ...preferences.frequency };
      if (preferences.frequency.quietHours) {
        merged.frequency.quietHours = { ...merged.frequency.quietHours, ...preferences.frequency.quietHours };
      }
    }
    
    if (preferences.advanced) {
      merged.advanced = { ...merged.advanced, ...preferences.advanced };
    }
    
    return merged;
  }

  /**
   * Validate notification preferences
   */
  static validatePreferences(preferences: Partial<NotificationPreferences>): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];
    
    // Validate quiet hours
    if (preferences.frequency?.quietHours?.enabled) {
      const startTime = preferences.frequency.quietHours.startTime;
      const endTime = preferences.frequency.quietHours.endTime;
      
      if (!startTime || !endTime) {
        errors.push('Start time and end time are required when quiet hours are enabled');
      } else {
        const startMatch = startTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
        const endMatch = endTime.match(/^([01]?[0-9]|2[0-3]):[0-5][0-9]$/);
        
        if (!startMatch) {
          errors.push('Start time must be in HH:MM format');
        }
        if (!endMatch) {
          errors.push('End time must be in HH:MM format');
        }
      }
    }
    
    // Validate digest frequency
    if (preferences.frequency?.digestEmails) {
      const validFrequencies = ['never', 'daily', 'weekly', 'monthly'];
      if (!validFrequencies.includes(preferences.frequency.digestEmails)) {
        errors.push('Digest frequency must be one of: never, daily, weekly, monthly');
      }
    }
    
    return {
      valid: errors.length === 0,
      errors
    };
  }
}
