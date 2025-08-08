
"use server";

import { z } from "zod";
import { Resend } from "resend";
import ContactFormEmail from "@/emails/contact-form-email";

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  subject: z.string().min(5),
  message: z.string().min(10),
});

export interface FormState {
  error: string | null;
  message: string;
}

export async function sendContactForm(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = contactSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    subject: formData.get("subject"),
    message: formData.get("message"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors
      .map((e) => e.message)
      .join(", ");
    return {
      error: errorMessage,
      message: "Validation failed. Please check the fields.",
    };
  }

  const { name, email, subject, message } = validatedFields.data;
  const resend = new Resend(process.env.RESEND_API_KEY);

  try {
    await resend.emails.send({
      from: "Contact Form <onboarding@resend.dev>", // Must be a verified domain on Resend
      to: process.env.ADMIN_EMAIL!,
      subject: `New Contact Form Submission: ${subject}`,
      reply_to: email,
      react: ContactFormEmail({ name, email, message }),
    });

    return {
      error: null,
      message: "Your message has been sent successfully!",
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Email sending failed:", error);
    return {
      error: `Failed to send email: ${error}`,
      message: "An error occurred while sending your message.",
    };
  }
}
