"use client";

import Script from 'next/script';
import { useEffect } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function GoogleAnalytics() {
  useEffect(() => {
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Analytics disabled in development mode');
      return;
    }

    // Add global error handler for script injection errors
    const handleScriptError = (event: any) => {
      const errorEvent = event as any;
      if (errorEvent.message && errorEvent.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', errorEvent.message);
        errorEvent.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleScriptError);
    
    return () => {
      window.removeEventListener('error', handleScriptError);
    };
  }, []);

  // Don't load analytics in development
  if (process.env.NODE_ENV === 'development') {
    return null;
  }

  return (
    <>
      <Script
        strategy="afterInteractive"
        src="https://www.googletagmanager.com/gtag/js?id=G-N6FJYX83QN"
        onError={(e) => {
          console.warn('Google Analytics script failed to load:', e);
        }}
        onLoad={() => {
          console.log('Google Analytics script loaded successfully');
        }}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N6FJYX83QN', {
                page_title: document.title,
                page_location: window.location.href,
                send_page_view: true
              });
              console.log('Google Analytics initialized successfully');
            } catch (error) {
              console.warn('Google Analytics initialization failed:', error);
            }
          `,
        }}
      />
    </>
  );
}
