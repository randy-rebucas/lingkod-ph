'use server';

import { db } from './firebase';
import { 
  collection, 
  query, 
  where, 
  getDocs, 
  orderBy,
  limit,
  Timestamp
} from 'firebase/firestore';
import { subscriptionService } from './subscription-service';
import { SUBSCRIPTION_FEATURES } from './subscription-types';

export interface Job {
  id: string;
  title: string;
  description: string;
  categoryName: string;
  budget: {
    amount: number;
    type: 'Fixed' | 'Daily' | 'Monthly';
    negotiable: boolean;
  };
  location: string;
  clientName: string;
  clientId: string;
  clientIsVerified?: boolean;
  createdAt: Timestamp;
  applications?: string[];
  status: string;
  priority?: 'high' | 'medium' | 'low';
  isHighValue?: boolean;
  isUrgent?: boolean;
  proAccessOnly?: boolean;
}

export interface JobWithPriority extends Job {
  isPriorityAccess: boolean;
  subscriptionTier: 'free' | 'pro';
  canAccess: boolean;
  accessReason: string;
}

export class JobPriorityService {
  /**
   * Get jobs with priority access for Pro subscribers
   */
  static async getJobsWithPriority(
    providerId: string,
    limitCount: number = 50
  ): Promise<JobWithPriority[]> {
    try {
      // Check if provider has Pro subscription
      const subscription = await subscriptionService.getProviderSubscription(providerId);
      const isPro = subscription?.tier === 'pro';
      const hasPriorityAccess = subscription?.features.some(f => 
        f.id === 'priority_job_access' && f.isEnabled
      ) || false;

      // Get all open jobs
      const jobsQuery = query(
        collection(db, "jobs"),
        where("status", "==", "Open"),
        orderBy("createdAt", "desc"),
        limit(limitCount * 2) // Get more to filter and prioritize
      );

      const snapshot = await getDocs(jobsQuery);
      const jobs: Job[] = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt as Timestamp
      })) as Job[];

      // Process jobs with priority logic
      const jobsWithPriority: JobWithPriority[] = jobs.map(job => {
        const isHighValue = this.isHighValueJob(job);
        const isUrgent = this.isUrgentJob(job);
        const isPriorityAccess = isHighValue || isUrgent;
        const canAccess = isPro && hasPriorityAccess;
        
        let accessReason = 'Standard job access';
        if (isHighValue && canAccess) {
          accessReason = 'High-value job - Pro access';
        } else if (isUrgent && canAccess) {
          accessReason = 'Urgent job - Pro access';
        } else if (isHighValue && !canAccess) {
          accessReason = 'High-value job - Pro subscription required';
        } else if (isUrgent && !canAccess) {
          accessReason = 'Urgent job - Pro subscription required';
        }

        return {
          ...job,
          isPriorityAccess,
          subscriptionTier: isPro ? 'pro' : 'free',
          canAccess,
          accessReason
        };
      });

      // Sort jobs: Priority jobs first for Pro subscribers, then regular jobs
      return this.sortJobsByPriority(jobsWithPriority, isPro);
    } catch (error) {
      console.error('Error getting jobs with priority:', error);
      return [];
    }
  }

  /**
   * Check if a job is high-value
   */
  private static isHighValueJob(job: Job): boolean {
    // High-value criteria
    const highValueThreshold = 5000; // ₱5,000+
    const isHighBudget = job.budget.amount >= highValueThreshold;
    
    // Check for high-value keywords in title/description
    const highValueKeywords = [
      'premium', 'luxury', 'high-end', 'commercial', 'business',
      'corporate', 'enterprise', 'large', 'extensive', 'comprehensive'
    ];
    
    const text = `${job.title} ${job.description}`.toLowerCase();
    const hasHighValueKeywords = highValueKeywords.some(keyword => 
      text.includes(keyword)
    );

    return isHighBudget || hasHighValueKeywords;
  }

  /**
   * Check if a job is urgent
   */
  private static isUrgentJob(job: Job): boolean {
    // Urgent criteria
    const urgentKeywords = [
      'urgent', 'asap', 'immediate', 'emergency', 'rush',
      'quick', 'fast', 'today', 'tomorrow', 'this week'
    ];
    
    const text = `${job.title} ${job.description}`.toLowerCase();
    const hasUrgentKeywords = urgentKeywords.some(keyword => 
      text.includes(keyword)
    );

    // Check if job was posted recently (within last 24 hours)
    const now = new Date();
    const jobDate = job.createdAt.toDate();
    const hoursSincePosted = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
    const isRecentlyPosted = hoursSincePosted <= 24;

    return hasUrgentKeywords || isRecentlyPosted;
  }

  /**
   * Sort jobs by priority for Pro subscribers
   */
  private static sortJobsByPriority(
    jobs: JobWithPriority[], 
    isPro: boolean
  ): JobWithPriority[] {
    if (!isPro) {
      // Free users see regular jobs only, sorted by date
      return jobs
        .filter(job => !job.isPriorityAccess)
        .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());
    }

    // Pro users see priority jobs first, then regular jobs
    const priorityJobs = jobs
      .filter(job => job.isPriorityAccess)
      .sort((a, b) => {
        // Sort priority jobs by value and urgency
        const aScore = this.calculatePriorityScore(a);
        const bScore = this.calculatePriorityScore(b);
        return bScore - aScore;
      });

    const regularJobs = jobs
      .filter(job => !job.isPriorityAccess)
      .sort((a, b) => b.createdAt.toMillis() - a.createdAt.toMillis());

    return [...priorityJobs, ...regularJobs];
  }

  /**
   * Calculate priority score for job sorting
   */
  private static calculatePriorityScore(job: JobWithPriority): number {
    let score = 0;

    // Budget score (higher budget = higher score)
    score += Math.min(job.budget.amount / 1000, 50); // Max 50 points for budget

    // Urgency score
    if (job.isUrgent) {
      score += 30;
    }

    // High value score
    if (job.isHighValue) {
      score += 25;
    }

    // Recency score (newer jobs get higher score)
    const now = new Date();
    const jobDate = job.createdAt.toDate();
    const hoursSincePosted = (now.getTime() - jobDate.getTime()) / (1000 * 60 * 60);
    score += Math.max(0, 20 - hoursSincePosted); // Max 20 points for recency

    // Verified client bonus
    if (job.clientIsVerified) {
      score += 10;
    }

    return score;
  }

  /**
   * Get priority jobs only (for Pro subscribers)
   */
  static async getPriorityJobs(providerId: string): Promise<JobWithPriority[]> {
    const allJobs = await this.getJobsWithPriority(providerId, 100);
    return allJobs.filter(job => job.isPriorityAccess && job.canAccess);
  }

  /**
   * Get high-value jobs only
   */
  static async getHighValueJobs(providerId: string): Promise<JobWithPriority[]> {
    const allJobs = await this.getJobsWithPriority(providerId, 100);
    return allJobs.filter(job => job.isHighValue && job.canAccess);
  }

  /**
   * Get urgent jobs only
   */
  static async getUrgentJobs(providerId: string): Promise<JobWithPriority[]> {
    const allJobs = await this.getJobsWithPriority(providerId, 100);
    return allJobs.filter(job => job.isUrgent && job.canAccess);
  }

  /**
   * Record priority job access for analytics
   */
  static async recordPriorityJobAccess(
    providerId: string,
    jobId: string,
    accessType: 'high_value' | 'urgent' | 'priority'
  ): Promise<void> {
    try {
      await subscriptionService.recordFeatureUsage(
        providerId,
        SUBSCRIPTION_FEATURES.PRIORITY_JOB_ACCESS
      );
    } catch (error) {
      console.error('Error recording priority job access:', error);
    }
  }
}

// Export singleton instance
export const jobPriorityService = new JobPriorityService();
