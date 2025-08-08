
'use server';

/**
 * @fileOverview Defines a Genkit flow for a help center AI assistant.
 * - helpCenterAssistant - A function that answers user questions based on FAQs.
 */

import { ai } from '@/ai/genkit';
import { z } from 'zod';

// Define the input schema for the flow
const HelpCenterInputSchema = z.object({
  question: z.string().describe('The user\'s question about the platform.'),
});
export type HelpCenterInput = z.infer<typeof HelpCenterInputSchema>;

// Define the output schema for the flow
const HelpCenterOutputSchema = z.object({
  answer: z.string().describe('A helpful and concise answer to the user\'s question.'),
});
export type HelpCenterOutput = z.infer<typeof HelpCenterOutputSchema>;

// This is the main function that the client-side component will call
export async function helpCenterAssistant(input: HelpCenterInput): Promise<HelpCenterOutput> {
  return helpCenterAssistantFlow(input);
}

const faqContent = `
=== For Clients ===
Q: How do I book a service?
A: You can book a service by browsing our provider listings, selecting a provider, choosing a service, and then clicking the 'Book' button. You'll be prompted to select a date and time that works for you.

Q: What payment methods are accepted?
A: We support a variety of payment methods, including GCash, Maya, Debit/Credit Card, and Bank Transfer, all processed securely through our platform.

Q: Can I cancel or reschedule a booking?
A: Yes, you can cancel or request to reschedule a booking directly from your 'My Bookings' page. Please be aware of the provider's cancellation policy, as some fees may apply depending on the timing of the cancellation.

Q: How do I communicate with my service provider?
A: Once a booking is confirmed, you can use our built-in messaging system to communicate directly and securely with your provider to discuss any details.

=== For Providers & Agencies ===
Q: How do I become a provider on LocalPro?
A: Simply sign up for a 'Provider' or 'Agency' account. You'll then be guided through setting up your profile, adding your services, and completing our verification process to build trust with clients.

Q: How and when do I get paid?
A: Payments for completed jobs are processed through our platform. Once a client pays for your service, the funds are held securely and transferred to your account after deducting our platform commission. You can request a payout from your Earnings dashboard.

Q: What are the fees for using the platform?
A: We charge a competitive commission fee on each completed booking. We also offer optional subscription plans for providers and agencies that provide access to advanced features like invoicing, analytics, and lower commission rates. You can find more details on our Subscription page.

Q: How can I improve my ranking and get more bookings?
A: High-quality service, positive client reviews, a complete and professional profile, and quick response times to inquiries all contribute to better visibility on our platform. Becoming a verified provider also significantly increases trust.
`;

// Define the prompt for the assistant
const assistantPrompt = ai.definePrompt({
  name: 'helpCenterAssistantPrompt',
  input: { schema: HelpCenterInputSchema },
  output: { schema: HelpCenterOutputSchema },
  prompt: `
    You are a friendly and helpful AI assistant for LocalPro, a service marketplace.
    Your goal is to answer user questions based *only* on the provided FAQ content.
    If the answer is not in the FAQ, politely say that you don't have the information and suggest they contact support.

    FAQ Content:
    ${faqContent}

    User's Question:
    {{{question}}}
  `,
});

// Define the flow that runs the prompt
const helpCenterAssistantFlow = ai.defineFlow(
  {
    name: 'helpCenterAssistantFlow',
    inputSchema: HelpCenterInputSchema,
    outputSchema: HelpCenterOutputSchema,
  },
  async (input) => {
    const { output } = await assistantPrompt(input);
    return output!;
  }
);
