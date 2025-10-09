
import type {Metadata} from 'next';
import './globals.css';
import { Toaster } from "@/components/ui/toaster"
import { AuthProvider } from '@/context/auth-context';
import { ThemeProvider } from '@/context/theme-provider';
import { Inter, Poppins } from 'next/font/google';
import {NextIntlClientProvider} from 'next-intl';
import '@/lib/console-override';
import '@/lib/dev-config';
import { GoogleAnalytics } from '@/components/analytics';
import { ScriptErrorBoundary } from '@/components/script-error-boundary';
import '@/lib/error-suppression';
import '@/lib/test-error-suppression';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-body',
})

const poppins = Poppins({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-headline',
  weight: ['400', '600', '700'],
})


export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' ? 'https://localpro.asia' : 'http://localhost:9002'),
  title: {
    default: 'LocalPro | Find Trusted Local Service Providers in the Philippines',
    template: '%s | LocalPro',
  },
  description: 'LocalPro is the leading platform for connecting clients with trusted, verified local service providers in the Philippines. From plumbing and electrical work to cleaning and beauty services, find the right pro for any job.',
  keywords: ['local services Philippines', 'home services', 'find a plumber', 'electrician manila', 'cleaning services cebu', 'skilled workers Philippines', 'LocalPro', 'local pro'],
  openGraph: {
    title: 'LocalPro | Find Trusted Local Service Providers in the Philippines',
    description: 'The easiest way to hire verified local professionals for all your home and business needs.',
    url: 'https://localpro.asia', // Replace with your actual domain
    siteName: 'LocalPro',
    images: [
      {
        url: '/og-image.png', // You would need to create this image and place it in the /public folder
        width: 1200,
        height: 630,
        alt: 'LocalPro - Connecting Communities with Trusted Providers',
      },
    ],
    locale: 'en_PH',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'LocalPro | Find Trusted Local Service Providers',
    description: 'Connecting you with the best local service professionals in the Philippines.',
    images: ['/twitter-image.png'], // You would need to create this image and place it in the /public folder
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning className={`${inter.variable} ${poppins.variable}`}>
      <head>
       
        <GoogleAnalytics />
      </head>
      <body className="font-body antialiased">
        <ScriptErrorBoundary>
          <NextIntlClientProvider>
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
        </ScriptErrorBoundary>
      </body>
    </html>
  );
}
