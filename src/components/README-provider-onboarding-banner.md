# Provider Onboarding Banner Component

## Overview
The `ProviderOnboardingBanner` component is a promotional banner designed specifically for provider accounts to guide them through the platform basics. It's inspired by modern onboarding patterns and provides a visually appealing way to introduce new providers to key features.

## Features
- **Dismissible**: Users can close the banner, and it won't show again (stored in localStorage)
- **Responsive Design**: Adapts to different screen sizes
- **Internationalization**: Supports both English and Tagalog translations
- **Modern UI**: Dark theme with gradient backgrounds and smooth animations
- **Call-to-Action**: Direct link to profile setup/exploration

## Design Elements
- **Left Section**: Animated character illustration with laptop and sparkles
- **Middle Section**: Educational content about getting started
- **Right Section**: Call-to-action button
- **Top Right**: Help and close buttons

## Usage
The component is automatically integrated into the provider dashboard and will only show for users with the 'provider' role who haven't dismissed it before.

## Translation Keys
- `learnHowToGetStarted`: Small uppercase text
- `providerGuideTitle`: Main heading
- `providerGuideDescription`: Descriptive text
- `exploreProviderGuide`: Button text
- `help`: Help button aria-label
- `close`: Close button aria-label

## Styling
- Uses Tailwind CSS classes
- Dark gradient background (slate-800 to slate-900)
- White text with proper contrast
- Rounded corners and shadow effects
- Hover states for interactive elements

## Dependencies
- React hooks (useState, useEffect)
- Next.js Link component
- Lucide React icons
- Next-intl for translations
- Tailwind CSS for styling
