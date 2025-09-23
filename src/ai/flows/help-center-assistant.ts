
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
A: You can book a service by browsing our provider listings, selecting a provider, choosing a service from their profile, and then clicking the 'Book' button. You'll be prompted to select a date and time that works for you.

Q: What's the difference between booking a service and posting a job?
A: Booking a service is for when you've already found a provider and a specific service they offer. Posting a job is for when you have a specific task and want to receive applications from interested providers.

Q: What payment methods are accepted?
A: We support a variety of payment methods, including GCash, Maya, Debit/Credit Card, and Bank Transfer, all processed securely through our platform. Some providers may also offer cash on delivery.

Q: Is my payment secure?
A: Yes, all online payments are processed through a secure payment gateway. For manual payments, we hold the funds until you confirm the job is complete, providing an extra layer of security.

Q: Can I cancel or reschedule a booking?
A: Yes, you can cancel or request to reschedule a booking directly from your 'My Bookings' page. Please be aware of the provider's cancellation policy, as some fees may apply depending on the timing of the cancellation.

Q: How do I communicate with my service provider?
A: Once a booking is confirmed, you can use our built-in messaging system to communicate directly and securely with your provider to discuss any details.


=== For Providers & Agencies ===
Q: How do I become a provider on LocalPro?
A: Sign up for a 'Client' account first. From your profile page, you will find an option to 'Become a Provider'. Complete the verification process to start offering your services.

Q: How do I create an effective profile?
A: A great profile includes a clear photo of yourself or your business logo, a detailed bio describing your experience, and a comprehensive list of the services you offer with clear pricing. Complete our identity verification process to earn a 'Verified' badge, which greatly increases client trust.

Q: How and when do I get paid?
A: Payments for completed jobs are processed through our platform. Once a client pays for your service, the funds are held securely and become available for payout after our platform commission is deducted. You can request a payout from your Earnings dashboard.

Q: When can I request a payout?
A: Payout requests are processed every Saturday. You must have a minimum available balance of ₱400 to be eligible for a payout. Please ensure your payout details are correctly set up in your profile.

Q: What are the fees for using the platform?
A: We charge a competitive commission fee on each completed booking. The commission rate varies based on the service category and is clearly displayed before you accept any booking.

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
