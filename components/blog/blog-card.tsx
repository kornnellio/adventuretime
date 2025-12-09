'use client';

import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '../ui/card';
import { cn } from '@/lib/utils';

interface Author {
  name: string;
  role: string;
  avatarUrl: string;
}

interface BlogCardProps {
  id: string;
  title: string;
  date: string;
  category: string;
  imageUrl: string;
  author: Author;
  className?: string;
}

export function BlogCard({
  id,
  title,
  date,
  category,
  imageUrl,
  author,
  className
}: BlogCardProps) {
  const router = useRouter();
  const slug = id || title.toLowerCase().replace(/\s+/g, '-');
  
  // Format image URLs correctly
  const formatImageUrl = (url: string) => {
    if (!url) return "/images/placeholder.jpg";
    if (url.startsWith('http')) return url;
    if (url.startsWith('/uploads/')) return `https://adventure-time.ro${url}`;
    return url;
  };
  
  const handleCardClick = () => {
    router.push(`/blog/${slug}`);
  };

  return (
    <Card 
      className={cn(
        "group overflow-hidden bg-gradient-to-b from-[#1C1C25]/95 to-[#1C1C25]/98 backdrop-blur-xl border-white/5 hover:border-orange-500/20 transition-all duration-300 hover:shadow-xl hover:shadow-orange-500/5 cursor-pointer",
        className
      )}
      onClick={handleCardClick}
    >
      <CardContent className="p-0">
        <div className="relative h-48 w-full overflow-hidden">
          {imageUrl && (
            <Image
              src={formatImageUrl(imageUrl)}
              alt={title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            />
          )}
        </div>
        <div className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="px-2.5 py-0.5 bg-orange-500/10 text-orange-500 rounded-full text-xs font-medium">
              {category}
            </span>
            <span className="text-xs text-gray-400">{date}</span>
          </div>
          <h3 className="text-lg font-semibold text-white group-hover:text-orange-500 transition-colors duration-300 line-clamp-2 mb-4">
            {title}
          </h3>
          <div className="flex items-center gap-3">
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              {author.avatarUrl && (
                <Image
                  src={formatImageUrl(author.avatarUrl)}
                  alt={author.name}
                  fill
                  className="object-cover"
                  sizes="32px"
                />
              )}
            </div>
            <div>
              <div className="text-sm font-medium text-white">{author.name}</div>
              <div className="text-xs text-gray-400">{author.role}</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 