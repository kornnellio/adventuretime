'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { getBlogs } from '@/lib/actions/blog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { IBlog } from '@/lib/models/blog';
import { ClientImage } from '@/components/ui/client-image';
import { useState, useEffect } from 'react';

export default function BlogPage() {
  const router = useRouter();
  const [blogs, setBlogs] = useState<(IBlog & { _id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    async function fetchBlogs() {
      try {
        const response = await getBlogs();
        if (response.success) {
          setBlogs(response.data || []);
        } else {
          setError(response.error || 'Eroare la încărcarea articolelor de blog');
        }
      } catch (err) {
        setError('A apărut o eroare neașteptată');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    
    fetchBlogs();
  }, []);

  const handleCardClick = (blogId: string) => {
    router.push(`/blog/${blogId}`);
  };

  return (
    <div className="container py-4 md:py-8 px-3 md:px-6">
      <div className="flex flex-col items-center text-center space-y-3 md:space-y-4 mb-8 md:mb-12">
        <h1 className="text-3xl md:text-4xl font-bold tracking-tight">Blog de Aventuri</h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl">
          Descoperă sfaturi, povești și informații din aventurile noastre din jurul lumii
        </p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
          <p className="text-muted-foreground">Se încarcă articolele de blog...</p>
        </div>
      ) : error ? (
        <div className="flex flex-col items-center justify-center p-8 md:p-12 text-center">
          <h2 className="text-xl md:text-2xl font-bold text-red-500 mb-2">Nu se pot încărca articolele de blog</h2>
          <p className="text-muted-foreground max-w-md">
            Întâmpinăm probleme la preluarea articolelor de blog. Te rugăm să revii mai târziu.
          </p>
        </div>
      ) : blogs?.length === 0 ? (
        <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
          <h2 className="text-xl md:text-2xl font-bold mb-2">În curând!</h2>
          <p className="text-muted-foreground max-w-md">
            Lucrăm la câteva articole de blog extraordinare. Revino în curând pentru actualizări!
          </p>
        </div>
      ) : (
        <div className="grid gap-4 md:gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
          {blogs?.map((blog) => (
            <Card 
              key={blog._id} 
              className="overflow-hidden flex flex-col h-full hover:shadow-xl hover:shadow-orange-500/5 transition-all duration-300 cursor-pointer"
              onClick={() => handleCardClick(blog._id)}
            >
              {blog.image && (
                <div className="relative h-40 sm:h-48 w-full overflow-hidden">
                  <ClientImage
                    src={blog.image}
                    alt={blog.title}
                    className="w-full h-full object-cover transition-transform hover:scale-105 duration-300"
                    fallbackSrc="/images/placeholder.jpg"
                  />
                </div>
              )}
              <CardHeader className="pb-2 md:pb-3">
                <div className="flex flex-wrap gap-2 mb-2">
                  {blog.tags?.slice(0, 3).map((tag: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
                <CardTitle className="text-lg md:text-xl line-clamp-2">
                  {blog.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0 pb-3 md:pb-4 flex-grow">
                <div 
                  className="text-sm md:text-base text-muted-foreground line-clamp-3" 
                  dangerouslySetInnerHTML={{ 
                    __html: blog.content.substring(0, 150).replace(/<[^>]*>/g, '') + '...'
                  }} 
                />
              </CardContent>
              <CardFooter className="flex justify-between items-center pt-0 border-t">
                <div className="text-xs md:text-sm text-muted-foreground">
                  {blog.createdAt && format(new Date(blog.createdAt), 'MMM d, yyyy')}
                </div>
                <Button variant="ghost" size="sm">
                  <span className="text-xs md:text-sm">Citește mai mult</span>
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
} 