
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
import { Badge } from "@/components/ui/badge";
import { Search, MessageCircle, ArrowRight, Bot, Loader2, User, FilePenLine, UserCheck, Building, Phone, Mail, Clock, HelpCircle, BookOpen, Video, Download, ExternalLink, ChevronRight, Star, Zap, Shield, CreditCard, Calendar, MapPin, Settings, Users, TrendingUp } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { helpCenterAssistant } from "@/ai/flows/help-center-assistant";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/auth-context";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useTranslations } from 'next-intl';


const clientFaqs = [
  {
    question: "How do I book a service?",
    answer: "You can book a service by browsing our provider listings, selecting a provider, choosing a service from their profile, and then clicking the 'Book' button. You'll be prompted to select a date and time that works for you.",
    category: "Booking",
    popular: true
  },
  {
    question: "What's the difference between booking a service and posting a job?",
    answer: "Booking a service is for when you've already found a provider and a specific service they offer. Posting a job is for when you have a specific task and want to receive applications from interested providers.",
    category: "Booking",
    popular: false
  },
  {
    question: "What payment methods are accepted?",
    answer: "We support a variety of payment methods, including GCash, Maya, Debit/Credit Card, and Bank Transfer, all processed securely through our platform. Some providers may also offer cash on delivery.",
    category: "Payment",
    popular: true
  },
  {
    question: "Is my payment secure?",
    answer: "Yes, all online payments are processed through a secure payment gateway. For manual payments, we hold the funds until you confirm the job is complete, providing an extra layer of security.",
    category: "Payment",
    popular: true
  },
  {
    question: "Can I cancel or reschedule a booking?",
    answer: "Yes, you can cancel or request to reschedule a booking directly from your 'My Bookings' page. Please be aware of the provider's cancellation policy, as some fees may apply depending on the timing of the cancellation.",
    category: "Booking",
    popular: false
  },
  {
    question: "How do I communicate with my service provider?",
    answer: "Once a booking is confirmed, you can use our built-in messaging system to communicate directly and securely with your provider to discuss any details.",
    category: "Communication",
    popular: false
  },
  {
    question: "How do I leave a review for a service?",
    answer: "After your service is completed, you'll receive an email with a link to leave a review. You can also access the review option from your 'My Bookings' page. Reviews help other clients make informed decisions.",
    category: "Reviews",
    popular: false
  },
  {
    question: "What if I'm not satisfied with the service?",
    answer: "If you're not satisfied with the service, please contact our support team within 24 hours. We'll work with you and the provider to resolve the issue, including potential refunds or service corrections.",
    category: "Support",
    popular: true
  },
  {
    question: "How do I track my booking status?",
    answer: "You can track your booking status in real-time from your 'My Bookings' page. You'll also receive email notifications for status updates including confirmation, provider en route, and completion.",
    category: "Booking",
    popular: false
  },
  {
    question: "Are there any service guarantees?",
    answer: "Yes, we offer a satisfaction guarantee. If you're not happy with the service quality, we'll work to make it right or provide a full refund. All providers are also insured and background-checked.",
    category: "Guarantees",
    popular: true
  }
];

const providerFaqs = [
  {
    question: "How do I become a provider on LocalPro?",
    answer: "Sign up for a 'Client' account first. From your profile page, you will find an option to 'Become a Provider'. Complete the verification process to start offering your services.",
    category: "Getting Started",
    popular: true
  },
  {
    question: "How do I create an effective profile?",
    answer: "A great profile includes a clear photo of yourself or your business logo, a detailed bio describing your experience, and a comprehensive list of the services you offer with clear pricing. Complete our identity verification process to earn a 'Verified' badge, which greatly increases client trust.",
    category: "Profile",
    popular: true
  },
  {
    question: "How and when do I get paid?",
    answer: "Payments for completed jobs are processed through our platform. Once a client pays for your service, the funds are held securely and become available for payout after our platform commission is deducted. You can request a payout from your Earnings dashboard.",
    category: "Payments",
    popular: true
  },
  {
    question: "When can I request a payout?",
    answer: "Payout requests are processed every Saturday. You must have a minimum available balance of ₱400 to be eligible for a payout. Please ensure your payout details are correctly set up in your profile.",
    category: "Payments",
    popular: false
  },
  {
    question: "What are the fees for using the platform?",
    answer: "We charge a competitive commission fee on each completed booking. The commission rate varies based on the service category and is clearly displayed before you accept any booking.",
    category: "Fees",
    popular: true
  },
  {
    question: "How can I improve my ranking and get more bookings?",
    answer: "High-quality service, positive client reviews, a complete and professional profile, and quick response times to inquiries all contribute to better visibility on our platform. Becoming a verified provider also significantly increases trust.",
    category: "Growth",
    popular: true
  },
  {
    question: "How do I manage my availability and schedule?",
    answer: "You can set your availability in your provider dashboard. Update your working hours, days off, and service areas. You can also block specific dates and times when you're not available.",
    category: "Schedule",
    popular: false
  },
  {
    question: "What happens if I need to cancel a booking?",
    answer: "If you need to cancel a booking, please do so as early as possible through your provider dashboard. Frequent cancellations may affect your ranking, so only cancel when absolutely necessary.",
    category: "Bookings",
    popular: false
  },
  {
    question: "How do I handle difficult clients or disputes?",
    answer: "Our support team is here to help resolve any issues. Contact us immediately if you encounter problems. We have a dispute resolution process to ensure fair outcomes for both parties.",
    category: "Support",
    popular: false
  },
  {
    question: "Can I offer additional services not listed on my profile?",
    answer: "Yes, you can add new services to your profile at any time. Go to your provider dashboard and update your services list. Make sure to include clear descriptions and pricing for each service.",
    category: "Services",
    popular: false
  }
];

const quickHelpResources = [
  {
    title: "Getting Started Guide",
    description: "Complete guide for new users",
    icon: <BookOpen className="h-6 w-6" />,
    link: "/guides/getting-started",
    category: "Guides"
  },
  {
    title: "Video Tutorials",
    description: "Step-by-step video guides",
    icon: <Video className="h-6 w-6" />,
    link: "/tutorials",
    category: "Tutorials"
  },
  {
    title: "Download App",
    description: "Get the mobile app",
    icon: <Download className="h-6 w-6" />,
    link: "/download",
    category: "Mobile"
  },
  {
    title: "Community Forum",
    description: "Connect with other users",
    icon: <Users className="h-6 w-6" />,
    link: "/community",
    category: "Community"
  }
];

const contactOptions = [
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: <MessageCircle className="h-6 w-6" />,
    availability: "24/7 Available",
    responseTime: "Average: 2 minutes",
    action: "Start Chat"
  },
  {
    title: "Email Support",
    description: "Send us a detailed message",
    icon: <Mail className="h-6 w-6" />,
    availability: "24/7 Available",
    responseTime: "Average: 2 hours",
    action: "Send Email"
  },
  {
    title: "Phone Support",
    description: "Speak directly with our team",
    icon: <Phone className="h-6 w-6" />,
    availability: "Mon-Fri 9AM-6PM",
    responseTime: "Immediate",
    action: "Call Now"
  },
  {
    title: "Video Call",
    description: "Schedule a screen sharing session",
    icon: <Video className="h-6 w-6" />,
    availability: "By Appointment",
    responseTime: "Same day",
    action: "Schedule Call"
  }
];

const popularTopics = [
  { title: "How to book a service", category: "Booking", popular: true },
  { title: "Payment methods accepted", category: "Payment", popular: true },
  { title: "Service guarantees", category: "Guarantees", popular: true },
  { title: "How to become a provider", category: "Getting Started", popular: true },
  { title: "Creating an effective profile", category: "Profile", popular: true },
  { title: "Getting paid as a provider", category: "Payments", popular: true }
];

type ChatMessage = {
  role: 'user' | 'assistant';
  content: string;
};

const AiChatbot = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const t = useTranslations('HelpCenter');

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
      const errorMessage: ChatMessage = { role: 'assistant', content: t('sorryError') };
      setMessages(prev => [...prev, errorMessage]);
      console.error("AI assistant error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px] flex flex-col h-[70vh]">
      <DialogHeader>
        <DialogTitle>{t('aiAssistant')}</DialogTitle>
        <DialogDescription>
          {t('aiAssistantSubtitle')}
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
            placeholder={t('askQuestion')}
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading}>{t('send')}</Button>
        </form>
      </DialogFooter>
    </DialogContent>
  )
}

const CreateTicketDialog = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('HelpCenter');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast({ variant: 'destructive', title: t('error'), description: t('mustBeLoggedIn') });
      return;
    }
    if (!subject.trim() || !message.trim()) {
      toast({ variant: 'destructive', title: t('error'), description: t('fillAllFields') });
      return;
    }
    setIsSubmitting(true);
    try {
      await addDoc(collection(db, 'tickets'), {
        userId: user.uid,
        userName: user.displayName,
        userEmail: user.email,
        subject,
        message,
        status: 'New',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      toast({ title: t('ticketSubmitted'), description: t('ticketSubmittedDesc') });
      setSubject("");
      setMessage("");
      setIsOpen(false);
    } catch (error) {
      toast({ variant: 'destructive', title: t('error'), description: t('failedToSubmit') });
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <FilePenLine className="mr-2 h-4 w-4" /> {t('createSupportTicket')}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('createTicket')}</DialogTitle>
          <DialogDescription>
            {t('createTicketDesc')}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="subject">{t('subject')}</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder={t('subjectPlaceholder')} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="message">{t('message')}</Label>
            <Textarea id="message" value={message} onChange={(e) => setMessage(e.target.value)} placeholder={t('messagePlaceholder')} rows={5} />
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? <Loader2 className="mr-2 animate-spin" /> : null}
              {t('submitTicket')}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function HelpCenterPage() {
  const t = useTranslations('HelpCenter');
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showPopularOnly, setShowPopularOnly] = useState(false);
  
  // Filter FAQs based on search and category
  const filteredClientFaqs = clientFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesPopular = !showPopularOnly || faq.popular;
    return matchesSearch && matchesCategory && matchesPopular;
  });

  const filteredProviderFaqs = providerFaqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchQuery.toLowerCase()) || 
                         faq.answer.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || faq.category === selectedCategory;
    const matchesPopular = !showPopularOnly || faq.popular;
    return matchesSearch && matchesCategory && matchesPopular;
  });

  const categories = ["all", ...new Set([...clientFaqs.map(f => f.category), ...providerFaqs.map(f => f.category)])];
  
  return (
    <Dialog>
      <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              24/7 Support Available
            </Badge>
            <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              Help Center
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
              Find instant answers to your questions, get help from our AI assistant, or connect with our support team.
            </p>

            {/* Search */}
            <div className="max-w-2xl mx-auto relative mb-8">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search for help topics, questions, or guides..."
                className="w-full rounded-full h-12 pl-12 pr-4 shadow-soft border-2 focus:border-primary transition-all duration-300"
              />
              {searchQuery && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setSearchQuery("")}
                  className="absolute right-2 top-1/2 transform -translate-y-1/2 h-8 w-8 p-0"
                >
                  ×
                </Button>
              )}
            </div>

            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                <Link href="/contact-us">
                  Contact Support <ArrowRight className="ml-2 h-5 w-5" />
                </Link>
              </Button>
              <Button asChild size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                <Link href="#quick-help">
                  Quick Help
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

        <div className="container py-16">
          <div className="max-w-6xl mx-auto space-y-16">
            {/* Quick Help Resources */}
            <section>
              <h2 className="text-3xl font-bold font-headline mb-8 text-center">Quick Help Resources</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {quickHelpResources.map((resource, index) => (
                  <Card key={index} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        {resource.icon}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{resource.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{resource.description}</p>
                      <Button variant="outline" size="sm" className="w-full">
                        <ExternalLink className="mr-2 h-4 w-4" />
                        {resource.category}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Popular Topics */}
            <section>
              <h2 className="text-3xl font-bold font-headline mb-8 text-center">Popular Topics</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                {popularTopics.map((topic, index) => (
                  <Card key={index} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-1 cursor-pointer">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-3">
                        <Star className="h-5 w-5 text-primary flex-shrink-0" />
                        <div>
                          <h4 className="font-medium text-sm">{topic.title}</h4>
                          <p className="text-xs text-muted-foreground">{topic.category}</p>
                        </div>
                        <ChevronRight className="h-4 w-4 text-muted-foreground ml-auto" />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* Contact Options */}
            <section>
              <h2 className="text-3xl font-bold font-headline mb-8 text-center">Get in Touch</h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                {contactOptions.map((option, index) => (
                  <Card key={index} className="group bg-background/60 backdrop-blur-sm border-0 shadow-soft hover:shadow-glow/20 transition-all duration-300 hover:-translate-y-2">
                    <CardContent className="p-6 text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                        {option.icon}
                      </div>
                      <h3 className="font-semibold text-lg mb-2">{option.title}</h3>
                      <p className="text-muted-foreground text-sm mb-4">{option.description}</p>
                      <div className="space-y-2 mb-4">
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Clock className="h-3 w-3" />
                          {option.availability}
                        </div>
                        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                          <Zap className="h-3 w-3" />
                          {option.responseTime}
                        </div>
                      </div>
                      <Button size="sm" className="w-full">
                        {option.action}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>

            {/* FAQ Filters */}
            <section>
              <div className="flex flex-col md:flex-row gap-4 mb-8">
                <div className="flex-1">
                  <h2 className="text-3xl font-bold font-headline mb-4">Frequently Asked Questions</h2>
                </div>
                <div className="flex gap-4">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-4 py-2 rounded-lg border border-border bg-background text-sm"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === "all" ? "All Categories" : category}
                      </option>
                    ))}
                  </select>
                  <Button
                    variant={showPopularOnly ? "default" : "outline"}
                    size="sm"
                    onClick={() => setShowPopularOnly(!showPopularOnly)}
                  >
                    <Star className="mr-2 h-4 w-4" />
                    Popular Only
                  </Button>
                </div>
              </div>

              {/* FAQ Sections */}
              <div className="space-y-12">
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold font-headline">For Clients</h3>
                    <Badge variant="secondary">{filteredClientFaqs.length} questions</Badge>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {filteredClientFaqs.map((faq, index) => (
                      <AccordionItem value={`client-${index}`} key={index} className="bg-background/60 backdrop-blur-sm border-0 shadow-soft rounded-xl px-6">
                        <AccordionTrigger className="text-lg text-left hover:no-underline py-6">
                          <div className="flex items-center gap-3">
                            {faq.popular && <Star className="h-4 w-4 text-primary flex-shrink-0" />}
                            {faq.question}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground pb-6 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
                
                <div>
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Building className="h-5 w-5 text-primary" />
                    </div>
                    <h3 className="text-2xl font-bold font-headline">For Providers</h3>
                    <Badge variant="secondary">{filteredProviderFaqs.length} questions</Badge>
                  </div>
                  <Accordion type="single" collapsible className="w-full space-y-4">
                    {filteredProviderFaqs.map((faq, index) => (
                      <AccordionItem value={`provider-${index}`} key={index} className="bg-background/60 backdrop-blur-sm border-0 shadow-soft rounded-xl px-6">
                        <AccordionTrigger className="text-lg text-left hover:no-underline py-6">
                          <div className="flex items-center gap-3">
                            {faq.popular && <Star className="h-4 w-4 text-primary flex-shrink-0" />}
                            {faq.question}
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="text-base text-muted-foreground pb-6 leading-relaxed">
                          {faq.answer}
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                </div>
              </div>
            </section>
          </div>
        </div>
        
        {/* Enhanced Support CTA */}
        <section className="py-20 bg-gradient-to-b from-muted/50 to-background">
          <div className="container">
            <Card className="max-w-5xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5 border-0 shadow-soft">
              <CardHeader className="text-center pb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                  <Bot className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-4xl font-bold font-headline">Still Need Help?</CardTitle>
                <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
                  Our AI assistant is available 24/7 to answer your questions instantly. 
                  For more complex issues, our human support team is ready to help.
                </p>
              </CardHeader>
              <CardContent className="flex flex-col sm:flex-row justify-center gap-4 pb-8">
                <DialogTrigger asChild>
                  <Button size="lg" className="h-14 px-8 text-lg shadow-glow hover:shadow-glow/50 transition-all duration-300">
                    <Bot className="mr-2 h-5 w-5" />
                    Ask AI Assistant <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </DialogTrigger>
                <CreateTicketDialog />
                <Button size="lg" variant="outline" className="h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                  <Phone className="mr-2 h-5 w-5" />
                  Call Support
                </Button>
              </CardContent>
              <div className="text-center pb-8">
                <p className="text-sm text-muted-foreground">
                  <Shield className="inline h-4 w-4 mr-1" />
                  All conversations are secure and confidential
                </p>
              </div>
            </Card>
          </div>
        </section>
      </div>
      <AiChatbot />
    </Dialog>
  );
}
