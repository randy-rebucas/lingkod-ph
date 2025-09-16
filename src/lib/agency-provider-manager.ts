import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  getDocs, 
  doc, 
  getDoc,
  addDoc, 
  updateDoc, 
  deleteDoc, 
  serverTimestamp, 
  writeBatch,
  Timestamp 
} from 'firebase/firestore';
import { AgencyAuditLogger } from './agency-audit-logger';

export interface ProviderProfile {
  id: string;
  displayName: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive' | 'suspended' | 'pending';
  role: 'provider';
  agencyId: string;
  agencyName: string;
  joinedAt: Timestamp;
  lastActiveAt: Timestamp;
  
  // Provider-specific data
  services: string[];
  categories: string[];
  location: {
    city: string;
    province: string;
    coordinates?: {
      lat: number;
      lng: number;
    };
  };
  
  // Performance metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  totalRevenue: number;
  averageRating: number;
  totalReviews: number;
  
  // Verification status
  isVerified: boolean;
  verificationLevel: 'basic' | 'enhanced' | 'premium';
  documentsSubmitted: string[];
  
  // Agency management
  assignedBy: string;
  notes?: string;
  tags: string[];
  priority: 'low' | 'medium' | 'high';
  
  // Settings
  notificationSettings: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
  availabilitySettings: {
    workingHours: {
      start: string;
      end: string;
    };
    workingDays: number[];
    timezone: string;
  };
}

export interface ProviderInvitation {
  id: string;
  agencyId: string;
  agencyName: string;
  providerId: string;
  providerEmail: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  invitedAt: Timestamp;
  expiresAt: Timestamp;
  invitedBy: string;
  message?: string;
}

export interface ProviderPerformanceReport {
  providerId: string;
  providerName: string;
  period: {
    start: Date;
    end: Date;
  };
  
  // Booking metrics
  totalBookings: number;
  completedBookings: number;
  cancelledBookings: number;
  noShowBookings: number;
  completionRate: number;
  
  // Revenue metrics
  totalRevenue: number;
  averageBookingValue: number;
  revenueGrowth: number;
  
  // Quality metrics
  averageRating: number;
  totalReviews: number;
  responseTime: number; // in hours
  customerSatisfaction: number;
  
  // Activity metrics
  activeDays: number;
  totalHoursWorked: number;
  averageHoursPerDay: number;
  
  // Performance score
  overallScore: number;
  ranking: number;
  trend: 'improving' | 'declining' | 'stable';
}

export class AgencyProviderManager {
  private agencyId: string;
  private agencyName: string;
  private auditLogger: AgencyAuditLogger;

  constructor(agencyId: string, agencyName: string) {
    this.agencyId = agencyId;
    this.agencyName = agencyName;
    this.auditLogger = new AgencyAuditLogger(agencyId, agencyName);
  }

  /**
   * Invite a provider to join the agency
   */
  async inviteProvider(
    providerEmail: string,
    message?: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<{ success: boolean; message: string; invitationId?: string }> {
    try {
      // Check if provider exists
      const userQuery = query(
        collection(db, 'users'),
        where('email', '==', providerEmail)
      );
      const userSnapshot = await getDocs(userQuery);

      if (userSnapshot.empty) {
        return {
          success: false,
          message: 'Provider not found. Please ensure the email address is correct.',
        };
      }

      const providerDoc = userSnapshot.docs[0];
      const providerData = providerDoc.data();

      // Validate provider role
      if (providerData.role !== 'provider') {
        return {
          success: false,
          message: 'User is not a provider. Only providers can be invited to agencies.',
        };
      }

      // Check if provider is already in an agency
      if (providerData.agencyId) {
        return {
          success: false,
          message: 'Provider is already part of an agency.',
        };
      }

      // Check for existing pending invitation
      const existingInviteQuery = query(
        collection(db, 'providerInvitations'),
        where('providerEmail', '==', providerEmail),
        where('status', '==', 'pending')
      );
      const existingInviteSnapshot = await getDocs(existingInviteQuery);

      if (!existingInviteSnapshot.empty) {
        return {
          success: false,
          message: 'An invitation is already pending for this provider.',
        };
      }

      // Create invitation
      const invitationData: Omit<ProviderInvitation, 'id'> = {
        agencyId: this.agencyId,
        agencyName: this.agencyName,
        providerId: providerDoc.id,
        providerEmail,
        status: 'pending',
        invitedAt: serverTimestamp() as Timestamp,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) as any, // 7 days
        invitedBy: this.agencyId,
        message,
      };

      const invitationRef = await addDoc(
        collection(db, 'providerInvitations'),
        invitationData
      );

      // Create notification for provider
      const notificationData = {
        type: 'agency_invitation',
        title: `Invitation from ${this.agencyName}`,
        message: message || `You have been invited to join ${this.agencyName}`,
        data: {
          invitationId: invitationRef.id,
          agencyId: this.agencyId,
          agencyName: this.agencyName,
        },
        read: false,
        createdAt: serverTimestamp(),
      };

      await addDoc(
        collection(db, `users/${providerDoc.id}/notifications`),
        notificationData
      );

      // Log the invitation
      await this.auditLogger.logProviderAction(
        'provider_invited',
        providerDoc.id,
        providerData.displayName,
        { email: providerEmail, message },
        options
      );

      return {
        success: true,
        message: 'Invitation sent successfully.',
        invitationId: invitationRef.id,
      };
    } catch (error) {
      console.error('Error inviting provider:', error);
      return {
        success: false,
        message: 'Failed to send invitation. Please try again.',
      };
    }
  }

  /**
   * Accept a provider invitation
   */
  async acceptProviderInvitation(
    invitationId: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const invitationRef = doc(db, 'providerInvitations', invitationId);
      const invitationDoc = await getDoc(doc(db, 'providerInvitations', invitationId));

      if (!invitationDoc.exists()) {
        return {
          success: false,
          message: 'Invitation not found.',
        };
      }

      const invitation = invitationDoc.data() as ProviderInvitation;

      // Check if invitation is still valid
      if (invitation.status !== 'pending') {
        return {
          success: false,
          message: 'Invitation is no longer valid.',
        };
      }

      if (invitation.expiresAt.toDate() < new Date()) {
        return {
          success: false,
          message: 'Invitation has expired.',
        };
      }

      // Update provider's agency information
      const batch = writeBatch(db);
      
      // Update provider document
      const providerRef = doc(db, 'users', invitation.providerId);
      batch.update(providerRef, {
        agencyId: this.agencyId,
        agencyName: this.agencyName,
        joinedAgencyAt: serverTimestamp(),
      });

      // Update invitation status
      batch.update(invitationRef, {
        status: 'accepted',
        acceptedAt: serverTimestamp(),
      });

      await batch.commit();

      // Log the acceptance
      await this.auditLogger.logProviderAction(
        'provider_status_changed',
        invitation.providerId,
        invitation.providerEmail,
        { status: 'accepted', invitationId },
        options
      );

      return {
        success: true,
        message: 'Provider successfully added to agency.',
      };
    } catch (error) {
      console.error('Error accepting provider invitation:', error);
      return {
        success: false,
        message: 'Failed to accept invitation. Please try again.',
      };
    }
  }

  /**
   * Remove a provider from the agency
   */
  async removeProvider(
    providerId: string,
    reason?: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get provider information
      const providerDoc = await getDoc(doc(db, 'users', providerId));

      if (!providerDoc.exists()) {
        return {
          success: false,
          message: 'Provider not found.',
        };
      }

      const providerData = providerDoc.data();

      // Update provider document
      const batch = writeBatch(db);
      
      const providerRef = doc(db, 'users', providerId);
      batch.update(providerRef, {
        agencyId: null,
        agencyName: null,
        removedFromAgencyAt: serverTimestamp(),
        removalReason: reason,
      });

      // Cancel any pending bookings
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('providerId', '==', providerId),
        where('status', 'in', ['Upcoming', 'In Progress'])
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      
      bookingsSnapshot.docs.forEach(bookingDoc => {
        batch.update(bookingDoc.ref, {
          status: 'Cancelled',
          cancellationReason: 'Provider removed from agency',
          cancelledAt: serverTimestamp(),
        });
      });

      await batch.commit();

      // Log the removal
      await this.auditLogger.logProviderAction(
        'provider_removed',
        providerId,
        providerData.displayName,
        { reason },
        options
      );

      return {
        success: true,
        message: 'Provider successfully removed from agency.',
      };
    } catch (error) {
      console.error('Error removing provider:', error);
      return {
        success: false,
        message: 'Failed to remove provider. Please try again.',
      };
    }
  }

  /**
   * Update provider status
   */
  async updateProviderStatus(
    providerId: string,
    status: ProviderProfile['status'],
    reason?: string,
    options: {
      ipAddress?: string;
      userAgent?: string;
    } = {}
  ): Promise<{ success: boolean; message: string }> {
    try {
      const providerRef = doc(db, 'users', providerId);
      await updateDoc(providerRef, {
        status,
        statusUpdatedAt: serverTimestamp(),
        statusUpdateReason: reason,
      });

      // Log the status change
      await this.auditLogger.logProviderAction(
        'provider_status_changed',
        providerId,
        'Provider',
        { status, reason },
        options
      );

      return {
        success: true,
        message: `Provider status updated to ${status}.`,
      };
    } catch (error) {
      console.error('Error updating provider status:', error);
      return {
        success: false,
        message: 'Failed to update provider status. Please try again.',
      };
    }
  }

  /**
   * Get all providers for the agency
   */
  async getAgencyProviders(): Promise<ProviderProfile[]> {
    try {
      const providersQuery = query(
        collection(db, 'users'),
        where('agencyId', '==', this.agencyId),
        where('role', '==', 'provider')
      );
      const snapshot = await getDocs(providersQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProviderProfile[];
    } catch (error) {
      console.error('Error getting agency providers:', error);
      return [];
    }
  }

  /**
   * Get provider performance report
   */
  async getProviderPerformanceReport(
    providerId: string,
    startDate: Date,
    endDate: Date
  ): Promise<ProviderPerformanceReport | null> {
    try {
      // Get provider information
      const providerDoc = await getDoc(doc(db, 'users', providerId));

      if (!providerDoc.exists()) {
        return null;
      }

      const providerData = providerDoc.data();

      // Get bookings for the period
      const bookingsQuery = query(
        collection(db, 'bookings'),
        where('providerId', '==', providerId),
        where('createdAt', '>=', startDate),
        where('createdAt', '<=', endDate)
      );
      const bookingsSnapshot = await getDocs(bookingsQuery);
      const bookings = bookingsSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const totalBookings = bookings.length;
      const completedBookings = bookings.filter(b => b.status === 'Completed').length;
      const cancelledBookings = bookings.filter(b => b.status === 'Cancelled').length;
      const noShowBookings = bookings.filter(b => b.status === 'No Show').length;
      const totalRevenue = bookings.filter(b => b.status === 'Completed').reduce((sum, b) => sum + (b.price || 0), 0);

      const completionRate = totalBookings > 0 ? (completedBookings / totalBookings) * 100 : 0;
      const averageBookingValue = completedBookings > 0 ? totalRevenue / completedBookings : 0;

      // Calculate performance score
      const overallScore = this.calculateProviderScore(
        completionRate,
        averageBookingValue,
        providerData.averageRating || 0
      );

      return {
        providerId,
        providerName: providerData.displayName,
        period: { start: startDate, end: endDate },
        totalBookings,
        completedBookings,
        cancelledBookings,
        noShowBookings,
        completionRate,
        totalRevenue,
        averageBookingValue,
        revenueGrowth: 0, // Would be calculated from historical data
        averageRating: providerData.averageRating || 0,
        totalReviews: providerData.totalReviews || 0,
        responseTime: 2, // Default value, would be calculated from actual data
        customerSatisfaction: providerData.averageRating || 0,
        activeDays: 30, // Default value, would be calculated from actual data
        totalHoursWorked: 160, // Default value, would be calculated from actual data
        averageHoursPerDay: 5.3, // Default value, would be calculated from actual data
        overallScore,
        ranking: 1, // Would be calculated relative to other providers
        trend: 'stable', // Would be calculated from historical data
      };
    } catch (error) {
      console.error('Error getting provider performance report:', error);
      return null;
    }
  }

  /**
   * Get provider invitations
   */
  async getProviderInvitations(): Promise<ProviderInvitation[]> {
    try {
      const invitationsQuery = query(
        collection(db, 'providerInvitations'),
        where('agencyId', '==', this.agencyId)
      );
      const snapshot = await getDocs(invitationsQuery);
      
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProviderInvitation[];
    } catch (error) {
      console.error('Error getting provider invitations:', error);
      return [];
    }
  }

  /**
   * Calculate provider performance score
   */
  private calculateProviderScore(
    completionRate: number,
    averageBookingValue: number,
    averageRating: number
  ): number {
    const completionScore = Math.min(completionRate, 100);
    const valueScore = Math.min(averageBookingValue / 1000 * 100, 100);
    const ratingScore = averageRating * 20; // Convert 5-star rating to 100-point scale
    
    return (completionScore + valueScore + ratingScore) / 3;
  }

  /**
   * Set up real-time listener for provider changes
   */
  subscribeToProviderChanges(
    callback: (providers: ProviderProfile[]) => void
  ): () => void {
    const providersQuery = query(
      collection(db, 'users'),
      where('agencyId', '==', this.agencyId),
      where('role', '==', 'provider')
    );

    return onSnapshot(providersQuery, (snapshot) => {
      const providers = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as ProviderProfile[];
      
      callback(providers);
    });
  }
}
