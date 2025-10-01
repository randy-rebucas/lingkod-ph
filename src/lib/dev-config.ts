// Development configuration for when Firebase is not available
export const DEV_CONFIG = {
  // Set to true to enable development mode without Firebase
  ENABLE_DEV_MODE: process.env.NODE_ENV === 'development' && !process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  
  // Mock user data for development
  MOCK_USER: {
    uid: 'dev-user-123',
    email: 'dev@example.com',
    role: 'client' as const,
    verificationStatus: 'Unverified' as const,
  }
};

export function isDevMode(): boolean {
  return DEV_CONFIG.ENABLE_DEV_MODE;
}
