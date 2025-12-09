import { notFound } from 'next/navigation';
import { Metadata, ResolvingMetadata } from 'next';
import { getAdventureById } from '@/lib/actions/adventure';
import { AdventurePageClient } from '@/components/adventures/adventure-page-client';

// Interface for MongoDB adventure document
interface MongoAdventure {
  _id?: string;
  title: string;
  images: string[];
  dates: {
    startDate: Date;
    endDate: Date;
  }[];
  // Legacy fields for backward compatibility
  date?: Date;
  endDate?: Date;
  price: number;
  includedItems: string[];
  additionalInfo: string[];
  location: string;
  meetingPoint?: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  advancePaymentPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  slug?: string;
}

// Extend MongoAdventure interface to include the new fields
interface MongoAdventureExtended extends MongoAdventure {
  bookingCutoffHour?: number;
  availableKayakTypes?: {
    caiacSingle: boolean;
    caiacDublu: boolean;
    placaSUP: boolean;
  };
}

// Helper function to format image URLs correctly
const formatImageUrl = (image: string) => {
  if (!image) return '/placeholder-adventure.jpg';
  if (image.startsWith('http')) return image;
  if (image === '/placeholder-adventure.jpg' || image === 'placeholder-adventure.jpg') 
    return '/placeholder-adventure.jpg';
  if (image.startsWith('/uploads/')) return `https://adventure-time.ro${image}`;
  if (image.startsWith('/')) return image;
  return `/${image}`;
};

// Helper function to safely parse dates from MongoDB
const safelyParseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date(); 
  
  try {
    const parsedDate = new Date(dateValue);
    
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date value:', dateValue);
      return new Date();
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Helper function to format price for display
const formatPrice = (price: number): string => {
  return `${price} lei`;
};

// Generate dynamic metadata for each adventure page
export async function generateMetadata(
  { params }: { params: Promise<{ slug: string }> },
  parent: ResolvingMetadata
): Promise<Metadata> {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const { success, data: adventure } = await getAdventureById(slug);

    if (!success || !adventure) {
      return {
        title: 'Aventura nu a fost găsită | AdventureTime.Ro',
        description: 'Aventura căutată nu există. Explorează alte aventuri pe caiac și SUP disponibile în România.',
      };
    }

    const parentMetadata = await parent;
    const baseUrl = 'https://adventuretime.ro';
    
    // Create a clean description from the adventure content
    const cleanDescription = adventure.shortDescription || adventure.description || '';
    const descriptionText = cleanDescription.replace(/<[^>]*>/g, '').slice(0, 155) + '...';
    
    // Get the first image for social sharing
    const primaryImage = adventure.images?.[0] ? formatImageUrl(adventure.images[0]) : '/logo.png';
    const fullImageUrl = primaryImage.startsWith('http') ? primaryImage : `${baseUrl}${primaryImage}`;
    
    // Format duration for metadata
    const durationText = `${adventure.duration.value} ${adventure.duration.unit === 'hours' ? 'ore' : 'zile'}`;
    
    // Format price for metadata
    const priceText = formatPrice(adventure.price);
    
    // Create SEO-optimized title
    const seoTitle = `${adventure.title} - ${adventure.location} | AdventureTime.Ro`;
    
    // Enhanced description with keywords
    const enhancedDescription = `${adventure.title} în ${adventure.location}. ${descriptionText} Durată: ${durationText}. Preț: ${priceText}. Rezervă acum aventura ta cu AdventureTime.Ro!`;

    return {
      title: seoTitle,
      description: enhancedDescription,
      keywords: [
        adventure.title.toLowerCase(),
        `ture caiac ${adventure.location}`,
        `ture SUP ${adventure.location}`,
        `aventuri ${adventure.location}`,
        adventure.location,
        'caiac România',
        'SUP România',
        'AdventureTime',
        'ture caiac Bucuresti',
        'ture SUP Bucuresti',
        adventure.difficulty,
        `${adventure.duration.value} ${adventure.duration.unit}`,
      ],
      authors: [{ name: 'AdventureTime.Ro' }],
      creator: 'AdventureTime.Ro',
      publisher: 'AdventureTime.Ro',
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
        type: 'article',
        locale: 'ro_RO',
        url: `${baseUrl}/adventures/${slug}`,
        siteName: 'AdventureTime.Ro',
        title: seoTitle,
        description: enhancedDescription,
        images: [
          {
            url: fullImageUrl,
            width: 1200,
            height: 630,
            alt: `${adventure.title} - ${adventure.location}`,
            type: 'image/jpeg',
          },
        ],
        publishedTime: adventure.createdAt ? new Date(adventure.createdAt).toISOString() : undefined,
        modifiedTime: adventure.updatedAt ? new Date(adventure.updatedAt).toISOString() : undefined,
      },
      twitter: {
        card: 'summary_large_image',
        site: '@AdventureTimeRo',
        creator: '@AdventureTimeRo',
        title: seoTitle,
        description: enhancedDescription,
        images: [fullImageUrl],
      },
      alternates: {
        canonical: `${baseUrl}/adventures/${slug}`,
      },
      other: {
        'article:author': 'AdventureTime.Ro',
        'article:section': 'Adventures',
        'article:tag': adventure.location,
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Aventura | AdventureTime.Ro',
      description: 'Explorează aventuri pe caiac și SUP în România cu AdventureTime.Ro',
    };
  }
}

export default async function AdventurePage({ 
  params 
}: { 
  params: Promise<{ slug: string }> 
}) {
  try {
    const resolvedParams = await params;
    const slug = resolvedParams.slug;
    const { success, data: adventure } = await getAdventureById(slug);

    if (!success || !adventure) {
      notFound();
    }

    // Generate JSON-LD structured data for the adventure
    const baseUrl = 'https://adventuretime.ro';
    const primaryImage = adventure.images?.[0] ? formatImageUrl(adventure.images[0]) : '/logo.png';
    const fullImageUrl = primaryImage.startsWith('http') ? primaryImage : `${baseUrl}${primaryImage}`;
    
    // Get all available dates for structured data
    const availableDates = adventure.dates && adventure.dates.length > 0 
      ? adventure.dates.map((datePair: any) => {
          const startDate = safelyParseDate(datePair.startDate);
          const endDate = safelyParseDate(datePair.endDate || datePair.startDate);
          return {
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
          };
        })
      : adventure.date 
      ? [{
          startDate: safelyParseDate(adventure.date).toISOString(),
          endDate: adventure.endDate 
            ? safelyParseDate(adventure.endDate).toISOString()
            : safelyParseDate(adventure.date).toISOString(),
        }]
      : [];

    const jsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Event',
      name: adventure.title,
      description: adventure.shortDescription || adventure.description || `${adventure.title} în ${adventure.location}`,
      image: [fullImageUrl],
      startDate: availableDates[0]?.startDate || new Date().toISOString(),
      endDate: availableDates[0]?.endDate || new Date().toISOString(),
      eventStatus: 'https://schema.org/EventScheduled',
      eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
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
        logo: `${baseUrl}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          telephone: '+40-784-258-058',
          contactType: 'customer service',
        },
      },
      offers: {
        '@type': 'Offer',
        price: adventure.price.toString(),
        priceCurrency: 'RON',
        availability: 'https://schema.org/InStock',
        url: `${baseUrl}/adventures/${slug}`,
        seller: {
          '@type': 'Organization',
          name: 'AdventureTime.Ro',
        },
      },
      performer: {
        '@type': 'Organization',
        name: 'AdventureTime.Ro',
        url: baseUrl,
      },
      category: 'Adventure Tourism',
      keywords: [
        adventure.location,
        'caiac',
        'SUP',
        'aventuri',
        'România',
        adventure.difficulty,
      ].join(', '),
      additionalProperty: [
        {
          '@type': 'PropertyValue',
          name: 'Difficulty',
          value: adventure.difficulty,
        },
        {
          '@type': 'PropertyValue',
          name: 'Duration',
          value: `${adventure.duration.value} ${adventure.duration.unit}`,
        },
        {
          '@type': 'PropertyValue',
          name: 'Equipment Included',
          value: adventure.includedItems?.join(', ') || 'Ghidaj profesional',
        },
      ],
    };

    // Service structured data
    const serviceJsonLd = {
      '@context': 'https://schema.org',
      '@type': 'Service',
      serviceType: adventure.title,
      provider: {
        '@type': 'Organization',
        name: 'AdventureTime.Ro',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
      },
      areaServed: {
        '@type': 'Place',
        name: adventure.location,
      },
      hasOfferCatalog: {
        '@type': 'OfferCatalog',
        name: adventure.title,
        itemListElement: {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: adventure.title,
            description: adventure.shortDescription || adventure.description,
          },
          price: adventure.price.toString(),
          priceCurrency: 'RON',
        },
      },
    };

    return (
      <>
        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
        />
        
        {/* Client Component with all interactive functionality */}
        <AdventurePageClient adventure={adventure} />
      </>
    );
  } catch (error) {
    console.error('Error loading adventure page:', error);
    notFound();
  }
} 