import { MetadataRoute } from 'next'
import { getAdventures } from '@/lib/actions/adventure'

const baseUrl = 'https://adventuretime.ro'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Static pages
  const staticPages = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: `${baseUrl}/adventures`,
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
    },
    {
      url: `${baseUrl}/contact`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.7,
    },
    {
      url: `${baseUrl}/about`,
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.6,
    },
    {
      url: `${baseUrl}/politica-de-confidentialitate`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/termeni-si-conditii`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
    {
      url: `${baseUrl}/politica-cookies`,
      lastModified: new Date(),
      changeFrequency: 'yearly' as const,
      priority: 0.3,
    },
  ]

  // Dynamic adventure pages
  let adventurePages: MetadataRoute.Sitemap = []
  try {
    const adventuresResponse = await getAdventures()
    if (adventuresResponse.success && adventuresResponse.data) {
      adventurePages = adventuresResponse.data.map((adventure: any) => ({
        url: `${baseUrl}/adventures/${adventure.slug || adventure._id}`,
        lastModified: adventure.updatedAt ? new Date(adventure.updatedAt) : new Date(),
        changeFrequency: 'weekly' as const,
        priority: 0.8,
      }))
    }
  } catch (error) {
    console.error('Error fetching adventures for sitemap:', error)
  }

  // TODO: Add blog posts when available
  // const blogPosts = await getBlogPosts()
  // const blogPages = blogPosts.map((post) => ({
  //   url: `${baseUrl}/blog/${post.slug}`,
  //   lastModified: new Date(post.updatedAt),
  //   changeFrequency: 'monthly' as const,
  //   priority: 0.7,
  // }))

  return [...staticPages, ...adventurePages]
} 