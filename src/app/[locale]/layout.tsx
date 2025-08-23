
import type {Metadata} from 'next';
import '../globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
import { PT_Sans } from 'next/font/google';
import Script from 'next/script';
import {NextIntlClientProvider, useMessages} from 'next-intl';

const ptSans = PT_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
  weight: ['400', '700'],
})


export const metadata: Metadata = {
  title: {
    default: 'Lingkod PH | Find Trusted Local Service Providers in the Philippines',
    template: '%s | Lingkod PH',
  },
  description: 'Lingkod PH is the leading platform for connecting clients with trusted, verified local service providers in the Philippines. From plumbing and electrical work to cleaning and beauty services, find the right pro for any job.',
  keywords: ['local services Philippines', 'home services', 'find a plumber', 'electrician manila', 'cleaning services cebu', 'skilled workers Philippines', 'Lingkod PH', 'lingkod ph'],
  openGraph: {
    title: 'Lingkod PH | Find Trusted Local Service Providers in the Philippines',
    description: 'The easiest way to hire verified local professionals for all your home and business needs.',
    url: 'https://lingkod.ph', // Replace with your actual domain
    siteName: 'Lingkod PH',
    images: [
      {
        url: '/og-image.png', 
        width: 1200,
        height: 630,
        alt: 'Lingkod PH - Connecting Communities with Trusted Providers',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
   twitter: {
    card: 'summary_large_image',
    title: 'Lingkod PH | Find Trusted Local Service Providers',
    description: 'Connecting you with the best local service professionals in the Philippines.',
    images: ['/twitter-image.png'], 
  },
};

interface Props {
    children: React.ReactNode;
    params: {locale: string};
}

export default function LocaleLayout({ children, params: {locale} }: Props) {
  const messages = useMessages();
 
  return (
    <html lang={locale} suppressHydrationWarning className={`${ptSans.variable}`}>
      <head>
        <Script
          strategy="afterInteractive"
          src="https://www.googletagmanager.com/gtag/js?id=G-N6FJYX83QN"
        />
        <Script
          id="gtag-init"
          strategy="afterInteractive"
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', 'G-N6FJYX83QN');
            `,
          }}
        />
      </head>
      <body className="font-body antialiased">
        <NextIntlClientProvider locale={locale} messages={messages}>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
                {children}
                <Toaster />
            </AuthProvider>
          </ThemeProvider>
        </NextIntlClientProvider>
      </body>
    </html>
  );
}
