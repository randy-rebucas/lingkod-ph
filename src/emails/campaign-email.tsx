
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
  Button,
  Link,
} from '@react-email/components';
import * as React from 'react';

interface CampaignEmailProps {
  subject: string;
  message: string;
  providerName: string;
}

export const CampaignEmail = ({
  subject,
  message,
  providerName,
}: CampaignEmailProps) => (
  <Html>
    <Head />
    <Preview>{subject}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>{subject}</Heading>
        <Text style={paragraph}>Hi {providerName},</Text>
        <Text style={paragraph}>{message}</Text>
        <Section style={btnContainer}>
          <Button style={button} href="https://localpro.com/dashboard">
            Go to Your Dashboard
          </Button>
        </Section>
        <Hr style={hr} />
        <Text style={footer}>
          This email was sent to all LocalPro providers.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default CampaignEmail;

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

const btnContainer = {
  textAlign: 'center' as const,
  width: '100%',
  padding: '20px 40px',
};

const button = {
  backgroundColor: '#00528A',
  borderRadius: '3px',
  color: '#fff',
  fontSize: '16px',
  textDecoration: 'none',
  textAlign: 'center' as const,
  display: 'inline-block',
  padding: '12px 20px',
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
