'use server';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
}

export async function sendEmail(options: EmailOptions): Promise<{ success: boolean; error?: string }> {
  try {
    // For development/testing - just log the email
    console.log('Email would be sent:', {
      to: options.to,
      subject: options.subject,
      from: options.from || 'Lingkod PH <noreply@lingkod-ph.com>'
    });
    
    // In production, integrate with your email service (Resend, SendGrid, etc.)
    return { success: true };
  } catch (error) {
    console.error('Email service error:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    };
  }
}

export async function sendBulkEmail(emails: EmailOptions[]): Promise<{ success: boolean; results: any[] }> {
  try {
    const results = await Promise.allSettled(
      emails.map(email => sendEmail(email))
    );

    const successful = results.filter(result => 
      result.status === 'fulfilled' && result.value.success
    ).length;

    return {
      success: successful === emails.length,
      results: results.map(result => 
        result.status === 'fulfilled' ? result.value : { success: false, error: 'Failed' }
      )
    };
  } catch (error) {
    console.error('Bulk email error:', error);
    return { success: false, results: [] };
  }
}
