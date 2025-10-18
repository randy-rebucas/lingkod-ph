
'use server';

/**
 * @fileOverview This file defines a Genkit flow for generating a professional description for a service.
 *
 * - generateServiceDescription - A function that takes a brief service name and generates a polished, client-facing description for a service listing.
 * - GenerateServiceDescriptionInput - The input type for the generateServiceDescription function.
 * - GenerateServiceDescriptionOutput - The return type for the generateServiceDescription function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'zod';

const GenerateServiceDescriptionInputSchema = z.object({
  serviceName: z
    .string()
    .describe('The brief name or title of the service. e.g., "Deep House Cleaning"'),
});
export type GenerateServiceDescriptionInput = z.infer<typeof GenerateServiceDescriptionInputSchema>;

const GenerateServiceDescriptionOutputSchema = z.object({
  description: z
    .string()
    .describe('A well-written, professional, and client-friendly description for the service. This should be 2-3 sentences long and highlight the value and scope of the service.'),
});
export type GenerateServiceDescriptionOutput = z.infer<typeof GenerateServiceDescriptionOutputSchema>;

export async function generateServiceDescription(input: GenerateServiceDescriptionInput): Promise<GenerateServiceDescriptionOutput> {
  // If AI is not available, provide a fallback response
  if (!isAIAvailable || !ai) {
    return provideFallbackServiceDescription(input);
  }
  
  return generateServiceDescriptionFlow!(input);
}

// Fallback response when AI is not available
function provideFallbackServiceDescription(input: GenerateServiceDescriptionInput): GenerateServiceDescriptionOutput {
  return {
    description: `Professional ${input.serviceName} service. We provide high-quality work with attention to detail and customer satisfaction. Our experienced team ensures reliable and efficient service delivery.`
  };
}

const prompt = ai ? ai.definePrompt({
  name: 'generateServiceDescriptionPrompt',
  input: {schema: GenerateServiceDescriptionInputSchema},
  output: {schema: GenerateServiceDescriptionOutputSchema},
  prompt: `You are an expert copywriter who specializes in writing compelling service descriptions for online marketplaces.

Given the following service name, generate a client-friendly description that is 2-3 sentences long. The tone should be professional, trustworthy, and aimed at attracting customers.

Service Name: {{{serviceName}}}

Focus on the benefits, what's included, and the value the customer will receive.
`,
}) : null;

const generateServiceDescriptionFlow = ai ? ai.defineFlow(
  {
    name: 'generateServiceDescriptionFlow',
    inputSchema: GenerateServiceDescriptionInputSchema,
    outputSchema: GenerateServiceDescriptionOutputSchema,
  },
  async input => {
    const {output} = await prompt!(input);
    return output!;
  }
) : null;
