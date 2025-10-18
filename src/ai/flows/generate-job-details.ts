
'use server';

/**
 * @fileOverview This file defines Genkit flows for enhancing the job posting process.
 *
 * - generateJobDetails: Suggests a budget and generates relevant questions based on a job description.
 * - GenerateJobDetailsInput: The input type for the flow.
 * - GenerateJobDetailsOutput: The return type for the flow.
 * - JobDetailQuestion: The structure for a dynamically generated question.
 */

import {ai, isAIAvailable} from '@/ai/genkit';
import {z} from 'zod';

const JobDetailQuestionSchema = z.object({
  question: z.string().describe("A specific question to ask the user to get more details about the job."),
  example: z.string().describe("A brief example of a good answer to the question."),
  type: z.enum(["text", "textarea"]).describe("The suggested input field type for the question."),
});
export type JobDetailQuestion = z.infer<typeof JobDetailQuestionSchema>;

const GenerateJobDetailsInputSchema = z.object({
  jobTitle: z.string().describe('The job title provided by the user.'),
  jobDescription: z.string().describe('The detailed description of the job provided by the user.'),
});
export type GenerateJobDetailsInput = z.infer<typeof GenerateJobDetailsInputSchema>;

const GenerateJobDetailsOutputSchema = z.object({
  suggestedCategory: z
    .string()
    .describe('The most appropriate service category for this job based on the title and description.'),
  suggestedBudget: z
    .number()
    .describe('A suggested budget in Philippine Peso (PHP) for the described job. Should be a reasonable market rate.'),
  questions: z
    .array(JobDetailQuestionSchema)
    .describe("An array of 2-3 relevant questions to ask the user for more clarity. Do not ask for location or budget, as those are separate fields."),
});
export type GenerateJobDetailsOutput = z.infer<typeof GenerateJobDetailsOutputSchema>;

export async function generateJobDetails(input: GenerateJobDetailsInput): Promise<GenerateJobDetailsOutput> {
  // If AI is not available, provide a fallback response
  if (!isAIAvailable || !ai) {
    return provideFallbackJobDetails(input);
  }
  
  return generateJobDetailsFlow!(input);
}

// Fallback response when AI is not available
function provideFallbackJobDetails(input: GenerateJobDetailsInput): GenerateJobDetailsOutput {
  const { jobTitle, jobDescription } = input;
  
  // Basic category suggestion based on keywords
  const lowerTitle = jobTitle.toLowerCase();
  const lowerDescription = jobDescription.toLowerCase();
  const combined = `${lowerTitle} ${lowerDescription}`;
  
  let suggestedCategory = "General Services";
  
  if (combined.includes('clean') || combined.includes('housekeeper')) {
    suggestedCategory = "Housekeeper / Kasambahay";
  } else if (combined.includes('plumb') || combined.includes('pipe')) {
    suggestedCategory = "Plumber";
  } else if (combined.includes('electric') || combined.includes('wiring')) {
    suggestedCategory = "Electrician";
  } else if (combined.includes('carpent') || combined.includes('wood')) {
    suggestedCategory = "Carpenter";
  } else if (combined.includes('massage') || combined.includes('spa')) {
    suggestedCategory = "Massage Therapist";
  } else if (combined.includes('beauty') || combined.includes('hair')) {
    suggestedCategory = "Hairdresser / Barber";
  }
  
  // Basic budget suggestion
  let suggestedBudget = 1000; // Default budget
  
  if (combined.includes('clean') || combined.includes('housekeeper')) {
    suggestedBudget = 500;
  } else if (combined.includes('plumb') || combined.includes('electric')) {
    suggestedBudget = 1500;
  } else if (combined.includes('carpent') || combined.includes('construction')) {
    suggestedBudget = 2000;
  }
  
  // Basic questions
  const questions: JobDetailQuestion[] = [
    {
      question: "What is the specific scope of work needed?",
      type: "textarea",
      example: "Please describe the specific tasks or deliverables required."
    },
    {
      question: "What is the preferred timeline for completion?",
      type: "text",
      example: "e.g., Within 1 week, ASAP, Flexible"
    }
  ];
  
  return {
    suggestedCategory,
    suggestedBudget,
    questions
  };
}

const prompt = ai ? ai.definePrompt({
  name: 'generateJobDetailsPrompt',
  input: {schema: GenerateJobDetailsInputSchema},
  output: {schema: GenerateJobDetailsOutputSchema},
  prompt: `You are an expert assistant for a service marketplace in the Philippines. Your goal is to help users create the most effective job posting possible.

Given the user's job title and description, you need to do three things:
1. Suggest the most appropriate service category from the available categories below.
2. Suggest a reasonable budget for this job in Philippine Peso (PHP). Consider the complexity and typical rates for such services in the Philippines.
3. Generate 2-3 specific, important questions that would help a service provider better understand the scope of the work.
   - Do NOT ask about budget, location, or deadline, as the user will enter those in separate fields.
   - Frame questions to gather details a professional would need (e.g., "What is the floor area in square meters?" for a cleaning job, or "What is the brand and model of the aircon unit?" for a repair job).
   - For each question, provide a short example answer.
   - Determine if the answer is likely to be a short 'text' response or a longer 'textarea' response.

Available Service Categories:
- Carpenter, Electrician, Plumber, Welder, Heavy Equipment Operator, HVAC Technician, Roofer, Drywaller, Sheet Metal Worker, Glazier
- Machinist, Millwright, Tool and Die Maker, CNC Operator, Automotive Technician, Diesel Mechanic, Aircraft Maintenance Technician, Elevator Technician, Boiler Operator
- Electronics Technician, Line Installer/Repairer, IT Technician/Support Specialist, Network Technician, Telecommunications Technician
- Chef/Cook, Baker/Pastry Chef, Butcher/Meat Cutter, Cosmetologist, Tattoo Artist, Tailor/Seamstress, Pet Groomer
- Commercial Driver, Crane Operator, Forklift Operator, Ship Captain or Marine Engineer, Train Conductor/Engineer
- Paramedic/EMT, Medical Laboratory Technician, Dental Technician, Pharmacy Technician, Firefighter, Security System Installer
- Hairdresser / Barber, Makeup Artist, Nail Technician / Manicurist / Pedicurist, Massage Therapist, Esthetician, Eyelash & Brow Technician, Body Waxing Technician
- Mason (Panday / Masonero), Painter (Construction), Tiler (Tile Setter), Steelman (Rebar Worker), Laborer / Helper
- Housekeeper / Kasambahay, Janitor / Utility Worker, Window Cleaner, Carpet & Upholstery Cleaner, Post-Construction Cleaner, Laundry Worker

Job Title: {{{jobTitle}}}
Job Description: {{{jobDescription}}}
`,
}) : null;

const generateJobDetailsFlow = ai ? ai.defineFlow(
  {
    name: 'generateJobDetailsFlow',
    inputSchema: GenerateJobDetailsInputSchema,
    outputSchema: GenerateJobDetailsOutputSchema,
  },
  async input => {
    const {output} = await prompt!(input);
    return output!;
  }
) : null;
