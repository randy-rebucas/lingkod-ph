"use server";

import { suggestSmartRate, type SuggestSmartRateOutput } from "@/ai/flows/smart-rate-suggestions";
import { z } from "zod";
import { getTranslations } from 'next-intl/server';

const createSuggestionSchema = (t: any) => z.object({
  servicesOffered: z.string().min(10, { message: t('servicesDescriptionRequired') }),
  location: z.string().min(3, { message: t('locationRequired') }),
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
  const t = await getTranslations('SmartRateActions');
  const SuggestionSchema = createSuggestionSchema(t);
  
  const validatedFields = SuggestionSchema.safeParse({
    servicesOffered: formData.get("servicesOffered"),
    location: formData.get("location"),
  });

  if (!validatedFields.success) {
    const errorMessage = validatedFields.error.errors.map((e: any) => e.message).join(", ");
    return {
      data: null,
      error: errorMessage,
      message: t('validationFailed')
    };
  }
  
  try {
    const result = await suggestSmartRate(validatedFields.data);
    return {
        data: result,
        error: null,
        message: t('suggestionSuccessful')
    };
  } catch (e: unknown) {
    const error = e instanceof Error ? e.message : t('unknownError');
    return {
        data: null,
        error: t('failedToGetSuggestion', { error }),
        message: t('anErrorOccurred')
    };
  }
}
