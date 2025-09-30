# LocalPro - Email Templates Documentation

## Overview

This document provides comprehensive documentation for the email templates and notification system in the LocalPro application. The email system uses React Email for template creation and provides automated notifications for various platform events.

## Table of Contents

1. [Email Architecture](#email-architecture)
2. [Email Templates](#email-templates)
3. [Email Service](#email-service)
4. [Notification System](#notification-system)
5. [Template Development](#template-development)
6. [Testing and Deployment](#testing-and-deployment)

---

## Email Architecture

### Technology Stack
- **React Email**: Email template framework with React components
- **Resend**: Email delivery service
- **TypeScript**: Type-safe email template development
- **Tailwind CSS**: Styling for email templates

### Email Flow
```
User Action → Server Action → Email Service → Template Rendering → Email Delivery
```

### Template Structure
All email templates follow a consistent structure:
```typescript
interface EmailTemplateProps {
  // Template-specific props
}

export const TemplateName = ({ props }: EmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Email preview text</Preview>
    <Body>
      <Container>
        <Section>
          {/* Email content */}
        </Section>
      </Container>
    </Body>
  </Html>
);
```

---

## Email Templates

### 1. Contact Form Email

**File**: `src/emails/contact-form-email.tsx`

**Purpose**: Sends contact form submissions to administrators.

#### Props
```typescript
interface ContactFormEmailProps {
  name: string;
  email: string;
  message: string;
}
```

#### Usage
```typescript
import { ContactFormEmail } from '@/emails/contact-form-email';

// In server action
await sendEmail({
  to: 'admin@localpro.asia',
  subject: 'New Contact Form Submission',
  template: ContactFormEmail,
  props: {
    name: 'John Doe',
    email: 'john@example.com',
    message: 'I have a question about your services...'
  }
});
```

#### Features
- **Formatted Message**: Clean formatting for contact form messages
- **Sender Information**: Includes sender name and email
- **Admin Notification**: Automatically sent to admin email
- **Responsive Design**: Mobile-friendly email layout

#### Template Structure
```typescript
export const ContactFormEmail = ({ name, email, message }: ContactFormEmailProps) => (
  <Html>
    <Head />
    <Preview>New message from your LocalPro contact form</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>New Contact Form Submission</Heading>
        <Text style={text}>
          You have received a new message from your LocalPro contact form.
        </Text>
        <Hr style={hr} />
        <Section style={section}>
          <Text style={label}>Name:</Text>
          <Text style={value}>{name}</Text>
        </Section>
        <Section style={section}>
          <Text style={label}>Email:</Text>
          <Text style={value}>{email}</Text>
        </Section>
        <Section style={section}>
          <Text style={label}>Message:</Text>
          <Text style={value}>{message}</Text>
        </Section>
      </Container>
    </Body>
  </Html>
);
```

---

### 2. Direct Message Email

**File**: `src/emails/direct-message-email.tsx`

**Purpose**: Sends notifications for direct messages between users.

#### Props
```typescript
interface DirectMessageEmailProps {
  senderName: string;
  senderEmail: string;
  recipientName: string;
  message: string;
  conversationId: string;
  platformUrl: string;
}
```

#### Usage
```typescript
import { DirectMessageEmail } from '@/emails/direct-message-email';

await sendEmail({
  to: recipientEmail,
  subject: `New message from ${senderName}`,
  template: DirectMessageEmail,
  props: {
    senderName: 'John Doe',
    senderEmail: 'john@example.com',
    recipientName: 'Jane Smith',
    message: 'Hello, I would like to discuss your services...',
    conversationId: 'conv123',
    platformUrl: 'https://localpro.asia'
  }
});
```

#### Features
- **Message Preview**: Shows message content in email
- **Direct Link**: Links to conversation in platform
- **Sender Information**: Clear sender identification
- **Unsubscribe Option**: Option to manage notification preferences

---

### 3. Payout Request Email

**File**: `src/emails/payout-request-email.tsx`

**Purpose**: Sends notifications for payout requests to administrators.

#### Props
```typescript
interface PayoutRequestEmailProps {
  providerName: string;
  providerEmail: string;
  amount: number;
  currency: string;
  requestDate: string;
  payoutMethod: string;
  accountDetails: {
    bankName?: string;
    accountNumber?: string;
    accountName?: string;
  };
  requestId: string;
}
```

#### Usage
```typescript
import { PayoutRequestEmail } from '@/emails/payout-request-email';

await sendEmail({
  to: 'admin@localpro.asia',
  subject: `Payout Request - ${providerName} - ₱${amount}`,
  template: PayoutRequestEmail,
  props: {
    providerName: 'John Doe',
    providerEmail: 'john@example.com',
    amount: 5000,
    currency: 'PHP',
    requestDate: '2024-01-15',
    payoutMethod: 'bank_transfer',
    accountDetails: {
      bankName: 'BPI',
      accountNumber: '1234567890',
      accountName: 'John Doe'
    },
    requestId: 'payout123'
  }
});
```

#### Features
- **Financial Details**: Secure display of payout information
- **Provider Information**: Complete provider details
- **Request Tracking**: Unique request ID for tracking
- **Admin Action Required**: Clear call-to-action for admin

---

### 4. Campaign Email

**File**: `src/emails/campaign-email.tsx`

**Purpose**: Sends marketing and promotional emails to users.

#### Props
```typescript
interface CampaignEmailProps {
  recipientName: string;
  campaignTitle: string;
  campaignContent: string;
  ctaText: string;
  ctaUrl: string;
  unsubscribeUrl: string;
  platformUrl: string;
}
```

#### Usage
```typescript
import { CampaignEmail } from '@/emails/campaign-email';

await sendEmail({
  to: userEmail,
  subject: campaignTitle,
  template: CampaignEmail,
  props: {
    recipientName: 'John Doe',
    campaignTitle: 'New Features Available!',
    campaignContent: 'We are excited to announce new features...',
    ctaText: 'Explore New Features',
    ctaUrl: 'https://localpro.asia/features',
    unsubscribeUrl: 'https://localpro.asia/unsubscribe',
    platformUrl: 'https://localpro.asia'
  }
});
```

#### Features
- **Personalization**: Personalized greeting and content
- **Call-to-Action**: Prominent CTA button
- **Unsubscribe**: Easy unsubscribe option
- **Branding**: Consistent LocalPro branding

---

## Email Service

### Email Service Implementation

**File**: `src/lib/email-service.ts`

**Purpose**: Handles email sending with template rendering and delivery.

#### Usage
```typescript
import { sendEmail } from '@/lib/email-service';

// Send simple email
await sendEmail({
  to: 'user@example.com',
  subject: 'Welcome to LocalPro',
  html: '<h1>Welcome!</h1><p>Thank you for joining LocalPro.</p>'
});

// Send email with React component template
await sendEmail({
  to: 'user@example.com',
  subject: 'Booking Confirmation',
  template: BookingConfirmationEmail,
  props: {
    userName: 'John Doe',
    serviceName: 'House Cleaning',
    date: '2024-01-15'
  }
});
```

#### Configuration
```typescript
interface EmailConfig {
  apiKey: string;
  from: string;
  replyTo?: string;
  baseUrl: string;
}

const emailConfig: EmailConfig = {
  apiKey: process.env.RESEND_API_KEY!,
  from: 'LocalPro <noreply@localpro.asia>',
  replyTo: 'support@localpro.asia',
  baseUrl: process.env.NEXT_PUBLIC_APP_URL!
};
```

#### Features
- **Template Rendering**: Renders React Email templates
- **Error Handling**: Comprehensive error handling and retry logic
- **Rate Limiting**: Prevents email spam and abuse
- **Logging**: Email sending audit logs
- **Delivery Tracking**: Tracks email delivery status

---

## Notification System

### Notification Types

#### 1. Booking Notifications
- **Booking Confirmation**: Sent to client when booking is confirmed
- **Booking Reminder**: Sent before scheduled service
- **Booking Cancellation**: Sent when booking is cancelled
- **Service Completion**: Sent after service is completed

#### 2. Payment Notifications
- **Payment Confirmation**: Sent when payment is successful
- **Payment Failed**: Sent when payment fails
- **Payout Request**: Sent to admin for payout approval
- **Payout Processed**: Sent to provider when payout is processed

#### 3. User Notifications
- **Welcome Email**: Sent to new users
- **Account Verification**: Sent for email verification
- **Password Reset**: Sent for password reset requests
- **Profile Updates**: Sent for important profile changes

#### 4. System Notifications
- **Maintenance Notices**: Sent for scheduled maintenance
- **Feature Updates**: Sent for new feature announcements
- **Security Alerts**: Sent for security-related events
- **Policy Updates**: Sent for terms and policy changes

### Notification Triggers

#### Server Actions
```typescript
// Example: Booking confirmation notification
export async function confirmBooking(bookingId: string) {
  // Update booking status
  await updateBookingStatus(bookingId, 'confirmed');
  
  // Send notification email
  await sendEmail({
    to: clientEmail,
    subject: 'Booking Confirmed - LocalPro',
    template: BookingConfirmationEmail,
    props: {
      clientName: client.name,
      serviceName: booking.serviceName,
      providerName: provider.name,
      date: booking.date,
      time: booking.time
    }
  });
}
```

#### Event Listeners
```typescript
// Example: Payment success notification
export async function handlePaymentSuccess(paymentData: PaymentData) {
  // Update payment status
  await updatePaymentStatus(paymentData.id, 'completed');
  
  // Send confirmation email
  await sendEmail({
    to: paymentData.clientEmail,
    subject: 'Payment Confirmed - LocalPro',
    template: PaymentConfirmationEmail,
    props: {
      amount: paymentData.amount,
      serviceName: paymentData.serviceName,
      transactionId: paymentData.id
    }
  });
}
```

---

## Template Development

### Creating New Email Templates

#### 1. Template Structure
```typescript
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components';

interface MyEmailTemplateProps {
  // Define props interface
  userName: string;
  message: string;
}

export const MyEmailTemplate = ({ userName, message }: MyEmailTemplateProps) => (
  <Html>
    <Head />
    <Preview>Email preview text for email clients</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={h1}>Email Title</Heading>
        <Text style={text}>
          Hello {userName},
        </Text>
        <Text style={text}>
          {message}
        </Text>
        <Hr style={hr} />
        <Text style={footer}>
          Best regards,<br />
          The LocalPro Team
        </Text>
      </Container>
    </Body>
  </Html>
);
```

#### 2. Styling Guidelines
```typescript
// Consistent styling across all templates
const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
};

const h1 = {
  color: '#333',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '40px 0',
  padding: '0',
};

const text = {
  color: '#333',
  fontSize: '16px',
  lineHeight: '26px',
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
};
```

#### 3. Responsive Design
```typescript
// Mobile-responsive styles
const responsiveStyles = {
  '@media only screen and (max-width: 600px)': {
    container: {
      padding: '10px',
    },
    h1: {
      fontSize: '20px',
    },
    text: {
      fontSize: '14px',
    },
  },
};
```

### Best Practices

#### 1. Email Client Compatibility
- Use inline styles for maximum compatibility
- Test across different email clients
- Avoid complex CSS features
- Use web-safe fonts

#### 2. Accessibility
- Include alt text for images
- Use semantic HTML structure
- Ensure good color contrast
- Provide text alternatives

#### 3. Performance
- Optimize images for email
- Keep HTML size minimal
- Use efficient CSS
- Test loading times

#### 4. Security
- Sanitize user input
- Avoid inline JavaScript
- Use HTTPS for links
- Validate email addresses

---

## Testing and Deployment

### Email Testing

#### 1. Development Testing
```bash
# Start email development server
npm run email

# Preview emails in browser
# Navigate to http://localhost:3000/emails
```

#### 2. Template Testing
```typescript
// Test email template rendering
import { render } from '@react-email/render';
import { MyEmailTemplate } from '@/emails/my-email-template';

const html = render(MyEmailTemplate({
  userName: 'Test User',
  message: 'Test message'
}));

console.log(html); // Rendered HTML
```

#### 3. Email Client Testing
- Test in Gmail, Outlook, Apple Mail
- Check mobile email clients
- Verify rendering across devices
- Test with different email providers

### Deployment

#### 1. Environment Configuration
```bash
# Production environment variables
RESEND_API_KEY=your_resend_api_key
EMAIL_FROM=LocalPro <noreply@localpro.asia>
EMAIL_REPLY_TO=support@localpro.asia
```

#### 2. Email Service Setup
```typescript
// Configure email service for production
const emailService = new EmailService({
  apiKey: process.env.RESEND_API_KEY,
  from: process.env.EMAIL_FROM,
  replyTo: process.env.EMAIL_REPLY_TO,
  baseUrl: process.env.NEXT_PUBLIC_APP_URL
});
```

#### 3. Monitoring
- Monitor email delivery rates
- Track bounce rates
- Monitor spam complaints
- Set up email analytics

---

## Email Analytics

### Metrics to Track
- **Delivery Rate**: Percentage of emails successfully delivered
- **Open Rate**: Percentage of emails opened by recipients
- **Click Rate**: Percentage of emails with clicked links
- **Bounce Rate**: Percentage of emails that bounced
- **Unsubscribe Rate**: Percentage of recipients who unsubscribed

### Analytics Implementation
```typescript
// Track email events
export async function trackEmailEvent(event: EmailEvent) {
  await logEmailEvent({
    eventType: event.type,
    emailId: event.emailId,
    recipientId: event.recipientId,
    timestamp: new Date(),
    metadata: event.metadata
  });
}
```

---

## Development Guidelines

### Adding New Email Templates
1. **Create Template**: Create new React Email template
2. **Define Props**: Define TypeScript interface for props
3. **Add Styling**: Implement consistent styling
4. **Test Template**: Test across email clients
5. **Add to Service**: Integrate with email service
6. **Update Documentation**: Document the new template

### Best Practices
1. **Consistent Branding**: Maintain consistent LocalPro branding
2. **Mobile Responsive**: Ensure mobile-friendly design
3. **Accessibility**: Follow accessibility guidelines
4. **Performance**: Optimize for fast loading
5. **Security**: Implement security best practices
6. **Testing**: Thoroughly test before deployment

---

This documentation provides comprehensive coverage of the email templates and notification system in the LocalPro application. For specific implementation details, refer to the source code and related documentation files.
