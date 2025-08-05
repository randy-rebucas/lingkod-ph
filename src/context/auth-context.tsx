
"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { onAuthStateChanged, User, signOut } from 'firebase/auth';
import { doc, getDoc, onSnapshot, Timestamp, collection, addDoc, serverTimestamp, getDocs, query, where, limit } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import { differenceInDays, differenceInHours } from 'date-fns';
import { useToast } from '@/hooks/use-toast';

type UserRole = 'client' | 'provider' | 'agency' | 'admin' | null;

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

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      setLoading(true);
      if (user) {
        setUser(user);
        const userDocRef = doc(db, 'users', user.uid);
        
        const unsubscribeDoc = onSnapshot(userDocRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            if (data.accountStatus === 'suspended') {
                signOut(auth);
                toast({ variant: 'destructive', title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.' });
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
                    createSingletonNotification(user.uid, 'renewal_reminder', `Your ${sub.planId} plan will renew in ${daysUntilRenewal} day${daysUntilRenewal > 1 ? 's' : ''}.`, '/subscription');
                }
            }
            
            // Check for upcoming appointments & completed jobs
            const bookingsQuery = query(
              collection(db, "bookings"),
              where(data.role === 'client' ? 'clientId' : 'providerId', '==', user.uid),
            );

            const unsubscribeBookings = onSnapshot(bookingsQuery, (snapshot) => {
                snapshot.forEach(doc => {
                    const booking = doc.data();
                    if(booking.status === 'Upcoming') {
                        const hoursUntilBooking = differenceInHours(booking.date.toDate(), new Date());
                        if (hoursUntilBooking > 0 && hoursUntilBooking <= 24) {
                             createSingletonNotification(user.uid, 'booking_update', `Your appointment for "${booking.serviceName}" is tomorrow.`, '/bookings');
                        }
                    } else if (booking.status === 'Completed' && data.role === 'client' && !booking.reviewId) {
                         createSingletonNotification(user.uid, 'new_review', `How was your service for "${booking.serviceName}"? Leave a review!`, '/bookings#completed');
                    }
                });
            });
            // This is a nested listener. For a production app, this should be managed more carefully.
          }
           setLoading(false);
        });

        return () => {
            unsubscribeDoc();
        };

      } else {
        setUser(null);
        setUserRole(null);
        setSubscription(null);
        setVerificationStatus(null);
        setLoading(false);
      }
    });

    return () => unsubscribeAuth();
  }, [toast]);

  return (
    <AuthContext.Provider value={{ user, loading, userRole, subscription, verificationStatus, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
