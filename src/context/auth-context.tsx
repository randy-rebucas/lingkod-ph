
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, Timestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';

type UserRole = 'client' | 'provider' | 'agency' | null;

type UserSubscription = {
    planId: 'starter' | 'pro' | 'elite' | 'free';
    status: 'active' | 'cancelled' | 'none';
    renewsOn: Timestamp | null;
} | null;

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  subscription: UserSubscription;
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
  subscription: null,
  setUser: () => {},
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<UserRole>(null);
  const [subscription, setSubscription] = useState<UserSubscription>(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserRole(data.role || null);
          setSubscription(data.subscription || { planId: 'free', status: 'active', renewsOn: null });
        }
      } else {
        setUser(null);
        setUserRole(null);
        setSubscription(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, subscription, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
