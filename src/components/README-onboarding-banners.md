# Onboarding Banner Components

## Overview
This collection of onboarding banner components provides role-specific guidance for different user types on the Lingkod platform. Each banner is designed to help users understand how to get started with their specific role and features.

## Components

### 1. ProviderOnboardingBanner
**File:** `provider-onboarding-banner.tsx`
**Target Users:** Service providers
**Theme:** Dark slate gradient (slate-800 to slate-900)
**Illustration:** Character with laptop and sparkles
**Call-to-Action:** Links to profile setup
**Key Features:**
- Profile setup guidance
- Booking management tips
- Business growth advice

### 2. ClientOnboardingBanner
**File:** `client-onboarding-banner.tsx`
**Target Users:** Service clients
**Theme:** Blue gradient (blue-800 to indigo-900)
**Illustration:** Character with search, heart, and star icons
**Call-to-Action:** Links to dashboard
**Key Features:**
- Service discovery guidance
- Booking process explanation
- Request management tips

### 3. AgencyOnboardingBanner
**File:** `agency-onboarding-banner.tsx`
**Target Users:** Agency managers
**Theme:** Purple gradient (purple-800 to violet-900)
**Illustration:** Building with team icons and growth indicators
**Call-to-Action:** Links to provider management
**Key Features:**
- Team management guidance
- Performance tracking tips
- Agency growth strategies

### 4. PartnerOnboardingBanner
**File:** `partner-onboarding-banner.tsx`
**Target Users:** Referral partners
**Theme:** Emerald gradient (emerald-800 to teal-900)
**Illustration:** Character with share, dollar, and target icons
**Call-to-Action:** Links to referral tracking page
**Key Features:**
- Referral program guidance
- Commission tracking tips
- Network growth strategies

## Common Features

### Dismissible Functionality
- Each banner can be dismissed by clicking the X button
- Dismissal state is stored in localStorage
- Once dismissed, the banner won't show again for that user

### Responsive Design
- Adapts to different screen sizes
- Mobile-friendly layout
- Touch-friendly buttons and interactions

### Internationalization
- Supports both English and Tagalog
- All text content is translatable
- Consistent translation key structure

### Accessibility
- Proper ARIA labels for buttons
- Keyboard navigation support
- Screen reader friendly

## Integration Points

### Dashboard Integration
- **Provider Banner:** Integrated into main dashboard for provider role
- **Client Banner:** Integrated into main dashboard for client role
- **Agency Banner:** Integrated into main dashboard for agency role
- **Partner Banner:** Integrated into partner dashboard

### Translation Keys Structure
Each banner follows this translation key pattern:
```json
{
  "BannerName": {
    "learnHowToGetStarted": "Learn how to get started",
    "guideTitle": "Role 101 will guide you through...",
    "guideDescription": "Description of key features...",
    "exploreGuide": "Explore Role 101",
    "help": "Help",
    "close": "Close"
  }
}
```

## Styling Guidelines

### Color Schemes
- **Provider:** Slate (professional, business-focused)
- **Client:** Blue (trust, reliability)
- **Agency:** Purple (premium, team-oriented)
- **Partner:** Emerald (growth, success)

### Typography
- Consistent font hierarchy
- Proper contrast ratios
- Readable text sizes

### Animations
- Subtle hover effects
- Smooth transitions
- Non-intrusive animations

## Usage Examples

### Basic Implementation
```tsx
import ClientOnboardingBanner from "@/components/client-onboarding-banner";

function ClientDashboard() {
  return (
    <div>
      <ClientOnboardingBanner />
      {/* Rest of dashboard content */}
    </div>
  );
}
```

### Conditional Rendering
```tsx
import { useAuth } from "@/context/auth-context";
import ProviderOnboardingBanner from "@/components/provider-onboarding-banner";
import ClientOnboardingBanner from "@/components/client-onboarding-banner";

function Dashboard() {
  const { userRole } = useAuth();
  
  return (
    <div>
      {userRole === 'provider' && <ProviderOnboardingBanner />}
      {userRole === 'client' && <ClientOnboardingBanner />}
      {/* Rest of content */}
    </div>
  );
}
```

## Customization

### Adding New Banners
1. Create new component following the existing pattern
2. Add unique localStorage key for dismissal
3. Create appropriate illustration and color scheme
4. Add translation keys for both languages
5. Integrate into appropriate dashboard

### Modifying Existing Banners
1. Update component content and styling
2. Update translation keys if needed
3. Test across different screen sizes
4. Verify accessibility features

## Performance Considerations
- Lightweight components with minimal dependencies
- Efficient localStorage usage
- No unnecessary re-renders
- Optimized for mobile devices

## Browser Support
- Modern browsers (Chrome, Firefox, Safari, Edge)
- Mobile browsers (iOS Safari, Chrome Mobile)
- Responsive design for all screen sizes
