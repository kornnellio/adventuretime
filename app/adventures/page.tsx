import type { Metadata } from "next";
import { getAdventuresByCategories } from '@/lib/actions/adventure';
import { AdventuresPageClient } from '@/components/adventures/adventures-page-client';

// Force revalidation of this page every 10 minutes or when manually triggered
export const revalidate = 600; // 10 minutes

// Also enable dynamic generation for more immediate updates
export const dynamic = 'force-dynamic';

// Generate metadata for the adventures listing page
export const metadata: Metadata = {
  title: "Toate Aventurile - Ture Caiac și SUP în România | AdventureTime.Ro",
  description: "Explorează toate aventurile noastre pe caiac și SUP în România. Ture caiac Herastrau, Delta Dunarii, Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti și multe altele. Alege aventura perfectă pentru tine!",
  keywords: [
    "ture caiac România",
    "ture SUP România", 
    "ture caiac Herastrau",
    "ture caiac Delta Dunarii",
    "ture caiac Cazanele Dunarii",
    "ture caiac Neajlov",
    "ture caiac Comana",
    "cursuri caiac white water",
    "cursuri caiac Bucuresti",
    "ture SUP Bucuresti",
    "ture SUP Delta Dunarii",
    "ture SUP Herastrau",
    "aventuri caiac",
    "aventuri SUP",
    "AdventureTime România",
    "caiac Bucuresti",
    "SUP Bucuresti"
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
    url: 'https://adventuretime.ro/adventures',
    siteName: 'AdventureTime.Ro',
    title: 'Toate Aventurile - Ture Caiac și SUP în România | AdventureTime.Ro',
    description: 'Explorează toate aventurile noastre pe caiac și SUP în România. Ture caiac Herastrau, Delta Dunarii, Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti și multe altele.',
    images: [
      {
        url: 'https://adventuretime.ro/logo.png',
        width: 1200,
        height: 630,
        alt: 'AdventureTime.Ro - Toate Aventurile pe Caiac și SUP',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Toate Aventurile - Ture Caiac și SUP în România | AdventureTime.Ro',
    description: 'Explorează toate aventurile noastre pe caiac și SUP în România. Ture caiac Herastrau, Delta Dunarii, Cazanele Dunarii și multe altele.',
    images: ['https://adventuretime.ro/logo.png'],
    creator: '@AdventureTimeRo',
  },
  alternates: {
    canonical: 'https://adventuretime.ro/adventures',
    languages: {
      'ro-RO': 'https://adventuretime.ro/adventures',
    },
  },
  category: 'travel',
  other: {
    'content-type': 'Adventure Listing',
    'content-category': 'Tourism',
  },
};

// Interface for MongoDB adventure document
interface MongoAdventure {
  _id?: string;
  title: string;
  images: string[];
  date: Date;
  endDate: Date;
  dates?: any[];
  endDates?: Date[];
  price: number;
  includedItems: string[];
  additionalInfo: string[];
  location: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  advancePaymentPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
  _expandedFromId?: string;
  _originalDateIndex?: number;
  slug?: string;
  category?: any;
}

// Interface for categorized adventures
interface CategorizedAdventures {
  category: {
    _id: string;
    title: string;
    description: string;
    image: string;
    slug: string;
  };
  adventures: MongoAdventure[];
}

export default async function AdventuresPage() {
  // Fetch adventures organized by categories server-side for better SEO
  const { success, data: categorizedAdventures, error } = await getAdventuresByCategories();
  
  // Flatten adventures for structured data
  const allAdventures = categorizedAdventures?.flatMap(cat => cat.adventures) || [];
  
  // Generate JSON-LD structured data for the adventures listing
  const baseUrl = 'https://adventuretime.ro';
  
  // Create ItemList structured data
  const itemListJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Ture Caiac și SUP în România',
    description: 'Lista completă cu toate aventurile pe caiac și SUP disponibile în România cu AdventureTime.Ro',
    url: `${baseUrl}/adventures`,
    numberOfItems: allAdventures?.length || 0,
    itemListElement: allAdventures?.slice(0, 20).map((adventure: MongoAdventure, index: number) => ({
      '@type': 'ListItem',
      position: index + 1,
      item: {
        '@type': 'Event',
        '@id': `${baseUrl}/adventures/${adventure.slug || adventure._id}`,
        name: adventure.title,
        description: adventure.shortDescription || adventure.description || `${adventure.title} în ${adventure.location}`,
        url: `${baseUrl}/adventures/${adventure.slug || adventure._id}`,
        image: adventure.images?.[0] ? 
          (adventure.images[0].startsWith('http') ? adventure.images[0] : `${baseUrl}${adventure.images[0]}`) :
          `${baseUrl}/logo.png`,
        location: {
          '@type': 'Place',
          name: adventure.location,
          address: {
            '@type': 'PostalAddress',
            addressCountry: 'Romania',
            addressLocality: adventure.location,
          },
        },
        organizer: {
          '@type': 'Organization',
          name: 'AdventureTime.Ro',
          url: baseUrl,
        },
        offers: {
          '@type': 'Offer',
          price: adventure.price.toString(),
          priceCurrency: 'RON',
          availability: 'https://schema.org/InStock',
        },
      },
    })) || [],
  };

  // Service provider structured data
  const serviceProviderJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'TouristInformationCenter',
    name: 'AdventureTime.Ro',
    alternateName: 'Adventure Time Romania',
    url: baseUrl,
    logo: `${baseUrl}/logo.png`,
    description: 'Furnizor principal de ture caiac și SUP în România. Oferim aventuri în Bucuresti, Delta Dunarii, Cazanele Dunarii și multe alte locații.',
    serviceType: [
      'Ture Caiac',
      'Ture SUP',
      'Cursuri Caiac',
      'Aventuri Outdoor',
      'Turism Activ',
    ],
    areaServed: [
      {
        '@type': 'Place',
        name: 'România',
      },
      {
        '@type': 'Place',
        name: 'Bucuresti',
      },
      {
        '@type': 'Place',
        name: 'Delta Dunarii',
      },
      {
        '@type': 'Place',
        name: 'Cazanele Dunarii',
      },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      telephone: '+40-784-258-058',
      contactType: 'customer service',
      areaServed: 'RO',
      availableLanguage: 'Romanian',
    },
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Catalog Ture Caiac și SUP',
      itemListElement: allAdventures?.slice(0, 10).map((adventure: MongoAdventure) => ({
        '@type': 'Offer',
        itemOffered: {
          '@type': 'Service',
          name: adventure.title,
          description: adventure.shortDescription || adventure.description,
          serviceType: adventure.title.toLowerCase().includes('sup') ? 'Ture SUP' : 'Ture Caiac',
        },
        price: adventure.price.toString(),
        priceCurrency: 'RON',
        availability: 'https://schema.org/InStock',
      })) || [],
    },
  };

  return (
    <>
      {/* JSON-LD Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceProviderJsonLd) }}
      />
      
      {/* Client Component with interactive functionality */}
      <AdventuresPageClient 
        categorizedAdventures={success && categorizedAdventures ? categorizedAdventures : []}
        error={error}
      />
    </>
  );
} 