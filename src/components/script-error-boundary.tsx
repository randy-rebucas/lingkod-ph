"use client";

import { useEffect, useState } from 'react';

export function ScriptErrorBoundary({ children }: { children: React.ReactNode }) {
  const [errorCount, setErrorCount] = useState(0);

  useEffect(() => {
    // Handle unhandled promise rejections that might be related to script injection
    const handleUnhandledRejection = (event: any) => {
      const promiseEvent = event as any;
      if (promiseEvent.reason && typeof promiseEvent.reason === 'string' && promiseEvent.reason.includes('injectScript')) {
        console.warn('Script injection promise rejection caught and handled:', promiseEvent.reason);
        setErrorCount(prev => prev + 1);
        promiseEvent.preventDefault();
      }
    };

    // Handle general errors
    const handleError = (event: any) => {
      const errorEvent = event as any;
      if (errorEvent.message && errorEvent.message.includes('injectScript')) {
        console.warn('Script injection error caught and handled:', errorEvent.message);
        setErrorCount(prev => prev + 1);
        errorEvent.preventDefault();
        return false;
      }
    };

    // Handle script loading errors
    const handleScriptError = (event: any) => {
      const scriptEvent = event as any;
      if (scriptEvent.target && scriptEvent.target.tagName === 'SCRIPT') {
        console.warn('Script loading error caught and handled:', scriptEvent.target.src);
        setErrorCount(prev => prev + 1);
        event.preventDefault();
        return false;
      }
    };

    // Add event listeners
    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);
    window.addEventListener('error', handleScriptError, true); // Use capture phase

    // Cleanup
    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
      window.removeEventListener('error', handleScriptError, true);
    };
  }, []);

  // Log error count for debugging
  useEffect(() => {
    if (errorCount > 0) {
      console.log(`Script error boundary has caught ${errorCount} script-related errors`);
    }
  }, [errorCount]);

  return <>{children}</>;
}
