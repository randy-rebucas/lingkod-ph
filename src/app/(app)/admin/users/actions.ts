
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  updateDoc,
  deleteDoc,
  setDoc,
  serverTimestamp,
  getDoc,
} from 'firebase/firestore';
import { getAuth, createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { z } from 'zod';
import { logAdminAction } from '@/lib/audit-logger';
import { Resend } from 'resend';
import DirectMessageEmail from '@/emails/direct-message-email';

type UserStatus = 'active' | 'pending_approval' | 'suspended';
type Actor = {
    id: string;
    name: string | null;
};

const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};

export async function handleUserStatusUpdate(
  userId: string,
  status: UserStatus,
  actor: Actor
) {
  try {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, { accountStatus: status });

    await logAdminAction({
        actor: { ...actor, role: 'admin' },
        action: 'USER_STATUS_UPDATED',
        details: { targetUserId: userId, newStatus: status }
    });

    return {
      error: null,
      message: `User status updated to ${status.replace('_', ' ')}.`,
    };
  } catch (e: any) {
    console.error('Error updating user status: ', e);
    return { error: e.message, message: 'Failed to update user status.' };
  }
}

export async function handleDeleteUser(userId: string, actor: Actor) {
    try {
        const userRef = doc(db, 'users', userId);
        await deleteDoc(userRef);

         await logAdminAction({
            actor: { ...actor, role: 'admin' },
            action: 'USER_DELETED',
            details: { targetUserId: userId }
        });

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
  role: z.enum(['client', 'provider', 'agency', 'partner']),
  phone: z.string().optional(),
});

export async function handleCreateUser(data: z.infer<typeof createUserSchema>, actor: Actor) {
    const validatedFields = createUserSchema.safeParse(data);
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(', '),
            message: 'Validation failed.'
        };
    }
    
    const { name, email, password, role, phone } = validatedFields.data;

    try {
        // This action can't use the regular client-side `auth` object because you can't create users on the client
        // after the first one. This is a placeholder for a proper Admin SDK-backed server function.
        // For the purpose of this prototype, we assume the initial admin setup is a special case.
        // A real implementation would require a backend function with admin privileges.
        return { error: "User creation from the admin panel requires a backend with Admin SDK privileges, which is not implemented in this prototype.", message: 'Feature not available.' };

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
  role: z.enum(['client', 'provider', 'agency', 'partner']),
  phone: z.string().optional(),
});


export async function handleUpdateUser(userId: string, data: z.infer<typeof updateUserSchema>, actor: Actor) {
    const validatedFields = updateUserSchema.safeParse(data);
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(', '),
            message: 'Validation failed.'
        };
    }

    try {
        const userRef = doc(db, 'users', userId);
        const updateData = {
            displayName: validatedFields.data.name,
            role: validatedFields.data.role,
            phone: validatedFields.data.phone || null,
        };
        await updateDoc(userRef, updateData);

        await logAdminAction({
            actor: { ...actor, role: 'admin' },
            action: 'USER_UPDATED',
            details: { targetUserId: userId, changes: updateData }
        });

        return { error: null, message: 'User updated successfully.' };
    } catch (e: any) {
        console.error('Error updating user: ', e);
        return { error: e.message, message: 'Failed to update user.' };
    }
}

const sendDirectEmailSchema = z.object({
    targetUserId: z.string().min(1),
    subject: z.string().min(3, "Subject must be at least 3 characters."),
    message: z.string().min(10, "Message must be at least 10 characters."),
});

export async function handleSendDirectEmail(targetUserId: string, subject: string, message: string, actor: Actor) {
    const validatedFields = sendDirectEmailSchema.safeParse({ targetUserId, subject, message });
    if (!validatedFields.success) {
        return {
            error: validatedFields.error.errors.map(e => e.message).join(', '),
            message: 'Validation failed.'
        };
    }

    try {
        const userRef = doc(db, 'users', targetUserId);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
            return { error: "User not found.", message: "The target user does not exist." };
        }

        const targetUserEmail = userSnap.data().email;
        const targetUserName = userSnap.data().displayName;
        
        const resend = new Resend(process.env.RESEND_API_KEY);
        await resend.emails.send({
            from: `LocalPro Admin <onboarding@resend.dev>`,
            to: targetUserEmail,
            subject: subject,
            react: DirectMessageEmail({
                userName: targetUserName,
                subject: subject,
                message: message,
            }),
        });

        return { error: null, message: `Email successfully sent to ${targetUserName}.` };

    } catch (e: any) {
        console.error('Error sending direct email: ', e);
        return { error: e.message, message: 'Failed to send email.' };
    }
}

    