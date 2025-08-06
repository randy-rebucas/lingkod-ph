
'use server';

import { db, auth } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
} from 'firebase/firestore';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { z } from 'zod';

type UserStatus = 'active' | 'pending_approval' | 'suspended';

const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};

export async function handleUserStatusUpdate(
  userId: string,
  status: UserStatus
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { accountStatus: status });

    return {
      error: null,
      message: `User status updated to ${status.replace('_', ' ')}.`,
    };
  } catch (e: any) {
    console.error('Error updating user status: ', e);
    return { error: e.message, message: 'Failed to update user status.' };
  }
}

export async function handleDeleteUser(userId: string) {
    try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);
        // Note: This does not delete the user from Firebase Auth.
        // That requires admin SDK privileges on the backend.
        return {
            error: null,
            message: 'User record has been deleted successfully from the database.',
        };
    } catch (e: any) {
        console.error('Error deleting user: ', e);
        return { error: e.message, message: 'Failed to delete user record.' };
    }
}

const createUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email."),
  password: z.string().min(6, "Password must be at least 6 characters."),
  role: z.enum(['client', 'provider', 'agency']),
  phone: z.string().optional(),
});

export async function handleCreateUser(data: z.infer<typeof createUserSchema>) {
    const validatedFields = createUserSchema.safeParse(data);
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(', '),
            message: 'Validation failed.'
        };
    }
    
    const { name, email, password, role, phone } = validatedFields.data;

    try {
        // This action uses the client-side Admin Auth context which is initialized when an admin is logged in.
        // It's a temporary workaround. For production, a dedicated backend function with Admin SDK is recommended.
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        await updateProfile(user, { displayName: name });
        
        const newReferralCode = generateReferralCode(user.uid);
        const accountStatus = (role === 'provider' || role === 'agency') ? 'pending_approval' : 'active';
        
        const userData: any = {
            uid: user.uid,
            email: user.email,
            displayName: name,
            phone: phone || null,
            role: role,
            createdAt: serverTimestamp(),
            loyaltyPoints: 0,
            referralCode: newReferralCode,
            accountStatus: accountStatus,
        };

        if (role === 'provider') {
            userData.agencyId = null;
        }

        await setDoc(doc(db, "users", user.uid), userData);

        return { error: null, message: `User ${name} created successfully as a ${role}.` };

    } catch (e: any) {
         console.error('Error creating user: ', e);
         let errorMessage = e.message;
         if (e.code === 'auth/email-already-in-use') {
             errorMessage = "This email address is already in use by another account.";
         }
        return { error: errorMessage, message: 'Failed to create user.' };
    }
}

const updateUserSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  role: z.enum(['client', 'provider', 'agency']),
  phone: z.string().optional(),
});


export async function handleUpdateUser(userId: string, data: z.infer<typeof updateUserSchema>) {
    const validatedFields = updateUserSchema.safeParse(data);
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(', '),
            message: 'Validation failed.'
        };
    }

    try {
        const userRef = doc(db, 'users', userId);
        await updateDoc(userRef, {
            displayName: validatedFields.data.name,
            role: validatedFields.data.role,
            phone: validatedFields.data.phone || null,
        });
        return { error: null, message: 'User updated successfully.' };
    } catch (e: any) {
        console.error('Error updating user: ', e);
        return { error: e.message, message: 'Failed to update user.' };
    }
}
