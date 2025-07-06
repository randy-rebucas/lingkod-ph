'use server';

/**
 * @fileOverview This file defines a Genkit flow for suggesting smart rates to service providers.
 *
 * - suggestSmartRate - A function that suggests a competitive service rate based on the services offered and location.
 * - SuggestSmartRateInput - The input type for the suggestSmartRate function.
 * - SuggestSmartRateOutput - The return type for the suggestSmartRate function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

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
  return suggestSmartRateFlow(input);
}

const prompt = ai.definePrompt({
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
});

const suggestSmartRateFlow = ai.defineFlow(
  {
    name: 'suggestSmartRateFlow',
    inputSchema: SuggestSmartRateInputSchema,
    outputSchema: SuggestSmartRateOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
