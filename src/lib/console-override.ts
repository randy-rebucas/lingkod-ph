/**
 * Console override to suppress injectScript errors at the earliest possible moment
 * This runs before any other scripts to catch errors from Next.js internals
 */

if (typeof window !== 'undefined') {
  // Store original console methods immediately
  const originalConsole = {
    error: console.error,
    warn: console.warn,
    log: console.log,
    info: console.info,
    debug: console.debug
  };

  // Create a comprehensive error suppression function
  const shouldSuppressError = (message: string): boolean => {
    return (
      message.includes('injectScript error:') ||
      (message.includes('injectScript') && message.includes('{}')) ||
      message.includes('createConsoleError') ||
      message.includes('handleConsoleError') ||
      message.includes('node_modules_0dc43d48') ||
      (message.includes('injectScript') && message.includes('at createConsoleError')) ||
      (message.includes('injectScript') && message.includes('at handleConsoleError'))
    );
  };

  // Override console.error with comprehensive suppression
  console.error = (...args: any[]) => {
    const message = args.join(' ');
    
    if (shouldSuppressError(message)) {
      // Log a warning instead of the error
      originalConsole.warn('🚫 injectScript error suppressed:', message);
      return;
    }
    
    // Call original console.error for non-suppressed errors
    originalConsole.error.apply(console, args);
  };

  // Also override console.warn to catch any warnings that might be errors in disguise
  console.warn = (...args: any[]) => {
    const message = args.join(' ');
    
    if (shouldSuppressError(message)) {
      // Silently suppress
      return;
    }
    
    // Call original console.warn for non-suppressed warnings
    originalConsole.warn.apply(console, args);
  };

  // Global error handler for uncaught errors
  window.addEventListener('error', (event) => {
    if (event.message && shouldSuppressError(event.message)) {
      console.warn('🚫 Global error suppressed:', event.message);
      event.preventDefault();
      return false;
    }
  });

  // Global handler for unhandled promise rejections
  window.addEventListener('unhandledrejection', (event) => {
    const reason = event.reason;
    const message = typeof reason === 'string' ? reason : 
                   (reason && typeof reason === 'object' && 'message' in reason ? 
                    String(reason.message) : String(reason));
    
    if (shouldSuppressError(message)) {
      console.warn('🚫 Unhandled promise rejection suppressed:', message);
      event.preventDefault();
      return;
    }
  });

  // Log that the override is active
  originalConsole.log('🛡️ Console error suppression active for injectScript errors');
}
