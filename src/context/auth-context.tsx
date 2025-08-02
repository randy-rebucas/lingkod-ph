
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Timestamp, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { differenceInDays } from 'date-fns';

type UserRole = 'client' | 'provider' | 'agency' | null;

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
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  subscription: null,
  verificationStatus: null,
  setUser: () => {},
});

const createRenewalNotification = async (userId: string, planName: string, daysLeft: number) => {
    try {
        const notificationsRef = collection(db, `users/${userId}/notifications`);
        // Check if a similar notification already exists to avoid duplicates
        const q = query(notificationsRef, 
            where("type", "==", "renewal_reminder"),
            where("message", "==", `Your ${planName} plan will renew in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`)
        );

        const existingNotifs = await getDocs(q);
        if (!existingNotifs.empty) {
            return; // Notification already exists
        }

        await addDoc(notificationsRef, {
            userId,
            message: `Your ${planName} plan will renew in ${daysLeft} day${daysLeft > 1 ? 's' : ''}.`,
            link: '/subscription',
            type: 'renewal_reminder',
            read: false,
            createdAt: serverTimestamp(),
        });
    } catch (error) {
        console.error("Error creating renewal notification: ", error);
    }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [subscription, setSubscription] = useState<UserSubscription>(null);
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);


  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();
            const sub = data.subscription || { planId: 'free', status: 'active', renewsOn: null };

            setUserRole(data.role || null);
            setSubscription(sub);
            setVerificationStatus(data.verification?.status || 'Unverified');
            
            // Check for subscription renewal
            if (sub?.status === 'active' && sub.renewsOn) {
                const daysUntilRenewal = differenceInDays(sub.renewsOn.toDate(), new Date());
                if (daysUntilRenewal > 0 && daysUntilRenewal <= 7) {
                    createRenewalNotification(user.uid, sub.planId, daysUntilRenewal);
                }
            }
          }
           setLoading(false);
        });

        return () => unsubscribeDoc();
      } else {
        setUser(null);
        setUserRole(null);
        setSubscription(null);
        setVerificationStatus(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, subscription, verificationStatus, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
