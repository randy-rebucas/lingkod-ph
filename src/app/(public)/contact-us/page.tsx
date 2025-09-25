
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { sendContactForm, FormState } from "./actions";
import { useActionState, useEffect } from "react";
import type { Metadata } from "next";
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { StandardCard } from "@/components/app/standard-card";
import { designTokens } from "@/lib/design-tokens";
import { Loader2, Send, Mail, Phone, MapPin, Clock, MessageCircle, Users, Star, CheckCircle, ArrowRight, Globe, Calendar, Zap, Shield, Heart, Award, TrendingUp, UserCheck, Building, Briefcase } from "lucide-react";
import { Form, FormControl, FormField, FormItem, FormMessage } from "@/components/ui/form";


const createContactSchema = (t: any) => z.object({
  name: z.string().min(2, { message: t('nameRequired') }),
  email: z.string().email({ message: t('emailRequired') }),
  subject: z.string().min(5, { message: t('subjectRequired') }),
  message: z.string().min(10, { message: t('messageRequired') }),
});

const initialState: FormState = {
  error: null,
  message: "",
};

const contactMethods = [
  {
    title: "Email Support",
    description: "Send us a detailed message and we'll respond within 2 hours",
    icon: <Mail className="h-6 w-6" />,
    contact: "admin@localpro.asia",
    availability: "24/7 Available",
    responseTime: "Average: 2 hours",
    action: "Send Email",
    popular: true
  },
  {
    title: "Phone Support",
    description: "Speak directly with our customer service team",
    icon: <Phone className="h-6 w-6" />,
    contact: "+639179157515",
    availability: "Mon-Fri 9AM-6PM",
    responseTime: "Immediate",
    action: "Call Now",
    popular: true
  },
  {
    title: "Live Chat",
    description: "Get instant help from our support team",
    icon: <MessageCircle className="h-6 w-6" />,
    contact: "Available on website",
    availability: "24/7 Available",
    responseTime: "Average: 2 minutes",
    action: "Start Chat",
    popular: true
  },
  {
    title: "Office Visit",
    description: "Visit our office for in-person assistance",
    icon: <MapPin className="h-6 w-6" />,
    contact: "Poblacion Zone 2, Baybay City",
    availability: "Mon-Fri 9AM-5PM",
    responseTime: "By Appointment",
    action: "Schedule Visit",
    popular: false
  }
];

const businessHours = [
  { day: "Monday - Friday", hours: "9:00 AM - 6:00 PM", status: "Open" },
  { day: "Saturday", hours: "10:00 AM - 4:00 PM", status: "Limited" },
  { day: "Sunday", hours: "Closed", status: "Closed" }
];

const faqData = [
  {
    question: "How quickly will I receive a response?",
    answer: "We typically respond to emails within 2 hours during business hours, and within 24 hours on weekends. Phone calls are answered immediately during business hours.",
    category: "Response Time"
  },
  {
    question: "What's the best way to reach you?",
    answer: "For urgent matters, call us directly. For detailed inquiries, email is best. For quick questions, try our live chat feature.",
    category: "Contact Methods"
  },
  {
    question: "Do you offer support in Filipino?",
    answer: "Yes! Our team is fluent in both English and Filipino. We're happy to assist you in your preferred language.",
    category: "Language Support"
  },
  {
    question: "Can I visit your office?",
    answer: "Absolutely! We welcome office visits by appointment. Please call ahead to schedule a convenient time.",
    category: "Office Visits"
  },
  {
    question: "What if I have a technical issue?",
    answer: "For technical problems, please contact our support team with as much detail as possible. We'll escalate to our technical team if needed.",
    category: "Technical Support"
  },
  {
    question: "Do you have emergency support?",
    answer: "For urgent service-related emergencies, call our hotline. For non-urgent matters, email or live chat is preferred.",
    category: "Emergency Support"
  }
];

const testimonials = [
  {
    name: "Maria Santos",
    role: "Homeowner",
    content: "The customer service team was incredibly helpful when I had issues with my booking. They resolved everything quickly and professionally.",
    rating: 5,
    avatar: "MS"
  },
  {
    name: "Juan Dela Cruz",
    role: "Service Provider",
    content: "LocalPro's support team helped me set up my provider account and answered all my questions. Great service!",
    rating: 5,
    avatar: "JD"
  },
  {
    name: "Ana Rodriguez",
    role: "Business Owner",
    content: "Excellent communication and quick response times. The team really cares about their customers.",
    rating: 5,
    avatar: "AR"
  }
];

export default function ContactUsPage() {
  const { toast } = useToast();
  const [state, formAction, isPending] = useActionState(sendContactForm, initialState);
  const t = useTranslations('ContactUs');
  const contactSchema = createContactSchema(t);
  
  type ContactFormValues = z.infer<typeof contactSchema>;

  const form = useForm<ContactFormValues>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      subject: "",
      message: "",
    },
  });

  useEffect(() => {
    if (state.message) {
      toast({
        title: state.error ? t('error') : t('success'),
        description: state.message,
        variant: state.error ? "destructive" : "default",
      });
      if (!state.error) {
        form.reset();
      }
    }
  }, [state, toast, form, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
        <div className="container relative">
          <div className="mx-auto max-w-4xl text-center">
            <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
              <Star className="w-4 h-4 mr-2" />
              We're Here to Help
            </Badge>
            <h1 className={`text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent ${designTokens.typography.pageTitle}`}>
              Contact Us
            </h1>
            <p className={`text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12 ${designTokens.typography.pageDescription}`}>
              Get in touch with our friendly support team. Whether you have questions, need help, or want to share feedback,
              we're here to make your LocalPro experience exceptional.
            </p>
            <div className="flex flex-col sm:flex-row justify-center gap-4">
              <Button asChild size="lg" className={`h-14 px-8 text-lg ${designTokens.effects.buttonGlow}`}>
                <a href="#contact-form">
                  Send Message <ArrowRight className="ml-2 h-5 w-5" />
                </a>
              </Button>
              <Button asChild size="lg" variant="outline" className={`h-14 px-8 text-lg border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300 ${designTokens.effects.buttonGlow}`}>
                <a href="tel:+639179157515">
                  Call Now
                </a>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <div className="container py-16">
        <div className="max-w-7xl mx-auto space-y-16">
          {/* Contact Methods */}
          <section>
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold font-headline mb-4 ${designTokens.typography.sectionTitle}`}>Choose Your Preferred Contact Method</h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${designTokens.typography.sectionDescription}`}>
                We offer multiple ways to get in touch. Pick the method that works best for you.
              </p>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {contactMethods.map((method, index) => (
                <StandardCard key={index} variant="elevated" className="group hover:-translate-y-2 transition-all duration-300 relative">
                  {method.popular && (
                    <div className="absolute -top-2 -right-2 bg-primary text-primary-foreground text-xs px-2 py-1 rounded-full font-medium">
                      Popular
                    </div>
                  )}
                  <CardContent className="p-6 text-center">
                    <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4 group-hover:bg-primary/20 transition-colors">
                      {method.icon}
                    </div>
                    <h3 className={`font-semibold text-lg mb-2 ${designTokens.typography.cardTitle}`}>{method.title}</h3>
                    <p className={`text-muted-foreground text-sm mb-4 ${designTokens.typography.cardDescription}`}>{method.description}</p>
                    <div className="space-y-2 mb-4">
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {method.availability}
                      </div>
                      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                        <Zap className="h-3 w-3" />
                        {method.responseTime}
                      </div>
                    </div>
                    <Button size="sm" className={`w-full ${designTokens.effects.buttonGlow}`}>
                      {method.action}
                    </Button>
                  </CardContent>
                </StandardCard>
              ))}
            </div>
          </section>

          {/* Main Contact Section */}
          <section>
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              {/* Contact Information & Business Hours */}
              <div className="space-y-8">
                <div>
                  <h2 className={`text-3xl font-bold font-headline mb-6 ${designTokens.typography.sectionTitle}`}>Get in Touch</h2>
                  <p className={`text-muted-foreground leading-relaxed mb-8 ${designTokens.typography.sectionDescription}`}>
                    We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                  </p>
                </div>
                
                {/* Contact Details */}
                <div className="space-y-6">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Mail className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Email</h3>
                      <p className="text-muted-foreground">admin@localpro.asia</p>
                      <p className="text-xs text-muted-foreground mt-1">24/7 Available • 2hr avg response</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <Phone className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Phone</h3>
                      <p className="text-muted-foreground">+639179157515</p>
                      <p className="text-xs text-muted-foreground mt-1">Mon-Fri 9AM-6PM • Immediate response</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                      <MapPin className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold mb-1">Office Address</h3>
                      <p className="text-muted-foreground">
                        Poblacion Zone 2<br />
                        A Bonifacio Street<br />
                        Baybay City, Leyte<br />
                        Philippines 6530
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">Mon-Fri 9AM-5PM • By appointment</p>
                    </div>
                  </div>
                </div>

                {/* Business Hours */}
                <StandardCard variant="elevated" title="Business Hours" className="bg-background/60 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Calendar className="h-5 w-5 text-primary" />
                      Business Hours
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {businessHours.map((schedule, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <span className={`text-sm font-medium ${designTokens.typography.cardTitle}`}>{schedule.day}</span>
                          <div className="flex items-center gap-2">
                            <span className={`text-sm text-muted-foreground ${designTokens.typography.cardDescription}`}>{schedule.hours}</span>
                            <span className={`text-xs px-2 py-1 rounded-full ${
                              schedule.status === 'Open' ? 'bg-green-100 text-green-800' :
                              schedule.status === 'Limited' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {schedule.status}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </StandardCard>
              </div>

              {/* Enhanced Contact Form */}
              <StandardCard variant="elevated" title={t('sendMessage')} description={t('messageDescription')} className="bg-background/60 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className={`text-2xl font-bold ${designTokens.typography.sectionTitle}`}>{t('sendMessage')}</CardTitle>
                  <CardDescription className={`text-base ${designTokens.typography.sectionDescription}`}>{t('messageDescription')}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form action={formAction} className="space-y-6">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="name"
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor="name">{t('name')}</Label>
                              <FormControl>
                                <Input id="name" placeholder={t('namePlaceholder')} {...field} className="h-12" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        <FormField
                          control={form.control}
                          name="email"
                          render={({ field }) => (
                            <FormItem>
                              <Label htmlFor="email">{t('email')}</Label>
                              <FormControl>
                                <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...field} className="h-12" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="subject">{t('subject')}</Label>
                            <FormControl>
                              <Input id="subject" placeholder={t('subjectPlaceholder')} {...field} className="h-12" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="message"
                        render={({ field }) => (
                          <FormItem>
                            <Label htmlFor="message">{t('message')}</Label>
                            <FormControl>
                              <Textarea id="message" placeholder={t('messagePlaceholder')} {...field} rows={6} className="resize-none" />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <Button type="submit" className={`w-full h-12 text-lg ${designTokens.effects.buttonGlow}`} disabled={isPending}>
                        {isPending ? (
                          <>
                            <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                            {t('sending')}
                          </>
                        ) : (
                          <>
                            <Send className="mr-2 h-5 w-5" />
                            {t('submit')}
                          </>
                        )}
                      </Button>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            </div>
          </section>

          {/* FAQ Section */}
          <section>
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold font-headline mb-4 ${designTokens.typography.sectionTitle}`}>Frequently Asked Questions</h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${designTokens.typography.sectionDescription}`}>
                Quick answers to common questions about contacting us and getting support.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {faqData.map((faq, index) => (
                <StandardCard key={index} variant="elevated" className="group hover:shadow-glow/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <h3 className={`font-semibold text-lg mb-3 ${designTokens.typography.cardTitle}`}>{faq.question}</h3>
                    <p className={`text-muted-foreground leading-relaxed mb-3 ${designTokens.typography.cardDescription}`}>{faq.answer}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                        {faq.category}
                      </span>
                    </div>
                  </CardContent>
                </StandardCard>
              ))}
            </div>
          </section>

          {/* Testimonials */}
          <section>
            <div className="text-center mb-12">
              <h2 className={`text-3xl font-bold font-headline mb-4 ${designTokens.typography.sectionTitle}`}>What Our Customers Say</h2>
              <p className={`text-lg text-muted-foreground max-w-2xl mx-auto ${designTokens.typography.sectionDescription}`}>
                Hear from satisfied customers about their experience with our support team.
              </p>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <StandardCard key={index} variant="elevated" className="group hover:shadow-glow/20 transition-all duration-300">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-1 mb-4">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-4 w-4 fill-primary text-primary" />
                      ))}
                    </div>
                    <p className={`text-muted-foreground leading-relaxed mb-4 ${designTokens.typography.cardDescription}`}>"{testimonial.content}"</p>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center font-semibold text-primary">
                        {testimonial.avatar}
                      </div>
                      <div>
                        <h4 className={`font-semibold text-sm ${designTokens.typography.cardTitle}`}>{testimonial.name}</h4>
                        <p className={`text-xs text-muted-foreground ${designTokens.typography.cardDescription}`}>{testimonial.role}</p>
                      </div>
                    </div>
                  </CardContent>
                </StandardCard>
              ))}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
