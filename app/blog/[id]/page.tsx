import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { format } from 'date-fns';
import { ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { getBlogById } from '@/lib/actions/blog';
import { BlogContentRenderer } from '@/components/blog/blog-content-renderer';
import { ClientImage } from '@/components/ui/client-image';

interface BlogPostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  try {
    const { success, data: blog } = await getBlogById(id);
    
    if (!success || !blog) {
      return {
        title: 'Blog Post Not Found',
        description: 'The requested blog post could not be found.',
      };
    }
    
    return {
      title: `${blog.title} - AdventureTime.Ro Blog`,
      description: blog.content.substring(0, 160).replace(/<[^>]*>/g, ''),
      openGraph: {
        title: blog.title,
        description: blog.content.substring(0, 160).replace(/<[^>]*>/g, ''),
        images: [
          {
            url: blog.image,
            width: 1200,
            height: 630,
            alt: blog.title,
          },
        ],
      },
    };
  } catch (error) {
    console.error('Error generating metadata:', error);
    return {
      title: 'Blog - AdventureTime.Ro',
      description: 'Explore our blog posts about adventures and outdoor activities.',
    };
  }
}

export default async function BlogPostPage({ params }: BlogPostPageProps) {
  const resolvedParams = await params;
  const { id } = resolvedParams;
  
  const { success, data: blog, error } = await getBlogById(id);
  
  if (!success || !blog) {
    notFound();
  }
  
  return (
    <div className="container mx-auto max-w-4xl py-6 md:py-8 space-y-4 md:space-y-6 px-3 sm:px-6">
      <div>
        <Button variant="outline" size="sm" asChild className="mb-4 md:mb-6">
          <Link href="/blog">
            <ChevronLeft className="h-4 w-4 mr-2" />
            Back to All Blogs
          </Link>
        </Button>
      </div>
      
      <article className="space-y-4 md:space-y-6">
        <div className="space-y-3 md:space-y-4">
          <h1 className="text-2xl md:text-4xl font-bold tracking-tight">{blog.title}</h1>
          
          <div className="flex flex-wrap items-center gap-2 text-muted-foreground text-sm md:text-base">
            <span>By {blog.author.name}</span>
            <span>•</span>
            <time dateTime={blog.createdAt}>
              {format(new Date(blog.createdAt), 'MMMM d, yyyy')}
            </time>
          </div>
          
          <div className="flex flex-wrap gap-2">
            {blog.tags.map((tag: string, index: number) => (
              <Badge key={index} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
        </div>
        
        {blog.image && (
          <div className="relative h-[200px] md:h-[400px] w-full rounded-lg overflow-hidden">
            <ClientImage
              src={blog.image}
              alt={blog.title}
              className="object-cover w-full h-full"
              fallbackSrc="/images/placeholder.jpg"
            />
          </div>
        )}
        
        <BlogContentRenderer content={blog.content} />
        
        <div className="border-t pt-4 md:pt-6">
          <h2 className="text-xl md:text-2xl font-bold mb-3 md:mb-4">Share this post</h2>
          <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(
                  `${process.env.NEXT_PUBLIC_APP_URL}/blog/${blog._id}`
                )}&text=${encodeURIComponent(blog.title)}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm"
              >
                Share on Twitter
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(
                  `${process.env.NEXT_PUBLIC_APP_URL}/blog/${blog._id}`
                )}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm"
              >
                Share on Facebook
              </a>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <a 
                href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(
                  `${process.env.NEXT_PUBLIC_APP_URL}/blog/${blog._id}`
                )}`} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-sm"
              >
                Share on LinkedIn
              </a>
            </Button>
          </div>
        </div>
      </article>
    </div>
  );
} 