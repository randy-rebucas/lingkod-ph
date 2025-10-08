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

    // Handle unhandled promise rejections that might be related to script injection
    const handleUnhandledRejection = (event: any) => {
      const promiseEvent = event as any;
      if (promiseEvent.reason && typeof promiseEvent.reason === 'string' && promiseEvent.reason.includes('injectScript')) {
        console.warn('Script injection promise rejection caught and handled:', promiseEvent.reason);
        promiseEvent.preventDefault();
      }
    };

    // Handle general errors that might be related to script injection
    const handleGeneralError = (event: any) => {
      const errorEvent = event as any;
      if (errorEvent.error && errorEvent.error.message && errorEvent.error.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', errorEvent.error.message);
        errorEvent.preventDefault();
        return false;
      }
    };

    window.addEventListener('error', handleScriptError);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleGeneralError);
    
    return () => {
      window.removeEventListener('error', handleScriptError);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleGeneralError);
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
          // Suppress injectScript errors specifically
          if (e && typeof e === 'object' && 'message' in e && 
              typeof e.message === 'string' && e.message.includes('injectScript')) {
            console.warn('injectScript error suppressed in Google Analytics:', e.message);
            return;
          }
        }}
        onLoad={() => {
          console.log('Google Analytics script loaded successfully');
        }}
      />
      <Script
        id="gtag-init"
        strategy="afterInteractive"
        onError={(e) => {
          console.warn('Google Analytics initialization script failed:', e);
          // Suppress injectScript errors specifically
          if (e && typeof e === 'object' && 'message' in e && 
              typeof e.message === 'string' && e.message.includes('injectScript')) {
            console.warn('injectScript error suppressed in Google Analytics init:', e.message);
            return;
          }
        }}
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
              // Suppress injectScript errors specifically
              if (error.message && error.message.includes('injectScript')) {
                console.warn('injectScript error suppressed:', error.message);
                return;
              }
              throw error;
            }
          `,
        }}
      />
    </>
  );
}
