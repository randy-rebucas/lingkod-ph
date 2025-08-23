
"use server";

import { z } from "zod";
import { auth } from "@/lib/firebase";
import { sendPasswordResetEmail } from "firebase/auth";
import { getTranslations } from 'next-intl/server';


const forgotPasswordSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
});

export interface FormState {
  error: string | null;
  message: string;
}

export async function forgotPasswordAction(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
   const t = await getTranslations('ForgotPassword');
  
  const validatedFields = forgotPasswordSchema.safeParse({
    email: formData.get("email"),
  });

  if (!validatedFields.success) {
    return {
      error: validatedFields.error.flatten().fieldErrors.email?.[0] ?? "Invalid email.",
      message: "Validation failed.",
    };
  }

  const { email } = validatedFields.data;

  try {
    await sendPasswordResetEmail(auth, email);
    return {
      error: null,
      message: t('resetLinkSent'),
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Password reset failed:", error);
    // Do not reveal if the email exists or not for security reasons.
    // Return a generic success message regardless of the outcome.
    return {
      error: null,
      message: t('resetLinkSent'),
    };
  }
}
