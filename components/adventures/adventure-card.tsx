import Image from 'next/image';
import Link from 'next/link';
import { Calendar, Clock, MapPin, CalendarDays } from 'lucide-react';
import { cn, isDevelopmentMode, formatImageUrl } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"

// Determine if we're in development mode
const isDevelopment = isDevelopmentMode();

export interface AdventureCardProps {
  slug: string;
  title: string;
  description: string;
  shortDescription?: string;
  image: string;
  date: string;
  endDate: string;
  dates?: string[]; // Optional additional start dates
  endDates?: string[]; // Optional additional end dates
  duration: string;
  location: string;
  price?: number;
  currency?: string;
  variant?: 'default' | 'compact';
  isPast?: boolean; // Indicates if the adventure date is in the past
}

export function AdventureCard({
  slug,
  title,
  description,
  shortDescription,
  image,
  date,
  endDate,
  dates = [],
  endDates = [],
  duration,
  location,
  price,
  currency = 'lei',
  variant = 'default',
  isPast = false
}: AdventureCardProps) {
  const isCompact = variant === 'compact';
  
  // Format the date display to show ranges
  const formatDateDisplay = (start: string, end: string) => {
    return `${start} - ${end}`;
  };
  
  const mainDateDisplay = formatDateDisplay(date, endDate);
  const hasDates = dates && dates.length > 0;
  
  // Function to strip HTML and limit text length
  const getPreviewText = (htmlContent: string, limit: number = 100) => {
    // Strip HTML tags
    const plainText = htmlContent.replace(/<[^>]*>/g, '');
    // Decode HTML entities like &nbsp; and others
    const decodedText = plainText
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'")
      .replace(/&eacute;/g, 'é')
      .replace(/&egrave;/g, 'è')
      .replace(/&acirc;/g, 'â')
      .replace(/&icirc;/g, 'î')
      .replace(/&oacute;/g, 'ó')
      .replace(/&ucirc;/g, 'û');
    
    // Limit length and add ellipsis if needed
    return decodedText.slice(0, limit) + (decodedText.length > limit ? '...' : '');
  };

  // Use shortDescription with fallback to description for backward compatibility
  const displayDescription = shortDescription || description;
  
  return (
    <Link 
      href={`/adventures/${slug}`}
      className={cn(
        "group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300",
        isCompact ? "h-[280px] sm:h-[220px] md:h-[240px]" : "h-auto",
        isPast ? "opacity-80" : ""
      )}
    >
      <div className={cn(
        "relative w-full",
        isCompact ? "h-full" : "aspect-[4/3]"
      )}>
        <Image
          src={formatImageUrl(image)}
          alt={title}
          fill
          className={cn(
            "object-cover transition-transform duration-500 group-hover:scale-110",
            isPast ? "grayscale-[30%]" : ""
          )}
        />
        
        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/50 to-black/20" />
        
        <div className="absolute inset-0 p-3 sm:p-2.5 md:p-4 flex flex-col justify-end">
          <h3 className={cn(
            "font-semibold text-white group-hover:text-orange-500 transition-colors duration-300 line-clamp-2",
            isCompact ? "text-base sm:text-sm md:text-base" : "text-base md:text-lg"
          )}>{title}</h3>
          
          {!isCompact && (
            <div className="text-gray-200 text-xs mt-1 line-clamp-2">
              {getPreviewText(displayDescription || '', 100)}
            </div>
          )}
          
          <div className={cn(
            "space-y-1.5",
            isCompact ? "mt-3" : "mt-2 md:mt-3"
          )}>
            <div className="flex items-center gap-1.5 text-gray-200">
              {hasDates ? (
                <TooltipProvider>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <div className="flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-orange-500" />
                        <span className="text-[11px] md:text-xs truncate">
                          {mainDateDisplay} + încă {dates.length}
                        </span>
                      </div>
                    </TooltipTrigger>
                    <TooltipContent>
                      <div className="text-xs p-1">
                        <p className="font-semibold mb-1">Intervale de date disponibile:</p>
                        <ul className="space-y-1">
                          <li>{mainDateDisplay} (Principal)</li>
                          {dates.map((additionalDate, idx) => (
                            <li key={idx}>{formatDateDisplay(additionalDate, endDates?.[idx] || additionalDate)}</li>
                          ))}
                        </ul>
                      </div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : (
                <>
                  <Calendar className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-orange-500" />
                  <span className="text-[11px] md:text-xs truncate">{mainDateDisplay}</span>
                </>
              )}
            </div>
            <div className="flex items-center gap-1.5 text-gray-200">
              <Clock className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-orange-500" />
              <span className="text-[11px] md:text-xs truncate">{duration}</span>
            </div>
            <div className="flex items-center gap-1.5 text-gray-200">
              <MapPin className="h-3.5 w-3.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 text-orange-500" />
              <span className="text-[11px] md:text-xs truncate">{location}</span>
            </div>
          </div>
          
          <div className="mt-3 md:mt-4 flex items-center justify-between">
            {price !== undefined && (
              <>
                <div className="flex-shrink-0">
                  <span className="text-[11px] text-gray-300">Începând de la</span>
                </div>
                <div className="flex items-baseline gap-1 px-2 py-1 rounded-lg">
                  <span className="text-lg md:text-base font-bold text-white">{price.toLocaleString()}</span>
                  <span className="text-xs text-orange-500">{currency}</span>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
} 