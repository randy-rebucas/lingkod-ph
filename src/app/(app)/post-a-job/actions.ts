
"use server";

import { z } from "zod";
import { db, auth } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, Timestamp } from "firebase/firestore";

const postJobSchema = z.object({
  title: z.string().min(10, "Job title must be at least 10 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  budget: z.coerce.number().positive("Budget must be a positive number."),
  location: z.string().min(5, "Please provide a specific location."),
  deadline: z.string().optional(), // Dates are passed as strings from FormData
});

export interface PostJobFormState {
  error: string | null;
  message: string;
}

export async function handlePostJob(
  prevState: PostJobFormState,
  formData: FormData
): Promise<PostJobFormState> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    return { error: "You must be logged in to post a job.", message: "Authentication failed." };
  }

  const validatedFields = postJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    budget: formData.get("budget"),
    location: formData.get("location"),
    deadline: formData.get("deadline"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map((e) => e.message).join(", ");
    return {
      error: errorMessage,
      message: "Validation failed. Please check the fields.",
    };
  }

  const { title, description, categoryId, budget, location, deadline } = validatedFields.data;

  try {
    const userDocRef = doc(db, "users", currentUser.uid);
    const userDoc = await getDoc(userDocRef);
    if (!userDoc.exists()) {
        throw new Error("User document not found.");
    }
    const userData = userDoc.data();

    const categoryDocRef = doc(db, "categories", categoryId);
    const categoryDoc = await getDoc(categoryDocRef);
     if (!categoryDoc.exists()) {
        throw new Error("Category document not found.");
    }
    const categoryName = categoryDoc.data()?.name;

    const jobData: any = {
      title,
      description,
      categoryId,
      categoryName,
      budget,
      location,
      status: 'Open', // Initial status
      clientId: currentUser.uid,
      clientName: userData.displayName,
      clientAvatar: userData.photoURL || null,
      createdAt: serverTimestamp(),
      applications: [], // To store provider applications
    };
    
    if (deadline) {
        jobData.deadline = Timestamp.fromDate(new Date(deadline));
    }

    await addDoc(collection(db, "jobs"), jobData);

    return {
      error: null,
      message: "Your job has been posted successfully!",
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Job posting failed:", error);
    return {
      error: `Failed to post job: ${error}`,
      message: "An error occurred while posting your job.",
    };
  }
}
