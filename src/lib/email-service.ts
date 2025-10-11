'use server';

import { Resend } from 'resend';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  replyTo?: string;
  tags?: Array<{ name: string; value: string }>;
}

export interface EmailResult {
  success: boolean;
  error?: string;
  messageId?: string;
}

// Initialize Resend client
const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail(options: EmailOptions): Promise<EmailResult> {
  try {
    // Check if we're in development mode or if Resend API key is not configured
    if (process.env.NODE_ENV === 'development' && !process.env.RESEND_API_KEY) {
      console.log('Email would be sent (development mode):', {
        to: options.to,
        subject: options.subject,
        from: options.from || 'LocalPro <admin@localpro.asia>'
      });
      return { success: true, messageId: 'dev-mode' };
    }

    // Validate required fields
    if (!options.to || !options.subject || !options.html) {
      throw new Error('Missing required email fields: to, subject, or html');
    }

    // Send email using Resend
      const { data, error } = await resend.emails.send({
        from: options.from || 'LocalPro <admin@localpro.asia>',
        to: Array.isArray(options.to) ? options.to : [options.to],
        subject: options.subject,
        html: options.html,
        reply_to: options.replyTo,
        tags: options.tags,
      });

    if (error) {
      console.error('Resend API error:', error);
      return { 
        success: false, 
        error: error.message || 'Failed to send email' 
      };
    }

    console.log('Email sent successfully:', { messageId: data?.id });
    return { 
      success: true, 
      messageId: data?.id 
    };
  } catch (error) {
    console.error('Email service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendBulkEmail(emails: EmailOptions[]): Promise<{ success: boolean; results: PromiseSettledResult<EmailResult>[]; successfulCount: number; failedCount: number }> {
  try {
    if (!emails || emails.length === 0) {
      return { success: true, results: [], successfulCount: 0, failedCount: 0 };
    }

    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    const failed = results.length - successful;

    return {
      success: successful === emails.length,
      results: results as PromiseSettledResult<EmailResult>[],
      successfulCount: successful,
      failedCount: failed
    };
  } catch (error) {
    console.error('Bulk email error:', error);
    return { 
      success: false, 
      results: [], 
      successfulCount: 0, 
      failedCount: emails?.length || 0 
    };
  }
}

// Utility functions for common email templates
export async function sendWelcomeEmail(userEmail: string, userName: string): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Welcome to LocalPro!</h1>
      <p>Hi ${userName},</p>
      <p>Welcome to LocalPro! We're excited to have you join our community of service providers and clients.</p>
      <p>Get started by:</p>
      <ul>
        <li>Completing your profile</li>
        <li>Exploring available services</li>
        <li>Connecting with local providers</li>
      </ul>
      <p>If you have any questions, feel free to reach out to our support team.</p>
      <p>Best regards,<br>The LocalPro Team</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Welcome to LocalPro!',
    html,
    tags: [{ name: 'type', value: 'welcome' }]
  });
}

export async function sendBookingConfirmationEmail(
  clientEmail: string, 
  clientName: string, 
  providerName: string, 
  serviceName: string, 
  bookingDate: string
): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Booking Confirmed!</h1>
      <p>Hi ${clientName},</p>
      <p>Your booking has been confirmed with ${providerName}.</p>
      <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3>Booking Details:</h3>
        <p><strong>Service:</strong> ${serviceName}</p>
        <p><strong>Provider:</strong> ${providerName}</p>
        <p><strong>Date:</strong> ${bookingDate}</p>
      </div>
      <p>You will receive a reminder before your scheduled appointment.</p>
      <p>Best regards,<br>The LocalPro Team</p>
    </div>
  `;

  return sendEmail({
    to: clientEmail,
    subject: 'Booking Confirmed - LocalPro',
    html,
    tags: [{ name: 'type', value: 'booking_confirmation' }]
  });
}

export async function sendPasswordResetEmail(userEmail: string, resetLink: string): Promise<EmailResult> {
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #2563eb;">Password Reset Request</h1>
      <p>You requested a password reset for your LocalPro account.</p>
      <p>Click the button below to reset your password:</p>
      <div style="text-align: center; margin: 30px 0;">
        <a href="${resetLink}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Reset Password</a>
      </div>
      <p>If you didn't request this reset, please ignore this email.</p>
      <p>This link will expire in 1 hour for security reasons.</p>
      <p>Best regards,<br>The LocalPro Team</p>
    </div>
  `;

  return sendEmail({
    to: userEmail,
    subject: 'Password Reset - LocalPro',
    html,
    tags: [{ name: 'type', value: 'password_reset' }]
  });
}
