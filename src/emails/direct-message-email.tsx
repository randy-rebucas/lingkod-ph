
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

interface DirectMessageEmailProps {
  userName: string;
  subject: string;
  message: string;
}

export const DirectMessageEmail = ({
  userName,
  subject,
  message,
}: DirectMessageEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{subject}</Heading>
        <Text style={paragraph}>Hi {userName},</Text>
        <Text style={paragraph}>You have received a message from the LocalPro administration team:</Text>
        
        <Section style={messageSection}>
          <Text style={messageText}>{message}</Text>
        </Section>
        
        <Hr style={hr} />
        <Text style={footer}>
          This is a direct message from an administrator. If you have questions, please contact support.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default DirectMessageEmail;

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
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

const messageSection = {
  backgroundColor: '#f8f9fa',
  padding: '20px 40px',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  margin: '20px 40px',
};

const messageText = {
  fontSize: '14px',
  lineHeight: '1.5',
  color: '#484848',
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

    