/**
 * Test script to verify injectScript error suppression is working
 * This can be called from the browser console to test the suppression
 */

export function testInjectScriptErrorSuppression() {
  if (typeof window === 'undefined') {
    console.log('❌ Test can only run in browser environment');
    return;
  }

  console.log('🧪 Testing injectScript error suppression...');

  // Test 1: Direct console.error with injectScript
  console.log('Test 1: Direct console.error with injectScript');
  console.error('injectScript error: {}');

  // Test 2: Console.error with createConsoleError
  console.log('Test 2: Console.error with createConsoleError');
  console.error('createConsoleError (file://test.js:1:1)');

  // Test 3: Console.error with node_modules reference
  console.log('Test 3: Console.error with node_modules reference');
  console.error('injectScript error at node_modules_0dc43d48._.js:1:1');

  // Test 4: Regular error (should not be suppressed)
  console.log('Test 4: Regular error (should NOT be suppressed)');
  console.error('This is a regular error that should appear');

  // Test 5: Unhandled promise rejection
  console.log('Test 5: Unhandled promise rejection');
  Promise.reject('injectScript error: {}');

  // Test 6: Global error event
  console.log('Test 6: Global error event');
  setTimeout(() => {
    const error = new Error('injectScript error: {}');
    window.dispatchEvent(new ErrorEvent('error', { error, message: error.message }));
  }, 100);

  console.log('✅ Test completed. Check console for results.');
}

// Make it available globally for testing
if (typeof window !== 'undefined') {
  (window as any).testInjectScriptErrorSuppression = testInjectScriptErrorSuppression;
  console.log('🧪 Test function available: window.testInjectScriptErrorSuppression()');
}
