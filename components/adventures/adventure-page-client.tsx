'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar as CalendarIcon, ChevronDown, MapPinIcon } from 'lucide-react';
import Image from 'next/image';
import { format, startOfDay, isAfter } from 'date-fns';
import { ro } from 'date-fns/locale';
import { BookingForm } from '@/components/booking/booking-form';

// Interface for MongoDB adventure document
interface MongoAdventureExtended {
  _id?: string;
  title: string;
  images: string[];
  dates: {
    startDate: Date;
    endDate: Date;
  }[];
  // Legacy fields for backward compatibility
  date?: Date;
  endDate?: Date;
  price: number;
  includedItems: string[];
  additionalInfo: string[];
  location: string;
  meetingPoint?: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  advancePaymentPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
  shortDescription?: string;
  longDescription?: string;
  description?: string;
  slug?: string;
  bookingCutoffHour?: number;
  availableKayakTypes?: {
    caiacSingle: boolean;
    caiacDublu: boolean;
    placaSUP: boolean;
  };
}

// Helper function to safely parse dates from MongoDB
const safelyParseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date(); 
  
  try {
    const parsedDate = new Date(dateValue);
    
    if (isNaN(parsedDate.getTime())) {
      console.error('Invalid date value:', dateValue);
      return new Date();
    }
    
    return parsedDate;
  } catch (error) {
    console.error('Error parsing date:', error);
    return new Date();
  }
};

// Helper function to safely format dates
const safelyFormatDate = (dateValue: any, formatString: string): string => {
  try {
    const date = safelyParseDate(dateValue);
    return format(date, formatString, { locale: ro });
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Dată indisponibilă';
  }
};

// Helper function to format image URLs correctly
const formatImageUrl = (image: string) => {
  if (!image) return '/placeholder-adventure.jpg';
  if (image.startsWith('http')) return image;
  if (image === '/placeholder-adventure.jpg' || image === 'placeholder-adventure.jpg') 
    return '/placeholder-adventure.jpg';
  if (image.startsWith('/uploads/')) return `https://adventure-time.ro${image}`;
  if (image.startsWith('/')) return image;
  return `/${image}`;
};

// The DateSelector component for cleaner code organization
const DateSelector = ({ 
  datePairs,
  selectedDate, 
  onDateSelect,
  bookingCutoffHour,
  isOpen,
  onOpenChange
}: { 
  datePairs: { startDate: Date; endDate: Date }[],
  selectedDate: Date | null,
  onDateSelect: (date: Date) => void,
  bookingCutoffHour?: number | null,
  isOpen: boolean,
  onOpenChange: (open: boolean) => void
}) => {
  const now = new Date();
  const currentHour = now.getHours();
  const today = startOfDay(now);

  const isSelectedDateToday = selectedDate ? startOfDay(selectedDate).getTime() === today.getTime() : false;

  const allDates = datePairs.map(pair => {
    const isToday = pair.startDate && startOfDay(pair.startDate).getTime() === today.getTime();
    let isPastCutoff = false;
    
    if (isToday && bookingCutoffHour !== null && bookingCutoffHour !== undefined) {
      isPastCutoff = currentHour >= bookingCutoffHour;
    }

    return {
      ...pair,
      isPast: (pair.startDate ? pair.startDate <= now : true) || isPastCutoff
    };
  });
  
  const futureDates = allDates.filter(pair => !pair.isPast);
  const usePopover = allDates.length > 3;

  const formatDateRange = (pair: { startDate: Date; endDate: Date}) => {
    if (!pair.startDate) return 'Dată indisponibilă';
    
    const startDateStr = safelyFormatDate(pair.startDate, 'dd MMMM yyyy');
    if (!pair.endDate) return startDateStr;
    
    const startDay = pair.startDate.getDate();
    const startMonth = pair.startDate.getMonth();
    const startYear = pair.startDate.getFullYear();
    
    const endDay = pair.endDate.getDate();
    const endMonth = pair.endDate.getMonth();
    const endYear = pair.endDate.getFullYear();
    
    if (startDay === endDay && startMonth === endMonth && startYear === endYear) {
      return startDateStr;
    }
    
    const endDateStr = safelyFormatDate(pair.endDate, 'dd MMMM yyyy');
    return `${startDateStr} - ${endDateStr}`;
  };
  
  const findDatePair = (date: Date | null) => {
    if (!date) return null;
    
    return allDates.find(pair => 
      pair.startDate && date.getTime() === pair.startDate.getTime()
    ) || null;
  };
  
  if (usePopover) {
    return (
      <Popover open={isOpen} onOpenChange={onOpenChange}>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full flex justify-between items-center"
          >
            <div className="flex items-center gap-2">
              <CalendarIcon className="h-4 w-4" />
              <span>
                {selectedDate 
                  ? formatDateRange(findDatePair(selectedDate) || { startDate: selectedDate, endDate: selectedDate })
                  : 'Selectează o dată'}
              </span>
            </div>
            <div className="flex items-center">
              <Badge variant="outline" className="mr-2">{allDates.length} date</Badge>
              <ChevronDown className="h-4 w-4" />
            </div>
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-0" align="start">
          <div className="max-h-[300px] overflow-y-auto">
            {allDates.length > 0 ? (
              allDates.map((pair, index) => {
                if (!pair.startDate) return null;
                
                const dayName = safelyFormatDate(pair.startDate, 'EEEE');
                const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
                
                return (
                  <button
                    key={index}
                    onClick={() => {
                      if (!pair.isPast) {
                        onDateSelect(pair.startDate!);
                        onOpenChange(false);
                      }
                    }}
                    disabled={pair.isPast}
                    className={`w-full text-left p-3 hover:bg-gray-100 dark:hover:bg-gray-800 relative ${
                      selectedDate && pair.startDate && selectedDate.getTime() === pair.startDate.getTime()
                        ? 'bg-orange-50 dark:bg-orange-900/20'
                        : ''
                    } ${
                      pair.isPast
                        ? 'opacity-70 cursor-not-allowed'
                        : ''
                    }`}
                  >
                    <p className="font-medium text-base">{capitalizedDayName}</p>
                    <p className="text-gray-600 dark:text-gray-400">
                      {formatDateRange(pair)}
                    </p>
                    {pair.isPast && (
                      <span className="absolute top-2 right-2 text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                        Trecut
                      </span>
                    )}
                  </button>
                );
              })
            ) : (
              <div className="p-3 text-center text-gray-500">
                Nu există date disponibile
              </div>
            )}
          </div>
        </PopoverContent>
      </Popover>
    );
  }
  
  return (
    <div className="grid grid-cols-1 gap-2">
      {isSelectedDateToday && bookingCutoffHour !== null && bookingCutoffHour !== undefined && (
        <div className="p-2 text-sm text-center bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-md mb-2">
          Rezervările pentru astăzi sunt disponibile până la ora {bookingCutoffHour}:00.
        </div>
      )}
      {allDates.length > 0 ? (
        allDates.map((pair, index) => {
          if (!pair.startDate) return null;
          
          const dayName = safelyFormatDate(pair.startDate, 'EEEE');
          const capitalizedDayName = dayName.charAt(0).toUpperCase() + dayName.slice(1);
          
          return (
            <button
              key={index}
              onClick={() => {
                if (!pair.isPast) {
                  onDateSelect(pair.startDate!);
                }
              }}
              disabled={pair.isPast}
              className={`text-left p-3 rounded-md border relative ${
                selectedDate && pair.startDate && selectedDate.getTime() === pair.startDate.getTime()
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20'
                  : 'border-gray-200 hover:border-orange-300 dark:border-gray-700'
              } ${
                pair.isPast 
                  ? 'opacity-70 cursor-not-allowed'
                  : ''
              }`}
            >
              <p className="font-medium text-base">{capitalizedDayName}</p>
              <p className="text-gray-600 dark:text-gray-400">
                {formatDateRange(pair)}
              </p>
              {pair.isPast && (
                <span className="absolute top-2 right-2 text-xs text-amber-600 font-medium bg-amber-100 px-2 py-0.5 rounded-full">
                  Trecut
                </span>
              )}
            </button>
          );
        })
      ) : (
        <div className="p-3 text-center text-gray-500 border border-gray-200 dark:border-gray-700 rounded-md">
          Nu există date disponibile
        </div>
      )}
    </div>
  );
};

interface AdventurePageClientProps {
  adventure: MongoAdventureExtended;
}

export function AdventurePageClient({ adventure }: AdventurePageClientProps) {
  const [showBookingForm, setShowBookingForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [isDatePopoverOpen, setIsDatePopoverOpen] = useState(false);

  useEffect(() => {
    // Set the first available future date as the default selected date
    const today = startOfDay(new Date());
    
    if (adventure.dates && adventure.dates.length > 0) {
      const futureDates = adventure.dates.filter((date: any) => 
        typeof date === 'object' && date.startDate && isAfter(new Date(date.startDate), today)
      );
      
      if (futureDates.length > 0) {
        setSelectedDate(new Date(futureDates[0].startDate));
      } else {
        setSelectedDate(null);
      }
    } else if (adventure.date) {
      const adventureDate = new Date(adventure.date);
      if (isAfter(adventureDate, today)) {
        setSelectedDate(adventureDate);
      } else {
        setSelectedDate(null);
      }
    }
  }, [adventure]);

  // Get formatted duration string
  const durationStr = `${adventure.duration.value} ${adventure.duration.unit}`;
  
  // Get formatted difficulty for display (capitalize first letter)
  const displayDifficulty = adventure.difficulty.charAt(0).toUpperCase() + adventure.difficulty.slice(1);

  // Calculate advance payment amount based on base price
  const basePrice = adventure.price || 0;
  const advancePaymentAmount = Math.round(basePrice * (adventure.advancePaymentPercentage || 30) / 100);

  // Function to handle date selection
  const handleDateSelection = (date: Date) => {
    setSelectedDate(date);
    setIsDatePopoverOpen(false);
  };

  // Get all available dates as a flat array for compatibility
  const allDates = adventure.dates && Array.isArray(adventure.dates) 
    ? adventure.dates.map(datePair => safelyParseDate(datePair.startDate)) 
    : adventure.date ? [safelyParseDate(adventure.date)] : [];

  // Create date pairs for display
  const datePairs = adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 && 
    typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)
      ? adventure.dates.map(datePair => ({
          startDate: safelyParseDate(datePair.startDate),
          endDate: safelyParseDate(datePair.endDate)
        }))
      : [
          {
            startDate: safelyParseDate(adventure.date || new Date()),
            endDate: adventure.endDate ? safelyParseDate(adventure.endDate) : safelyParseDate(adventure.date || new Date())
          }
        ];

  return (
    <div className="container mx-auto px-2 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Carousel and Basic Info */}
        <div>
          <div className="relative">
            <Carousel className="w-full">
              <CarouselContent>
                {adventure.images && adventure.images.length > 0 ? (
                  adventure.images.map((image, index) => (
                    <CarouselItem key={index}>
                      <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                        <Image
                          src={formatImageUrl(image)}
                          alt={`${adventure.title} - Imagine ${index + 1}`}
                          fill
                          className="object-cover"
                          sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          priority={index === 0}
                        />
                      </div>
                    </CarouselItem>
                  ))
                ) : (
                  <CarouselItem>
                    <div className="relative aspect-[4/3] w-full overflow-hidden rounded-lg">
                      <Image
                        src={`https://picsum.photos/seed/${adventure.title.toLowerCase().replace(/\s+/g, '')}/800/600`}
                        alt={adventure.title}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                        priority
                      />
                    </div>
                  </CarouselItem>
                )}
              </CarouselContent>
              <div className="absolute inset-y-1/2 left-2 right-2 flex justify-between -translate-y-1/2">
                <CarouselPrevious className="relative translate-y-0 left-0" />
                <CarouselNext className="relative translate-y-0 right-0" />
              </div>
            </Carousel>
          </div>

          <div className="mt-6">
            <h1 className="text-3xl font-bold mb-4">{adventure.title}</h1>
            <div className="flex flex-wrap gap-2 mb-4">
              <Badge variant="secondary">{displayDifficulty}</Badge>
              <Badge variant="secondary">{durationStr}</Badge>
              <Badge 
                variant="secondary" 
                className="cursor-help"
                title={`Locație: ${adventure.location}`}
              >
                {adventure.location}
              </Badge>
            </div>
            
            {(adventure.shortDescription || adventure.description) && (
              <div 
                className="prose max-w-none dark:prose-invert break-all hyphens-auto overflow-x-hidden mb-4"
                style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
                dangerouslySetInnerHTML={{ 
                  __html: adventure.shortDescription || adventure.description || ''
                }}
              />
            )}
          </div>
        </div>

        {/* Right Column - Booking and Details */}
        <div>
          <Card>
            <CardContent className="p-7">
              {!showBookingForm ? (
                <>
                  <div className="mb-6">
                    <h2 className="text-2xl font-bold mb-2">Rezervă aventura</h2>
                    <div className="flex flex-col mb-2">
                      <div>
                        <p className="text-2xl font-bold text-primary">{adventure.price} lei</p>
                        <p className="text-sm text-gray-500">per persoană</p>
                      </div>
                    </div>
                    
                    <div className="mt-2 p-3 bg-orange-100 dark:bg-orange-950/30 rounded-md">
                      <p className="text-sm font-medium text-orange-800 dark:text-orange-400">
                        Plată în avans: {advancePaymentAmount} lei ({adventure.advancePaymentPercentage}%)
                      </p>
                      <p className="text-xs text-orange-700 dark:text-orange-500 mt-1">
                        Plătește {adventure.advancePaymentPercentage}% acum pentru a-ți asigura locul. Vei selecta tipurile de ambarcațiuni în următorul pas. Restul se va plăti în numerar în ziua aventurii.
                      </p>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h3 className="text-lg font-semibold mb-2">Date disponibile</h3>
                    {allDates.length > 0 ? (
                      <DateSelector 
                        datePairs={datePairs}
                        selectedDate={selectedDate}
                        onDateSelect={handleDateSelection}
                        bookingCutoffHour={adventure.bookingCutoffHour}
                        isOpen={isDatePopoverOpen}
                        onOpenChange={setIsDatePopoverOpen}
                      />
                    ) : (
                      <p className="text-gray-600">
                        {safelyFormatDate(adventure.date, 'dd MMMM yyyy')} 
                        {adventure.endDate && ` - ${safelyFormatDate(adventure.endDate, 'dd MMMM yyyy')}`}
                      </p>
                    )}
                  </div>

                  {adventure.meetingPoint && (
                    <div className="mb-6">
                      <h3 className="text-lg font-semibold mb-2">Punct de întâlnire</h3>
                      <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded-md">
                        <div className="flex items-start gap-2">
                          <MapPinIcon className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
                          <p className="text-blue-800 dark:text-blue-300">
                            {adventure.meetingPoint}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  <Button 
                    className="w-full mb-4" 
                    size="lg"
                    onClick={() => setShowBookingForm(true)}
                    disabled={!selectedDate}
                  >
                    Rezervă acum
                  </Button>
                  {!selectedDate && (
                    <p className="text-sm text-red-500 mb-4 text-center">
                      Nu există date disponibile în viitor pentru această aventură.
                    </p>
                  )}
                </>
              ) : (
                <BookingForm
                  adventureId={adventure._id || ''}
                  adventureTitle={adventure.title}
                  adventurePrice={adventure.price}
                  adventureDate={selectedDate || new Date()}
                  availableKayakTypes={adventure.availableKayakTypes}
                  advancePaymentPercentage={adventure.advancePaymentPercentage}
                />
              )}

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Ce este inclus</h3>
                <ul className="space-y-2">
                  {adventure.includedItems && adventure.includedItems.length > 0 ? (
                    adventure.includedItems.map((item, index) => (
                      <li key={index} className="flex items-center gap-2">
                        <svg
                          className="w-5 h-5 text-green-500"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M5 13l4 4L19 7"
                          />
                        </svg>
                        {item}
                      </li>
                    ))
                  ) : (
                    <li className="flex items-center gap-2">
                      <svg
                        className="w-5 h-5 text-green-500"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      Ghidaj profesional
                    </li>
                  )}
                </ul>
              </div>

              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-2">Informații suplimentare</h3>
                <div className="space-y-2 text-sm text-gray-600 dark:text-white">
                  {adventure.additionalInfo && adventure.additionalInfo.length > 0 ? (
                    adventure.additionalInfo.map((info, index) => (
                      <p key={index}>{info}</p>
                    ))
                  ) : (
                    <>
                      <p>Participanți maxim: 8</p>
                      {!adventure.meetingPoint && 
                        <p>Punct de întâlnire: Va fi trimis după rezervare</p>
                      }
                      <p>Anulare: Gratuită cu până la 24 de ore înainte de începere</p>
                    </>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Long description section - Full width */}
      {adventure.longDescription && (
        <div className="mt-10">
          <div className="border-t border-gray-200 dark:border-gray-800 pt-8">
            <h2 className="text-2xl font-bold mb-4">Detalii aventură</h2>
            <div 
              className="prose max-w-none dark:prose-invert break-all hyphens-auto overflow-x-hidden"
              style={{ wordWrap: 'break-word', overflowWrap: 'break-word', maxWidth: '100%' }}
              dangerouslySetInnerHTML={{ 
                __html: adventure.longDescription 
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
} 