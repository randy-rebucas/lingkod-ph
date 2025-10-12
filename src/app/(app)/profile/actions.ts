
'use server';

import { getDb, getStorageInstance } from '@/lib/firebase';
import { 
    doc, 
    writeBatch, 
    serverTimestamp, 
    getDoc, 
    collection, 
    updateDoc, 
    runTransaction,
    arrayUnion,
    arrayRemove,
    query,
    where,
    orderBy,
    getDocs
} from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from "firebase/storage";
import { z } from "zod";

const InviteActionSchema = z.object({
  inviteId: z.string().min(1, 'Invite ID is required'),
  accepted: z.boolean(),
});

interface ActionState {
    error: string | null;
    message: string;
}

export async function handleInviteAction(
    prevState: ActionState,
    formData: FormData
): Promise<ActionState> {
    const validatedFields = InviteActionSchema.safeParse({
        inviteId: formData.get("inviteId"),
        accepted: formData.get("accepted") === 'true',
    });

    if (!validatedFields.success) {
        return { error: "Invalid data provided.", message: "Validation failed." };
    }
    
    const { inviteId, accepted } = validatedFields.data;
    const batch = writeBatch(getDb());
    const inviteRef = doc(getDb(), 'invites', inviteId);

    try {
        const inviteDoc = await getDoc(inviteRef);
        if (!inviteDoc.exists()) {
            throw new Error("Invitation not found or has been revoked.");
        }

        const inviteData = inviteDoc.data();
        const providerRef = doc(getDb(), 'users', inviteData.providerId);

        if (accepted) {
            batch.update(providerRef, { agencyId: inviteData.agencyId });
            batch.update(inviteRef, { status: 'accepted' });

            const agencyNotificationRef = doc(collection(getDb(), `users/${inviteData.agencyId}/notifications`));
            const providerDoc = await getDoc(providerRef);
            batch.set(agencyNotificationRef, {
                type: 'info',
                message: `${providerDoc.data()?.displayName} has accepted your agency invitation.`,
                link: '/manage-providers',
                read: false,
                createdAt: serverTimestamp(),
            });

        } else {
            batch.update(inviteRef, { status: 'declined' });
             const agencyNotificationRef = doc(collection(getDb(), `users/${inviteData.agencyId}/notifications`));
            const providerDoc = await getDoc(providerRef);
            batch.set(agencyNotificationRef, {
                type: 'info',
                message: `${providerDoc.data()?.displayName} has declined your agency invitation.`,
                link: '/manage-providers',
                read: false,
                createdAt: serverTimestamp(),
            });
        }
        
        await batch.commit();
        
        return { error: null, message: `Invitation successfully ${accepted ? 'accepted' : 'declined'}.` };

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred.";
        return { error: errorMessage, message: "Action failed." };
    }
}

// Validation schemas
const PublicProfileSchema = z.object({
    displayName: z.string().min(1, 'Display name is required'),
    bio: z.string().optional(),
});

const PersonalDetailsSchema = z.object({
    phone: z.string().optional(),
    gender: z.string().optional(),
    address: z.string().optional(),
    latitude: z.number().optional(),
    longitude: z.number().optional(),
    birthdate: z.date().optional(),
});

const ProviderDetailsSchema = z.object({
    availabilityStatus: z.string().optional(),
    yearsOfExperience: z.string().optional(),
    keyServices: z.array(z.string()).optional(),
    ownsToolsSupplies: z.boolean().optional(),
    isLicensed: z.boolean().optional(),
    licenseNumber: z.string().optional(),
    licenseType: z.string().optional(),
    licenseExpirationDate: z.string().optional(),
    licenseIssuingState: z.string().optional(),
    licenseIssuingCountry: z.string().optional(),
    availabilitySchedule: z.any().optional(),
});

const PayoutDetailsSchema = z.object({
    method: z.string().optional(),
    paypalEmail: z.string().email().optional(),
    bankName: z.string().optional(),
    bankAccountNumber: z.string().optional(),
    bankAccountName: z.string().optional(),
});

// Action result interface
interface ActionResult {
    success: boolean;
    error?: string;
    message?: string;
    data?: any;
}

// Update public profile
export async function updatePublicProfile(
    userId: string,
    data: {
        displayName: string;
        bio?: string;
    }
): Promise<ActionResult> {
    try {
        const validatedData = PublicProfileSchema.parse(data);
        const userDocRef = doc(getDb(), "users", userId);
        
        const updates: any = {
            displayName: validatedData.displayName,
            updatedAt: serverTimestamp(),
        };
        
        if (validatedData.bio !== undefined) {
            updates.bio = validatedData.bio;
        }
        
        await updateDoc(userDocRef, updates);
        
        return {
            success: true,
            message: "Public profile updated successfully"
        };
    } catch (error) {
        console.error('Error updating public profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update public profile'
        };
    }
}

// Update personal details
export async function updatePersonalDetails(
    userId: string,
    data: {
        phone?: string;
        gender?: string;
        address?: string;
        latitude?: number;
        longitude?: number;
        birthdate?: Date;
    }
): Promise<ActionResult> {
    try {
        const validatedData = PersonalDetailsSchema.parse(data);
        const userDocRef = doc(getDb(), "users", userId);
        
        const updates: any = {
            updatedAt: serverTimestamp(),
        };
        
        if (validatedData.phone !== undefined) updates.phone = validatedData.phone;
        if (validatedData.gender !== undefined) updates.gender = validatedData.gender;
        if (validatedData.address !== undefined) updates.address = validatedData.address;
        if (validatedData.latitude !== undefined) updates.latitude = validatedData.latitude;
        if (validatedData.longitude !== undefined) updates.longitude = validatedData.longitude;
        if (validatedData.birthdate !== undefined) updates.birthdate = validatedData.birthdate;
        
        await updateDoc(userDocRef, updates);
        
        return {
            success: true,
            message: "Personal details updated successfully"
        };
    } catch (error) {
        console.error('Error updating personal details:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update personal details'
        };
    }
}

// Update provider details
export async function updateProviderDetails(
    userId: string,
    data: {
        availabilityStatus?: string;
        yearsOfExperience?: string;
        keyServices?: string[];
        ownsToolsSupplies?: boolean;
        isLicensed?: boolean;
        licenseNumber?: string;
        licenseType?: string;
        licenseExpirationDate?: string;
        licenseIssuingState?: string;
        licenseIssuingCountry?: string;
        availabilitySchedule?: any;
    }
): Promise<ActionResult> {
    try {
        const validatedData = ProviderDetailsSchema.parse(data);
        const userDocRef = doc(getDb(), "users", userId);
        
        const updates: any = {
            updatedAt: serverTimestamp(),
        };
        
        Object.keys(validatedData).forEach(key => {
            if (validatedData[key as keyof typeof validatedData] !== undefined) {
                updates[key] = validatedData[key as keyof typeof validatedData];
            }
        });
        
        await updateDoc(userDocRef, updates);
        
        return {
            success: true,
            message: "Provider details updated successfully"
        };
    } catch (error) {
        console.error('Error updating provider details:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update provider details'
        };
    }
}

// Update payout details
export async function updatePayoutDetails(
    userId: string,
    data: {
        method?: string;
        paypalEmail?: string;
        bankName?: string;
        bankAccountNumber?: string;
        bankAccountName?: string;
    }
): Promise<ActionResult> {
    try {
        const validatedData = PayoutDetailsSchema.parse(data);
        const userDocRef = doc(getDb(), "users", userId);
        
        const payoutDetails: Record<string, unknown> = {};
        
        if (validatedData.method !== undefined) payoutDetails.method = validatedData.method;
        if (validatedData.paypalEmail !== undefined) payoutDetails.paypalEmail = validatedData.paypalEmail;
        if (validatedData.bankName !== undefined) payoutDetails.bankName = validatedData.bankName;
        if (validatedData.bankAccountNumber !== undefined) payoutDetails.bankAccountNumber = validatedData.bankAccountNumber;
        if (validatedData.bankAccountName !== undefined) payoutDetails.bankAccountName = validatedData.bankAccountName;
        
        await updateDoc(userDocRef, { payoutDetails });
        
        return {
            success: true,
            message: "Payout details updated successfully"
        };
    } catch (error) {
        console.error('Error updating payout details:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to update payout details'
        };
    }
}

// Upload profile picture
export async function uploadProfilePicture(
    userId: string,
    imageFile: File
): Promise<ActionResult> {
    try {
        const storagePath = `profile-pictures/${userId}/${Date.now()}_${imageFile.name}`;
        const storageRef = ref(getStorageInstance(), storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, imageFile);
        
        return new Promise((resolve) => {
            uploadTask.on('state_changed',
                (_snapshot) => {
                    // Progress tracking can be handled on client side
                },
                (error) => {
                    console.error('Upload error:', error);
                    resolve({
                        success: false,
                        error: 'Failed to upload image'
                    });
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        // Update user document with new photo URL
                        const userDocRef = doc(getDb(), "users", userId);
                        await updateDoc(userDocRef, { photoURL: downloadURL });
                        
                        resolve({
                            success: true,
                            message: "Profile picture updated successfully",
                            data: { photoURL: downloadURL }
                        });
                    } catch (error) {
                        console.error('Error updating user document:', error);
                        resolve({
                            success: false,
                            error: 'Failed to update profile picture'
                        });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading profile picture:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload profile picture'
        };
    }
}

// Upload document
export async function uploadDocument(
    userId: string,
    documentFile: File,
    documentName: string
): Promise<ActionResult> {
    try {
        const storagePath = `provider-documents/${userId}/${Date.now()}_${documentFile.name}`;
        const storageRef = ref(getStorageInstance(), storagePath);
        
        const uploadTask = uploadBytesResumable(storageRef, documentFile);
        
        return new Promise((resolve) => {
            uploadTask.on('state_changed',
                (_snapshot) => {
                    // Progress tracking can be handled on client side
                },
                (error) => {
                    console.error('Upload error:', error);
                    resolve({
                        success: false,
                        error: 'Failed to upload document'
                    });
                },
                async () => {
                    try {
                        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                        
                        const newDocument = {
                            name: documentName,
                            url: downloadURL,
                            uploadedAt: serverTimestamp()
                        };
                        
                        const userDocRef = doc(getDb(), "users", userId);
                        await updateDoc(userDocRef, {
                            documents: arrayUnion(newDocument)
                        });
                        
                        resolve({
                            success: true,
                            message: "Document uploaded successfully",
                            data: { document: newDocument }
                        });
                    } catch (error) {
                        console.error('Error updating user document:', error);
                        resolve({
                            success: false,
                            error: 'Failed to upload document'
                        });
                    }
                }
            );
        });
    } catch (error) {
        console.error('Error uploading document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to upload document'
        };
    }
}

// Delete document
export async function deleteDocument(
    userId: string,
    documentToDelete: { name: string; url: string }
): Promise<ActionResult> {
    try {
        // Delete from Storage
        const fileRef = ref(getStorageInstance(), documentToDelete.url);
        await deleteObject(fileRef);
        
        // Delete from Firestore
        const userRef = doc(getDb(), "users", userId);
        await updateDoc(userRef, {
            documents: arrayRemove(documentToDelete)
        });
        
        return {
            success: true,
            message: "Document deleted successfully"
        };
    } catch (error) {
        console.error('Error deleting document:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to delete document'
        };
    }
}

// Redeem loyalty reward
export async function redeemLoyaltyReward(
    userId: string,
    reward: {
        id: string;
        title: string;
        pointsRequired: number;
    }
): Promise<ActionResult> {
    try {
        const userRef = doc(getDb(), "users", userId);
        
        await runTransaction(getDb(), async (transaction) => {
            const userDoc = await transaction.get(userRef);
            if (!userDoc.exists()) throw new Error("User document does not exist!");
            
            const currentPoints = userDoc.data()?.loyaltyPoints || 0;
            if (currentPoints < reward.pointsRequired) {
                throw new Error("Insufficient loyalty points");
            }
            
            const newTotalPoints = currentPoints - reward.pointsRequired;
            transaction.update(userRef, { loyaltyPoints: newTotalPoints });
            
            const loyaltyTxRef = doc(collection(getDb(), `users/${userId}/loyaltyTransactions`));
            transaction.set(loyaltyTxRef, {
                points: reward.pointsRequired,
                type: 'redeem',
                description: `Redeemed: ${reward.title}`,
                rewardId: reward.id,
                createdAt: serverTimestamp()
            });
        });
        
        return {
            success: true,
            message: "Reward redeemed successfully"
        };
    } catch (error) {
        console.error('Error redeeming reward:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to redeem reward'
        };
    }
}

// Get user profile data
export async function getUserProfile(userId: string): Promise<ActionResult> {
    try {
        const userDocRef = doc(getDb(), "users", userId);
        const userDoc = await getDoc(userDocRef);
        
        if (!userDoc.exists()) {
            return {
                success: false,
                error: 'User profile not found'
            };
        }
        
        const userData = userDoc.data();
        
        // Convert Firebase Timestamps to plain objects
        const serializedData = {
            id: userDoc.id,
            ...userData
        };
        
        // Convert any Timestamp fields to Date objects
        Object.keys(serializedData).forEach(key => {
            const value = (serializedData as any)[key];
            if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                (serializedData as any)[key] = new Date(value.seconds * 1000);
            }
        });
        
        return {
            success: true,
            data: serializedData
        };
    } catch (error) {
        console.error('Error fetching user profile:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch user profile'
        };
    }
}

// Get categories
export async function getCategories(): Promise<ActionResult> {
    try {
        const categoriesRef = collection(getDb(), "categories");
        const q = query(categoriesRef, orderBy("name"));
        const querySnapshot = await getDocs(q);
        const categories = querySnapshot.docs.map(doc => ({ 
            id: doc.id, 
            name: doc.data().name 
        }));
        
        return {
            success: true,
            data: categories
        };
    } catch (error) {
        console.error('Error fetching categories:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch categories'
        };
    }
}

// Get loyalty rewards
export async function getLoyaltyRewards(): Promise<ActionResult> {
    try {
        const rewardsRef = collection(getDb(), "loyaltyRewards");
        const qRewards = query(rewardsRef, where("isActive", "==", true), orderBy("pointsRequired"));
        const rewardsSnapshot = await getDocs(qRewards);
        const rewards = rewardsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Timestamp fields to Date objects
            Object.keys(data).forEach(key => {
                const value = (data as any)[key];
                if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                    (data as any)[key] = new Date(value.seconds * 1000);
                }
            });
            return { id: doc.id, ...data };
        });
        
        return {
            success: true,
            data: rewards
        };
    } catch (error) {
        console.error('Error fetching loyalty rewards:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch loyalty rewards'
        };
    }
}

// Get loyalty transactions
export async function getLoyaltyTransactions(userId: string): Promise<ActionResult> {
    try {
        const transactionsRef = collection(getDb(), `users/${userId}/loyaltyTransactions`);
        const qTransactions = query(transactionsRef, orderBy("createdAt", "desc"));
        const transactionsSnapshot = await getDocs(qTransactions);
        const transactions = transactionsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Timestamp fields to Date objects
            Object.keys(data).forEach(key => {
                const value = (data as any)[key];
                if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                    (data as any)[key] = new Date(value.seconds * 1000);
                }
            });
            return { id: doc.id, ...data };
        });
        
        return {
            success: true,
            data: transactions
        };
    } catch (error) {
        console.error('Error fetching loyalty transactions:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch loyalty transactions'
        };
    }
}

// Get referrals
export async function getReferrals(userId: string): Promise<ActionResult> {
    try {
        const referralsRef = collection(getDb(), 'referrals');
        const qReferrals = query(referralsRef, where("referrerId", "==", userId), orderBy("createdAt", "desc"));
        const referralsSnapshot = await getDocs(qReferrals);
        const referrals = referralsSnapshot.docs.map(doc => {
            const data = doc.data();
            // Convert Timestamp fields to Date objects
            Object.keys(data).forEach(key => {
                const value = (data as any)[key];
                if (value && typeof value === 'object' && value.seconds !== undefined && value.nanoseconds !== undefined) {
                    (data as any)[key] = new Date(value.seconds * 1000);
                }
            });
            return { id: doc.id, ...data };
        });
        
        return {
            success: true,
            data: referrals
        };
    } catch (error) {
        console.error('Error fetching referrals:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch referrals'
        };
    }
}

// Get agency invites
export async function getAgencyInvites(userId: string): Promise<ActionResult> {
    try {
        const invitesRef = collection(getDb(), "invites");
        const qInvites = query(invitesRef, where("providerId", "==", userId), where("status", "==", "pending"));
        const invitesSnapshot = await getDocs(qInvites);
        const invites = invitesSnapshot.docs.map(doc => ({ 
            id: doc.id, 
            ...doc.data() 
        }));
        
        return {
            success: true,
            data: invites
        };
    } catch (error) {
        console.error('Error fetching agency invites:', error);
        return {
            success: false,
            error: error instanceof Error ? error.message : 'Failed to fetch agency invites'
        };
    }
}
