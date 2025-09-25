'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Mail, Phone, MapPin, Clock, Send, MessageSquare, CheckCircle, AlertCircle, Loader2, Star, Users, Heart } from 'lucide-react';
import { useTranslations } from 'next-intl';
import { StandardCard } from '@/components/app/standard-card';
import { designTokens } from '@/lib/design-tokens';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';

export default function ContactUsPage() {
    const { toast } = useToast();
    const t = useTranslations('ContactUs');
    
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
        inquiryType: ''
    });
    
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formErrors, setFormErrors] = useState<Record<string, string>>({});
    const [isSuccess, setIsSuccess] = useState(false);

    const validateForm = () => {
        const errors: Record<string, string> = {};
        
        if (!formData.name.trim()) {
            errors.name = 'Name is required';
        }
        
        if (!formData.email.trim()) {
            errors.email = 'Email is required';
        } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
            errors.email = 'Please enter a valid email address';
        }
        
        if (!formData.subject.trim()) {
            errors.subject = 'Subject is required';
        }
        
        if (!formData.message.trim()) {
            errors.message = 'Message is required';
        } else if (formData.message.trim().length < 10) {
            errors.message = 'Message must be at least 10 characters long';
        }
        
        setFormErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
        
        // Clear error when user starts typing
        if (formErrors[name]) {
            setFormErrors(prev => ({
                ...prev,
                [name]: ''
            }));
        }
    };

    const handleSelectChange = (value: string) => {
        setFormData(prev => ({
            ...prev,
            inquiryType: value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            toast({
                variant: "destructive",
                title: "Validation Error",
                description: "Please fix the errors in the form before submitting.",
            });
            return;
        }
        
        setIsSubmitting(true);
        setFormErrors({});

        try {
            // Here you would typically send the form data to your backend
            // For now, we'll just simulate a successful submission
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            setIsSuccess(true);
            toast({
                title: "Message Sent Successfully!",
                description: "Thank you for contacting us. We'll get back to you within 24 hours.",
            });

            // Reset form
            setFormData({
                name: '',
                email: '',
                phone: '',
                subject: '',
                message: '',
                inquiryType: ''
            });
            
            // Reset success state after 3 seconds
            setTimeout(() => setIsSuccess(false), 3000);
        } catch (error) {
            toast({
                variant: "destructive",
                title: "Error",
                description: "Failed to send message. Please try again or contact us directly.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
            {/* Hero Section */}
            <section className="relative py-20 lg:py-32 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />
                <div className="container relative">
                    <div className="mx-auto max-w-4xl text-center">
                        <Badge variant="secondary" className="mb-6 px-4 py-2 text-sm font-medium">
                            <MessageSquare className="w-4 h-4 mr-2" />
                            24/7 Support Available
                        </Badge>
                        <h1 className="text-5xl lg:text-7xl font-bold font-headline mb-8 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
                            Get in Touch
                        </h1>
                        <p className="text-xl text-muted-foreground leading-relaxed max-w-3xl mx-auto mb-12">
                            Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
                        </p>
                    </div>
                </div>
            </section>

            {/* Stats Section */}
            <section className="py-16 bg-muted/30">
                <div className="container">
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">24h</div>
                            <div className="text-muted-foreground font-medium">Response Time</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">99%</div>
                            <div className="text-muted-foreground font-medium">Satisfaction Rate</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">10K+</div>
                            <div className="text-muted-foreground font-medium">Happy Customers</div>
                        </div>
                        <div className="text-center">
                            <div className="text-4xl lg:text-5xl font-bold text-primary mb-2">4.9</div>
                            <div className="text-muted-foreground font-medium">Average Rating</div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Main Content */}
            <section className="py-20">
                <div className="container">
                    <div className={cn(designTokens.layout.cardGrid2, "max-w-7xl mx-auto")}>
                {/* Contact Form */}
                <StandardCard 
                    title="Send us a Message"
                    description="Fill out the form below and we'll get back to you within 24 hours."
                    variant="elevated"
                >
                    <form onSubmit={handleSubmit} className={designTokens.spacing.section}>
                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="name" className="flex items-center gap-2">
                                    Full Name *
                                    {formErrors.name && <AlertCircle className="h-4 w-4 text-destructive" />}
                                </Label>
                                <Input
                                    id="name"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleInputChange}
                                    placeholder="Your full name"
                                    className={cn(formErrors.name && "border-destructive focus-visible:ring-destructive")}
                                    required
                                />
                                {formErrors.name && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {formErrors.name}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="email" className="flex items-center gap-2">
                                    Email Address *
                                    {formErrors.email && <AlertCircle className="h-4 w-4 text-destructive" />}
                                </Label>
                                <Input
                                    id="email"
                                    name="email"
                                    type="email"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                    placeholder="your.email@admin.localpro.asia"
                                    className={cn(formErrors.email && "border-destructive focus-visible:ring-destructive")}
                                    required
                                />
                                {formErrors.email && (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {formErrors.email}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <Input
                                    id="phone"
                                    name="phone"
                                    type="tel"
                                    value={formData.phone}
                                    onChange={handleInputChange}
                                    placeholder="+1 (555) 123-4567"
                                />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="inquiryType">Inquiry Type</Label>
                                <Select value={formData.inquiryType} onValueChange={handleSelectChange}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select inquiry type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="general">General Question</SelectItem>
                                        <SelectItem value="support">Technical Support</SelectItem>
                                        <SelectItem value="billing">Billing Inquiry</SelectItem>
                                        <SelectItem value="partnership">Partnership</SelectItem>
                                        <SelectItem value="feedback">Feedback</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="subject" className="flex items-center gap-2">
                                Subject *
                                {formErrors.subject && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </Label>
                            <Input
                                id="subject"
                                name="subject"
                                value={formData.subject}
                                onChange={handleInputChange}
                                placeholder="Brief subject of your message"
                                className={cn(formErrors.subject && "border-destructive focus-visible:ring-destructive")}
                                required
                            />
                            {formErrors.subject && (
                                <p className="text-sm text-destructive flex items-center gap-1">
                                    <AlertCircle className="h-3 w-3" />
                                    {formErrors.subject}
                                </p>
                            )}
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="message" className="flex items-center gap-2">
                                Message *
                                {formErrors.message && <AlertCircle className="h-4 w-4 text-destructive" />}
                            </Label>
                            <Textarea
                                id="message"
                                name="message"
                                value={formData.message}
                                onChange={handleInputChange}
                                placeholder="Tell us more about your inquiry..."
                                rows={6}
                                className={cn(formErrors.message && "border-destructive focus-visible:ring-destructive")}
                                required
                            />
                            <div className="flex justify-between items-center">
                                {formErrors.message ? (
                                    <p className="text-sm text-destructive flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        {formErrors.message}
                                    </p>
                                ) : (
                                    <p className="text-xs text-muted-foreground">
                                        Minimum 10 characters
                                    </p>
                                )}
                                <p className="text-xs text-muted-foreground">
                                    {formData.message.length}/500
                                </p>
                            </div>
                        </div>

                        <Button 
                            type="submit" 
                            className={cn(
                                "w-full transition-all duration-300",
                                isSuccess 
                                    ? "bg-green-600 hover:bg-green-700" 
                                    : designTokens.effects.buttonGlow
                            )}
                            disabled={isSubmitting || isSuccess}
                            size="lg"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                    Sending Message...
                                </>
                            ) : isSuccess ? (
                                <>
                                    <CheckCircle className="h-4 w-4 mr-2" />
                                    Message Sent!
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4 mr-2" />
                                    Send Message
                                </>
                            )}
                        </Button>
                    </form>
                </StandardCard>

                {/* Contact Information */}
                <div className="space-y-6">
                    <StandardCard 
                        title="Contact Information"
                        description="Reach out to us through any of these channels"
                        variant="elevated"
                    >
                        <div className="grid gap-4">
                            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="p-3 rounded-full bg-primary/10 ring-2 ring-primary/20 flex-shrink-0">
                                    <Mail className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={designTokens.typography.cardTitle}>Email Support</h3>
                                    <p className="text-muted-foreground font-medium">admin@localpro.asia</p>
                                    <p className={designTokens.typography.cardDescription}>We'll respond within 24 hours</p>
                                    <Badge variant="secondary" className="mt-2">
                                        <CheckCircle className="h-3 w-3 mr-1" />
                                        Verified
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="p-3 rounded-full bg-primary/10 ring-2 ring-primary/20 flex-shrink-0">
                                    <Phone className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={designTokens.typography.cardTitle}>Phone Support</h3>
                                    <p className="text-muted-foreground font-medium">+639179157515</p>
                                    <p className={designTokens.typography.cardDescription}>Mon-Fri 9AM-6PM PST</p>
                                    <Badge variant="outline" className="mt-2">
                                        <Clock className="h-3 w-3 mr-1" />
                                        Business Hours
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="p-3 rounded-full bg-primary/10 ring-2 ring-primary/20 flex-shrink-0">
                                    <MapPin className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={designTokens.typography.cardTitle}>Office Location</h3>
                                    <p className="text-muted-foreground">
                                        A. Bonifacio St<br />
                                        Baybay City, Leyte<br />
                                        Philippines 6521
                                    </p>
                                    <Badge variant="secondary" className="mt-2">
                                        <MapPin className="h-3 w-3 mr-1" />
                                        Leyte
                                    </Badge>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 rounded-lg hover:bg-muted/30 transition-colors">
                                <div className="p-3 rounded-full bg-primary/10 ring-2 ring-primary/20 flex-shrink-0">
                                    <Clock className="h-6 w-6 text-primary" />
                                </div>
                                <div className="flex-1 min-w-0">
                                    <h3 className={designTokens.typography.cardTitle}>Business Hours</h3>
                                    <p className="text-muted-foreground">
                                        Monday - Friday: 9:00 AM - 6:00 PM<br />
                                        Saturday: 10:00 AM - 4:00 PM<br />
                                        Sunday: Closed
                                    </p>
                                    <Badge variant="outline" className="mt-2">
                                        <Clock className="h-3 w-3 mr-1" />
                                        PST Timezone
                                    </Badge>
                                </div>
                            </div>
                        </div>
                    </StandardCard>


                    {/* FAQ Section */}
                    <StandardCard 
                        title="Frequently Asked Questions"
                        variant="elevated"
                    >
                        <div className="space-y-4">
                            <div className="p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200">
                                <h4 className={designTokens.typography.cardTitle}>How quickly do you respond?</h4>
                                <p className={designTokens.typography.cardDescription}>
                                    We typically respond to all inquiries within 24 hours during business days. For urgent matters, you can call us directly.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200">
                                <h4 className={designTokens.typography.cardTitle}>Do you offer phone support?</h4>
                                <p className={designTokens.typography.cardDescription}>
                                    Yes, we provide phone support during our business hours (Mon-Fri 9AM-6PM PST) for urgent matters and complex inquiries.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200">
                                <h4 className={designTokens.typography.cardTitle}>What information should I include?</h4>
                                <p className={designTokens.typography.cardDescription}>
                                    Please provide as much detail as possible about your inquiry, including your account information if applicable, to help us assist you better.
                                </p>
                            </div>
                            <div className="p-4 rounded-lg border border-border/50 hover:border-primary/30 hover:bg-muted/20 transition-all duration-200">
                                <h4 className={designTokens.typography.cardTitle}>Can I visit your office?</h4>
                                <p className={designTokens.typography.cardDescription}>
                                    Yes, our office is open for visits by appointment. Please contact us in advance to schedule a meeting with our team.
                                </p>
                            </div>
                        </div>
                    </StandardCard>
                    </div>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-20 bg-gradient-to-br from-primary/5 to-accent/5">
                <div className="container">
                    <StandardCard 
                        title=""
                        variant="elevated" 
                        className="max-w-4xl mx-auto bg-gradient-to-br from-primary/5 to-accent/5"
                    >
                        <div className="text-center pb-8">
                            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                                <MessageSquare className="h-8 w-8 text-primary" />
                            </div>
                            <h2 className="text-3xl font-bold font-headline mb-6">Still Have Questions?</h2>
                            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                                Can't find what you're looking for? Our support team is here to help you with any questions or concerns you may have.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-center gap-4">
                                <Button asChild size="lg" className="h-12 px-8 shadow-glow hover:shadow-glow/50 transition-all duration-300">
                                    <a href="mailto:admin@localpro.asia">
                                        Email Support <Mail className="ml-2 h-5 w-5" />
                                    </a>
                                </Button>
                                <Button asChild size="lg" variant="outline" className="h-12 px-8 border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300">
                                    <a href="tel:+63212345678">
                                        Call Us <Phone className="ml-2 h-5 w-5" />
                                    </a>
                                </Button>
                            </div>
                        </div>
                    </StandardCard>
                </div>
            </section>
        </div>
    );
}