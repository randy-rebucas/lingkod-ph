
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import { getAuthInstance, getDb   } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/hooks/use-error-handler';
import { isDevMode, DEV_CONFIG } from '@/lib/dev-config';

type UserRole = 'client' | 'provider' | 'agency' | 'admin' | 'partner' | 'driver' | null;

type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

interface PartnerData {
  company: string;
  position: string;
  businessType: string;
  businessSize: string;
  website: string;
  location: string;
  description: string;
  partnershipType: string;
  targetAudience: string[];
  expectedReferrals: string;
  marketingChannels: string[];
  experience: string;
  motivation: string;
  goals: string;
  additionalInfo: string;
  status: 'active' | 'inactive' | 'suspended';
  totalReferrals?: number;
  totalCommission?: number;
  approvedAt?: any;
  approvedBy?: string;
  statusUpdatedAt?: any;
  statusUpdatedBy?: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  verificationStatus: VerificationStatus | null;
  partnerStatus: string | null;
  partnerData: PartnerData | null;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  verificationStatus: null,
  partnerStatus: null,
  partnerData: null,
  getIdToken: async () => null,
});

// const createSingletonNotification = async (userId: string, type: string, message: string, link: string) => {
//     if (!getDb()) {
//         console.warn('Firebase not initialized, skipping notification creation');
//         return;
//     }
//     
//     try {
//         const notificationsRef = collection(getDb(), `users/${userId}/notifications`);
//         // Check if a similar notification already exists to avoid duplicates
//         const q = query(notificationsRef, 
//             where("type", "==", type),
//             where("message", "==", message),
//             limit(1)
//         );

//         const existingNotifs = await getDocs(q);
//         if (!existingNotifs.empty) {
//             return; // Notification already exists
//         }

//         await addDoc(notificationsRef, {
//             userId,
//             message,
//             link,
//             type,
//             read: false,
//             createdAt: serverTimestamp(),
//         });
//     } catch (error) {
//         console.error(`Error creating ${type} notification: `, error);
//     }
// };

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const [partnerStatus, setPartnerStatus] = useState<string | null>(null);
  const [partnerData, setPartnerData] = useState<PartnerData | null>(null);
  const [hasRedirected, setHasRedirected] = useState(false);
  const { toast } = useToast();
  const { handleError } = useErrorHandler();

  const handleSignOut = useCallback(() => {
    const authInstance = getAuthInstance();
    if (authInstance) {
      signOut(authInstance);
    }
    setUser(null);
    setUserRole(null);
    setVerificationStatus(null);
    setPartnerStatus(null);
    setPartnerData(null);
    setHasRedirected(false);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (isDevMode()) {
      return 'dev-token-123';
    }
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      handleError(error, 'get ID token');
      return null;
    }
  }, [user, handleError]);

  useEffect(() => {
    // Check if we're in development mode without Firebase
    if (isDevMode()) {
      console.log('Running in development mode without Firebase');
      setLoading(false);
      return;
    }

    const authInstance = getAuthInstance();
    const dbInstance = getDb();
    
    if (!authInstance || !dbInstance) {
      console.warn('Firebase not initialized, skipping auth state listener');
      setLoading(false);
      return;
    }

    const unsubscribeAuth = onAuthStateChanged(authInstance, (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(dbInstance, 'users', authUser.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.accountStatus === 'suspended') {
                toast({ variant: 'destructive', title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.' });
                handleSignOut();
                return;
            }

            // Check partner status for partners
            if (data.role === 'partner') {
              const partnerStatus = data.accountStatus || 'pending_approval';
              setPartnerStatus(partnerStatus);
              setPartnerData(data.partnerData || null);
              
              // Only redirect if not already on the unauthorized page and not in a loading state
              if (partnerStatus === 'pending_approval' && 
                  !hasRedirected &&
                  typeof window !== 'undefined' && 
                  !window.location.pathname.includes('/partners/unauthorized') &&
                  !window.location.pathname.includes('/partners/apply')) {
                setHasRedirected(true);
                // Use setTimeout to avoid redirect during initial load
                setTimeout(() => {
                  if (typeof window !== 'undefined' && !window.location.pathname.includes('/partners/unauthorized')) {
                    window.location.href = '/partners/unauthorized';
                  }
                }, 100);
                return;
              }
            } else {
              setPartnerStatus(null);
              setPartnerData(null);
              setHasRedirected(false);
            }

            setUserRole(data.role || null);
            setVerificationStatus(data.verification?.status || 'Unverified');
          }
           setLoading(false);
        });

        return () => unsubscribeDoc();

      } else {
        handleSignOut();
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [toast, handleSignOut]);

  // Memoize context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    user,
    loading,
    userRole,
    verificationStatus,
    partnerStatus,
    partnerData,
    getIdToken
  }), [user, loading, userRole, verificationStatus, partnerStatus, partnerData, getIdToken]);

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
