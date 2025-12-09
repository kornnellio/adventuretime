import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import { Providers } from "./providers";
import { LogoutHelper } from "@/components/auth/logout-helper";
import { DebugAuth } from "@/components/auth/debug-auth";
import { SessionChecker } from "@/components/auth/session-checker";
import { WhatsAppButton } from "@/components/ui/whatsapp-button";
import Footer from "@/components/layout/footer";
import Script from "next/script";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://adventuretime.ro'),
  title: {
    default: "AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!",
    template: "%s | AdventureTime.Ro"
  },
  description: "Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Ture caiac raul Neajlov, Ture caiac Comana, Ture caiac Grecia Paxos & Antipaxos, Ture caiac insula Mijlet - Croatia, Ture caiac Vidraru, Ture caiac raul Olt, Ture caiac lacul Mogosoaia, Ture caiac lacul Morii, Ture caiac Sulina, Cursuri caiac white water, Cursuri caiac Bucuresti, Ture caiac Bucuresti, ture caiac Snagov, Ture SUP Bucuresti, Ture SUP Delta Dunarii, Ture SUP lacul Snagov, Ture SUP Comana, Ture SUP raul Neajlov, Ture SUP Herastrau",
  keywords: [
    "ture caiac Herastrau",
    "ture caiac Delta Dunarii", 
    "ture caiac Cazanele Dunarii",
    "ture caiac raul Neajlov",
    "ture caiac Comana",
    "ture caiac Grecia Paxos Antipaxos",
    "ture caiac insula Mijlet Croatia",
    "ture caiac Vidraru",
    "ture caiac raul Olt",
    "ture caiac lacul Mogosoaia",
    "ture caiac lacul Morii",
    "ture caiac Sulina",
    "cursuri caiac white water",
    "cursuri caiac Bucuresti",
    "ture caiac Bucuresti",
    "ture caiac Snagov",
    "ture SUP Bucuresti",
    "ture SUP Delta Dunarii",
    "ture SUP lacul Snagov",
    "ture SUP Comana",
    "ture SUP raul Neajlov",
    "ture SUP Herastrau",
    "caiac România",
    "SUP România",
    "AdventureTime"
  ],
  authors: [{ name: "AdventureTime.Ro Team" }],
  creator: "AdventureTime.Ro",
  publisher: "AdventureTime.Ro",
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  openGraph: {
    type: 'website',
    locale: 'ro_RO',
    url: 'https://adventuretime.ro',
    siteName: 'AdventureTime.Ro',
    title: 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
    description: 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti, Ture SUP Delta Dunarii, Ture caiac Bucuresti, ture caiac Snagov, Ture SUP Herastrau și multe altele.',
    images: [
      {
        url: '/logo.png',
        width: 1200,
        height: 630,
        alt: 'AdventureTime.Ro - Ture Caiac și SUP în România',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
    description: 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti, Ture SUP Delta Dunarii și multe altele.',
    images: ['/logo.png'],
    creator: '@AdventureTimeRo',
  },
  verification: {
    google: 'google-site-verification-code',
  },
  alternates: {
    canonical: 'https://adventuretime.ro',
    languages: {
      'ro-RO': 'https://adventuretime.ro',
    },
  },
  category: 'travel',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AdventureTime.Ro',
    alternateName: 'Adventure Time Romania',
    url: 'https://adventuretime.ro',
    logo: 'https://adventuretime.ro/logo.png',
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+40-784-258-058',
      contactType: 'customer service',
      areaServed: 'RO',
      availableLanguage: 'Romanian'
    },
    address: {
      '@type': 'PostalAddress',
      addressCountry: 'Romania'
    },
    sameAs: [
      'https://www.facebook.com/adventuretime.ro',
      'https://www.instagram.com/adventuretime.ro'
    ],
    description: 'Aici începe aventura ta în Caiac și pe SUP! Ture caiac Herastrau, Delta Dunarii, Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti și multe altele.',
    serviceType: [
      'Ture Caiac Herastrau',
      'Ture Caiac Delta Dunarii',
      'Ture Caiac Cazanele Dunarii',
      'Ture Caiac Neajlov',
      'Ture Caiac Comana',
      'Cursuri Caiac White Water',
      'Cursuri Caiac Bucuresti',
      'Ture SUP Bucuresti',
      'Ture SUP Delta Dunarii',
      'Ture SUP Herastrau'
    ],
    areaServed: [
      {
        '@type': 'Place',
        name: 'Bucuresti, Romania'
      },
      {
        '@type': 'Place', 
        name: 'Delta Dunarii, Romania'
      },
      {
        '@type': 'Place',
        name: 'Cazanele Dunarii, Romania'
      },
      {
        '@type': 'Place',
        name: 'Lacul Herastrau, Bucuresti'
      },
      {
        '@type': 'Place',
        name: 'Raul Neajlov, Romania'
      },
      {
        '@type': 'Place',
        name: 'Comana, Romania'
      }
    ],
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Ture Caiac și SUP în România',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ture Caiac Herastrau',
            description: 'Ture caiac pe Lacul Herastrau din Bucuresti'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ture Caiac Delta Dunarii',
            description: 'Ture caiac în Delta Dunarii cu ghid experimentat'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Cursuri Caiac White Water',
            description: 'Cursuri caiac white water pentru începători și avansați'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Ture SUP Bucuresti',
            description: 'Ture SUP în Bucuresti pe lacuri și râuri'
          }
        }
      ]
    }
  };

  return (
    <html lang="ro" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Essential Meta Tags */}
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, shrink-to-fit=no" />
        <meta name="theme-color" content="#10b981" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="format-detection" content="telephone=no" />
        
        {/* Favicon and Icons */}
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="icon" href="/logo.png" type="image/png" />
        <link rel="apple-touch-icon" href="/logo.png" />
        <link rel="manifest" href="/manifest.json" />
        
        {/* Preload Critical Resources */}
        <link rel="preload" href="/logo.png" as="image" type="image/png" />
        <link rel="dns-prefetch" href="//www.googletagmanager.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        
        {/* Google Ads Global Site Tag (gtag.js) */}
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-16886522730"
          strategy="afterInteractive"
        />
        <Script id="google-ads-init" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-16886522730');
          `}
        </Script>
      </head>
      <body className={cn("min-h-screen bg-background font-sans antialiased flex flex-col")}>
        <Providers>
          <ThemeProvider attribute="class" defaultTheme="dark" enableSystem={false}>
            {children}
            <Footer />
            <LogoutHelper />
            <SessionChecker />
            <DebugAuth />
            <WhatsAppButton phoneNumber="+40 784 258 058" />
            <ShadcnToaster />
            <Toaster position="top-right" />
          </ThemeProvider>
        </Providers>
      </body>
    </html>
  );
}
