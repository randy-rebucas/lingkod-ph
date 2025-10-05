import { render, screen } from '@testing-library/react';
import PartnerOnboardingBanner from '../partner-onboarding-banner';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock next-intl
jest.mock('next-intl', () => ({
  useTranslations: () => (key: string) => {
    const translations: Record<string, string> = {
      'learnHowToGetStarted': 'Learn how to get started',
      'partnerGuideTitle': 'Partner 101 will guide you through referral programs and commissions.',
      'partnerGuideDescription': 'Track referrals, earn commissions, and grow your network.',
      'explorePartnerGuide': 'Start Tracking Referrals',
      'help': 'Help',
      'close': 'Close'
    };
    return translations[key] || key;
  }
}));

describe('PartnerOnboardingBanner', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders when not dismissed', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<PartnerOnboardingBanner />);
    
    expect(screen.getByText('Learn how to get started')).toBeInTheDocument();
    expect(screen.getByText('Partner 101 will guide you through referral programs and commissions.')).toBeInTheDocument();
    expect(screen.getByText('Start Tracking Referrals')).toBeInTheDocument();
  });

  it('does not render when dismissed', () => {
    localStorageMock.getItem.mockReturnValue('true');
    
    render(<PartnerOnboardingBanner />);
    
    expect(screen.queryByText('Learn how to get started')).not.toBeInTheDocument();
  });

  it('has correct link to referral tracking', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    render(<PartnerOnboardingBanner />);
    
    const link = screen.getByRole('link', { name: /start tracking referrals/i });
    expect(link).toHaveAttribute('href', '/partners/referral-tracking');
  });
});
