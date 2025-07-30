
"use server";

import { z } from "zod";
import { db } from "@/lib/firebase";
import { collection, addDoc, serverTimestamp, doc, getDoc, Timestamp, updateDoc } from "firebase/firestore";

const postJobSchema = z.object({
  title: z.string().min(10, "Job title must be at least 10 characters."),
  description: z.string().min(20, "Description must be at least 20 characters."),
  categoryId: z.string().min(1, "Please select a category."),
  budget: z.coerce.number().positive("Budget must be a positive number."),
  location: z.string().min(5, "Please provide a specific location."),
  deadline: z.string().optional(),
  additionalDetails: z.string().optional(), // JSON string of questions and answers
  userId: z.string().min(1, "User ID is required."),
  jobId: z.string().optional(), // For editing existing jobs
});

export interface PostJobFormState {
  error: string | null;
  message: string;
}

export async function handlePostJob(
  prevState: PostJobFormState,
  formData: FormData
): Promise<PostJobFormState> {

  const validatedFields = postJobSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description"),
    categoryId: formData.get("categoryId"),
    budget: formData.get("budget"),
    location: formData.get("location"),
    deadline: formData.get("deadline"),
    additionalDetails: formData.get("additionalDetails"),
    userId: formData.get("userId"),
    jobId: formData.get("jobId"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map((e) => e.message).join(", ");
    return {
      error: errorMessage,
      message: "Validation failed. Please check the fields.",
    };
  }

  const { userId, title, description, categoryId, budget, location, deadline, additionalDetails, jobId } = validatedFields.data;

  if (!userId) {
    return { error: "You must be logged in to post a job.", message: "Authentication failed." };
  }

  try {
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
      updatedAt: serverTimestamp(),
    };
    
    if (deadline) {
        jobData.deadline = Timestamp.fromDate(new Date(deadline));
    } else {
        jobData.deadline = null;
    }

    if (additionalDetails) {
        try {
            jobData.additionalDetails = JSON.parse(additionalDetails);
        } catch (e) {
            console.warn("Invalid JSON for additional details");
        }
    }
    
    if (jobId) {
        // Update existing job
        const jobRef = doc(db, "jobs", jobId);
        // Security check: ensure the user owns this job
        const jobSnap = await getDoc(jobRef);
        if (!jobSnap.exists() || jobSnap.data().clientId !== userId) {
            return { error: "Permission denied.", message: "You cannot edit this job." };
        }
        await updateDoc(jobRef, jobData);
         return { error: null, message: "Your job has been updated successfully!" };

    } else {
        // Create new job
        const userDocRef = doc(db, "users", userId);
        const userDoc = await getDoc(userDocRef);
        if (!userDoc.exists()) {
            throw new Error("User document not found.");
        }
        const userData = userDoc.data();
        const clientIsVerified = userData.verification?.status === 'Verified';

        const newJobData = {
            ...jobData,
            status: 'Open',
            clientId: userId,
            clientName: userData.displayName,
            clientAvatar: userData.photoURL || null,
            clientIsVerified: clientIsVerified,
            createdAt: serverTimestamp(),
            applications: [],
        };
        await addDoc(collection(db, "jobs"), newJobData);
        return { error: null, message: "Your job has been posted successfully!" };
    }

  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    console.error("Job operation failed:", error);
    return {
      error: `Failed to save job: ${error}`,
      message: "An error occurred while saving your job.",
    };
  }
}
