
"use client";

import { QRCodeSVG } from 'qrcode.react';

// Using a placeholder value for the QR code.
// In a real implementation, you would generate a unique payment request
// from your payment provider (e.g., PayMongo, Xendit) and encode that URL here.
const placeholderPaymentUrl = "https://localpro.ph/pay?tx=12345&amount=100";

export function QRCode() {
  return (
    <QRCodeSVG
      value={placeholderPaymentUrl}
      size={192} // 192px fits well in the 208px container (w-52) with p-2 padding
      bgColor={"#ffffff"}
      fgColor={"#000000"}
      level={"L"}
      includeMargin={false}
      className="w-full h-full"
    />
  );
}
