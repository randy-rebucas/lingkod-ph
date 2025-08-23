
"use server";

import { z } from "zod";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, setDoc, getDocs, query, limit } from "firebase/firestore";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, updateProfile } from "firebase/auth";

const setupSchema = z.object({
  name: z.string().min(2, "Name is required."),
  email: z.string().email(),
  password: z.string().min(6, "Password must be at least 6 characters."),
});

export interface FormState {
  error: string | null;
  message: string;
}

const generateReferralCode = (userId: string): string => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const uidPart = userId.substring(0, 4).toUpperCase();
    const randomPart = Math.random().toString(36).substring(2, 5).toUpperCase();
    return `LP-${uidPart}-${timestamp.slice(-3)}-${randomPart}`;
};

export async function createAdminAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = setupSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map((e) => e.message).join(", ");
    return {
      error: errorMessage,
      message: "Validation failed.",
    };
  }
  
  // Security check: ensure the users collection is still empty
  const usersRef = collection(db, "users");
  const q = query(usersRef, limit(1));
  const snapshot = await getDocs(q);
  if (!snapshot.empty) {
    return {
      error: "An admin account already exists.",
      message: "Setup has already been completed.",
    };
  }

  const { name, email, password } = validatedFields.data;

  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await updateProfile(user, { displayName: name });
    
    const newReferralCode = generateReferralCode(user.uid);

    await setDoc(doc(db, "users", user.uid), {
        uid: user.uid,
        email: user.email,
        displayName: name,
        phone: '',
        role: 'admin',
        accountStatus: 'active',
        createdAt: serverTimestamp(),
        loyaltyPoints: 0,
        referralCode: newReferralCode,
    });
    
    // Sign in the user automatically after creating the account
    await signInWithEmailAndPassword(auth, email, password);
    
    return {
      error: null,
      message: "Admin account created successfully!",
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Admin creation failed:", error);
    return {
      error: `Failed to create admin: ${error}`,
      message: "An error occurred during setup.",
    };
  }
}
