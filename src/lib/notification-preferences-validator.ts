import { UserSettings } from '@/types/user-settings';

export interface ValidationResult {
  valid: boolean;
  warnings: string[];
  errors: string[];
  suggestions: string[];
}

export class NotificationPreferencesValidator {
  /**
   * Validate user notification preferences
   */
  static validatePreferences(settings: UserSettings): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];
    const suggestions: string[] = [];

    // Check email notifications
    if (settings.notifications.email.enabled) {
      if (!settings.notifications.email.bookingUpdates && 
          !settings.notifications.email.paymentUpdates && 
          !settings.notifications.email.newMessages) {
        warnings.push('Email notifications are enabled but no specific notification types are selected');
        suggestions.push('Consider enabling at least booking updates or payment updates');
      }
    }

    // Check SMS notifications
    if (settings.notifications.sms.enabled) {
      if (!settings.notifications.sms.phoneVerified) {
        errors.push('SMS notifications are enabled but phone number is not verified');
        suggestions.push('Verify your phone number to receive SMS notifications');
      }
      
      if (settings.notifications.sms.phoneVerified && 
          !settings.notifications.sms.paymentUpdates && 
          !settings.notifications.sms.systemAlerts) {
        warnings.push('SMS notifications are enabled but no critical notification types are selected');
        suggestions.push('Consider enabling payment updates and system alerts for important notifications');
      }
    }

    // Check push notifications
    if (settings.notifications.push.enabled) {
      if (settings.notifications.push.quietHours.enabled) {
        const startTime = settings.notifications.push.quietHours.startTime;
        const endTime = settings.notifications.push.quietHours.endTime;
        
        if (startTime === endTime) {
          warnings.push('Quiet hours start and end times are the same');
          suggestions.push('Set different start and end times for quiet hours');
        }
      }
    }

    // Check frequency settings
    if (settings.notifications.frequency.maxSMSPerDay < 5) {
      warnings.push('SMS daily limit is very low');
      suggestions.push('Consider increasing the SMS daily limit to ensure important notifications are not missed');
    }

    // Check if user has no notifications enabled at all
    if (!settings.notifications.email.enabled && 
        !settings.notifications.sms.enabled && 
        !settings.notifications.inApp.enabled && 
        !settings.notifications.push.enabled) {
      errors.push('All notification types are disabled');
      suggestions.push('Enable at least one notification type to stay informed about important updates');
    }

    // Check for urgent-only mode
    if (settings.notifications.advanced.urgentNotificationsOnly) {
      warnings.push('Urgent notifications only mode is enabled');
      suggestions.push('This will limit notifications to only urgent items. Consider enabling specific notification types for better coverage');
    }

    return {
      valid: errors.length === 0,
      warnings,
      errors,
      suggestions
    };
  }

  /**
   * Get notification coverage score
   */
  static getCoverageScore(settings: UserSettings): {
    score: number;
    maxScore: number;
    percentage: number;
    breakdown: {
      email: number;
      sms: number;
      inApp: number;
      push: number;
    };
  } {
    let score = 0;
    const maxScore = 20; // Maximum possible score

    // Email notifications (5 points max)
    if (settings.notifications.email.enabled) {
      score += 2; // Base points for enabling
      if (settings.notifications.email.bookingUpdates) score += 1;
      if (settings.notifications.email.paymentUpdates) score += 1;
      if (settings.notifications.email.securityAlerts) score += 1;
    }

    // SMS notifications (5 points max)
    if (settings.notifications.sms.enabled && settings.notifications.sms.phoneVerified) {
      score += 2; // Base points for enabling and verifying
      if (settings.notifications.sms.paymentUpdates) score += 1;
      if (settings.notifications.sms.systemAlerts) score += 1;
      if (settings.notifications.sms.verificationCodes) score += 1;
    }

    // In-app notifications (5 points max)
    if (settings.notifications.inApp.enabled) {
      score += 2; // Base points for enabling
      if (settings.notifications.inApp.bookingUpdates) score += 1;
      if (settings.notifications.inApp.paymentUpdates) score += 1;
      if (settings.notifications.inApp.newMessages) score += 1;
    }

    // Push notifications (5 points max)
    if (settings.notifications.push.enabled) {
      score += 2; // Base points for enabling
      if (settings.notifications.push.bookingUpdates) score += 1;
      if (settings.notifications.push.paymentUpdates) score += 1;
      if (settings.notifications.push.securityAlerts) score += 1;
    }

    const breakdown = {
      email: settings.notifications.email.enabled ? 
        (settings.notifications.email.bookingUpdates ? 1 : 0) +
        (settings.notifications.email.paymentUpdates ? 1 : 0) +
        (settings.notifications.email.securityAlerts ? 1 : 0) + 2 : 0,
      sms: (settings.notifications.sms.enabled && settings.notifications.sms.phoneVerified) ? 
        (settings.notifications.sms.paymentUpdates ? 1 : 0) +
        (settings.notifications.sms.systemAlerts ? 1 : 0) +
        (settings.notifications.sms.verificationCodes ? 1 : 0) + 2 : 0,
      inApp: settings.notifications.inApp.enabled ? 
        (settings.notifications.inApp.bookingUpdates ? 1 : 0) +
        (settings.notifications.inApp.paymentUpdates ? 1 : 0) +
        (settings.notifications.inApp.newMessages ? 1 : 0) + 2 : 0,
      push: settings.notifications.push.enabled ? 
        (settings.notifications.push.bookingUpdates ? 1 : 0) +
        (settings.notifications.push.paymentUpdates ? 1 : 0) +
        (settings.notifications.push.securityAlerts ? 1 : 0) + 2 : 0
    };

    return {
      score,
      maxScore,
      percentage: Math.round((score / maxScore) * 100),
      breakdown
    };
  }

  /**
   * Get optimization suggestions
   */
  static getOptimizationSuggestions(settings: UserSettings): string[] {
    const suggestions: string[] = [];
    const coverage = this.getCoverageScore(settings);

    if (coverage.percentage < 50) {
      suggestions.push('Consider enabling more notification types for better coverage');
    }

    if (!settings.notifications.email.enabled) {
      suggestions.push('Enable email notifications for important updates and receipts');
    }

    if (!settings.notifications.sms.enabled && !settings.notifications.sms.phoneVerified) {
      suggestions.push('Verify your phone number to enable SMS notifications for critical alerts');
    }

    if (!settings.notifications.inApp.enabled) {
      suggestions.push('Enable in-app notifications to stay updated while using the platform');
    }

    if (settings.notifications.frequency.maxSMSPerDay < 10) {
      suggestions.push('Increase SMS daily limit to ensure important notifications are not missed');
    }

    if (settings.notifications.advanced.urgentNotificationsOnly) {
      suggestions.push('Consider disabling urgent-only mode to receive more comprehensive notifications');
    }

    return suggestions;
  }
}
