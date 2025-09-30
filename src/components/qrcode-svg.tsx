
"use client";

import { memo } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';

// Using a placeholder value for the QR code.
// In a real implementation, you would generate a unique payment request
// from your payment provider (e.g., PayMongo, Xendit) and encode that URL here.

export const QRCode = memo(function QRCode() {
  const t = useTranslations('QRCode');
  
  return (
    <Image 
        src="https://placehold.co/256x256.png" 
        alt={t('sampleQRCode')} 
        width={192} 
        height={192} 
        data-ai-hint="qr code"
        aria-label={t('sampleQRCode')}
    />
  );
});
