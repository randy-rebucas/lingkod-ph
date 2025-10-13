# Email Templates Documentation - LocalPro

This document provides comprehensive documentation for all email templates and notification systems in the LocalPro platform.

## Table of Contents

1. [Email System Overview](#email-system-overview)
2. [Email Templates](#email-templates)
3. [Notification System](#notification-system)
4. [Email Configuration](#email-configuration)
5. [Template Customization](#template-customization)
6. [Testing & Development](#testing--development)

---

## Email System Overview

The LocalPro email system uses React Email for template creation and Resend for email delivery, providing a robust and scalable email infrastructure.

### Key Features

- **React Email Templates**: Modern, responsive email templates
- **Resend Integration**: Reliable email delivery service
- **Template System**: Reusable and customizable templates
- **Multi-language Support**: English and Filipino templates
- **Responsive Design**: Mobile-friendly email layouts
- **Brand Consistency**: Consistent branding across all emails

### Architecture

```
User Action → Email Trigger → Template Selection → Email Generation → Resend API → Delivery
```

---

## Email Templates

### 1. Campaign Email

**File:** `src/emails/campaign-email.tsx`

**Purpose:** Mass communication to providers about platform updates, promotions, or announcements.

**Props Interface:**
```typescript
interface CampaignEmailProps {
  subject: string;        // Email subject line
  message: string;        // Main message content
  providerName: string;   // Provider's name
}
```

**Usage Example:**
```typescript
import { CampaignEmail } from '@/emails/campaign-email';

const emailData = {
  subject: "New Feature: Smart Rate Suggestions",
  message: "We're excited to announce our new AI-powered rate suggestion feature...",
  providerName: "John Doe"
};

// Send email
await sendEmail({
  to: "provider@example.com",
  subject: emailData.subject,
  template: CampaignEmail,
  props: emailData
});
```

**Template Features:**
- Professional header with LocalPro branding
- Personalized greeting
- Clear call-to-action button
- Footer with platform information
- Responsive design for mobile devices

### 2. Contact Form Email

**File:** `src/emails/contact-form-email.tsx`

**Purpose:** Notifies administrators when users submit contact form inquiries.

**Props Interface:**
```typescript
interface ContactFormEmailProps {
  name: string;           // Sender's name
  email: string;          // Sender's email
  message: string;        // Contact message
}
```

**Usage Example:**
```typescript
import { ContactFormEmail } from '@/emails/contact-form-email';

const contactData = {
  name: "Jane Smith",
  email: "jane@example.com",
  message: "I have a question about your services..."
};

// Send email
await sendEmail({
  to: "admin@localpro.asia",
  subject: "New Contact Form Submission",
  template: ContactFormEmail,
  props: contactData
});
```

**Template Features:**
- Clear form submission notification
- Highlighted sender information
- Formatted message display
- Professional layout for admin review

### 3. Direct Message Email

**File:** `src/emails/direct-message-email.tsx`

**Purpose:** Sends direct messages from administrators to users.

**Props Interface:**
```typescript
interface DirectMessageEmailProps {
  userName: string;       // Recipient's name
  subject: string;        // Message subject
  message: string;        // Message content
}
```

**Usage Example:**
```typescript
import { DirectMessageEmail } from '@/emails/direct-message-email';

const messageData = {
  userName: "Maria Santos",
  subject: "Account Verification Update",
  message: "Your account has been successfully verified..."
};

// Send email
await sendEmail({
  to: "maria@example.com",
  subject: messageData.subject,
  template: DirectMessageEmail,
  props: messageData
});
```

**Template Features:**
- Personalized greeting
- Clear message formatting
- Professional tone
- Support contact information

### 4. Payout Request Email

**File:** `src/emails/payout-request-email.tsx`

**Purpose:** Notifies administrators when providers request payouts.

**Props Interface:**
```typescript
interface PayoutRequestEmailProps {
  providerName: string;   // Provider's name
  amount: number;         // Payout amount
  payoutDetails: {        // Payout method details
    method: 'paypal' | 'bank';
    paypalEmail?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  };
}
```

**Usage Example:**
```typescript
import { PayoutRequestEmail } from '@/emails/payout-request-email';

const payoutData = {
  providerName: "Carlos Rodriguez",
  amount: 5000,
  payoutDetails: {
    method: 'bank',
    bankName: 'BPI',
    bankAccountNumber: '1234-5678-90',
    bankAccountName: 'Carlos Rodriguez'
  }
};

// Send email
await sendEmail({
  to: "admin@localpro.asia",
  subject: "New Payout Request",
  template: PayoutRequestEmail,
  props: payoutData
});
```

**Template Features:**
- Clear payout information display
- Secure payment details
- Professional formatting
- Action-oriented layout

---

## Notification System

### Email Triggers

**User Registration:**
- Welcome email with onboarding information
- Account verification email
- Profile completion reminders

**Booking Management:**
- Booking confirmation emails
- Booking reminder notifications
- Booking status updates
- Cancellation notifications

**Payment Processing:**
- Payment confirmation emails
- Payment failure notifications
- Refund notifications
- Payout request confirmations

**Service Updates:**
- Service completion notifications
- Review request emails
- Rating reminders
- Follow-up communications

### Notification Preferences

**User Settings:**
- Email frequency preferences
- Notification type selection
- Quiet hours configuration
- Language preferences

**Admin Controls:**
- Global notification settings
- Template customization
- Delivery monitoring
- Performance analytics

---

## Email Configuration

### Environment Setup

**Required Environment Variables:**
```env
# Resend Configuration
RESEND_API_KEY=your_resend_api_key
RESEND_FROM_EMAIL=noreply@localpro.asia

# Email Settings
EMAIL_FROM_NAME=LocalPro
EMAIL_REPLY_TO=support@localpro.asia
EMAIL_BCC_ADMIN=admin@localpro.asia
```

### Resend Integration

**Configuration:**
```typescript
// lib/email.ts
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEmail({
  to,
  subject,
  template,
  props
}: {
  to: string;
  subject: string;
  template: React.ComponentType<any>;
  props: any;
}) {
  const { data, error } = await resend.emails.send({
    from: process.env.RESEND_FROM_EMAIL!,
    to,
    subject,
    react: template(props),
  });

  if (error) {
    console.error('Email sending failed:', error);
    throw new Error('Failed to send email');
  }

  return data;
}
```

### Email Service Functions

**Send Campaign Email:**
```typescript
export async function sendCampaignEmail(
  recipients: string[],
  subject: string,
  message: string
) {
  const promises = recipients.map(async (email) => {
    const provider = await getProviderByEmail(email);
    return sendEmail({
      to: email,
      subject,
      template: CampaignEmail,
      props: {
        subject,
        message,
        providerName: provider?.displayName || 'Provider'
      }
    });
  });

  return Promise.all(promises);
}
```

**Send Contact Form Email:**
```typescript
export async function sendContactFormEmail(
  name: string,
  email: string,
  message: string
) {
  return sendEmail({
    to: process.env.EMAIL_BCC_ADMIN!,
    subject: 'New Contact Form Submission',
    template: ContactFormEmail,
    props: { name, email, message }
  });
}
```

---

## Template Customization

### Brand Customization

**Color Scheme:**
```typescript
const brandColors = {
  primary: '#00528A',
  secondary: '#f6f9fc',
  text: '#484848',
  border: '#e6ebf1',
  footer: '#8898aa'
};
```

**Typography:**
```typescript
const typography = {
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
  heading: {
    fontSize: '24px',
    fontWeight: '600',
    lineHeight: '1.3'
  },
  body: {
    fontSize: '14px',
    lineHeight: '1.5'
  }
};
```

### Template Styling

**Common Styles:**
```typescript
const commonStyles = {
  main: {
    backgroundColor: '#f6f9fc',
    fontFamily: typography.fontFamily,
  },
  container: {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '20px 0 48px',
    marginBottom: '64px',
    border: '1px solid #f0f0f0',
    borderRadius: '4px',
  },
  button: {
    backgroundColor: brandColors.primary,
    borderRadius: '3px',
    color: '#fff',
    fontSize: '16px',
    textDecoration: 'none',
    textAlign: 'center' as const,
    display: 'inline-block',
    padding: '12px 20px',
  }
};
```

### Responsive Design

**Mobile Optimization:**
```typescript
const responsiveStyles = {
  container: {
    width: '100%',
    maxWidth: '600px',
    margin: '0 auto',
    padding: '20px',
    '@media (max-width: 600px)': {
      padding: '10px',
    }
  },
  button: {
    width: '100%',
    '@media (max-width: 600px)': {
      fontSize: '14px',
      padding: '10px 16px',
    }
  }
};
```

---

## Testing & Development

### Development Setup

**Installation:**
```bash
npm install @react-email/components @react-email/render
```

**Development Server:**
```bash
npm run email
```

**Preview Templates:**
- Visit `http://localhost:3000/email` to preview templates
- Test different props and configurations
- Validate responsive design

### Template Testing

**Unit Testing:**
```typescript
import { render } from '@react-email/render';
import { CampaignEmail } from '@/emails/campaign-email';

describe('CampaignEmail', () => {
  it('renders correctly', () => {
    const props = {
      subject: 'Test Subject',
      message: 'Test message',
      providerName: 'Test Provider'
    };

    const html = render(CampaignEmail(props));
    expect(html).toContain('Test Subject');
    expect(html).toContain('Test message');
    expect(html).toContain('Test Provider');
  });
});
```

**Integration Testing:**
```typescript
import { sendEmail } from '@/lib/email';

describe('Email Integration', () => {
  it('sends email successfully', async () => {
    const result = await sendEmail({
      to: 'test@example.com',
      subject: 'Test Email',
      template: CampaignEmail,
      props: {
        subject: 'Test',
        message: 'Test message',
        providerName: 'Test Provider'
      }
    });

    expect(result).toBeDefined();
    expect(result.id).toBeTruthy();
  });
});
```

### Email Testing Tools

**Resend Testing:**
- Use Resend's test mode for development
- Test email delivery and formatting
- Validate webhook integration

**Email Clients:**
- Test across different email clients
- Validate responsive design
- Check spam score

---

## Performance & Monitoring

### Email Metrics

**Delivery Metrics:**
- Delivery rate tracking
- Bounce rate monitoring
- Spam complaint tracking
- Open rate analytics

**Performance Metrics:**
- Send time optimization
- Template load time
- Error rate monitoring
- User engagement tracking

### Monitoring Setup

**Error Tracking:**
```typescript
export async function sendEmailWithTracking(emailData: any) {
  try {
    const result = await sendEmail(emailData);
    
    // Log successful send
    console.log('Email sent successfully:', result.id);
    
    return result;
  } catch (error) {
    // Log error for monitoring
    console.error('Email sending failed:', error);
    
    // Send to error tracking service
    await trackError('email_send_failed', error);
    
    throw error;
  }
}
```

**Analytics Integration:**
```typescript
export async function trackEmailEvent(event: string, data: any) {
  // Send to analytics service
  await analytics.track(event, {
    ...data,
    timestamp: new Date().toISOString(),
    platform: 'localpro'
  });
}
```

---

## Best Practices

### Email Design

1. **Mobile-First**: Design for mobile devices first
2. **Clear CTAs**: Use clear call-to-action buttons
3. **Consistent Branding**: Maintain brand consistency
4. **Readable Typography**: Use readable fonts and sizes
5. **Proper Spacing**: Ensure adequate white space

### Content Guidelines

1. **Personalization**: Use recipient names and relevant information
2. **Clear Subject Lines**: Write compelling and clear subject lines
3. **Concise Content**: Keep content concise and focused
4. **Action-Oriented**: Include clear next steps
5. **Professional Tone**: Maintain professional communication

### Technical Best Practices

1. **Error Handling**: Implement comprehensive error handling
2. **Rate Limiting**: Respect email service rate limits
3. **Template Validation**: Validate template props
4. **Performance**: Optimize for fast rendering
5. **Testing**: Test across different email clients

---

This email templates documentation provides comprehensive information about the email system in the LocalPro platform. For implementation details and examples, refer to the individual template files and the React Email documentation.
