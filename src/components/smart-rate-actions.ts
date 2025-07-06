"use server";

import { suggestSmartRate, type SuggestSmartRateOutput } from "@/ai/flows/smart-rate-suggestions";
import { z } from "zod";

const SuggestionSchema = z.object({
  servicesOffered: z.string().min(10, { message: "Please describe your services in more detail (at least 10 characters)." }),
  location: z.string().min(3, { message: "Please provide a valid location (at least 3 characters)." }),
});

export interface FormState {
  data: SuggestSmartRateOutput | null;
  error: string | null;
  message: string;
}

export async function handleSuggestSmartRate(
  prevState: FormState,
  formData: FormData
): Promise<FormState> {
  const validatedFields = SuggestionSchema.safeParse({
    servicesOffered: formData.get("servicesOffered"),
    location: formData.get("location"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map((e) => e.message).join(", ");
    return {
      data: null,
      error: errorMessage,
      message: "Validation failed."
    };
  }
  
  try {
    const result = await suggestSmartRate(validatedFields.data);
    return {
        data: result,
        error: null,
        message: "Suggestion successful."
    };
  } catch (e) {
    const error = e instanceof Error ? e.message : "An unknown error occurred.";
    return {
        data: null,
        error: `Failed to get suggestion: ${error}`,
        message: "An error occurred."
    };
  }
}
