'use client';

import { AdventureCard } from '@/components/adventures/adventure-card';
import { CalendarWidget } from '@/components/calendar/calendar-widget';
import { CalendarModal } from '@/components/calendar/calendar-modal';
import { BookingList } from '@/components/bookings/booking-list';
import { DestinationSearch } from '@/components/search/destination-search';
import { useState, useMemo, useEffect } from 'react';
import { format, addDays, startOfMonth, getDate, isSameDay, addMonths, subMonths, isBefore, isAfter, startOfDay, eachDayOfInterval } from 'date-fns';
import { getAdventures, getAdventureById } from '@/lib/actions/adventure';
import { getUserBookings, getUserBookingsAndIntents } from '@/lib/actions/booking';
import { IAdventure } from '@/lib/models/adventure';
import { useAuth } from '@/lib/hooks/use-auth';
import Link from 'next/link';
import { formatPrice, formatImageUrl } from '@/lib/utils';
import { ChevronLeft, ChevronRight } from 'lucide-react'; // Added import for ChevronLeft and ChevronRight

// Added interface for MongoDB document with _id
interface MongoAdventure extends IAdventure {
  _id?: string;
  description?: string; // Optional for backward compatibility
  endDates?: string[] | Date[]; // Optional for legacy additional dates' end dates
  _expandedFromId?: string; // Reference to original adventure ID for expanded adventures
  _originalDateIndex?: number; // Index of the original date in the dates array
  singleDateMode?: boolean; // Flag to indicate if this is a single date adventure
  singleDate?: string | Date; // Single date for the adventure
  singleEndDate?: string | Date; // Single end date for the adventure
  uniqueId?: string; // Unique identifier for expanded adventures
  bookingCutoffHour?: number; // Add cutoff hour
  slug?: string; // Reverted slug to optional
}

// Interface for the combined booking and payment intent structure
interface BookingOrPaymentIntent {
  _id: string;
  orderId: string;
  adventureId: string;
  adventureTitle: string;
  date?: Date | string;
  startDate?: Date | string;
  endDate?: Date | string;
  price: number;
  advancePaymentPercentage: number;
  advancePaymentAmount: number;
  status: string;
  isPaymentIntent: boolean;
  createdAt: Date | string;
  location?: string;
  adventureImage?: string;
  paymentAttempt?: number;
  kayakSelections?: {
    caiacSingle?: number;
    caiacDublu?: number;
    placaSUP?: number;
  };
  [key: string]: any; // For any additional properties
}

// Helper function to generate random event dates
const generateRandomEventDates = (baseDate: Date, count: number) => {
  const dates: Date[] = [];
  const today = startOfDay(new Date());
  const monthStart = startOfMonth(baseDate);
  
  while (dates.length < count) {
    // Generate random days starting from today
    const randomDays = Math.floor(Math.random() * 28) + 1; // Add at least 1 day to make it future
    const newDate = addDays(today, randomDays);
    
    if (!dates.some(date => getDate(date) === getDate(newDate))) {
      dates.push(newDate);
    }
  }
  
  return dates;
};

// Helper function to safely parse dates from MongoDB
const safelyParseDate = (dateValue: any): Date => {
  if (!dateValue) return new Date(); // Default to current date if null/undefined
  
  try {
    // If it's an ISO string or timestamp, use the Date constructor
    const parsedDate = new Date(dateValue);
    
    // Check if the date is valid
    if (isNaN(parsedDate.getTime())) {
      // Instead of logging an error, just return current date silently
      return new Date(); // Return current date as fallback
    }
    
    return parsedDate;
  } catch (error) {
    // Silently handle error and return current date
    return new Date(); // Return current date as fallback
  }
};

// Helper function to safely format dates
const safelyFormatDate = (dateValue: any, formatString: string): string => {
  try {
    const date = safelyParseDate(dateValue);
    return format(date, formatString);
  } catch (error) {
    // Silently handle error and return a default string
    return 'Date unavailable';
  }
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [adventures, setAdventures] = useState<MongoAdventure[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [upcomingBookings, setUpcomingBookings] = useState<any[]>([]);
  const [upcomingAdventures, setUpcomingAdventures] = useState<MongoAdventure[]>([]);
  const [upcomingAdventuresByDate, setUpcomingAdventuresByDate] = useState<any[]>([]);

  // Navigation functions for the calendar
  const nextMonth = () => setCurrentMonth(addMonths(currentMonth, 1));
  const previousMonth = () => setCurrentMonth(subMonths(currentMonth, 1));

  // Fetch adventures and bookings
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch adventures
        const adventureResponse = await getAdventures();
        if (adventureResponse.success && adventureResponse.data) {
          // Get all adventures
          // Ensure all adventures conform to MongoAdventure, providing slug fallback
          const allAdventures: MongoAdventure[] = adventureResponse.data.map((adv: any) => ({
            ...adv,
            slug: adv.slug || adv._id?.toString() || `fallback-slug-${adv._id || Math.random()}`,
          }));
          
          // Store all adventures for calendar calculation
          setAdventures(allAdventures);
          
          // Get future adventures for display, sorted by date
          const futureAdventures = allAdventures
            .filter(adventure => {
              // Check if it has future dates in the new format
              if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
                  typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
                const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
                return dateArray.some(datePair => safelyParseDate(datePair.startDate) >= new Date());
              }
              // Check legacy format
              return safelyParseDate(adventure.date) >= new Date();
            })
            .sort((a, b) => safelyParseDate(a.date).getTime() - safelyParseDate(b.date).getTime());
          
          // Get the nearest 3 adventures for "Aventurile Viitoare" - one per adventure
          setUpcomingAdventures(futureAdventures.slice(0, 3).map(adventure => ({ ...adventure, slug: adventure.slug || adventure._id })));
          
          // Create a list with one entry per adventure (not per date)
          const uniqueAdventures: any[] = [];
          
          futureAdventures.slice(0, 6).forEach(adventure => {
            // Check if adventure has dates array with the new structure
            if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
                typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
              
              // New structure - find the earliest future date
              const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
              
              // Sort dates chronologically and get first future date
              const sortedDates = [...dateArray].sort((a, b) => 
                safelyParseDate(a.startDate).getTime() - safelyParseDate(b.startDate).getTime()
              );
              
              // Only include future dates
              const now = new Date();
              const futureDates = sortedDates.filter(datePair => 
                safelyParseDate(datePair.startDate) >= now
              );
              
              // Add only the first (earliest) future date for this adventure
              if (futureDates.length > 0) {
                const earliestDate = futureDates[0];
                uniqueAdventures.push({
                  ...adventure,
                  slug: adventure.slug || (adventure._id ? adventure._id.toString() : `adventure-${uniqueAdventures.length}`),
                  _id: adventure._id || `temp-id-${uniqueAdventures.length}`,
                  singleDateMode: true,
                  singleDate: earliestDate.startDate,
                  singleEndDate: earliestDate.endDate,
                  // Create a unique ID for the card
                  uniqueId: `${adventure._id || `temp-id-${uniqueAdventures.length}`}-${safelyParseDate(earliestDate.startDate).getTime()}`
                });
              }
            } else {
              // Legacy structure - add the main date
              if (adventure.date) {
                const mainDate = safelyParseDate(adventure.date);
                // Only include future dates
                if (mainDate >= new Date()) {
                  const fallbackBaseId = adventure._id ? adventure._id.toString() : `legacy-${adventure.title.slice(0, 10).replace(/\s+/g, '-')}`;
                  const fallbackSlug = adventure.slug || fallbackBaseId;
                  uniqueAdventures.push({
                    ...adventure,
                    slug: fallbackSlug,
                    _id: fallbackBaseId, // Ensure _id exists using the base
                    singleDateMode: true,
                    singleDate: adventure.date,
                    singleEndDate: adventure.endDate || (() => {
                      const endDate = new Date(mainDate);
                      endDate.setDate(endDate.getDate() + 1);
                      return endDate;
                    })(),
                    // Create a unique ID for the card
                    uniqueId: `${fallbackBaseId}-${mainDate.getTime()}`
                  });
                }
              }
            }
          });
          
          // Sort unique adventures by date
          uniqueAdventures.sort((a, b) => 
            safelyParseDate(a.singleDate).getTime() - safelyParseDate(b.singleDate).getTime()
          );
          
          // Limit to the closest 6 unique adventures
          setUpcomingAdventuresByDate(uniqueAdventures.slice(0, 6));
        }

        // Fetch user bookings if user is logged in
        if (user) {
          const bookingsResponse = await getUserBookingsAndIntents(user.id);
          if (bookingsResponse.success && bookingsResponse.data) {
            // Get the most recent bookings (include payment intents marked as pending)
            // Filter out past bookings - only show future bookings
            const today = startOfDay(new Date());
            const userBookings = bookingsResponse.data.filter(function(b: BookingOrPaymentIntent) { 
              // Include payment intents that are pending or processing
              if (b.isPaymentIntent && ['pending', 'processing'].includes(b.status)) {
                return true;
              }
              
              // Check if booking date is in the future
              const bookingDate = new Date(b.startDate || b.date || new Date());
              return isAfter(bookingDate, today);
            });
            
            // Format bookings for the BookingList component
            const formattedBookings = await Promise.all(
              userBookings.slice(0, 3).map(async function(booking: any) {
                // Calculate the total price based on kayak selections
                const totalPrice = 
                  ((booking.kayakSelections?.caiacSingle || 0) * booking.price) + 
                  ((booking.kayakSelections?.caiacDublu || 0) * booking.price * 2) + 
                  ((booking.kayakSelections?.placaSUP || 0) * booking.price);
                
                // If the booking already has an image, use it
                if (booking.adventureImage) {
                  return {
                    destination: booking.adventureTitle,
                    date: safelyFormatDate(booking.startDate || booking.date, 'dd MMM yyyy'),
                    imageUrl: formatImageUrl(booking.adventureImage),
                    price: totalPrice, // Use calculated total price
                    advancePaymentAmount: booking.advancePaymentAmount,
                    status: booking.status,
                    isPaymentIntent: booking.isPaymentIntent,
                    id: booking.isPaymentIntent ? booking.orderId : booking._id
                  };
                }
                
                // Otherwise, fetch the adventure details to get the image
                let imageUrl = `https://picsum.photos/seed/${booking.adventureTitle.toLowerCase().replace(/\s+/g, '')}/800/600`;
                
                try {
                  const adventureResponse = await getAdventureById(booking.adventureId);
                  if (adventureResponse.success && adventureResponse.data) {
                    const adventure = adventureResponse.data;
                    
                    // Use the first image from the adventure if available
                    if (adventure.images && adventure.images.length > 0) {
                      imageUrl = adventure.images[0].startsWith('http')
                        ? adventure.images[0]
                        : adventure.images[0] === '/placeholder-adventure.jpg' || adventure.images[0] === 'placeholder-adventure.jpg'
                          ? '/placeholder-adventure.jpg' // Always use absolute path for local images
                          : adventure.images[0].startsWith('/')
                            ? adventure.images[0] // Already has leading slash
                            : `/${adventure.images[0]}`; // Add leading slash for relative paths
                    }
                  }
                } catch (error) {
                  // Silent fail for adventure fetch - this is non-critical
                  // Use default image if adventure fetch fails
                }
                
                return {
                  destination: booking.adventureTitle,
                  date: safelyFormatDate(booking.startDate || booking.date, 'dd MMM yyyy'),
                  imageUrl: formatImageUrl(imageUrl),
                  price: totalPrice, // Use calculated total price
                  advancePaymentAmount: booking.advancePaymentAmount,
                  status: booking.status,
                  isPaymentIntent: booking.isPaymentIntent,
                  id: booking.isPaymentIntent ? booking.orderId : booking._id
                };
              })
            );
            
            setUpcomingBookings(formattedBookings);
          }
        }
      } catch (error) {
        // Log error but continue rendering the dashboard with available data
        if (process.env.NODE_ENV === 'development') {
          console.warn('Dashboard data fetch issue:', error instanceof Error ? error.message : 'Unknown error');
        }
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [user]);

  // Generate event dates for the calendar based on actual adventure dates
  const eventDates = useMemo(() => {
    if (adventures.length > 0) {
      // Collect all dates, including past ones - now includes all days in the range
      const allDates: Date[] = [];
      
      adventures.forEach(adventure => {
        // Check if we have the new structure with an array of date objects
        if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
            typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
          // New structure - extract all days between startDate and endDate
          const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
          dateArray.forEach(datePair => {
            const startDate = safelyParseDate(datePair.startDate);
            const endDate = safelyParseDate(datePair.endDate);
            
            // Get all days in the interval between start and end date (inclusive)
            try {
              const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
              allDates.push(...daysInRange);
            } catch (error) {
              // If there's an error with the interval, just add the start date as fallback
              console.warn('Error generating date interval for adventure:', adventure.title, error);
              allDates.push(startDate);
            }
          });
        } else if (adventure.dates && Array.isArray(adventure.dates)) {
          // Legacy array of dates
          adventure.dates.forEach(singleDate => {
            const date = safelyParseDate(singleDate);
            allDates.push(date);
          });
        } else if (adventure.date) {
          // Legacy single date - also include end date range if available
          const startDate = safelyParseDate(adventure.date);
          if (adventure.endDate) {
            const endDate = safelyParseDate(adventure.endDate);
            try {
              const daysInRange = eachDayOfInterval({ start: startDate, end: endDate });
              allDates.push(...daysInRange);
            } catch (error) {
              console.warn('Error generating date interval for legacy adventure:', adventure.title, error);
              allDates.push(startDate);
            }
          } else {
            allDates.push(startDate);
          }
        }
      });
      
      // Remove duplicates by converting to Set of timestamps and back
      const uniqueDates = Array.from(new Set(allDates.map(d => d.getTime())))
        .map(timestamp => new Date(timestamp))
        .sort((a, b) => a.getTime() - b.getTime());
      
      // Debugging - log extracted dates for verification
      console.log('Calendar event dates (including all days in ranges):', uniqueDates.map(d => d.toISOString().split('T')[0]));
      
      return uniqueDates;
    }
    return [];
  }, [adventures]);

  // Function to get adventures for a specific date
  const getAdventuresForDate = (date: Date | null) => {
    const today = startOfDay(new Date());
    
    if (!date) {
      // If no date is selected, return adventures for tomorrow, not today
      const tomorrow = addDays(today, 1);
      return adventures.filter(adventure => {
        // Check if we have the new structure with an array of date objects
        if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
            typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
          // New structure - check if tomorrow falls within any date range
          const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
          return dateArray.some(datePair => {
            const startDate = safelyParseDate(datePair.startDate);
            const endDate = safelyParseDate(datePair.endDate);
            // Check if tomorrow is within the date range (inclusive) and is a future date
            return tomorrow >= startOfDay(startDate) && tomorrow <= startOfDay(endDate) && isAfter(startDate, today);
          });
        } else {
          // Legacy structure - check main date and additional dates
          if (adventure.date) {
            const mainDate = safelyParseDate(adventure.date);
            const endDate = adventure.endDate ? safelyParseDate(adventure.endDate) : mainDate;
            // Check if tomorrow falls within the date range
            if (tomorrow >= startOfDay(mainDate) && tomorrow <= startOfDay(endDate) && isAfter(mainDate, today)) return true;
          }
          
          // Check additional dates if they exist
          if (adventure.dates && Array.isArray(adventure.dates)) {
            return adventure.dates.some(additionalDate => {
              if (!additionalDate) return false;
              const parsedDate = safelyParseDate(additionalDate);
              return isSameDay(parsedDate, tomorrow) && isAfter(parsedDate, today);
            });
          }
        }
        
        return false;
      });
    }
    
    // Show adventures for the selected date, regardless of whether it's in the past
    return adventures.filter(adventure => {
      // Check if we have the new structure with an array of date objects
      if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
          typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
        // New structure - check if the selected date falls within any date range
        const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
        return dateArray.some(datePair => {
          const startDate = safelyParseDate(datePair.startDate);
          const endDate = safelyParseDate(datePair.endDate);
          // Check if the selected date is within the date range (inclusive), ignoring time
          return startOfDay(date) >= startOfDay(startDate) && startOfDay(date) <= startOfDay(endDate);
        });
      } else {
        // Legacy structure - check main date and additional dates, including end date ranges
        if (adventure.date) {
          const mainDate = safelyParseDate(adventure.date);
          const endDate = adventure.endDate ? safelyParseDate(adventure.endDate) : mainDate;
          // Check if the selected date falls within the date range, ignoring time
          if (startOfDay(date) >= startOfDay(mainDate) && startOfDay(date) <= startOfDay(endDate)) return true;
        }
        
        // Check additional dates if they exist
        if (adventure.dates && Array.isArray(adventure.dates)) {
          return adventure.dates.some(additionalDate => {
            if (!additionalDate) return false;
            const parsedDate = safelyParseDate(additionalDate);
            return isSameDay(parsedDate, date);
          });
        }
      }
      
      return false;
    });
  };

  const handleDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  const getClosestDateInfo = (adventure: MongoAdventure) => {
    const now = new Date();
    let closestDate: Date | null = null;
    let closestEndDate: Date | null = null;
    let smallestDiff = Infinity;
    
    // Check if we have the new structure with date objects
    if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 &&
        typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
      // New structure - find the closest future date
      const dateArray = adventure.dates as unknown as { startDate: string | Date; endDate: string | Date }[];
      
      dateArray.forEach(datePair => {
        const startDate = safelyParseDate(datePair.startDate);
        
        // Only consider future dates
        if (startDate >= now) {
          const diff = startDate.getTime() - now.getTime();
          if (diff < smallestDiff) {
            smallestDiff = diff;
            closestDate = startDate;
            closestEndDate = safelyParseDate(datePair.endDate);
          }
        }
      });
      
      // If we found a closest date, return it
      if (closestDate && closestEndDate) {
        return {
          date: safelyFormatDate(closestDate, 'dd MMM yyyy'),
          endDate: safelyFormatDate(closestEndDate, 'dd MMM yyyy')
        };
      }
    }
    
    // Fallback to legacy date field if no future dates in the new structure
    // or if using old date structure
    if (adventure.date) {
      const legacyDate = safelyParseDate(adventure.date);
      const legacyEndDate = adventure.endDate 
        ? safelyParseDate(adventure.endDate)
        : (() => {
            const endDate = new Date(legacyDate);
            endDate.setDate(endDate.getDate() + 1);
            return endDate;
          })();
      
      return {
        date: safelyFormatDate(legacyDate, 'dd MMM yyyy'),
        endDate: safelyFormatDate(legacyEndDate, 'dd MMM yyyy')
      };
    }
    
    // Default fallback if no dates at all
    return {
      date: "Dată indisponibilă",
      endDate: "Dată indisponibilă"
    };
  };

  // Filter adventures for the selected date - remove search filtering
  const getFilteredAdventuresForDate = (date: Date | null) => {
    return getAdventuresForDate(date);
  };

  // Filter upcoming adventures - remove search filtering
  const getFilteredUpcomingAdventures = () => {
    return upcomingAdventuresByDate;
  };

  return (
    <div className="container mx-auto px-0 sm:px-2">
      <div className="mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-white">
              {user ? `Bună, ${user.name || 'Aventurier'}!` : 'Bine ai venit la Adventure Time!'}
            </h1>
            <p className="text-gray-400 mt-1">Ce aventură o să începi azi?</p>
          </div>
          <div className="flex justify-end">
            <CalendarModal 
              onDateSelect={handleDateSelect}
              eventDates={eventDates}
              currentMonth={currentMonth}
              onNextMonth={nextMonth}
              onPreviousMonth={previousMonth}
              selectedDate={selectedDate}
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <p className="text-white">Încărcare aventuri...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-4 sm:gap-6 lg:flex-row lg:gap-8">
          {/* Main content */}
          <div className="w-full lg:w-3/5 xl:w-2/3 space-y-4 sm:space-y-6">
            {/* Display selected date adventures if selected date exists */}
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  {selectedDate 
                    ? isSameDay(selectedDate, new Date())
                      ? 'Aventuri pentru Astăzi'
                      : `Aventuri din ${safelyFormatDate(selectedDate, 'dd MMMM yyyy')}`
                    : 'Aventuri pentru Astăzi'
                  }
                </h2>
                <Link href="/adventures" className="text-orange-500 hover:text-orange-600 text-sm sm:text-base">Vezi Toate</Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                {getFilteredAdventuresForDate(selectedDate).length > 0 ? (
                  getFilteredAdventuresForDate(selectedDate).map((adventure) => {
                    // Check if this is a past adventure based on the selected date
                    const now = new Date();
                    const today = startOfDay(now);
                    const currentHour = now.getHours();

                    // Determine the relevant start and end dates for comparison
                    const adventureStartDate = adventure.singleDateMode 
                      ? safelyParseDate(adventure.singleDate)
                      : (adventure.dates && adventure.dates.length > 0) 
                        ? safelyParseDate(adventure.dates[0].startDate)
                        : safelyParseDate(adventure.date); // Fallback to legacy
                    
                    // Robust End Date Calculation: Use specific end date, fallback to legacy end date, or finally start date
                    const adventureEndDate = adventure.singleDateMode 
                      ? safelyParseDate(adventure.singleEndDate) 
                      : (adventure.dates && adventure.dates.length > 0) 
                        ? safelyParseDate(adventure.dates[0].endDate)
                        : safelyParseDate(adventure.endDate || adventureStartDate); // Use start date if end date is missing

                    const isAdventureToday = isSameDay(adventureStartDate, today);
                    let isPastCutoffOrStartTime = false;

                    // Check cutoff/start time ONLY if the adventure *starts* today
                    if (isAdventureToday) {
                      const cutoffHour = adventure.bookingCutoffHour;
                      if (cutoffHour !== null && cutoffHour !== undefined) {
                        // Use cutoff hour if defined
                        isPastCutoffOrStartTime = currentHour >= cutoffHour;
                      } else {
                        // Otherwise, check against the specific start time
                        isPastCutoffOrStartTime = adventureStartDate <= now;
                      }
                    }

                    // Determine if the adventure is truly past:
                    // It's past if its END date is strictly before today OR 
                    // if it started today AND the cutoff/start time has passed.
                    const isPast = isBefore(adventureEndDate, today) || isPastCutoffOrStartTime;
                    
                    return (
                      <AdventureCard
                        key={adventure.uniqueId}
                        slug={adventure.slug || (adventure._id ? adventure._id.toString() : "")}
                        title={adventure.title}
                        description={adventure.description || ''}
                        shortDescription={adventure.shortDescription}
                        image={adventure.images && adventure.images.length > 0 
                          ? formatImageUrl(adventure.images[0])
                          : `https://picsum.photos/seed/${adventure.title.toLowerCase().replace(/\s+/g, '')}/800/600`}
                        date={getClosestDateInfo(adventure).date}
                        endDate={getClosestDateInfo(adventure).endDate}
                        dates={adventure.dates?.map((date: any) => {
                          if (typeof date === 'object' && 'startDate' in date) {
                            return safelyFormatDate(date.startDate, 'dd MMM yyyy');
                          }
                          return safelyFormatDate(date, 'dd MMM yyyy');
                        }) || []}
                        duration={`${adventure.duration.value} ${adventure.duration.unit}`}
                        location={adventure.location}
                        price={adventure.price}
                        variant="compact"
                        isPast={isPast}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-6 sm:py-8">
                    <p className="text-gray-400">Nu există aventuri pentru data selectată</p>
                  </div>
                )}
              </div>
            </div>

            {/* Display closest upcoming adventures section */}
            <div>
              <div className="flex items-center justify-between mb-2 sm:mb-3">
                <h2 className="text-lg sm:text-xl font-semibold text-white">
                  Cele mai apropiate aventuri
                </h2>
                <Link href="/adventures" className="text-orange-500 hover:text-orange-600 text-sm sm:text-base">Vezi Toate</Link>
              </div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-3">
                {getFilteredUpcomingAdventures().length > 0 ? (
                  getFilteredUpcomingAdventures().map((adventure) => {
                    const now_upcoming = new Date();
                    const today_upcoming = startOfDay(now_upcoming);
                    const currentHour_upcoming = now_upcoming.getHours();
                    
                    // Use singleDate/singleEndDate if available (flattened list), otherwise fallback
                    const adventureStartDate = adventure.singleDateMode 
                      ? safelyParseDate(adventure.singleDate)
                      : (adventure.dates && adventure.dates.length > 0) 
                        ? safelyParseDate(adventure.dates[0].startDate)
                        : safelyParseDate(adventure.date); // Fallback to legacy date if no dates array
                        
                    const adventureEndDate = adventure.singleDateMode 
                      ? safelyParseDate(adventure.singleEndDate)
                      : (adventure.dates && adventure.dates.length > 0) 
                        ? safelyParseDate(adventure.dates[0].endDate)
                        : safelyParseDate(adventure.endDate || adventureStartDate); // Fallback: use endDate or startDate if endDate missing
                        
                    const isAdventureToday = isSameDay(adventureStartDate, today_upcoming);
                    let isPastCutoffOrStartTime = false;
                    
                    // Check cutoff/start time ONLY if the adventure is actually today
                    if (isAdventureToday) {
                      const cutoffHour = adventure.bookingCutoffHour;
                      if (cutoffHour !== null && cutoffHour !== undefined) {
                        // Use cutoff hour if defined
                        isPastCutoffOrStartTime = currentHour_upcoming >= cutoffHour;
                      } else {
                        // Otherwise, check against the specific start time
                        isPastCutoffOrStartTime = adventureStartDate <= now_upcoming;
                      }
                    }

                    // Determine if the adventure is truly past:
                    // 1. Is the calculated END date *after* today? If yes, it's definitely NOT past.
                    // 2. If the END date is today or earlier, check if the start time/cutoff for today has passed.
                    const isEndDateInFuture = isAfter(adventureEndDate, today_upcoming);
                    const isPast = !isEndDateInFuture && isPastCutoffOrStartTime; 
                    
                    return (
                      <AdventureCard
                        key={adventure.uniqueId}
                        slug={adventure.slug || (adventure._id ? adventure._id.toString() : "")}
                        title={adventure.title}
                        description={adventure.description || ''}
                        shortDescription={adventure.shortDescription}
                        image={adventure.images && adventure.images.length > 0 
                          ? formatImageUrl(adventure.images[0])
                          : `https://picsum.photos/seed/${adventure.title.toLowerCase().replace(/\s+/g, '')}/800/600`}
                        date={adventure.singleDateMode 
                          ? safelyFormatDate(adventure.singleDate, 'dd MMM yyyy')
                          : getClosestDateInfo(adventure).date}
                        endDate={adventure.singleDateMode
                          ? safelyFormatDate(adventure.singleEndDate, 'dd MMM yyyy')
                          : getClosestDateInfo(adventure).endDate}
                        // Don't pass dates and endDates for single-date mode to avoid showing the date tooltip
                        dates={adventure.singleDateMode ? [] : adventure.dates?.map((date: any) => safelyFormatDate(date, 'dd MMM yyyy')) || []}
                        duration={`${adventure.duration.value} ${adventure.duration.unit}`}
                        location={adventure.location}
                        price={adventure.price}
                        variant="compact"
                        isPast={isPast}
                      />
                    );
                  })
                ) : (
                  <div className="col-span-full text-center py-6 sm:py-8">
                    <p className="text-gray-400">Nu există aventuri viitoare momentan</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Sidebar - Calendar and Bookings */}
          <div className="w-full sm:flex sm:flex-row sm:gap-4 lg:flex-col lg:w-2/5 xl:w-1/3 lg:gap-6">
            <div className="hidden sm:block bg-card rounded-lg overflow-hidden sm:w-1/2 lg:w-full mb-4 sm:mb-0 border border-border shadow-sm">
              {/* Enhanced calendar header */}
              <div className="bg-gradient-to-r from-muted/40 to-muted/60 border-b border-border">
                <h2 className="text-lg sm:text-xl font-bold text-foreground px-4 pt-4 pb-3 flex justify-between items-center">
                  <span className="tracking-wide">{format(currentMonth, 'MMM yyyy').toUpperCase()}</span>
                  <div className="flex gap-1">
                    <button 
                      onClick={previousMonth}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                    >
                      <ChevronLeft className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={nextMonth}
                      className="text-muted-foreground hover:text-foreground h-8 w-8 flex items-center justify-center rounded-md hover:bg-primary/10 transition-colors border border-transparent hover:border-primary/20"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                  </div>
                </h2>
              </div>
              {/* Calendar container with enhanced background */}
              <div className="bg-background/5 p-1">
                <CalendarWidget 
                  onDateSelect={handleDateSelect}
                  eventDates={eventDates}
                  currentMonth={currentMonth}
                />
              </div>
            </div>
            
            <div className="bg-card rounded-lg p-4 sm:p-3 md:p-4 sm:w-1/2 lg:w-full">
              <h2 className="text-lg sm:text-xl font-semibold text-white mb-3 sm:mb-4 flex justify-between items-center">
                <span>Rezervări</span>
                <Link href="/dashboard/bookings" className="text-orange-500 hover:text-orange-600 text-sm">Vezi Toate</Link>
              </h2>
              <BookingList bookings={upcomingBookings} showHeader={false} />
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 