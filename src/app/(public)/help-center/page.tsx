
"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Search, MessageCircle, ArrowRight, Bot, Loader2, User } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { helpCenterAssistant } from "@/ai/flows/help-center-assistant";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";


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
    question: "How do I become a provider on LocalPro?",
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

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const AiChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const userMessage: ChatMessage = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await helpCenterAssistant({ question: input });
      const assistantMessage: ChatMessage = { role: 'assistant', content: response.answer };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: ChatMessage = { role: 'assistant', content: "Sorry, I encountered an error. Please try again." };
      setMessages(prev => [...prev, errorMessage]);
      console.error("AI assistant error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px] flex flex-col h-[70vh]">
      <DialogHeader>
        <DialogTitle>AI Assistant</DialogTitle>
        <DialogDescription>
          Ask me anything about LocalPro. I'll do my best to help!
        </DialogDescription>
      </DialogHeader>
      <ScrollArea className="flex-1 -mx-6 px-6">
        <div className="space-y-4 py-4">
          {messages.map((message, index) => (
            <div key={index} className={cn("flex items-start gap-3", message.role === 'user' ? "justify-end" : "")}>
              {message.role === 'assistant' && (
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
              )}
               <div className={cn("rounded-lg p-3 max-w-[80%] text-sm", message.role === 'user' ? "bg-secondary" : "bg-primary/10")}>
                {message.content}
              </div>
               {message.role === 'user' && (
                <Avatar className="h-8 w-8 bg-secondary text-secondary-foreground">
                  <AvatarFallback><User className="h-5 w-5"/></AvatarFallback>
                </Avatar>
              )}
            </div>
          ))}
          {isLoading && (
             <div className="flex items-start gap-3">
                <Avatar className="h-8 w-8 bg-primary text-primary-foreground">
                  <AvatarFallback><Bot className="h-5 w-5"/></AvatarFallback>
                </Avatar>
                <div className="rounded-lg p-3 bg-primary/10">
                  <Loader2 className="h-5 w-5 animate-spin" />
                </div>
            </div>
          )}
        </div>
      </ScrollArea>
      <DialogFooter>
        <form onSubmit={handleSendMessage} className="w-full flex gap-2">
          <Input 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask a question..."
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>Send</Button>
        </form>
      </DialogFooter>
    </DialogContent>
  )
}

export default function HelpCenterPage() {
  return (
    <Dialog>
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
              <Bot className="mx-auto h-12 w-12 text-primary mb-4" />
              <CardTitle className="text-2xl">Need Immediate Help?</CardTitle>
              <p className="text-muted-foreground">Try our new AI Assistant for instant answers.</p>
            </CardHeader>
            <CardContent className="flex justify-center">
               <DialogTrigger asChild>
                  <Button>
                    Ask AI Assistant <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </DialogTrigger>
            </CardContent>
          </Card>

      </div>
       <AiChatbot />
    </Dialog>
  );
}
