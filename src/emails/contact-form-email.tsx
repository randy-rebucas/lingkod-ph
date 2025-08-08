
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
import * as React from 'react';

interface ContactFormEmailProps {
  name: string;
  email: string;
  message: string;
}

export const ContactFormEmail = ({
  name,
  email,
  message,
}: ContactFormEmailProps) => (
  <Html>
    <Head />
    <Preview>New message from your LocalPro contact form</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Contact Form Submission</Heading>
        <Text style={paragraph}>You received the following message from your website's contact form:</Text>
        <Section style={infoSection}>
          <Text>
            <strong>From:</strong> {name}
          </Text>
          <Text>
            <strong>Email:</strong> {email}
          </Text>
        </Section>
        <Hr style={hr} />
        <Heading as="h2" style={messageHeading}>Message:</Heading>
        <Text style={messageText}>{message}</Text>
        <Hr style={hr} />
        <Text style={footer}>
          This email was sent from the contact form on LocalPro.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default ContactFormEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
};

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  padding: '20px 0 48px',
  marginBottom: '64px',
  border: '1px solid #f0f0f0',
  borderRadius: '4px',
};

const heading = {
  fontSize: '24px',
  letterSpacing: '-0.5px',
  lineHeight: '1.3',
  fontWeight: '600',
  color: '#484848',
  padding: '0 40px',
};

const paragraph = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#484848',
  padding: '0 40px',
};

const infoSection = {
  backgroundColor: '#f8f9fa',
  padding: '10px 40px',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  margin: '20px 40px',
};

const messageHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#484848',
  padding: '0 40px',
};

const messageText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#484848',
  padding: '0 40px',
  whiteSpace: 'pre-wrap' as const,
};

const hr = {
  borderColor: '#e6ebf1',
  margin: '20px 0',
};

const footer = {
  color: '#8898aa',
  fontSize: '12px',
  lineHeight: '16px',
  textAlign: 'center' as const,
};
