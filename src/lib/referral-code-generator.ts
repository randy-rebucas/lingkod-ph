/**
 * Shared utility for generating referral codes
 * Ensures consistent format across the application
 */

/**
 * Generate a unique referral code following the LP-XXXX-YYY-ZZZ format
 * @param userId - The user ID to generate the code for
 * @returns A referral code in the format LP-XXXX-YYY-ZZZ
 */
export const generateReferralCode = (userId: string): string => {
    // Create a more unique and readable referral code
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    // Format: LP-XXXX-YYY-ZZZ (where XXXX is uid part, YYY is timestamp part, ZZZ is random part)
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};

/**
 * Generate a partner-specific referral code following the LP-XXXX-YYY-ZZZ format
 * @param partnerId - The partner ID to generate the code for
 * @param partnerName - The partner name (optional, for additional uniqueness)
 * @returns A referral code in the format LP-XXXX-YYY-ZZZ
 */
export const generatePartnerReferralCode = (partnerId: string, _partnerName?: string): string => {
    // Use partner ID as the base, similar to user ID
    const timestamp = Date.now().toString(36).toUpperCase();
    const partnerPart = partnerId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    
    // Format: LP-XXXX-YYY-ZZZ (where XXXX is partner part, YYY is timestamp part, ZZZ is random part)
    return `LP-${partnerPart}-${timestamp.slice(-3)}-${randomPart}`;
};
