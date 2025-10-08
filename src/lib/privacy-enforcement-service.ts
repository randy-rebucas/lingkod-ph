'use server';

import { getDb } from './firebase';
import { doc, getDoc, collection, query, where, getDocs, limit } from 'firebase/firestore';
import { UserSettingsService } from './user-settings-service';

export interface PrivacyCheckResult {
  allowed: boolean;
  reason?: string;
  filteredData?: any;
}

export interface UserProfileData {
  userId: string;
  displayName: string;
  email: string;
  phone?: string;
  location?: string;
  bio?: string;
  services?: string[];
  reviews?: any[];
  bookings?: any[];
  earnings?: any;
  profilePicture?: string;
  isOnline?: boolean;
  lastSeen?: Date;
}

export interface MessageData {
  messageId: string;
  senderId: string;
  recipientId: string;
  content: string;
  timestamp: Date;
  read: boolean;
}

export class PrivacyEnforcementService {
  private static readonly USERS_COLLECTION = 'users';
  private static readonly MESSAGES_COLLECTION = 'messages';
  private static readonly BOOKINGS_COLLECTION = 'bookings';
  private static readonly REVIEWS_COLLECTION = 'reviews';

  /**
   * Check if user can view another user's profile
   */
  static async canViewProfile(viewerId: string, targetUserId: string): Promise<PrivacyCheckResult> {
    try {
      // Get target user's privacy settings
      const targetUserSettings = await UserSettingsService.getUserSettings(targetUserId);
      
      // Check if profile is public
      if (!targetUserSettings.privacy.profile.profilePublic) {
        return { allowed: false, reason: 'Profile is private' };
      }
      
      // Check if viewer is blocked
      if (targetUserSettings.privacy.blockedUsers.includes(viewerId)) {
        return { allowed: false, reason: 'You are blocked by this user' };
      }
      
      // Check if viewer is restricted
      if (targetUserSettings.privacy.restrictedUsers.includes(viewerId)) {
        return { allowed: false, reason: 'You are restricted by this user' };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking profile view permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Get filtered profile data based on privacy settings
   */
  static async getFilteredProfileData(viewerId: string, targetUserId: string): Promise<PrivacyCheckResult> {
    try {
      const canView = await this.canViewProfile(viewerId, targetUserId);
      if (!canView.allowed) {
        return canView;
      }
      
      // Get target user's settings and profile data
      const [targetUserSettings, targetUserData] = await Promise.all([
        UserSettingsService.getUserSettings(targetUserId),
        this.getUserProfileData(targetUserId)
      ]);
      
      if (!targetUserData) {
        return { allowed: false, reason: 'User not found' };
      }
      
      // Filter data based on privacy settings
      const filteredData: Partial<UserProfileData> = {
        userId: targetUserId,
        displayName: targetUserSettings.privacy.profile.showFullName ? targetUserData.displayName : 'User',
        email: targetUserSettings.privacy.profile.showEmail ? targetUserData.email : undefined,
        phone: targetUserSettings.privacy.profile.showPhone ? targetUserData.phone : undefined,
        location: targetUserSettings.privacy.profile.showLocation ? targetUserData.location : undefined,
        bio: targetUserData.bio,
        profilePicture: targetUserData.profilePicture,
        isOnline: targetUserSettings.privacy.onlineStatus.showOnlineStatus ? targetUserData.isOnline : undefined,
        lastSeen: targetUserSettings.privacy.onlineStatus.showLastSeen ? targetUserData.lastSeen : undefined
      };
      
      // Add services if allowed
      if (targetUserSettings.privacy.profile.showServices && targetUserData.services) {
        filteredData.services = targetUserData.services;
      }
      
      // Add reviews if allowed
      if (targetUserSettings.privacy.profile.showReviews && targetUserData.reviews) {
        filteredData.reviews = targetUserData.reviews;
      }
      
      // Add bookings if allowed
      if (targetUserSettings.privacy.profile.showBookings && targetUserData.bookings) {
        filteredData.bookings = targetUserData.bookings;
      }
      
      // Add earnings if allowed
      if (targetUserSettings.privacy.profile.showEarnings && targetUserData.earnings) {
        filteredData.earnings = targetUserData.earnings;
      }
      
      return { allowed: true, filteredData };
      
    } catch (error) {
      console.error('Error getting filtered profile data:', error);
      return { allowed: false, reason: 'Error retrieving profile data' };
    }
  }

  /**
   * Check if user can send direct message
   */
  static async canSendDirectMessage(senderId: string, recipientId: string): Promise<PrivacyCheckResult> {
    try {
      // Get recipient's privacy settings
      const recipientSettings = await UserSettingsService.getUserSettings(recipientId);
      
      // Check if direct messages are allowed
      if (!recipientSettings.privacy.directMessages.allowDirectMessages) {
        return { allowed: false, reason: 'Direct messages are disabled' };
      }
      
      // Check if sender is blocked
      if (recipientSettings.privacy.blockedUsers.includes(senderId)) {
        return { allowed: false, reason: 'You are blocked by this user' };
      }
      
      // Check message permissions
      const allowFrom = recipientSettings.privacy.directMessages.allowMessagesFrom;
      if (allowFrom === 'none') {
        return { allowed: false, reason: 'Messages not allowed' };
      }
      
      // TODO: Implement more granular checks based on user relationship
      // (contacts, providers, clients, etc.)
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking direct message permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Check if user can view message
   */
  static async canViewMessage(userId: string, messageId: string): Promise<PrivacyCheckResult> {
    try {
      if (!getDb()) {
        return { allowed: false, reason: 'Database not initialized' };
      }
      
      // Get message data
      const messageDoc = await getDoc(doc(getDb(), this.MESSAGES_COLLECTION, messageId));
      if (!messageDoc.exists()) {
        return { allowed: false, reason: 'Message not found' };
      }
      
      const messageData = messageDoc.data() as MessageData;
      
      // Check if user is sender or recipient
      if (messageData.senderId !== userId && messageData.recipientId !== userId) {
        return { allowed: false, reason: 'Unauthorized access' };
      }
      
      return { allowed: true, filteredData: messageData };
      
    } catch (error) {
      console.error('Error checking message view permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Check if user can search for another user
   */
  static async canSearchUser(searcherId: string, targetUserId: string): Promise<PrivacyCheckResult> {
    try {
      // Get target user's privacy settings
      const targetUserSettings = await UserSettingsService.getUserSettings(targetUserId);
      
      // Check if search is allowed
      if (!targetUserSettings.privacy.profile.allowSearch) {
        return { allowed: false, reason: 'User not searchable' };
      }
      
      // Check if searcher is blocked
      if (targetUserSettings.privacy.blockedUsers.includes(searcherId)) {
        return { allowed: false, reason: 'You are blocked by this user' };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking search permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Check if user can view booking details
   */
  static async canViewBooking(userId: string, bookingId: string): Promise<PrivacyCheckResult> {
    try {
      if (!getDb()) {
        return { allowed: false, reason: 'Database not initialized' };
      }
      
      // Get booking data
      const bookingDoc = await getDoc(doc(getDb(), this.BOOKINGS_COLLECTION, bookingId));
      if (!bookingDoc.exists()) {
        return { allowed: false, reason: 'Booking not found' };
      }
      
      const bookingData = bookingDoc.data();
      
      // Check if user is client or provider
      if (bookingData.clientId !== userId && bookingData.providerId !== userId) {
        return { allowed: false, reason: 'Unauthorized access' };
      }
      
      return { allowed: true, filteredData: bookingData };
      
    } catch (error) {
      console.error('Error checking booking view permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Check if user can view review
   */
  static async canViewReview(userId: string, reviewId: string): Promise<PrivacyCheckResult> {
    try {
      if (!getDb()) {
        return { allowed: false, reason: 'Database not initialized' };
      }
      
      // Get review data
      const reviewDoc = await getDoc(doc(getDb(), this.REVIEWS_COLLECTION, reviewId));
      if (!reviewDoc.exists()) {
        return { allowed: false, reason: 'Review not found' };
      }
      
      const reviewData = reviewDoc.data();
      
      // Check if user is the reviewer or the reviewed user
      if (reviewData.reviewerId !== userId && reviewData.revieweeId !== userId) {
        return { allowed: false, reason: 'Unauthorized access' };
      }
      
      return { allowed: true, filteredData: reviewData };
      
    } catch (error) {
      console.error('Error checking review view permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }

  /**
   * Filter search results based on privacy settings
   */
  static async filterSearchResults(searcherId: string, searchResults: any[]): Promise<any[]> {
    try {
      const filteredResults = [];
      
      for (const result of searchResults) {
        const canSearch = await this.canSearchUser(searcherId, result.userId);
        if (canSearch.allowed) {
          const profileData = await this.getFilteredProfileData(searcherId, result.userId);
          if (profileData.allowed && profileData.filteredData) {
            filteredResults.push(profileData.filteredData);
          }
        }
      }
      
      return filteredResults;
      
    } catch (error) {
      console.error('Error filtering search results:', error);
      return [];
    }
  }

  /**
   * Get user profile data
   */
  private static async getUserProfileData(userId: string): Promise<UserProfileData | null> {
    try {
      if (!getDb()) {
        return null;
      }
      
      const userDoc = await getDoc(doc(getDb(), this.USERS_COLLECTION, userId));
      if (!userDoc.exists()) {
        return null;
      }
      
      return userDoc.data() as UserProfileData;
      
    } catch (error) {
      console.error('Error getting user profile data:', error);
      return null;
    }
  }

  /**
   * Check if user is online
   */
  static async isUserOnline(userId: string): Promise<boolean> {
    try {
      const userSettings = await UserSettingsService.getUserSettings(userId);
      
      // Check if online status is enabled
      if (!userSettings.privacy.onlineStatus.showOnlineStatus) {
        return false;
      }
      
      // TODO: Implement actual online status checking
      // This would typically check a real-time database or WebSocket connection
      
      return false; // Placeholder
      
    } catch (error) {
      console.error('Error checking online status:', error);
      return false;
    }
  }

  /**
   * Get user's last seen time
   */
  static async getUserLastSeen(userId: string): Promise<Date | null> {
    try {
      const userSettings = await UserSettingsService.getUserSettings(userId);
      
      // Check if last seen is enabled
      if (!userSettings.privacy.onlineStatus.showLastSeen) {
        return null;
      }
      
      // TODO: Implement actual last seen tracking
      // This would typically be stored in the user's profile or a separate collection
      
      return null; // Placeholder
      
    } catch (error) {
      console.error('Error getting user last seen:', error);
      return null;
    }
  }

  /**
   * Check if user can contact another user
   */
  static async canContactUser(requesterId: string, targetUserId: string): Promise<PrivacyCheckResult> {
    try {
      // Get target user's privacy settings
      const targetUserSettings = await UserSettingsService.getUserSettings(targetUserId);
      
      // Check if direct contact is allowed
      if (!targetUserSettings.privacy.profile.allowDirectContact) {
        return { allowed: false, reason: 'Direct contact is disabled' };
      }
      
      // Check if requester is blocked
      if (targetUserSettings.privacy.blockedUsers.includes(requesterId)) {
        return { allowed: false, reason: 'You are blocked by this user' };
      }
      
      return { allowed: true };
      
    } catch (error) {
      console.error('Error checking contact permission:', error);
      return { allowed: false, reason: 'Error checking permissions' };
    }
  }
}
