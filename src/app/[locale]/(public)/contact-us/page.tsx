
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useToast } from "@/hooks/use-toast";
import { sendContactForm, FormState } from "./actions";
import { useActionState, useEffect } from "react";
import { useTranslations } from 'next-intl';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Loader2, Send } from "lucide-react";
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
    <div className="container py-12 md:py-24 lg:py-32">
      <div className="mx-auto max-w-3xl text-center">
        <h1 className="text-4xl font-bold tracking-tight sm:text-5xl font-headline">{t('title')}</h1>
        <p className="mt-6 text-lg leading-8 text-muted-foreground">
          {t('subtitle')}
        </p>
      </div>

      <Card className="mt-12 max-w-xl mx-auto">
        <CardHeader>
          <CardTitle>{t('sendMessage')}</CardTitle>
          <CardDescription>{t('messageDescription')}</CardDescription>
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
                        <Input id="name" placeholder={t('namePlaceholder')} {...field} />
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
                        <Input id="email" type="email" placeholder={t('emailPlaceholder')} {...field} />
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
                      <Input id="subject" placeholder={t('subjectPlaceholder')} {...field} />
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
                      <Textarea id="message" placeholder={t('messagePlaceholder')} {...field} rows={5} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    {t('sending')}
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    {t('submit')}
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}
