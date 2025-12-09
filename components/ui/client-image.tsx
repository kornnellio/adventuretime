'use client';

import { useState } from 'react';
import Image from 'next/image';
import { cn, formatImageUrl } from '@/lib/utils';

interface ClientImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  fallbackSrc?: string;
}

export function ClientImage({
  src,
  alt,
  width,
  height,
  className,
  fallbackSrc = '/images/placeholder.jpg', // Default fallback image
}: ClientImageProps) {
  const [imgSrc, setImgSrc] = useState(formatImageUrl(src, fallbackSrc));
  const [isError, setIsError] = useState(false);

  const handleError = () => {
    if (!isError) {
      setIsError(true);
      setImgSrc(fallbackSrc);
    }
  };

  // If width and height are provided, use Next/Image
  if (width && height) {
    return (
      <div className="w-full overflow-hidden flex justify-center">
        <Image
          src={imgSrc}
          alt={alt}
          width={width}
          height={height}
          className={cn("max-w-full h-auto object-contain", className)}
          onError={handleError}
        />
      </div>
    );
  }

  // Fallback to regular img tag if dimensions aren't provided
  return (
    <div className="w-full overflow-hidden flex justify-center">
      <img
        src={imgSrc}
        alt={alt}
        className={cn("max-w-full h-auto object-contain", className)}
        onError={handleError}
      />
    </div>
  );
} 
