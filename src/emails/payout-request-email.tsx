
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

interface PayoutRequestEmailProps {
  providerName: string;
  amount: number;
  payoutDetails: {
    method: 'paypal' | 'bank';
    paypalEmail?: string;
    bankName?: string;
    bankAccountNumber?: string;
    bankAccountName?: string;
  };
}

export const PayoutRequestEmail = ({
  providerName,
  amount,
  payoutDetails,
}: PayoutRequestEmailProps) => (
  <Html>
    <Head />
    <Preview>New Payout Request from {providerName}</Preview>
    <Body style={main}>
      <Container style={container}>
        <Heading style={heading}>New Payout Request</Heading>
        <Text style={paragraph}>A new payout has been requested by a provider on LocalPro.</Text>
        
        <Section style={infoSection}>
          <Text><strong>Provider:</strong> {providerName}</Text>
          <Text><strong>Amount:</strong> ₱{amount.toFixed(2)}</Text>
        </Section>

        <Hr style={hr} />

        <Heading as="h2" style={messageHeading}>Payout Details</Heading>
        <Section style={detailsSection}>
          <Text><strong>Method:</strong> {payoutDetails.method.toUpperCase()}</Text>
          {payoutDetails.method === 'paypal' ? (
            <Text><strong>PayPal Email:</strong> {payoutDetails.paypalEmail}</Text>
          ) : (
            <>
              <Text><strong>Bank Name:</strong> {payoutDetails.bankName}</Text>
              <Text><strong>Account Number:</strong> {payoutDetails.bankAccountNumber}</Text>
              <Text><strong>Account Name:</strong> {payoutDetails.bankAccountName}</Text>
            </>
          )}
        </Section>
        
        <Hr style={hr} />

        <Text style={footer}>
          Please process this payment and update the provider&apos;s records accordingly.
        </Text>
      </Container>
    </Body>
  </Html>
);

export default PayoutRequestEmail;

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

const infoSection = {
  backgroundColor: '#f8f9fa',
  padding: '10px 40px',
  border: '1px solid #e9ecef',
  borderRadius: '4px',
  margin: '20px 40px',
};

const detailsSection = {
  padding: '0 40px',
};

const messageHeading = {
  fontSize: '18px',
  fontWeight: '600',
  color: '#484848',
  padding: '0 40px',
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
