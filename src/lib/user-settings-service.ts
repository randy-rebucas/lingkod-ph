'use server';

import { getDb } from './firebase';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp, collection, addDoc } from 'firebase/firestore';
import { 
  UserSettings, 
  DEFAULT_USER_SETTINGS, 
  SettingsValidationResult, 
  SettingsMigrationResult,
  SettingsChange,
  SettingsAuditLog
} from '@/types/user-settings';
import { sendSMS, sendVerificationCode, validatePhoneNumber } from './sms-service';

// Constants
const COLLECTION = 'userSettings';
const AUDIT_COLLECTION = 'settingsAuditLogs';
const CURRENT_VERSION = '1.0.0';

/**
 * Get user settings
 */
export async function getUserSettings(userId: string): Promise<UserSettings> {
  try {
    if (!getDb()) {
      console.warn('Firebase not initialized, returning default settings');
      return DEFAULT_USER_SETTINGS;
    }

    const settingsDoc = await getDoc(doc(getDb(), COLLECTION, userId));
    
    if (settingsDoc.exists()) {
      const settingsData = settingsDoc.data() as any;
      
      // Convert Firestore Timestamps to JavaScript Date objects
      if (settingsData.lastUpdated && typeof settingsData.lastUpdated.toDate === 'function') {
        settingsData.lastUpdated = settingsData.lastUpdated.toDate();
      }
      
      // Check if settings need migration
      if (settingsData.version !== CURRENT_VERSION) {
        const migrationResult = await migrateSettings(userId, settingsData);
        if (migrationResult.success) {
          return await getUserSettings(userId); // Recursive call to get migrated settings
        }
      }
      
      return mergeWithDefaults(settingsData);
    }
    
    // Create default settings for new user
    await createDefaultSettings(userId);
    return DEFAULT_USER_SETTINGS;
    
  } catch (error) {
    console.error('Error getting user settings:', error);
    return DEFAULT_USER_SETTINGS;
  }
}

/**
 * Update user settings
 */
export async function updateUserSettings(
  userId: string, 
  updates: Partial<UserSettings>,
  options: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  } = {}
): Promise<{ success: boolean; error?: string; validation?: SettingsValidationResult }> {
  try {
    if (!getDb()) {
      return { success: false, error: 'Firebase not initialized' };
    }

    // Get current settings
    const currentSettings = await getUserSettings(userId);
    
    // Validate updates
    const validation = validateSettings(updates);
    if (!validation.valid) {
      return { success: false, error: 'Validation failed', validation };
    }

    // Merge updates with current settings
    const updatedSettings = mergeWithDefaults({
      ...currentSettings,
      ...updates,
      lastUpdated: new Date(),
      version: CURRENT_VERSION
    });

    // Track changes for audit
    const changes = trackChanges(currentSettings, updatedSettings);
    if (changes.length > 0) {
      await logSettingsChanges(userId, changes, options);
    }

    // Update settings in database
    await setDoc(doc(getDb(), COLLECTION, userId), updatedSettings, { merge: true });

    // Handle special cases
    await handleSpecialUpdates(userId, updates, currentSettings);

    return { success: true };
    
  } catch (error) {
    console.error('Error updating user settings:', error);
    return { success: false, error: 'Failed to update settings' };
  }
}

/**
 * Update specific notification settings
 */
export async function updateNotificationSettings(
  userId: string,
  notificationType: 'email' | 'sms' | 'inApp' | 'push',
  updates: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentSettings = await getUserSettings(userId);
    
    const notificationUpdates = {
      notifications: {
        ...currentSettings.notifications,
        [notificationType]: {
          ...currentSettings.notifications[notificationType],
          ...updates
        }
      }
    };

    return await updateUserSettings(userId, notificationUpdates);
    
  } catch (error) {
    console.error('Error updating notification settings:', error);
    return { success: false, error: 'Failed to update notification settings' };
  }
}

/**
 * Update privacy settings
 */
export async function updatePrivacySettings(
  userId: string,
  privacyType: 'profile' | 'onlineStatus' | 'directMessages' | 'dataSharing',
  updates: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentSettings = await getUserSettings(userId);
    
    const privacyUpdates = {
      privacy: {
        ...currentSettings.privacy,
        [privacyType]: {
          ...currentSettings.privacy[privacyType],
          ...updates
        }
      }
    };

    return await updateUserSettings(userId, privacyUpdates);
    
  } catch (error) {
    console.error('Error updating privacy settings:', error);
    return { success: false, error: 'Failed to update privacy settings' };
  }
}

/**
 * Update appearance settings
 */
export async function updateAppearanceSettings(
  userId: string,
  appearanceType: 'theme' | 'language' | 'layout',
  updates: any
): Promise<{ success: boolean; error?: string }> {
  try {
    const currentSettings = await getUserSettings(userId);
    
    const appearanceUpdates = {
      appearance: {
        ...currentSettings.appearance,
        [appearanceType]: {
          ...currentSettings.appearance[appearanceType],
          ...updates
        }
      }
    };

    return await updateUserSettings(userId, appearanceUpdates);
    
  } catch (error) {
    console.error('Error updating appearance settings:', error);
    return { success: false, error: 'Failed to update appearance settings' };
  }
}

/**
 * Verify phone number for SMS notifications
 */
export async function verifyPhoneNumber(
  userId: string,
  phoneNumber: string,
  verificationCode: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format
    const validation = await validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // TODO: Implement verification code validation
    // For now, we'll assume the code is valid
    const isValidCode = true; // This should be implemented with proper verification

    if (!isValidCode) {
      return { success: false, error: 'Invalid verification code' };
    }

    // Update SMS settings with verified phone number
    const result = await updateNotificationSettings(userId, 'sms', {
      phoneNumber: validation.formatted,
      phoneVerified: true
    });

    if (result.success) {
      // Send confirmation SMS
      await sendSMS({
        type: 'account_update',
        phoneNumber: validation.formatted!,
        message: 'Your phone number has been verified for LocalPro SMS notifications. You can now receive SMS updates.',
        priority: 'medium'
      });
    }

    return result;
    
  } catch (error) {
    console.error('Error verifying phone number:', error);
    return { success: false, error: 'Failed to verify phone number' };
  }
}

/**
 * Send phone verification code
 */
export async function sendPhoneVerificationCode(
  userId: string,
  phoneNumber: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate phone number format
    const validation = await validatePhoneNumber(phoneNumber);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    // Send SMS with verification code
    const smsResult = await sendVerificationCode(validation.formatted!, verificationCode);
    
    if (!smsResult.success) {
      return { success: false, error: smsResult.error };
    }

    // TODO: Store verification code in database with expiration
    // For now, we'll just return success
    
    return { success: true };
    
  } catch (error) {
    console.error('Error sending phone verification code:', error);
    return { success: false, error: 'Failed to send verification code' };
  }
}

/**
 * Reset settings to defaults
 */
export async function resetToDefaults(userId: string): Promise<{ success: boolean; error?: string }> {
  try {
    return await updateUserSettings(userId, DEFAULT_USER_SETTINGS);
  } catch (error) {
    console.error('Error resetting settings to defaults:', error);
    return { success: false, error: 'Failed to reset settings' };
  }
}

/**
 * Export user settings
 */
export async function exportUserSettings(userId: string): Promise<{
  success: boolean;
  data?: UserSettings;
  error?: string;
}> {
  try {
    const settings = await getUserSettings(userId);
    return { success: true, data: settings };
  } catch (error) {
    console.error('Error exporting user settings:', error);
    return { success: false, error: 'Failed to export settings' };
  }
}

/**
 * Import user settings
 */
export async function importUserSettings(
  userId: string,
  settings: UserSettings
): Promise<{ success: boolean; error?: string; validation?: SettingsValidationResult }> {
  try {
    // Validate imported settings
    const validation = validateSettings(settings);
    if (!validation.valid) {
      return { success: false, error: 'Invalid settings format', validation };
    }

    // Update settings
    return await updateUserSettings(userId, settings);
    
  } catch (error) {
    console.error('Error importing user settings:', error);
    return { success: false, error: 'Failed to import settings' };
  }
}

/**
 * Get settings audit log
 */
export async function getSettingsAuditLog(
  userId: string,
  limit: number = 50
): Promise<SettingsChange[]> {
  try {
    if (!getDb()) {
      return [];
    }

    // TODO: Implement audit log querying
    // This would typically query the audit collection
    return [];
    
  } catch (error) {
    console.error('Error getting settings audit log:', error);
    return [];
  }
}

/**
 * Create default settings for new user
 */
async function createDefaultSettings(userId: string): Promise<void> {
  try {
    if (!getDb()) return;

    const defaultSettings = {
      ...DEFAULT_USER_SETTINGS,
      lastUpdated: serverTimestamp(),
      version: CURRENT_VERSION
    };

    await setDoc(doc(getDb(), COLLECTION, userId), defaultSettings);
    
  } catch (error) {
    console.error('Error creating default settings:', error);
  }
}

/**
 * Migrate settings to current version
 */
async function migrateSettings(
  userId: string,
  settings: UserSettings
): Promise<SettingsMigrationResult> {
  try {
    const result: SettingsMigrationResult = {
      success: true,
      migrated: false,
      errors: [],
      warnings: []
    };

    // Version-specific migrations
    if (settings.version === '0.9.0') {
      // Example migration from 0.9.0 to 1.0.0
      result.migrated = true;
      result.warnings.push('Settings migrated from version 0.9.0');
    }

    if (result.migrated) {
      // Update settings with new version
      await updateUserSettings(userId, {
        version: CURRENT_VERSION,
        migrated: true
      });
    }

    return result;
    
  } catch (error) {
    console.error('Error migrating settings:', error);
    return {
      success: false,
      migrated: false,
      errors: ['Migration failed'],
      warnings: []
    };
  }
}

/**
 * Validate settings
 */
function validateSettings(settings: Partial<UserSettings>): SettingsValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Validate notification settings
  if (settings.notifications) {
    if (settings.notifications.sms?.enabled && !settings.notifications.sms.phoneVerified) {
      warnings.push('SMS notifications enabled but phone number not verified');
    }
  }

  // Validate privacy settings
  if (settings.privacy) {
    if (settings.privacy.profile?.profilePublic && !settings.privacy.profile.showFullName) {
      warnings.push('Profile is public but full name is hidden');
    }
  }

  // Validate appearance settings
  if (settings.appearance) {
    if (settings.appearance.language?.language && !['en', 'tl', 'es', 'fr', 'de', 'ja', 'ko', 'zh'].includes(settings.appearance.language.language)) {
      errors.push('Invalid language code');
    }
  }

  return {
    valid: errors.length === 0,
    errors,
    warnings
  };
}

/**
 * Merge settings with defaults
 */
function mergeWithDefaults(settings: Partial<UserSettings>): UserSettings {
  return {
    ...DEFAULT_USER_SETTINGS,
    ...settings,
    // Ensure lastUpdated is a proper Date object
    lastUpdated: settings.lastUpdated instanceof Date ? settings.lastUpdated : new Date(),
    notifications: {
      ...DEFAULT_USER_SETTINGS.notifications,
      ...settings.notifications,
      email: {
        ...DEFAULT_USER_SETTINGS.notifications.email,
        ...settings.notifications?.email
      },
      sms: {
        ...DEFAULT_USER_SETTINGS.notifications.sms,
        ...settings.notifications?.sms
      },
      inApp: {
        ...DEFAULT_USER_SETTINGS.notifications.inApp,
        ...settings.notifications?.inApp
      },
      push: {
        ...DEFAULT_USER_SETTINGS.notifications.push,
        ...settings.notifications?.push
      }
    },
    privacy: {
      ...DEFAULT_USER_SETTINGS.privacy,
      ...settings.privacy
    },
    appearance: {
      ...DEFAULT_USER_SETTINGS.appearance,
      ...settings.appearance
    },
    account: {
      ...DEFAULT_USER_SETTINGS.account,
      ...settings.account
    }
  };
}

/**
 * Track changes for audit
 */
function trackChanges(
  oldSettings: UserSettings,
  newSettings: UserSettings
): SettingsChange[] {
  const changes: SettingsChange[] = [];
  const changeId = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Compare settings and track changes
  compareObjects('', oldSettings, newSettings, changes, changeId);

  return changes;
}

/**
 * Compare objects recursively
 */
function compareObjects(
  path: string,
  oldObj: any,
  newObj: any,
  changes: SettingsChange[],
  changeId: string
): void {
  for (const key in newObj) {
    const currentPath = path ? `${path}.${key}` : key;
    
    if (typeof newObj[key] === 'object' && newObj[key] !== null && !Array.isArray(newObj[key])) {
      compareObjects(currentPath, oldObj[key] || {}, newObj[key], changes, changeId);
    } else if (oldObj[key] !== newObj[key]) {
      changes.push({
        id: changeId,
        userId: '', // Will be set when logging
        section: path.split('.')[0] as keyof UserSettings,
        field: currentPath,
        oldValue: oldObj[key],
        newValue: newObj[key],
        timestamp: new Date()
      });
    }
  }
}

/**
 * Log settings changes for audit
 */
async function logSettingsChanges(
  userId: string,
  changes: SettingsChange[],
  options: {
    ipAddress?: string;
    userAgent?: string;
    sessionId?: string;
  }
): Promise<void> {
  try {
    if (!getDb() || changes.length === 0) return;

    // Update change records with userId
    const updatedChanges = changes.map(change => ({
      ...change,
      userId
    }));

    const auditLog: SettingsAuditLog = {
      userId,
      changes: updatedChanges,
      timestamp: new Date(),
      sessionId: options.sessionId
    };

    await addDoc(collection(getDb(), AUDIT_COLLECTION), {
      ...auditLog,
      timestamp: serverTimestamp()
    });
    
  } catch (error) {
    console.error('Error logging settings changes:', error);
  }
}

/**
 * Handle special updates that require additional processing
 */
async function handleSpecialUpdates(
  userId: string,
  updates: Partial<UserSettings>,
  currentSettings: UserSettings
): Promise<void> {
  try {
    // Handle SMS settings changes
    if (updates.notifications?.sms) {
      const smsSettings = updates.notifications.sms;
      
      // If SMS is disabled, send confirmation
      if (currentSettings.notifications.sms.enabled && !smsSettings.enabled) {
        // Send confirmation email or in-app notification
        console.log('SMS notifications disabled for user:', userId);
      }
    }

    // Handle theme changes
    if (updates.appearance?.theme) {
      // Could trigger theme change event for real-time updates
      console.log('Theme changed for user:', userId);
    }

    // Handle language changes
    if (updates.appearance?.language?.language) {
      // Could trigger language change event
      console.log('Language changed for user:', userId);
    }

  } catch (error) {
    console.error('Error handling special updates:', error);
  }
}
