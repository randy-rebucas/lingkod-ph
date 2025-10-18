'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting smart rates to service providers.
 *
 * - suggestSmartRate - A function that suggests a competitive service rate based on the services offered and location.
 * - SuggestSmartRateInput - The input type for the suggestSmartRate function.
 * - SuggestSmartRateOutput - The return type for the suggestSmartRate function.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'zod';

const SuggestSmartRateInputSchema = z.object({
  servicesOffered: z
    .string()
    .describe('The services offered by the provider, comma separated.'),
  location: z.string().describe('The location of the service provider.'),
});
export type SuggestSmartRateInput = z.infer<typeof SuggestSmartRateInputSchema>;

const SuggestSmartRateOutputSchema = z.object({
  suggestedRate: z
    .number()
    .describe('The suggested competitive service rate in Philippine Peso.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the suggested rate.'),
});
export type SuggestSmartRateOutput = z.infer<typeof SuggestSmartRateOutputSchema>;

export async function suggestSmartRate(input: SuggestSmartRateInput): Promise<SuggestSmartRateOutput> {
  // If AI is not available, provide a fallback response
  if (!isAIAvailable || !ai) {
    return provideFallbackRateSuggestion(input);
  }
  
  return suggestSmartRateFlow!(input);
}

// Fallback response when AI is not available
function provideFallbackRateSuggestion(input: SuggestSmartRateInput): SuggestSmartRateOutput {
  const { servicesOffered, location } = input;
  
  // Basic rate suggestions based on common services
  const lowerServices = servicesOffered.toLowerCase();
  let baseRate = 500; // Default base rate
  
  if (lowerServices.includes('cleaning') || lowerServices.includes('housekeeper')) {
    baseRate = 300;
  } else if (lowerServices.includes('plumber') || lowerServices.includes('electrician')) {
    baseRate = 800;
  } else if (lowerServices.includes('carpenter') || lowerServices.includes('construction')) {
    baseRate = 600;
  } else if (lowerServices.includes('massage') || lowerServices.includes('beauty')) {
    baseRate = 400;
  }
  
  // Adjust for location (basic adjustment)
  const lowerLocation = location.toLowerCase();
  if (lowerLocation.includes('manila') || lowerLocation.includes('makati') || lowerLocation.includes('quezon')) {
    baseRate = Math.round(baseRate * 1.2); // 20% higher for major cities
  }
  
  return {
    suggestedRate: baseRate,
    reasoning: `Based on the services offered (${servicesOffered}) and location (${location}), I suggest a rate of ₱${baseRate}. This is a competitive rate that considers local market conditions. For more accurate pricing, please research similar services in your area or contact our support team for assistance.`
  };
}

const prompt = ai ? ai.definePrompt({
  name: 'suggestSmartRatePrompt',
  input: {schema: SuggestSmartRateInputSchema},
  output: {schema: SuggestSmartRateOutputSchema},
  prompt: `You are an expert pricing consultant in the Philippines, specializing in service rates.

You will use the information about services offered and location to suggest a competitive service rate in Philippine Peso.

Consider local market conditions, competitor pricing, and the cost of living in the specified location.

Services Offered: {{{servicesOffered}}}
Location: {{{location}}}

Respond with a suggested rate and the reasoning behind it.

Ensure the suggested rate allows the service provider to be competitive while maintaining profitability.
`,
}) : null;

const suggestSmartRateFlow = ai ? ai.defineFlow(
  {
    name: 'suggestSmartRateFlow',
    inputSchema: SuggestSmartRateInputSchema,
    outputSchema: SuggestSmartRateOutputSchema,
  },
  async input => {
    const {output} = await prompt!(input);
    return output!;
  }
) : null;
