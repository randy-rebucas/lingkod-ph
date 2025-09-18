
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, Timestamp, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { differenceInDays, differenceInHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'provider' | 'agency' | 'admin' | 'partner' | null;

type UserSubscription = {
    planId: 'starter' | 'pro' | 'elite' | 'free' | 'lite' | 'custom';
    status: 'active' | 'cancelled' | 'none' | 'pending';
    renewsOn: Timestamp | null;
} | null;

type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  subscription: UserSubscription;
  verificationStatus: VerificationStatus | null;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  subscription: null,
  verificationStatus: null,
  getIdToken: async () => null,
});

const createSingletonNotification = async (userId: string, type: string, message: string, link: string) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        // Check if a similar notification already exists to avoid duplicates
        const q = query(notificationsRef, 
            where("type", "==", type),
            where("message", "==", message),
            limit(1)
        );

        const existingNotifs = await getDocs(q);
        if (!existingNotifs.empty) {
            return; // Notification already exists
        }

        await addDoc(notificationsRef, {
            userId,
            message,
            link,
            type,
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error(`Error creating ${type} notification: `, error);
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [subscription, setSubscription] = useState<UserSubscription>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const { toast } = useToast();

  const handleSignOut = useCallback(() => {
    signOut(auth);
    setUser(null);
    setUserRole(null);
    setSubscription(null);
    setVerificationStatus(null);
  }, []);

  const getIdToken = useCallback(async (): Promise<string | null> => {
    if (!user) return null;
    try {
      return await user.getIdToken();
    } catch (error) {
      console.error('Error getting ID token:', error);
      return null;
    }
  }, [user]);

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (authUser) => {
      if (authUser) {
        setUser(authUser);
        const userDocRef = doc(db, 'users', authUser.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.accountStatus === 'suspended') {
                toast({ variant: 'destructive', title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.' });
                handleSignOut();
                return;
            }

            const sub = data.subscription || { planId: 'free', status: 'active', renewsOn: null };

            setUserRole(data.role || null);
            setSubscription(sub);
            setVerificationStatus(data.verification?.status || 'Unverified');
            
            // Check for subscription renewal
            if (sub?.status === 'active' && sub.renewsOn) {
                const daysUntilRenewal = differenceInDays(sub.renewsOn.toDate(), new Date());
                if (daysUntilRenewal > 0 && daysUntilRenewal <= 7) {
                    createSingletonNotification(authUser.uid, 'renewal_reminder', `Your ${sub.planId} plan will renew in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}.`, '/subscription');
                }
            }
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

  return (
    <AuthContext.Provider value={{ user, loading, userRole, subscription, verificationStatus, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
