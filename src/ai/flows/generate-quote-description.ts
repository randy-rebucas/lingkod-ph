
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a professional description for a quote line item.
 *
 * - generateQuoteDescription - A function that takes a brief service name and generates a polished, client-facing description.
 * - GenerateQuoteDescriptionInput - The input type for the generateQuoteDescription function.
 * - GenerateQuoteDescriptionOutput - The return type for the generateQuoteDescription function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'zod';

const GenerateQuoteDescriptionInputSchema = z.object({
  itemName: z
    .string()
    .describe('The brief name or title of the service or product. e.g., "Basic Lawn Mowing"'),
});
export type GenerateQuoteDescriptionInput = z.infer<typeof GenerateQuoteDescriptionInputSchema>;

const GenerateQuoteDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A well-written, professional, and client-friendly description for the line item. This should be 1-2 sentences long.'),
});
export type GenerateQuoteDescriptionOutput = z.infer<typeof GenerateQuoteDescriptionOutputSchema>;

export async function generateQuoteDescription(input: GenerateQuoteDescriptionInput): Promise<GenerateQuoteDescriptionOutput> {
  // If AI is not available, provide a fallback response
  if (!isAIAvailable || !ai) {
    return provideFallbackQuoteDescription(input);
  }
  
  return generateQuoteDescriptionFlow!(input);
}

// Fallback response when AI is not available
function provideFallbackQuoteDescription(input: GenerateQuoteDescriptionInput): GenerateQuoteDescriptionOutput {
  return {
    description: `Professional ${input.itemName} service. This includes all necessary materials and labor to complete the job to your satisfaction.`
  };
}

const prompt = ai ? ai.definePrompt({
  name: 'generateQuoteDescriptionPrompt',
  input: {schema: GenerateQuoteDescriptionInputSchema},
  output: {schema: GenerateQuoteDescriptionOutputSchema},
  prompt: `You are an expert copywriter who specializes in writing clear, concise, and professional service descriptions for quotes and invoices.

Given the following item name, generate a client-friendly description that is 1-2 sentences long. The tone should be professional and instill confidence.

Item Name: {{{itemName}}}

Focus on the value and completeness of the service.
`,
}) : null;

const generateQuoteDescriptionFlow = ai ? ai.defineFlow(
  {
    name: 'generateQuoteDescriptionFlow',
    inputSchema: GenerateQuoteDescriptionInputSchema,
    outputSchema: GenerateQuoteDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt!(input);
    return output!;
  }
) : null;
