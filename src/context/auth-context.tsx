
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

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
        
        const unsubscribeDoc = onSnapshot(userDocRef, (doc) => {
          if (doc.exists()) {
            const data = doc.data();
            setUserRole(data.role || null);
            setSubscription(data.subscription || { planId: 'free', status: 'active', renewsOn: null });
            setVerificationStatus(data.verification?.status || 'Unverified');
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
