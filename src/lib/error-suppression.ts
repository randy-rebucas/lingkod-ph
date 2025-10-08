/**
 * Global error suppression for injectScript errors in Next.js 15.5.4 with Turbopack
 * This addresses compatibility issues between third-party libraries and Turbopack
 */

export function setupInjectScriptErrorSuppression() {
  if (typeof window === 'undefined') return;

  // Handle unhandled promise rejections
  const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
    const reason = event.reason;
    
    // Check if the error is related to injectScript
    if (
      (typeof reason === 'string' && reason.includes('injectScript')) ||
      (reason && typeof reason === 'object' && 'message' in reason && 
       typeof reason.message === 'string' && reason.message.includes('injectScript'))
    ) {
      console.warn('injectScript promise rejection suppressed:', reason);
      event.preventDefault();
      return;
    }
  };

  // Handle general errors
  const handleError = (event: ErrorEvent) => {
    if (event.message && event.message.includes('injectScript')) {
      console.warn('injectScript error suppressed:', event.message);
      event.preventDefault();
      return false;
    }
  };

  // Enhanced console error handling for Next.js internal errors
  const originalConsoleError = console.error;
  console.error = (...args) => {
    const message = args.join(' ');
    
    // Suppress injectScript errors specifically
    if (message.includes('injectScript error:')) {
      console.warn('injectScript console error suppressed:', message);
      return;
    }
    
    // Suppress Next.js internal createConsoleError for injectScript
    if (message.includes('createConsoleError') && message.includes('injectScript')) {
      console.warn('Next.js createConsoleError for injectScript suppressed:', message);
      return;
    }
    
    // Suppress specific module errors
    if (message.includes('node_modules_0dc43d48') && message.includes('injectScript')) {
      console.warn('Module-specific injectScript error suppressed:', message);
      return;
    }
    
    originalConsoleError.apply(console, args);
  };

  // Override console.error at the global level for more comprehensive coverage
  if (typeof window !== 'undefined') {
    // Store original console methods
    const originalMethods = {
      error: console.error,
      warn: console.warn,
      log: console.log
    };

    // Enhanced error suppression
    const suppressInjectScriptErrors = (originalMethod: typeof console.error) => {
      return (...args: any[]) => {
        const message = args.join(' ');
        
        // Check for injectScript errors in various formats
        if (
          message.includes('injectScript error:') ||
          (message.includes('injectScript') && message.includes('{}')) ||
          (message.includes('createConsoleError') && message.includes('injectScript')) ||
          (message.includes('node_modules_') && message.includes('injectScript'))
        ) {
          console.warn('injectScript error suppressed globally:', message);
          return;
        }
        
        originalMethod.apply(console, args);
      };
    };

    // Apply suppression
    console.error = suppressInjectScriptErrors(originalMethods.error);
  }

  // Add event listeners
  window.addEventListener('unhandledrejection', handleUnhandledRejection);
  window.addEventListener('error', handleError);

  // Return cleanup function
  return () => {
    window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    window.removeEventListener('error', handleError);
  };
}

// Auto-setup in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setupInjectScriptErrorSuppression();
}
