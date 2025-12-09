import { Metadata } from 'next'
import Script from 'next/script'

interface PageSEOProps {
  title?: string
  description?: string
  keywords?: string[]
  image?: string
  url?: string
  type?: 'website' | 'article'
  publishedTime?: string
  modifiedTime?: string
  author?: string
  structuredData?: any
  noIndex?: boolean
  children?: React.ReactNode
}

export function generatePageMetadata({
  title,
  description,
  keywords,
  image,
  url,
  type = 'website',
  publishedTime,
  modifiedTime,
  author,
  noIndex = false,
}: PageSEOProps): Metadata {
  const baseUrl = 'https://adventuretime.ro'
  const fullUrl = url ? `${baseUrl}${url}` : baseUrl
  const defaultImage = '/logo.png'
  const ogImage = image || defaultImage

  return {
    title: title || 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
    description: description || 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti, Ture SUP Delta Dunarii, Ture caiac Bucuresti, ture caiac Snagov, Ture SUP Herastrau',
    keywords: keywords || [
      'ture caiac Herastrau',
      'ture caiac Delta Dunarii',
      'ture caiac Cazanele Dunarii',
      'cursuri caiac white water',
      'ture SUP Bucuresti',
      'ture caiac Bucuresti',
      'ture caiac Snagov',
      'ture SUP Herastrau',
      'caiac România',
      'SUP România',
    ],
    authors: author ? [{ name: author }] : [{ name: 'AdventureTime.Ro Team' }],
    robots: noIndex ? {
      index: false,
      follow: false,
    } : {
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
      type,
      locale: 'ro_RO',
      url: fullUrl,
      siteName: 'AdventureTime.Ro',
      title: title || 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
      description: description || 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti, Ture SUP Delta Dunarii',
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: title || 'AdventureTime.Ro - Ture Caiac și SUP în România',
        },
      ],
      ...(publishedTime && { publishedTime }),
      ...(modifiedTime && { modifiedTime }),
      ...(author && { authors: [author] }),
    },
    twitter: {
      card: 'summary_large_image',
      title: title || 'AdventureTime.Ro - Aici începe aventura ta în Caiac și pe SUP!',
      description: description || 'Ture caiac Herastrau, Ture caiac Delta Dunarii, Ture caiac Cazanele Dunarii, Cursuri caiac white water, Ture SUP Bucuresti',
      images: [ogImage],
      creator: '@AdventureTimeRo',
    },
    alternates: {
      canonical: fullUrl,
    },
  }
}

export function PageSEO({
  structuredData,
  children,
}: {
  structuredData?: any
  children?: React.ReactNode
}) {
  return (
    <>
      {structuredData && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      {children}
    </>
  )
}

// Helper function to generate adventure structured data
export function generateAdventureStructuredData(adventure: any) {
  const baseUrl = 'https://adventuretime.ro'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: adventure.title,
    description: adventure.description || adventure.shortDescription,
    image: adventure.images?.[0] || '/placeholder-adventure.jpg',
    url: `${baseUrl}/adventures/${adventure.slug || adventure._id}`,
    brand: {
      '@type': 'Brand',
      name: 'AdventureTime.Ro'
    },
    offers: {
      '@type': 'Offer',
      price: adventure.price,
      priceCurrency: 'RON',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString(),
      seller: {
        '@type': 'Organization',
        name: 'AdventureTime.Ro'
      }
    },
    provider: {
      '@type': 'Organization',
      name: 'AdventureTime.Ro',
      url: baseUrl
    },
    location: adventure.location ? {
      '@type': 'Place',
      name: adventure.location,
      address: {
        '@type': 'PostalAddress',
        addressCountry: 'Romania'
      }
    } : undefined,
    startDate: adventure.date || adventure.dates?.[0]?.startDate,
    endDate: adventure.endDate || adventure.dates?.[0]?.endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    organizer: {
      '@type': 'Organization',
      name: 'AdventureTime.Ro',
      url: baseUrl
    }
  }
}

// Helper function to generate blog post structured data
export function generateBlogPostStructuredData(post: any) {
  const baseUrl = 'https://adventuretime.ro'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt || post.description,
    image: post.featuredImage || '/logo.png',
    url: `${baseUrl}/blog/${post.slug}`,
    datePublished: post.publishedAt || post.createdAt,
    dateModified: post.updatedAt || post.createdAt,
    author: {
      '@type': 'Person',
      name: post.author || 'AdventureTime.Ro Team'
    },
    publisher: {
      '@type': 'Organization',
      name: 'AdventureTime.Ro',
      logo: {
        '@type': 'ImageObject',
        url: `${baseUrl}/logo.png`
      }
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${baseUrl}/blog/${post.slug}`
    }
  }
} 