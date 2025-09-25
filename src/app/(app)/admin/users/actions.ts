
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
import { adminAuth } from '@/lib/firebase-admin';
import { z } from 'zod';
import { AuditLogger } from '@/lib/audit-logger';
import { Resend } from 'resend';
import DirectMessageEmail from '@/emails/direct-message-email';

type UserStatus = 'active' | 'pending_approval' | 'suspended';
type Actor = {
    id: string;
    name: string | null;
    role: string;
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

    await AuditLogger.getInstance().logAction(
        actor.id,
        'users',
        'USER_STATUS_UPDATED',
        { targetUserId: userId, newStatus: status, actorRole: 'admin' }
    );

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

         await AuditLogger.getInstance().logAction(
            actor.id,
            'users',
            'USER_DELETED',
            { targetUserId: userId, actorRole: 'admin' }
        );

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
        // Use Firebase Admin SDK to create user
        const userRecord = await adminAuth.createUser({
            email: email,
            password: password,
            displayName: name,
        });

        // Generate referral code for the new user
        const newReferralCode = generateReferralCode(userRecord.uid);

        // Create user document in Firestore
        await setDoc(doc(db, 'users', userRecord.uid), {
            uid: userRecord.uid,
            email: email,
            displayName: name,
            phone: phone || '',
            role: role,
            createdAt: serverTimestamp(),
            loyaltyPoints: 0,
            referralCode: newReferralCode,
            accountStatus: 'active',
        });

        // Log the admin action
        await AuditLogger.getInstance().logAction(
            actor.id,
            'users',
            'USER_CREATED',
            { 
                targetUserId: userRecord.uid, 
                userEmail: email, 
                userRole: role, 
                actorRole: 'admin' 
            }
        );

        return { 
            error: null, 
            message: `User ${name} (${email}) created successfully with role: ${role}.` 
        };

    } catch (e: any) {
         console.error('Error creating user: ', e);
         let errorMessage = e.message;
         if (e.code === 'auth/email-already-exists') {
             errorMessage = "This email address is already in use by another account.";
         } else if (e.code === 'auth/invalid-email') {
             errorMessage = "The email address is invalid.";
         } else if (e.code === 'auth/weak-password') {
             errorMessage = "The password is too weak.";
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
    // Server-side role verification
    if (actor.role !== 'admin') {
        return {
            error: 'Unauthorized',
            message: 'Admin privileges required.'
        };
    }

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

        await AuditLogger.getInstance().logAction(
            actor.id,
            'users',
            'USER_UPDATED',
            { targetUserId: userId, changes: updateData, actorRole: 'admin' }
        );

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
            from: `LocalPro Admin <admin@localpro.asia>`,
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

    