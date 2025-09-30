'use server';

import { getDb  } from './firebase';
import { doc, updateDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { financialAuditLogger } from './financial-audit-logger';

export interface VerificationDocument {
  type: 'government_id' | 'business_permit' | 'professional_license' | 'portfolio' | 'reference';
  url: string;
  status: 'pending' | 'approved' | 'rejected';
  uploadedAt: Date;
  reviewedAt?: Date;
  reviewedBy?: string;
  rejectionReason?: string;
}

export interface VerificationStatus {
  isVerified: boolean;
  verificationLevel: 'unverified' | 'basic' | 'professional' | 'premium';
  documents: VerificationDocument[];
  score: number;
  lastUpdated: Date;
}

export class ProviderVerificationService {
  private static instance: ProviderVerificationService;

  private constructor() {}

  public static getInstance(): ProviderVerificationService {
    if (!ProviderVerificationService.instance) {
      ProviderVerificationService.instance = new ProviderVerificationService();
    }
    return ProviderVerificationService.instance;
  }

  async submitVerificationDocument(
    providerId: string,
    documentType: string,
    documentUrl: string,
    requestMetadata: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate document type
      const validTypes = ['government_id', 'business_permit', 'professional_license', 'portfolio', 'reference'];
      if (!validTypes.includes(documentType)) {
        return { success: false, message: 'Invalid document type' };
      }

      // Get current verification status
      const userDoc = await getDoc(doc(getDb(), 'users', providerId));
      if (!userDoc.exists()) {
        return { success: false, message: 'User not found' };
      }

      const userData = userDoc.data();
      const currentVerification = userData.verification || { documents: [] };

      // Check if document already exists
      const existingDoc = currentVerification.documents.find(
        (doc: VerificationDocument) => doc.type === documentType
      );

      if (existingDoc && existingDoc.status === 'pending') {
        return { success: false, message: 'Document already submitted and pending review' };
      }

      // Add new document
      const newDocument: VerificationDocument = {
        type: documentType as VerificationDocument['type'],
        url: documentUrl,
        status: 'pending',
        uploadedAt: new Date()
      };

      const updatedDocuments = existingDoc
        ? currentVerification.documents.map((doc: VerificationDocument) =>
            doc.type === documentType ? newDocument : doc
          )
        : [...currentVerification.documents, newDocument];

      // Update verification status
      const verificationStatus = this.calculateVerificationStatus(updatedDocuments);

      await updateDoc(doc(getDb(), 'users', providerId), {
        verification: {
          ...currentVerification,
          documents: updatedDocuments,
          ...verificationStatus,
          lastUpdated: new Date()
        }
      });

      // Log verification submission
      await financialAuditLogger.logSecurityEvent(
        'verification_document_submitted',
        { ...requestMetadata, documentType, documentUrl, providerId, severity: 'medium' }
      );

      return { success: true, message: 'Document submitted successfully' };

    } catch (error) {
      console.error('Verification submission error:', error);
      return { success: false, message: 'Failed to submit document' };
    }
  }

  async reviewVerificationDocument(
    providerId: string,
    documentType: string,
    status: 'approved' | 'rejected',
    reviewerId: string,
    rejectionReason?: string,
    requestMetadata?: Record<string, unknown>
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Get current verification status
      const userDoc = await getDoc(doc(getDb(), 'users', providerId));
      if (!userDoc.exists()) {
        return { success: false, message: 'User not found' };
      }

      const userData = userDoc.data();
      const currentVerification = userData.verification || { documents: [] };

      // Find and update the document
      const updatedDocuments = currentVerification.documents.map((doc: VerificationDocument) => {
        if (doc.type === documentType) {
          return {
            ...doc,
            status,
            reviewedAt: new Date(),
            reviewedBy: reviewerId,
            rejectionReason: status === 'rejected' ? rejectionReason : undefined
          };
        }
        return doc;
      });

      // Recalculate verification status
      const verificationStatus = this.calculateVerificationStatus(updatedDocuments);

      // Update user document
      await updateDoc(doc(getDb(), 'users', providerId), {
        verification: {
          ...currentVerification,
          documents: updatedDocuments,
          ...verificationStatus,
          lastUpdated: new Date()
        }
      });

      // Log verification review
      await financialAuditLogger.logSecurityEvent(
        'verification_document_reviewed',
        { 
          ...requestMetadata, 
          providerId, 
          documentType, 
          status, 
          rejectionReason,
          reviewerId,
          severity: 'high'
        }
      );

      return { success: true, message: 'Document review completed' };

    } catch (error) {
      console.error('Verification review error:', error);
      return { success: false, message: 'Failed to review document' };
    }
  }

  async getVerificationStatus(providerId: string): Promise<VerificationStatus | null> {
    try {
      const userDoc = await getDoc(doc(getDb(), 'users', providerId));
      if (!userDoc.exists()) {
        return null;
      }

      const userData = userDoc.data();
      return userData.verification || {
        isVerified: false,
        verificationLevel: 'unverified',
        documents: [],
        score: 0,
        lastUpdated: new Date()
      };

    } catch (error) {
      console.error('Get verification status error:', error);
      return null;
    }
  }

  async getVerificationRequirements(verificationLevel: string): Promise<string[]> {
    const requirements = {
      unverified: [],
      basic: ['government_id'],
      professional: ['government_id', 'professional_license', 'portfolio'],
      premium: ['government_id', 'business_permit', 'professional_license', 'portfolio', 'reference']
    };

    return requirements[verificationLevel as keyof typeof requirements] || [];
  }

  async getPendingVerifications(): Promise<Array<{ id: string; data: Record<string, unknown> }>> {
    try {
      // Get all users with verification data and filter client-side
      // Note: This is not ideal for large datasets, but Firestore doesn't support
      // complex queries on nested array objects. Consider using a separate collection
      // for pending verifications in production.
      const usersQuery = query(
        collection(getDb(), 'users'),
        where('role', '==', 'provider')
      );

      const usersSnapshot = await getDocs(usersQuery);
      const pendingVerifications: Array<{ id: string; data: Record<string, unknown> }> = [];

      usersSnapshot.docs.forEach(doc => {
        const userData = doc.data();
        if (userData.verification?.documents) {
          const pendingDocs = userData.verification.documents.filter(
            (doc: VerificationDocument) => doc.status === 'pending'
          );
          
          if (pendingDocs.length > 0) {
            pendingVerifications.push({
              id: doc.id,
              data: {
                providerName: userData.displayName || userData.name,
                email: userData.email,
                pendingDocuments: pendingDocs
              }
            });
          }
        }
      });

      return pendingVerifications;

    } catch (error) {
      console.error('Get pending verifications error:', error);
      return [];
    }
  }

  private calculateVerificationStatus(documents: VerificationDocument[]): Partial<VerificationStatus> {
    const approvedDocs = documents.filter(doc => doc.status === 'approved');
    const approvedTypes = approvedDocs.map(doc => doc.type);

    let verificationLevel: 'unverified' | 'basic' | 'professional' | 'premium' = 'unverified';
    let score = 0;

    // Basic verification (Government ID)
    if (approvedTypes.includes('government_id')) {
      verificationLevel = 'basic';
      score += 25;
    }

    // Professional verification (Government ID + Professional License + Portfolio)
    if (approvedTypes.includes('government_id') && 
        approvedTypes.includes('professional_license') && 
        approvedTypes.includes('portfolio')) {
      verificationLevel = 'professional';
      score += 50;
    }

    // Premium verification (All documents)
    if (approvedTypes.includes('government_id') && 
        approvedTypes.includes('business_permit') && 
        approvedTypes.includes('professional_license') && 
        approvedTypes.includes('portfolio') && 
        approvedTypes.includes('reference')) {
      verificationLevel = 'premium';
      score += 100;
    }

    // Additional points for extra documents
    if (approvedTypes.includes('business_permit')) score += 15;
    if (approvedTypes.includes('reference')) score += 10;

    return {
      isVerified: verificationLevel !== 'unverified',
      verificationLevel,
      score: Math.min(score, 100)
    };
  }

  async updateProviderRanking(providerId: string): Promise<void> {
    try {
      const verificationStatus = await this.getVerificationStatus(providerId);
      if (!verificationStatus) return;

      // Get provider performance metrics
      const performanceMetrics = await this.getProviderPerformanceMetrics(providerId);
      
      // Calculate ranking score
      const rankingScore = this.calculateRankingScore(verificationStatus, performanceMetrics);

      // Update provider ranking
      await updateDoc(doc(getDb(), 'users', providerId), {
        ranking: {
          score: rankingScore,
          level: this.getRankingLevel(rankingScore),
          lastUpdated: new Date()
        }
      });

    } catch (error) {
      console.error('Update provider ranking error:', error);
    }
  }

  private async getProviderPerformanceMetrics(providerId: string): Promise<Record<string, unknown>> {
    // Get bookings, reviews, and other performance data
    const bookingsQuery = query(
      collection(getDb(), 'bookings'),
      where('providerId', '==', providerId)
    );
    const reviewsQuery = query(
      collection(getDb(), 'reviews'),
      where('providerId', '==', providerId)
    );

    const [bookingsSnapshot, reviewsSnapshot] = await Promise.all([
      getDocs(bookingsQuery),
      getDocs(reviewsQuery)
    ]);

    const bookings = bookingsSnapshot.docs.map(doc => doc.data());
    const reviews = reviewsSnapshot.docs.map(doc => doc.data());

    const completedBookings = bookings.filter(b => b.status === 'Completed');
    const averageRating = reviews.length > 0 
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length 
      : 0;

    return {
      totalBookings: bookings.length,
      completedBookings: completedBookings.length,
      completionRate: bookings.length > 0 ? completedBookings.length / bookings.length : 0,
      averageRating,
      totalReviews: reviews.length
    };
  }

  private calculateRankingScore(verificationStatus: VerificationStatus, performanceMetrics: Record<string, unknown>): number {
    let score = 0;

    // Verification score (40% weight)
    score += verificationStatus.score * 0.4;

    // Performance score (60% weight)
    const performanceScore = (
      (performanceMetrics.completionRate as number) * 30 +
      (performanceMetrics.averageRating as number) * 20 +
      Math.min((performanceMetrics.totalReviews as number) * 2, 20) +
      Math.min((performanceMetrics.completedBookings as number) * 0.5, 30)
    );
    score += performanceScore * 0.6;

    return Math.min(Math.round(score), 100);
  }

  private getRankingLevel(score: number): string {
    if (score >= 90) return 'expert';
    if (score >= 75) return 'professional';
    if (score >= 60) return 'experienced';
    if (score >= 40) return 'intermediate';
    return 'beginner';
  }
}

export const providerVerificationService = ProviderVerificationService.getInstance();
