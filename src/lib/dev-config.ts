/**
 * Development configuration for handling Turbopack and injectScript issues
 */

export const DEV_CONFIG = {
  // Suppress injectScript errors in development
  suppressInjectScriptErrors: process.env.NODE_ENV === 'development',
  
  // Enable detailed logging for debugging
  enableDetailedLogging: process.env.NODE_ENV === 'development',
  
  // Turbopack compatibility mode
  turbopackCompatibilityMode: process.env.NEXT_PUBLIC_TURBOPACK_COMPAT === 'true',
};

// Development-only error reporting
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  // Log when the app starts
  console.log('🔧 Development mode active');
  console.log('🛡️ injectScript error suppression:', DEV_CONFIG.suppressInjectScriptErrors);
  console.log('📊 Detailed logging:', DEV_CONFIG.enableDetailedLogging);
  console.log('⚡ Turbopack compatibility mode:', DEV_CONFIG.turbopackCompatibilityMode);
  
  // Add a global flag to help with debugging
  (window as any).__DEV_CONFIG__ = DEV_CONFIG;
}
