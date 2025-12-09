'use client';

import { useEffect, useState } from 'react';
import { ClientImage } from '@/components/ui/client-image';

interface BlogContentRendererProps {
  content: string;
}

export function BlogContentRenderer({ content }: BlogContentRendererProps) {
  const [processedContent, setProcessedContent] = useState('');

  useEffect(() => {
    // Process the content to replace img tags with ClientImage components
    if (content) {
      // Create a temporary DOM element to parse the HTML
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = content;

      // Find all img tags and replace them with placeholders
      const imgTags = tempDiv.querySelectorAll('img');
      imgTags.forEach((img, index) => {
        const src = img.getAttribute('src') || '';
        const alt = img.getAttribute('alt') || 'Blog image';
        const width = img.getAttribute('width') ? parseInt(img.getAttribute('width') || '0', 10) : 0;
        const height = img.getAttribute('height') ? parseInt(img.getAttribute('height') || '0', 10) : 0;
        
        // Replace the img tag with a placeholder that our ClientImage component will target
        img.outerHTML = `<div 
          data-client-image="true"
          data-src="${src}"
          data-alt="${alt}"
          data-width="${width || ''}"
          data-height="${height || ''}"
          data-index="${index}"
          class="blog-image-placeholder"
        ></div>`;
      });

      setProcessedContent(tempDiv.innerHTML);
    }
  }, [content]);

  // Function to render the processed content
  const renderContent = () => {
    if (!processedContent) return null;

    // Split the content by our custom placeholders
    const parts = processedContent.split('<div data-client-image="true"');
    
    return (
      <>
        {parts.map((part, i) => {
          // The first part won't have a closing div tag
          if (i === 0) {
            return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
          }

          // Extract the image data from the placeholder
          const closingDivIndex = part.indexOf('</div>');
          const placeholderData = part.substring(0, closingDivIndex);
          const remainingContent = part.substring(closingDivIndex + 6);

          // Parse the data attributes
          const src = placeholderData.match(/data-src="([^"]*)"/)?.[1] || '';
          const alt = placeholderData.match(/data-alt="([^"]*)"/)?.[1] || 'Blog image';
          const widthStr = placeholderData.match(/data-width="([^"]*)"/)?.[1] || '';
          const heightStr = placeholderData.match(/data-height="([^"]*)"/)?.[1] || '';
          
          const width = widthStr ? parseInt(widthStr, 10) : undefined;
          const height = heightStr ? parseInt(heightStr, 10) : undefined;

          return (
            <div key={i}>
              <ClientImage 
                src={src} 
                alt={alt} 
                width={width} 
                height={height} 
                className="my-4 rounded-md"
              />
              <div dangerouslySetInnerHTML={{ __html: remainingContent }} />
            </div>
          );
        })}
      </>
    );
  };

  return (
    <div className="prose prose-sm md:prose-lg dark:prose-invert mx-auto max-w-full md:max-w-3xl px-0 md:px-4 overflow-hidden">
      {renderContent()}
    </div>
  );
} 