'use client';

import { X } from 'lucide-react';
import { ClientImage } from '@/components/ui/client-image';

interface AdventureThumbnailProps {
  src: string;
  alt: string;
  onRemove: () => void;
}

export function AdventureThumbnail({ src, alt, onRemove }: AdventureThumbnailProps) {
  return (
    <div className="relative group">
      <ClientImage
        src={src}
        alt={alt}
        className="h-24 w-24 rounded-md object-cover"
        fallbackSrc="/images/placeholder.jpg"
      />
      <button
        type="button"
        onClick={onRemove}
        className="absolute top-1 right-1 rounded-full bg-black/70 p-1 text-white opacity-0 group-hover:opacity-100 transition-opacity"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
} 