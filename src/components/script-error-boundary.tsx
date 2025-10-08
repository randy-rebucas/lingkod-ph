"use client";

import { useEffect } from 'react';


export function ScriptErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle unhandled promise rejections that might be related to script injection
    const handleUnhandledRejection = (event: any) => {
      const promiseEvent = event as any;
      if (promiseEvent.reason && typeof promiseEvent.reason === 'string' && promiseEvent.reason.includes('injectScript')) {
        console.warn('Script injection promise rejection caught and handled:', promiseEvent.reason);
        promiseEvent.preventDefault();
      }
    };

    // Handle general errors
    const handleError = (event: any) => {
      const errorEvent = event as any;
      if (errorEvent.message && errorEvent.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', errorEvent.message);
        errorEvent.preventDefault();
        return false;
      }
    };

    // Note: Console error override removed due to compatibility issues
    // The error boundary will still catch and handle script injection errors
    // through the unhandledrejection and error event listeners above

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return <>{children}</>;
}
