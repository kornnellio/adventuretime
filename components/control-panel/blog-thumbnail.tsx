'use client';

import { ClientImage } from '@/components/ui/client-image';

interface BlogThumbnailProps {
  src: string;
  alt: string;
}

export function BlogThumbnail({ src, alt }: BlogThumbnailProps) {
  return (
    <div className="w-10 h-10 rounded-md overflow-hidden">
      <ClientImage
        src={src}
        alt={alt}
        className="w-full h-full object-cover"
        fallbackSrc="/images/placeholder.jpg"
      />
    </div>
  );
} 