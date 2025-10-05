"use client";

import { useEffect } from 'react';

export function ScriptErrorBoundary({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    // Handle unhandled promise rejections that might be related to script injection
    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (event.reason && typeof event.reason === 'string' && event.reason.includes('injectScript')) {
        console.warn('Script injection promise rejection caught and handled:', event.reason);
        event.preventDefault();
      }
    };

    // Handle general errors
    const handleError = (event: ErrorEvent) => {
      if (event.message && event.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', event.message);
        event.preventDefault();
        return false;
      }
    };

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
