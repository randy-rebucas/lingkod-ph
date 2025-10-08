
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
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // Early error suppression for injectScript errors
              (function() {
                if (typeof window === 'undefined') return;
                
                const originalConsoleError = console.error;
                console.error = function(...args) {
                  const message = args.join(' ');
                  if (message.includes('injectScript error:') || 
                      (message.includes('injectScript') && message.includes('{}')) ||
                      message.includes('createConsoleError') ||
                      message.includes('node_modules_0dc43d48')) {
                    console.warn('🚫 Early injectScript error suppression:', message);
                    return;
                  }
                  originalConsoleError.apply(console, args);
                };
                
                // Global error handlers
                window.addEventListener('error', function(event) {
                  if (event.message && event.message.includes('injectScript')) {
                    console.warn('🚫 Early global error suppression:', event.message);
                    event.preventDefault();
                    return false;
                  }
                });
                
                window.addEventListener('unhandledrejection', function(event) {
                  const reason = event.reason;
                  const message = typeof reason === 'string' ? reason : 
                                 (reason && reason.message ? reason.message : String(reason));
                  if (message.includes('injectScript')) {
                    console.warn('🚫 Early promise rejection suppression:', message);
                    event.preventDefault();
                    return;
                  }
                });
              })();
            `,
          }}
        />
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
