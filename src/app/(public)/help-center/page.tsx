
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, ArrowRight } from "lucide-react";
import Link from "next/link";

const clientFaqs = [
  {
    question: "How do I book a service?",
    answer: "You can book a service by browsing our provider listings, selecting a provider, choosing a service, and then clicking the 'Book' button. You'll be prompted to select a date and time that works for you.",
  },
  {
    question: "What payment methods are accepted?",
    answer: "We support a variety of payment methods, including GCash, Maya, Debit/Credit Card, and Bank Transfer, all processed securely through our platform.",
  },
  {
    question: "Can I cancel or reschedule a booking?",
    answer: "Yes, you can cancel or request to reschedule a booking directly from your 'My Bookings' page. Please be aware of the provider's cancellation policy, as some fees may apply depending on the timing of the cancellation.",
  },
  {
    question: "How do I communicate with my service provider?",
    answer: "Once a booking is confirmed, you can use our built-in messaging system to communicate directly and securely with your provider to discuss any details.",
  },
];

const providerFaqs = [
  {
    question: "How do I become a provider on LingkodPH?",
    answer: "Simply sign up for a 'Provider' or 'Agency' account. You'll then be guided through setting up your profile, adding your services, and completing our verification process to build trust with clients.",
  },
  {
    question: "How and when do I get paid?",
    answer: "Payments for completed jobs are processed through our platform. Once a client pays for your service, the funds are held securely and transferred to your account after deducting our platform commission. You can request a payout from your Earnings dashboard.",
  },
  {
    question: "What are the fees for using the platform?",
    answer: "We charge a competitive commission fee on each completed booking. We also offer optional subscription plans for providers and agencies that provide access to advanced features like invoicing, analytics, and lower commission rates. You can find more details on our Subscription page.",
  },
  {
    question: "How can I improve my ranking and get more bookings?",
    answer: "High-quality service, positive client reviews, a complete and professional profile, and quick response times to inquiries all contribute to better visibility on our platform. Becoming a verified provider also significantly increases trust.",
  },
];


export default function HelpCenterPage() {
  return (
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">Help Center</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          Find answers to your questions and get support.
        </p>
         <div className="relative mt-8 max-w-lg mx-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for answers..."
              className="w-full rounded-full h-12 pl-12 pr-4 shadow-sm"
            />
          </div>
      </div>

      <div className="mx-auto max-w-3xl space-y-12 mt-16">
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">For Clients</h2>
          <Accordion type="single" collapsible className="w-full">
            {clientFaqs.map((faq, index) => (
              <AccordionItem value={`client-${index}`} key={index}>
                <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        
        <div>
          <h2 className="text-2xl font-bold mb-6 text-center">For Providers & Agencies</h2>
           <Accordion type="single" collapsible className="w-full">
            {providerFaqs.map((faq, index) => (
              <AccordionItem value={`provider-${index}`} key={index}>
                <AccordionTrigger className="text-lg text-left">{faq.question}</AccordionTrigger>
                <AccordionContent className="text-base text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
      
       <Card className="mt-20 max-w-3xl mx-auto bg-secondary">
          <CardHeader className="text-center">
            <MessageCircle className="mx-auto h-12 w-12 text-primary mb-4" />
            <CardTitle className="text-2xl">Can't find an answer?</CardTitle>
            <p className="text-muted-foreground">Our support team is here to help.</p>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Button asChild>
              <Link href="/contact-us">
                Contact Support <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </CardContent>
        </Card>

    </div>
  );
}
