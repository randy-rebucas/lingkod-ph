
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, onSnapshot, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'provider' | 'agency' | 'admin' | 'partner' | null;


type VerificationStatus = 'Unverified' | 'Pending' | 'Verified' | 'Rejected';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  userRole: UserRole;
  verificationStatus: VerificationStatus | null;
  getIdToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  userRole: null,
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
  const [verificationStatus, setVerificationStatus] = useState<VerificationStatus | null>(null);
  const { toast } = useToast();

  const handleSignOut = useCallback(() => {
    signOut(auth);
    setUser(null);
    setUserRole(null);
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

  return (
    <AuthContext.Provider value={{ user, loading, userRole, verificationStatus, getIdToken }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
