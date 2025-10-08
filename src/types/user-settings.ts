/**
 * Comprehensive User Settings Types
 * 
 * This file defines all user settings interfaces and types for the LocalPro application.
 */

// ============================================================================
// NOTIFICATION SETTINGS
// ============================================================================

export interface EmailNotificationSettings {
  enabled: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  accountUpdates: boolean;
  systemUpdates: boolean;
  marketingEmails: boolean;
  securityAlerts: boolean;
  promotionalEmails: boolean;
  newsletter: boolean;
  newMessages: boolean;
  newReviews: boolean;
  jobAlerts: boolean;
  weeklyDigest: boolean;
}

export interface SMSNotificationSettings {
  enabled: boolean;
  phoneNumber?: string;
  phoneVerified: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  accountUpdates: boolean;
  systemAlerts: boolean;
  verificationCodes: boolean;
  bookingReminders: boolean;
  urgentOnly: boolean;
}

export interface InAppNotificationSettings {
  enabled: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  accountUpdates: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  newMessages: boolean;
  newReviews: boolean;
  jobAlerts: boolean;
  soundEnabled: boolean;
  vibrationEnabled: boolean;
}

export interface PushNotificationSettings {
  enabled: boolean;
  bookingUpdates: boolean;
  paymentUpdates: boolean;
  accountUpdates: boolean;
  systemUpdates: boolean;
  securityAlerts: boolean;
  newMessages: boolean;
  newReviews: boolean;
  jobAlerts: boolean;
  quietHours: {
    enabled: boolean;
    startTime: string; // HH:MM format
    endTime: string;   // HH:MM format
    timezone: string;
  };
}

export interface NotificationSettings {
  email: EmailNotificationSettings;
  sms: SMSNotificationSettings;
  inApp: InAppNotificationSettings;
  push: PushNotificationSettings;
  frequency: {
    digestEmails: 'never' | 'daily' | 'weekly' | 'monthly';
    smsFrequency: 'immediate' | 'hourly' | 'daily';
    maxSMSPerDay: number;
  };
  advanced: {
    urgentNotificationsOnly: boolean;
    notificationSound: boolean;
    vibrationEnabled: boolean;
    desktopNotifications: boolean;
  };
}

// ============================================================================
// PRIVACY SETTINGS
// ============================================================================

export interface ProfileVisibilitySettings {
  profilePublic: boolean;
  showFullName: boolean;
  showEmail: boolean;
  showPhone: boolean;
  showLocation: boolean;
  showServices: boolean;
  showReviews: boolean;
  showBookings: boolean;
  showEarnings: boolean;
  allowSearch: boolean;
  allowDirectContact: boolean;
}

export interface OnlineStatusSettings {
  showOnlineStatus: boolean;
  showLastSeen: boolean;
  showTypingIndicator: boolean;
  autoAwayTimeout: number; // minutes
  customStatus?: string;
}

export interface DirectMessageSettings {
  allowDirectMessages: boolean;
  allowMessagesFrom: 'everyone' | 'contacts' | 'providers' | 'clients' | 'none';
  allowGroupMessages: boolean;
  messageNotifications: boolean;
  readReceipts: boolean;
  messageRetention: 'forever' | '30days' | '7days' | '1day';
}

export interface DataSharingSettings {
  shareWithPartners: boolean;
  shareWithAdvertisers: boolean;
  shareWithAnalytics: boolean;
  shareWithMarketing: boolean;
  shareWithThirdParties: boolean;
  allowDataExport: boolean;
  allowDataDeletion: boolean;
  marketingConsent: boolean;
  analyticsConsent: boolean;
  cookiesConsent: boolean;
}

export interface PrivacySettings {
  profile: ProfileVisibilitySettings;
  onlineStatus: OnlineStatusSettings;
  directMessages: DirectMessageSettings;
  dataSharing: DataSharingSettings;
  blockedUsers: string[];
  restrictedUsers: string[];
}

// ============================================================================
// APPEARANCE SETTINGS
// ============================================================================

export type Theme = 'light' | 'dark' | 'system' | 'auto';

export type Language = 'en' | 'tl' | 'es' | 'fr' | 'de' | 'ja' | 'ko' | 'zh';

export interface ThemeSettings {
  theme: Theme;
  primaryColor: string;
  accentColor: string;
  fontSize: 'small' | 'medium' | 'large';
  fontFamily: 'system' | 'serif' | 'monospace';
  highContrast: boolean;
  reducedMotion: boolean;
  customCSS?: string;
}

export interface LanguageSettings {
  language: Language;
  dateFormat: 'MM/DD/YYYY' | 'DD/MM/YYYY' | 'YYYY-MM-DD';
  timeFormat: '12h' | '24h';
  timezone: string;
  currency: 'PHP' | 'USD' | 'EUR' | 'GBP' | 'JPY';
  numberFormat: 'US' | 'EU' | 'IN';
}

export interface AppearanceSettings {
  theme: ThemeSettings;
  language: LanguageSettings;
  layout: {
    sidebarCollapsed: boolean;
    compactMode: boolean;
    showBreadcrumbs: boolean;
    showTooltips: boolean;
  };
}

// ============================================================================
// ACCOUNT SETTINGS
// ============================================================================

export interface SecuritySettings {
  twoFactorEnabled: boolean;
  twoFactorMethod: 'sms' | 'email' | 'app' | 'none';
  loginNotifications: boolean;
  deviceNotifications: boolean;
  sessionTimeout: number; // minutes
  passwordExpiry: number; // days
  requirePasswordChange: boolean;
  allowedIPs: string[];
  blockedIPs: string[];
}

export interface AccountSettings {
  email: string;
  phone?: string;
  displayName: string;
  bio?: string;
  avatar?: string;
  location?: string;
  timezone: string;
  dateOfBirth?: string;
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say';
  preferences: {
    receiveNewsletters: boolean;
    receivePromotions: boolean;
    receiveUpdates: boolean;
    allowContact: boolean;
  };
  security: SecuritySettings;
}

// ============================================================================
// BUSINESS SETTINGS (for providers/agencies)
// ============================================================================

export interface BusinessSettings {
  businessName?: string;
  businessType: 'individual' | 'company' | 'agency';
  businessLicense?: string;
  taxId?: string;
  businessAddress?: string;
  businessPhone?: string;
  businessEmail?: string;
  businessWebsite?: string;
  businessHours: {
    monday: { open: string; close: string; closed: boolean };
    tuesday: { open: string; close: string; closed: boolean };
    wednesday: { open: string; close: string; closed: boolean };
    thursday: { open: string; close: string; closed: boolean };
    friday: { open: string; close: string; closed: boolean };
    saturday: { open: string; close: string; closed: boolean };
    sunday: { open: string; close: string; closed: boolean };
  };
  serviceRadius: number; // kilometers
  autoAcceptBookings: boolean;
  requireDeposit: boolean;
  depositPercentage: number;
  cancellationPolicy: string;
  refundPolicy: string;
}

// ============================================================================
// MAIN USER SETTINGS INTERFACE
// ============================================================================

export interface UserSettings {
  // Core settings
  notifications: NotificationSettings;
  privacy: PrivacySettings;
  appearance: AppearanceSettings;
  account: AccountSettings;
  
  // Business settings (for providers/agencies)
  business?: BusinessSettings;
  
  // Metadata
  lastUpdated: Date;
  version: string;
  migrated: boolean;
}

// ============================================================================
// DEFAULT SETTINGS
// ============================================================================

export const DEFAULT_EMAIL_NOTIFICATION_SETTINGS: EmailNotificationSettings = {
  enabled: true,
  bookingUpdates: true,
  paymentUpdates: true,
  accountUpdates: true,
  systemUpdates: true,
  marketingEmails: false,
  securityAlerts: true,
  promotionalEmails: false,
  newsletter: false,
  newMessages: true,
  newReviews: true,
  jobAlerts: true,
  weeklyDigest: true,
};

export const DEFAULT_SMS_NOTIFICATION_SETTINGS: SMSNotificationSettings = {
  enabled: false,
  phoneVerified: false,
  bookingUpdates: false,
  paymentUpdates: true,
  accountUpdates: false,
  systemAlerts: true,
  verificationCodes: true,
  bookingReminders: false,
  urgentOnly: true,
};

export const DEFAULT_IN_APP_NOTIFICATION_SETTINGS: InAppNotificationSettings = {
  enabled: true,
  bookingUpdates: true,
  paymentUpdates: true,
  accountUpdates: true,
  systemUpdates: true,
  securityAlerts: true,
  newMessages: true,
  newReviews: true,
  jobAlerts: true,
  soundEnabled: true,
  vibrationEnabled: true,
};

export const DEFAULT_PUSH_NOTIFICATION_SETTINGS: PushNotificationSettings = {
  enabled: false,
  bookingUpdates: true,
  paymentUpdates: true,
  accountUpdates: true,
  systemUpdates: false,
  securityAlerts: true,
  newMessages: true,
  newReviews: true,
  jobAlerts: true,
  quietHours: {
    enabled: false,
    startTime: '22:00',
    endTime: '08:00',
    timezone: 'Asia/Manila',
  },
};

export const DEFAULT_NOTIFICATION_SETTINGS: NotificationSettings = {
  email: DEFAULT_EMAIL_NOTIFICATION_SETTINGS,
  sms: DEFAULT_SMS_NOTIFICATION_SETTINGS,
  inApp: DEFAULT_IN_APP_NOTIFICATION_SETTINGS,
  push: DEFAULT_PUSH_NOTIFICATION_SETTINGS,
  frequency: {
    digestEmails: 'weekly',
    smsFrequency: 'immediate',
    maxSMSPerDay: 10,
  },
  advanced: {
    urgentNotificationsOnly: false,
    notificationSound: true,
    vibrationEnabled: true,
    desktopNotifications: false,
  },
};

export const DEFAULT_PROFILE_VISIBILITY_SETTINGS: ProfileVisibilitySettings = {
  profilePublic: true,
  showFullName: true,
  showEmail: false,
  showPhone: false,
  showLocation: true,
  showServices: true,
  showReviews: true,
  showBookings: false,
  showEarnings: false,
  allowSearch: true,
  allowDirectContact: true,
};

export const DEFAULT_ONLINE_STATUS_SETTINGS: OnlineStatusSettings = {
  showOnlineStatus: true,
  showLastSeen: true,
  showTypingIndicator: true,
  autoAwayTimeout: 15,
};

export const DEFAULT_DIRECT_MESSAGE_SETTINGS: DirectMessageSettings = {
  allowDirectMessages: true,
  allowMessagesFrom: 'everyone',
  allowGroupMessages: true,
  messageNotifications: true,
  readReceipts: true,
  messageRetention: '30days',
};

export const DEFAULT_DATA_SHARING_SETTINGS: DataSharingSettings = {
  shareWithPartners: false,
  shareWithAdvertisers: false,
  shareWithAnalytics: true,
  shareWithMarketing: false,
  shareWithThirdParties: false,
  allowDataExport: true,
  allowDataDeletion: true,
  marketingConsent: false,
  analyticsConsent: true,
  cookiesConsent: true,
};

export const DEFAULT_PRIVACY_SETTINGS: PrivacySettings = {
  profile: DEFAULT_PROFILE_VISIBILITY_SETTINGS,
  onlineStatus: DEFAULT_ONLINE_STATUS_SETTINGS,
  directMessages: DEFAULT_DIRECT_MESSAGE_SETTINGS,
  dataSharing: DEFAULT_DATA_SHARING_SETTINGS,
  blockedUsers: [],
  restrictedUsers: [],
};

export const DEFAULT_THEME_SETTINGS: ThemeSettings = {
  theme: 'system',
  primaryColor: '#059669',
  accentColor: '#2563eb',
  fontSize: 'medium',
  fontFamily: 'system',
  highContrast: false,
  reducedMotion: false,
};

export const DEFAULT_LANGUAGE_SETTINGS: LanguageSettings = {
  language: 'en',
  dateFormat: 'MM/DD/YYYY',
  timeFormat: '12h',
  timezone: 'Asia/Manila',
  currency: 'PHP',
  numberFormat: 'US',
};

export const DEFAULT_APPEARANCE_SETTINGS: AppearanceSettings = {
  theme: DEFAULT_THEME_SETTINGS,
  language: DEFAULT_LANGUAGE_SETTINGS,
  layout: {
    sidebarCollapsed: false,
    compactMode: false,
    showBreadcrumbs: true,
    showTooltips: true,
  },
};

export const DEFAULT_SECURITY_SETTINGS: SecuritySettings = {
  twoFactorEnabled: false,
  twoFactorMethod: 'none',
  loginNotifications: true,
  deviceNotifications: true,
  sessionTimeout: 480, // 8 hours
  passwordExpiry: 90, // 90 days
  requirePasswordChange: false,
  allowedIPs: [],
  blockedIPs: [],
};

export const DEFAULT_ACCOUNT_SETTINGS: AccountSettings = {
  email: '',
  displayName: '',
  timezone: 'Asia/Manila',
  preferences: {
    receiveNewsletters: false,
    receivePromotions: false,
    receiveUpdates: true,
    allowContact: true,
  },
  security: DEFAULT_SECURITY_SETTINGS,
};

export const DEFAULT_USER_SETTINGS: UserSettings = {
  notifications: DEFAULT_NOTIFICATION_SETTINGS,
  privacy: DEFAULT_PRIVACY_SETTINGS,
  appearance: DEFAULT_APPEARANCE_SETTINGS,
  account: DEFAULT_ACCOUNT_SETTINGS,
  lastUpdated: new Date(),
  version: '1.0.0',
  migrated: false,
};

// ============================================================================
// SETTINGS VALIDATION TYPES
// ============================================================================

export interface SettingsValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface SettingsMigrationResult {
  success: boolean;
  migrated: boolean;
  errors: string[];
  warnings: string[];
}

// ============================================================================
// SETTINGS CHANGE TRACKING
// ============================================================================

export interface SettingsChange {
  id: string;
  userId: string;
  section: keyof UserSettings;
  field: string;
  oldValue: any;
  newValue: any;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface SettingsAuditLog {
  userId: string;
  changes: SettingsChange[];
  timestamp: Date;
  sessionId?: string;
}
