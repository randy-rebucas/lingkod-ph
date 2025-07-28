
'use server';

/**
 * @fileOverview This file defines Genkit flows for enhancing the job posting process.
 *
 * - generateJobDetails: Suggests a budget and generates relevant questions based on a job description.
 * - GenerateJobDetailsInput: The input type for the flow.
 * - GenerateJobDetailsOutput: The return type for the flow.
 * - JobDetailQuestion: The structure for a dynamically generated question.
 */

import {ai} from '@/ai/genkit';
import {z} from 'zod';

const JobDetailQuestionSchema = z.object({
  question: z.string().describe("A specific question to ask the user to get more details about the job."),
  example: z.string().describe("A brief example of a good answer to the question."),
  type: z.enum(["text", "textarea"]).describe("The suggested input field type for the question."),
});
export type JobDetailQuestion = z.infer<typeof JobDetailQuestionSchema>;

const GenerateJobDetailsInputSchema = z.object({
  jobDescription: z.string().describe('The detailed description of the job provided by the user.'),
});
export type GenerateJobDetailsInput = z.infer<typeof GenerateJobDetailsInputSchema>;

const GenerateJobDetailsOutputSchema = z.object({
  suggestedBudget: z
    .number()
    .describe('A suggested budget in Philippine Peso (PHP) for the described job. Should be a reasonable market rate.'),
  questions: z
    .array(JobDetailQuestionSchema)
    .describe("An array of 2-3 relevant questions to ask the user for more clarity. Do not ask for location or budget, as those are separate fields."),
});
export type GenerateJobDetailsOutput = z.infer<typeof GenerateJobDetailsOutputSchema>;

export async function generateJobDetails(input: GenerateJobDetailsInput): Promise<GenerateJobDetailsOutput> {
  return generateJobDetailsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateJobDetailsPrompt',
  input: {schema: GenerateJobDetailsInputSchema},
  output: {schema: GenerateJobDetailsOutputSchema},
  prompt: `You are an expert assistant for a service marketplace in the Philippines. Your goal is to help users create the most effective job posting possible.

Given the user's job description, you need to do two things:
1. Suggest a reasonable budget for this job in Philippine Peso (PHP). Consider the complexity and typical rates for such services in the Philippines.
2. Generate 2-3 specific, important questions that would help a service provider better understand the scope of the work.
   - Do NOT ask about budget, location, or deadline, as the user will enter those in separate fields.
   - Frame questions to gather details a professional would need (e.g., "What is the floor area in square meters?" for a cleaning job, or "What is the brand and model of the aircon unit?" for a repair job).
   - For each question, provide a short example answer.
   - Determine if the answer is likely to be a short 'text' response or a longer 'textarea' response.

Job Description:
{{{jobDescription}}}
`,
});

const generateJobDetailsFlow = ai.defineFlow(
  {
    name: 'generateJobDetailsFlow',
    inputSchema: GenerateJobDetailsInputSchema,
    outputSchema: GenerateJobDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
