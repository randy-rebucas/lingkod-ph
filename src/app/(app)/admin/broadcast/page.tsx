
"use client";

import { useState } from "react";
import { useAuth } from "@/context/auth-context";
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Send, Radio } from "lucide-react";
import { sendBroadcastAction, sendCampaignEmailAction } from "./actions";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function BroadcastPage() {
    const { user, userRole } = useAuth();
    const { toast } = useToast();
    const t = useTranslations('Broadcast');
    
    // State for banner broadcast
    const [bannerMessage, setBannerMessage] = useState("");
    const [isSendingBanner, setIsSendingBanner] = useState(false);
    
    // State for email campaign
    const [emailSubject, setEmailSubject] = useState("");
    const [emailMessage, setEmailMessage] = useState("");
    const [isSendingEmail, setIsSendingEmail] = useState(false);

    const handleSendBanner = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }
        setIsSendingBanner(true);
        const result = await sendBroadcastAction(bannerMessage, { id: user.uid, name: user.displayName });

        toast({
            title: result.error ? 'Error' : 'Broadcast Sent!',
            description: result.message,
            variant: result.error ? "destructive" : "default"
        });

        if (!result.error) {
            setBannerMessage("");
        }

        setIsSendingBanner(false);
    };

    const handleSendEmail = async () => {
        if (!user) {
            toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in.' });
            return;
        }
        setIsSendingEmail(true);
        const result = await sendCampaignEmailAction({ subject: emailSubject, message: emailMessage }, { id: user.uid, name: user.displayName });

        toast({
            title: result.error ? 'Error' : 'Email Campaign Sent!',
            description: result.message,
            variant: result.error ? "destructive" : "default"
        });

        if (!result.error) {
            setEmailSubject("");
            setEmailMessage("");
        }
        setIsSendingEmail(false);
    };


    if (userRole !== 'admin') {
        return (
            <div className="container space-y-8">
                <div className=" mx-auto">
                    <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                        <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                            <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">Access Denied</CardTitle>
                            <CardDescription>This page is for administrators only.</CardDescription>
                        </CardHeader>
                    </Card>
                </div>
            </div>
        );
    }

    return (
        <div className="container space-y-8">
             <div className=" mx-auto">
                <h1 className="text-3xl font-bold font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('BroadcastCenterTitle')}</h1>
                <p className="text-muted-foreground">
                    {t('BroadcastCenterDescription')}
                </p>
            </div>
            <div className=" mx-auto">
                <Tabs defaultValue="banner">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="banner">{t('SiteBannerTab')}</TabsTrigger>
                        <TabsTrigger value="email">{t('EmailCampaignTab')}</TabsTrigger>
                    </TabsList>
                    <TabsContent value="banner" className="mt-4">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('CreateBroadcastBannerTitle')}</CardTitle>
                                <CardDescription>{t('CreateBroadcastBannerDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                <Textarea 
                                    placeholder={t('BannerMessagePlaceholder')}
                                    rows={5}
                                    value={bannerMessage}
                                    onChange={(e) => setBannerMessage(e.target.value)}
                                />
                                <Button onClick={handleSendBanner} disabled={isSendingBanner} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                    {isSendingBanner ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Radio className="mr-2 h-4 w-4" />}
                                    {isSendingBanner ? t('SendingBanner') : t('SendBanner')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                     <TabsContent value="email" className="mt-4">
                        <Card className="shadow-soft border-0 bg-background/80 backdrop-blur-sm">
                            <CardHeader className="border-b border-border/50 bg-gradient-to-r from-background/50 to-muted/20">
                                <CardTitle className="font-headline bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">{t('CreateEmailCampaignTitle')}</CardTitle>
                                <CardDescription>{t('CreateEmailCampaignDescription')}</CardDescription>
                            </CardHeader>
                            <CardContent className="space-y-4">
                                 <div className="space-y-2">
                                    <Label htmlFor="subject">{t('EmailSubjectLabel')}</Label>
                                    <Input 
                                        id="subject"
                                        placeholder={t('EmailSubjectPlaceholder')}
                                        value={emailSubject}
                                        onChange={(e) => setEmailSubject(e.target.value)}
                                    />
                                </div>
                                 <div className="space-y-2">
                                    <Label htmlFor="email-message">{t('EmailMessageLabel')}</Label>
                                    <Textarea 
                                        id="email-message"
                                        placeholder={t('EmailMessagePlaceholder')}
                                        rows={8}
                                        value={emailMessage}
                                        onChange={(e) => setEmailMessage(e.target.value)}
                                    />
                                </div>
                                <Button onClick={handleSendEmail} disabled={isSendingEmail} className="shadow-soft hover:shadow-glow/20 transition-all duration-300 border-2 hover:bg-primary hover:text-primary-foreground">
                                    {isSendingEmail ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                                    {isSendingEmail ? t('SendingEmail') : t('SendEmailToProviders')}
                                </Button>
                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}
