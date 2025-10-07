"use client";

import Script from 'next/script';
import { useEffect, useState } from 'react';

declare global {
  interface Window {
    gtag: (...args: any[]) => void;
    dataLayer: any[];
  }
}

export function GoogleAnalytics() {
  const [isClient, setIsClient] = useState(false);
  const [scriptError, setScriptError] = useState(false);

  useEffect(() => {
    setIsClient(true);
    
    // Check if we're in development mode
    if (process.env.NODE_ENV === 'development') {
      console.log('Google Analytics disabled in development mode');
      return;
    }

    // Enhanced error handler for script injection errors
    const handleScriptError = (event: any) => {
      const errorEvent = event as any;
      if (errorEvent.message && errorEvent.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', errorEvent.message);
        setScriptError(true);
        errorEvent.preventDefault();
        return false;
      }
    };

    // Handle unhandled promise rejections
    const handleUnhandledRejection = (event: any) => {
      const promiseEvent = event as any;
      if (promiseEvent.reason && typeof promiseEvent.reason === 'string' && promiseEvent.reason.includes('injectScript')) {
        console.warn('Script injection promise rejection caught and handled:', promiseEvent.reason);
        setScriptError(true);
        promiseEvent.preventDefault();
      }
    };

    window.addEventListener('error', handleScriptError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    
    return () => {
      window.removeEventListener('error', handleScriptError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  // Don't load analytics in development or if there's a script error
  if (process.env.NODE_ENV === 'development' || !isClient || scriptError) {
    return null;
  }

  return (
    <>
      <Script
        strategy="lazyOnload"
        src="https://www.googletagmanager.com/gtag/js?id=G-N6FJYX83QN"
        onError={(e) => {
          console.warn('Google Analytics script failed to load:', e);
          setScriptError(true);
        }}
        onLoad={() => {
          console.log('Google Analytics script loaded successfully');
        }}
      />
      <Script
        id="gtag-init"
        strategy="lazyOnload"
        dangerouslySetInnerHTML={{
          __html: `
            try {
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N6FJYX83QN', {
                page_title: document.title,
                page_location: window.location.href,
                send_page_view: true,
                anonymize_ip: true,
                allow_google_signals: false
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
