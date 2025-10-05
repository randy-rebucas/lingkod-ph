// Debug script for Partner Onboarding Banner
console.log('=== Partner Banner Debug ===');

// Check localStorage
const dismissed = localStorage.getItem('partner_onboarding_banner_dismissed');
console.log('Banner dismissed:', dismissed);

// Check if we're on the right page
const currentPath = window.location.pathname;
console.log('Current path:', currentPath);

// Check if we should be on partner dashboard
if (currentPath.includes('/partners/')) {
  console.log('✅ On partner page');
} else {
  console.log('❌ Not on partner page - current path:', currentPath);
}

// Instructions for testing
console.log('\n=== Testing Instructions ===');
console.log('1. Make sure you are logged in as a partner account');
console.log('2. Navigate to /partners/dashboard');
console.log('3. Check browser console for debug logs');
console.log('4. If banner is dismissed, run: localStorage.removeItem("partner_onboarding_banner_dismissed")');
console.log('5. Refresh the page');

// Reset function
window.resetPartnerBanner = function() {
  localStorage.removeItem('partner_onboarding_banner_dismissed');
  console.log('✅ Partner banner reset - refresh the page');
};

console.log('\nTo reset banner, run: resetPartnerBanner()');
