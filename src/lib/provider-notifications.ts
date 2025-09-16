'use server';

import { db } from './firebase';
import { doc, getDoc, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export interface NotificationTemplate {
  subject: string;
  html: string;
  text: string;
}

export class ProviderNotificationService {
  private static instance: ProviderNotificationService;

  private constructor() {}

  public static getInstance(): ProviderNotificationService {
    if (!ProviderNotificationService.instance) {
      ProviderNotificationService.instance = new ProviderNotificationService();
    }
    return ProviderNotificationService.instance;
  }

  async sendJobApplicationConfirmation(providerId: string, jobTitle: string, clientName: string) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getJobApplicationTemplate(jobTitle, clientName, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'job_application_confirmation', {
        jobTitle,
        clientName,
        email
      });

    } catch (error) {
      console.error('Failed to send job application confirmation:', error);
    }
  }

  async sendBookingConfirmation(providerId: string, bookingDetails: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getBookingConfirmationTemplate(bookingDetails, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'booking_confirmation', {
        bookingId: bookingDetails.id,
        clientName: bookingDetails.clientName,
        serviceName: bookingDetails.serviceName,
        email
      });

    } catch (error) {
      console.error('Failed to send booking confirmation:', error);
    }
  }

  async sendPayoutRequestConfirmation(providerId: string, payoutDetails: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getPayoutConfirmationTemplate(payoutDetails, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'payout_request_confirmation', {
        amount: payoutDetails.amount,
        method: payoutDetails.method,
        email
      });

    } catch (error) {
      console.error('Failed to send payout confirmation:', error);
    }
  }

  async sendPayoutProcessedNotification(providerId: string, payoutDetails: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getPayoutProcessedTemplate(payoutDetails, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'payout_processed', {
        amount: payoutDetails.amount,
        method: payoutDetails.method,
        transactionId: payoutDetails.transactionId,
        email
      });

    } catch (error) {
      console.error('Failed to send payout processed notification:', error);
    }
  }

  async sendSubscriptionReminder(providerId: string, subscriptionDetails: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getSubscriptionReminderTemplate(subscriptionDetails, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'subscription_reminder', {
        planName: subscriptionDetails.planName,
        renewalDate: subscriptionDetails.renewalDate,
        email
      });

    } catch (error) {
      console.error('Failed to send subscription reminder:', error);
    }
  }

  async sendNewReviewNotification(providerId: string, reviewDetails: any) {
    try {
      const userDoc = await getDoc(doc(db, 'users', providerId));
      if (!userDoc.exists()) return;

      const userData = userDoc.data();
      const email = userData.email;
      const providerName = userData.displayName || userData.name;

      const template = this.getNewReviewTemplate(reviewDetails, providerName);
      
      await resend.emails.send({
        from: 'Lingkod PH <notifications@lingkod-ph.com>',
        to: [email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      // Log notification
      await this.logNotification(providerId, 'new_review', {
        rating: reviewDetails.rating,
        clientName: reviewDetails.clientName,
        serviceName: reviewDetails.serviceName,
        email
      });

    } catch (error) {
      console.error('Failed to send new review notification:', error);
    }
  }

  private getJobApplicationTemplate(jobTitle: string, clientName: string, providerName: string): NotificationTemplate {
    return {
      subject: `Application Confirmed: ${jobTitle}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Application Confirmed!</h2>
          <p>Hello ${providerName},</p>
          <p>Your application for the job "<strong>${jobTitle}</strong>" has been successfully submitted.</p>
          <p><strong>Client:</strong> ${clientName}</p>
          <p>The client will review your application and get back to you soon. You can track the status of your application in your dashboard.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/applied-jobs" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Applications</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYour application for the job "${jobTitle}" has been successfully submitted.\n\nClient: ${clientName}\n\nThe client will review your application and get back to you soon. You can track the status of your application in your dashboard.\n\nBest regards,\nLingkod PH Team`
    };
  }

  private getBookingConfirmationTemplate(bookingDetails: any, providerName: string): NotificationTemplate {
    return {
      subject: `New Booking: ${bookingDetails.serviceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Booking Confirmed!</h2>
          <p>Hello ${providerName},</p>
          <p>You have a new booking for your service "<strong>${bookingDetails.serviceName}</strong>".</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Client:</strong> ${bookingDetails.clientName}</p>
            <p><strong>Service:</strong> ${bookingDetails.serviceName}</p>
            <p><strong>Date:</strong> ${new Date(bookingDetails.date).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₱${bookingDetails.price}</p>
          </div>
          <p>Please prepare for the service and ensure you have all necessary materials ready.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/bookings" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Booking</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYou have a new booking for your service "${bookingDetails.serviceName}".\n\nClient: ${bookingDetails.clientName}\nService: ${bookingDetails.serviceName}\nDate: ${new Date(bookingDetails.date).toLocaleDateString()}\nAmount: ₱${bookingDetails.price}\n\nPlease prepare for the service and ensure you have all necessary materials ready.\n\nBest regards,\nLingkod PH Team`
    };
  }

  private getPayoutConfirmationTemplate(payoutDetails: any, providerName: string): NotificationTemplate {
    return {
      subject: `Payout Request Confirmed - ₱${payoutDetails.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">Payout Request Confirmed!</h2>
          <p>Hello ${providerName},</p>
          <p>Your payout request has been successfully submitted and is being processed.</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ₱${payoutDetails.amount}</p>
            <p><strong>Method:</strong> ${payoutDetails.method}</p>
            <p><strong>Status:</strong> Processing</p>
          </div>
          <p>Your payout will be processed within 3-5 business days. You will receive another notification once the payment has been completed.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/earnings" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Earnings</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYour payout request has been successfully submitted and is being processed.\n\nAmount: ₱${payoutDetails.amount}\nMethod: ${payoutDetails.method}\nStatus: Processing\n\nYour payout will be processed within 3-5 business days. You will receive another notification once the payment has been completed.\n\nBest regards,\nLingkod PH Team`
    };
  }

  private getPayoutProcessedTemplate(payoutDetails: any, providerName: string): NotificationTemplate {
    return {
      subject: `Payout Processed - ₱${payoutDetails.amount}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #16a34a;">Payout Processed!</h2>
          <p>Hello ${providerName},</p>
          <p>Your payout has been successfully processed and should appear in your account within 1-2 business days.</p>
          <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Amount:</strong> ₱${payoutDetails.amount}</p>
            <p><strong>Method:</strong> ${payoutDetails.method}</p>
            <p><strong>Transaction ID:</strong> ${payoutDetails.transactionId}</p>
            <p><strong>Status:</strong> Completed</p>
          </div>
          <p>Thank you for using Lingkod PH. Keep up the great work!</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/earnings" style="background-color: #16a34a; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Earnings</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYour payout has been successfully processed and should appear in your account within 1-2 business days.\n\nAmount: ₱${payoutDetails.amount}\nMethod: ${payoutDetails.method}\nTransaction ID: ${payoutDetails.transactionId}\nStatus: Completed\n\nThank you for using Lingkod PH. Keep up the great work!\n\nBest regards,\nLingkod PH Team`
    };
  }

  private getSubscriptionReminderTemplate(subscriptionDetails: any, providerName: string): NotificationTemplate {
    return {
      subject: `Subscription Renewal Reminder - ${subscriptionDetails.planName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">Subscription Renewal Reminder</h2>
          <p>Hello ${providerName},</p>
          <p>Your ${subscriptionDetails.planName} subscription will renew on <strong>${new Date(subscriptionDetails.renewalDate).toLocaleDateString()}</strong>.</p>
          <div style="background-color: #fffbeb; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Current Plan:</strong> ${subscriptionDetails.planName}</p>
            <p><strong>Renewal Date:</strong> ${new Date(subscriptionDetails.renewalDate).toLocaleDateString()}</p>
            <p><strong>Amount:</strong> ₱${subscriptionDetails.amount}</p>
          </div>
          <p>Make sure your payment method is up to date to avoid any service interruptions.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/subscription" style="background-color: #f59e0b; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">Manage Subscription</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYour ${subscriptionDetails.planName} subscription will renew on ${new Date(subscriptionDetails.renewalDate).toLocaleDateString()}.\n\nCurrent Plan: ${subscriptionDetails.planName}\nRenewal Date: ${new Date(subscriptionDetails.renewalDate).toLocaleDateString()}\nAmount: ₱${subscriptionDetails.amount}\n\nMake sure your payment method is up to date to avoid any service interruptions.\n\nBest regards,\nLingkod PH Team`
    };
  }

  private getNewReviewTemplate(reviewDetails: any, providerName: string): NotificationTemplate {
    return {
      subject: `New Review: ${reviewDetails.rating}⭐ - ${reviewDetails.serviceName}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #2563eb;">New Review Received!</h2>
          <p>Hello ${providerName},</p>
          <p>You have received a new review for your service "<strong>${reviewDetails.serviceName}</strong>".</p>
          <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p><strong>Rating:</strong> ${'⭐'.repeat(reviewDetails.rating)} (${reviewDetails.rating}/5)</p>
            <p><strong>Client:</strong> ${reviewDetails.clientName}</p>
            <p><strong>Service:</strong> ${reviewDetails.serviceName}</p>
            ${reviewDetails.comment ? `<p><strong>Comment:</strong> "${reviewDetails.comment}"</p>` : ''}
          </div>
          <p>Great job! Keep up the excellent work to maintain your high ratings.</p>
          <div style="margin: 20px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/profile" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">View Profile</a>
          </div>
          <p>Best regards,<br>Lingkod PH Team</p>
        </div>
      `,
      text: `Hello ${providerName},\n\nYou have received a new review for your service "${reviewDetails.serviceName}".\n\nRating: ${'⭐'.repeat(reviewDetails.rating)} (${reviewDetails.rating}/5)\nClient: ${reviewDetails.clientName}\nService: ${reviewDetails.serviceName}\n${reviewDetails.comment ? `Comment: "${reviewDetails.comment}"` : ''}\n\nGreat job! Keep up the excellent work to maintain your high ratings.\n\nBest regards,\nLingkod PH Team`
    };
  }

  private async logNotification(providerId: string, type: string, details: any) {
    try {
      await addDoc(collection(db, 'notifications'), {
        userId: providerId,
        type,
        details,
        timestamp: serverTimestamp(),
        read: false
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }
}

export const providerNotificationService = ProviderNotificationService.getInstance();
