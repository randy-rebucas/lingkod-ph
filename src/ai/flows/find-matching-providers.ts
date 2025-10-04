
'use server';

/**
 * @fileOverview This file defines a Genkit flow for finding and ranking service providers.
 *
 * - findMatchingProviders - A function that takes a job query and returns a ranked list of suitable providers.
 * - FindMatchingProvidersInput - The input type for the function.
 * - FindMatchingProvidersOutput - The return type for the function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { getDb } from '@/shared/db';

// Schema for a single provider's details used in the prompt
const ProviderInfoSchema = z.object({
  uid: z.string(),
  displayName: z.string(),
  bio: z.string().optional(),
  keyServices: z.array(z.string()).optional(),
});

// Input schema for the main flow
const FindMatchingProvidersInputSchema = z.object({
  query: z.string().describe('The user\'s description of the job they need done.'),
});
export type FindMatchingProvidersInput = z.infer<typeof FindMatchingProvidersInputSchema>;

// Schema for a single matched provider in the output
const MatchedProviderSchema = z.object({
  providerId: z.string().describe('The unique ID of the matched provider.'),
  reasoning: z.string().describe('A brief, client-facing explanation of why this provider is a good match.'),
  rank: z.number().describe('A ranking score, where a lower number is a better match.'),
});

// Output schema for the main flow
const FindMatchingProvidersOutputSchema = z.object({
  providers: z.array(MatchedProviderSchema).describe('A ranked list of suitable providers.'),
});
export type FindMatchingProvidersOutput = z.infer<typeof FindMatchingProvidersOutputSchema>;


// The main exported function that clients will call.
export async function findMatchingProviders(input: FindMatchingProvidersInput): Promise<FindMatchingProvidersOutput> {
  return findMatchingProvidersFlow(input);
}


// Define a Genkit tool to fetch all providers from Firestore.
const getAllProvidersTool = ai.defineTool(
  {
    name: 'getAllProviders',
    description: 'Retrieves a list of all available service providers from the database.',
    inputSchema: z.object({}),
    outputSchema: z.array(ProviderInfoSchema),
  },
  async () => {
    const db = getDb();
    const providersRef = collection(db, 'users');
    const q = query(providersRef, where('role', '==', 'provider'));
    const snapshot = await getDocs(q);
    
    if (snapshot.empty) {
      return [];
    }
    
    return snapshot.docs.map(doc => {
        const data = doc.data();
        return {
            uid: data.uid,
            displayName: data.displayName,
            bio: data.bio,
            keyServices: data.keyServices,
        };
    });
  }
);

// Define the prompt that uses the tool to find and rank providers.
const findProvidersPrompt = ai.definePrompt({
  name: 'findProvidersPrompt',
  input: { schema: FindMatchingProvidersInputSchema },
  output: { schema: FindMatchingProvidersOutputSchema },
  tools: [getAllProvidersTool],
  prompt: `
    You are an expert matchmaking agent for a service provider marketplace called LocalPro.
    Your task is to find the best service providers for a user's request.

    1. First, use the \`getAllProviders\` tool to get a list of all available providers.
    2. Analyze the user's query: {{{query}}}
    3. Compare the user's query with each provider's details (name, bio, key services).
    4. Rank the providers based on how well they match the query. A lower rank number is better (e.g., 1 is the best match).
    5. Provide a short, client-facing reason for why each provider is a good match.
    6. Return a list of the top 5 most relevant providers. If there are fewer than 5 providers total, return all of them.
  `,
});


// Define the main flow that orchestrates the tool call and the prompt.
const findMatchingProvidersFlow = ai.defineFlow(
  {
    name: 'findMatchingProvidersFlow',
    inputSchema: FindMatchingProvidersInputSchema,
    outputSchema: FindMatchingProvidersOutputSchema,
  },
  async (input) => {
    const { output } = await findProvidersPrompt(input);
    return output!;
  }
);
