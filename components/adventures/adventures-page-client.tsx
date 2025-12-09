'use client';

import { AdventureCard } from '@/components/adventures/adventure-card';
import { AdventureFilters } from '@/components/adventures/adventure-filters';
import { useState, useEffect, useMemo } from 'react';
import { format, startOfDay, isAfter, isBefore } from 'date-fns';
import { ro } from 'date-fns/locale';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import { formatImageUrl } from '@/lib/utils';
import { useRouter, useSearchParams } from 'next/navigation';

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
    return format(date, formatString);
  } catch (error) {
    console.error('Error formatting date:', error);
    return 'Date unavailable';
  }
};

// Helper function to check if two dates are the same day
const isSameDay = (date1: Date, date2: Date): boolean => {
  return (
    date1.getFullYear() === date2.getFullYear() &&
    date1.getMonth() === date2.getMonth() &&
    date1.getDate() === date2.getDate()
  );
};

// Interface for MongoDB adventure document
interface MongoAdventure {
  _id?: string;
  title: string;
  images: string[];
  date: Date;
  endDate: Date;
  dates?: any[];
  endDates?: Date[];
  price: number;
  includedItems: string[];
  additionalInfo: string[];
  location: string;
  difficulty: 'easy' | 'moderate' | 'hard' | 'extreme';
  duration: {
    value: number;
    unit: 'hours' | 'days';
  };
  description?: string;
  shortDescription?: string;
  longDescription?: string;
  advancePaymentPercentage: number;
  createdAt?: Date;
  updatedAt?: Date;
  _expandedFromId?: string;
  _originalDateIndex?: number;
  slug?: string;
  category?: any;
}

// Interface for categorized adventures
interface CategorizedAdventures {
  category: {
    _id: string;
    title: string;
    description: string;
    image: string;
    slug: string;
  };
  adventures: MongoAdventure[];
}

interface AdventuresPageClientProps {
  categorizedAdventures: CategorizedAdventures[];
  error?: string | null;
}

export function AdventuresPageClient({ categorizedAdventures, error }: AdventuresPageClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [filteredAdventures, setFilteredAdventures] = useState<MongoAdventure[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  // Initialize selected category from URL params
  useEffect(() => {
    const categoryParam = searchParams.get('category');
    setSelectedCategory(categoryParam);
  }, [searchParams]);

  // Memoize flattened adventures to prevent infinite re-renders
  const allAdventures = useMemo(() => {
    return categorizedAdventures.flatMap(cat => cat.adventures);
  }, [categorizedAdventures]);

  useEffect(() => {
    if (allAdventures.length > 0) {
      // Sort adventures by date, showing future adventures first
      const sortedAdventures = [...allAdventures].sort((a, b) => 
        safelyParseDate(a.date).getTime() - safelyParseDate(b.date).getTime()
      );
      setFilteredAdventures(sortedAdventures);
    }
  }, [allAdventures]);

  // Apply filters whenever any filter changes
  useEffect(() => {
    if (!allAdventures.length) return;

    let filtered = [...allAdventures];
    
    // Process adventures to show only one instance per adventure (not expanded by dates)
    const processedAdventures: MongoAdventure[] = [];
    
    filtered.forEach(adventure => {
      // Check if this adventure has a dates array with the new structure
      if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0 && 
          typeof adventure.dates[0] === 'object' && 'startDate' in (adventure.dates[0] as any)) {
        
        // Find the earliest future date, or earliest date if no future dates
        const dateArray = adventure.dates as any[];
        const sortedDates = [...dateArray].sort((a, b) => 
          safelyParseDate(a.startDate).getTime() - safelyParseDate(b.startDate).getTime()
        );
        
        // Try to find future dates first
        const now = new Date();
        const futureDates = sortedDates.filter(datePair => 
          safelyParseDate(datePair.startDate) >= now
        );
        
        // Use earliest future date, or earliest date if no future dates
        const selectedDatePair = futureDates.length > 0 ? futureDates[0] : sortedDates[0];
        
        if (selectedDatePair) {
          processedAdventures.push({
            ...adventure,
            date: safelyParseDate(selectedDatePair.startDate),
            endDate: safelyParseDate(selectedDatePair.endDate || selectedDatePair.startDate),
            // Keep original _id for the adventure
            _id: adventure._id
          });
        }
      } else if (adventure.dates && Array.isArray(adventure.dates) && adventure.dates.length > 0) {
        // Legacy date array format - find earliest future date or earliest date
        const sortedDates = [...adventure.dates].sort((a, b) => 
          safelyParseDate(a).getTime() - safelyParseDate(b).getTime()
        );
        
        // Try to find future dates first
        const now = new Date();
        const futureDates = sortedDates.filter(singleDate => 
          safelyParseDate(singleDate) >= now
        );
        
        // Use earliest future date, or earliest date if no future dates
        const selectedDateValue = futureDates.length > 0 ? futureDates[0] : sortedDates[0];
        
        if (selectedDateValue) {
          const parsedDate = safelyParseDate(selectedDateValue);
          const endDate = adventure.endDates && adventure.endDates[0] 
            ? safelyParseDate(adventure.endDates[0])
            : (() => {
                const end = new Date(parsedDate);
                end.setDate(end.getDate() + 1);
                return end;
              })();
              
          processedAdventures.push({
            ...adventure,
            date: parsedDate,
            endDate: endDate,
            // Keep original _id for the adventure
            _id: adventure._id
          });
        }
      } else {
        // Single date adventure - keep as is
        processedAdventures.push(adventure);
      }
    });
    
    filtered = processedAdventures;
    
    // Apply date filter if a specific date is selected
    if (selectedDate) {
      filtered = filtered.filter(adv => {
        const adventureDate = safelyParseDate(adv.date);
        return isSameDay(adventureDate, selectedDate);
      });
    }

    // Apply search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(adv => 
        adv.title.toLowerCase().includes(searchLower) ||
        adv.location.toLowerCase().includes(searchLower) ||
        (adv.description && adv.description.toLowerCase().includes(searchLower)) ||
        (adv.shortDescription && adv.shortDescription.toLowerCase().includes(searchLower))
      );
    }

    // Apply duration filter
    if (selectedDuration) {
      filtered = filtered.filter(adv => {
        const duration = adv.duration;
        
        switch (selectedDuration) {
          case 'under-6h':
            return duration.unit === 'hours' && duration.value < 6;
          case '6-12h':
            return duration.unit === 'hours' && duration.value >= 6 && duration.value <= 12;
          case '1-2d':
            return duration.unit === 'days' && duration.value >= 1 && duration.value <= 2;
          case '3d-plus':
            return duration.unit === 'days' && duration.value >= 3;
          default:
            return true;
        }
      });
    }

    // Apply location filter
    if (selectedLocation) {
      filtered = filtered.filter(adv => 
        adv.location.toLowerCase().includes(selectedLocation.toLowerCase())
      );
    }

    setFilteredAdventures(filtered);
  }, [allAdventures, searchTerm, selectedDuration, selectedLocation, selectedDate]);

  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
  };

  const handleDurationChange = (duration: string) => {
    setSelectedDuration(duration);
  };

  const handleLocationChange = (location: string) => {
    setSelectedLocation(location);
  };

  const handleDateChange = (date: Date | null) => {
    setSelectedDate(date);
  };

  const handleCategoryClick = (categorySlug: string) => {
    const currentParams = new URLSearchParams(searchParams.toString());
    
    if (selectedCategory === categorySlug) {
      // If clicking the same category, deselect it
      currentParams.delete('category');
      setSelectedCategory(null);
    } else {
      // Select the new category
      currentParams.set('category', categorySlug);
      setSelectedCategory(categorySlug);
    }
    
    // Update URL without navigation
    const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : '/adventures';
    router.replace(newUrl, { scroll: false });
  };

  const clearCategorySelection = () => {
    const currentParams = new URLSearchParams(searchParams.toString());
    currentParams.delete('category');
    setSelectedCategory(null);
    
    const newUrl = currentParams.toString() ? `?${currentParams.toString()}` : '/adventures';
    router.replace(newUrl, { scroll: false });
  };

  // Get adventures to display based on filters and category selection
  const getAdventuresToDisplay = () => {
    if (selectedCategory) {
      const category = categorizedAdventures.find(cat => cat.category.slug === selectedCategory);
      if (category) {
        return filteredAdventures.filter(adventure => 
          category.adventures.some(catAdv => catAdv._id === adventure._id)
        );
      }
    }
    return filteredAdventures;
  };

  // Check if any search filters are applied (excluding category selection)
  const hasActiveFilters = () => {
    return searchTerm.trim() !== '' || 
           selectedDuration !== '' || 
           selectedLocation !== '' || 
           selectedDate !== null;
  };

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Eroare</h1>
          <p className="text-gray-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-full p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Aventurile Noastre
          </h1>
          <p className="text-xl text-white max-w-3xl mx-auto">
            {selectedCategory 
              ? `Explorează aventurile din categoria ${categorizedAdventures.find(cat => cat.category.slug === selectedCategory)?.category.title || 'selectată'}.`
              : 'Descoperă aventurile organizate pe categorii. Alege categoria care te interesează și explorează toate opțiunile disponibile.'
            }
          </p>
        </div>

        {/* Adventure Filters */}
        <div className="mb-8">
          <AdventureFilters
            onSearchChange={handleSearchChange}
            onDurationChange={handleDurationChange}
            onLocationChange={handleLocationChange}
            onDateChange={handleDateChange}
          />
        </div>

        {/* Categories as Cards */}
        {!selectedCategory && !hasActiveFilters() && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-white mb-8 text-center">Categorii Aventuri</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {categorizedAdventures.map(cat => {
                const isSelected = selectedCategory === cat.category.slug;
                return (
                  <div 
                    key={cat.category._id} 
                    className={`group relative overflow-hidden rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 cursor-pointer bg-white ${
                      isSelected ? 'ring-4 ring-orange-500' : ''
                    }`}
                    onClick={() => handleCategoryClick(cat.category.slug)}
                  >
                  <div className="relative aspect-[4/3] overflow-hidden">
                    <Image
                      src={formatImageUrl(cat.category.image)}
                      alt={cat.category.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-110"
                      sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
                    
                    <div className="absolute inset-0 p-6 flex flex-col justify-end">
                      <h3 className="text-2xl font-bold text-white group-hover:text-orange-500 transition-colors duration-300 mb-2">
                        {cat.category.title}
                      </h3>
                      <p className="text-gray-200 text-sm line-clamp-3 mb-4">
                        {cat.category.description}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-orange-500 font-semibold text-sm">
                          {cat.adventures.length} aventur{cat.adventures.length !== 1 ? 'i' : 'ă'}
                        </span>
                        <Button
                          variant="secondary"
                          size="sm"
                          className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30 transition-all duration-200"
                        >
                          Vezi Aventurile
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Selected Category Header */}
        {selectedCategory && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  {categorizedAdventures.find(cat => cat.category.slug === selectedCategory)?.category.title}
                </h2>
                <p className="text-white/80 mt-1">
                  {categorizedAdventures.find(cat => cat.category.slug === selectedCategory)?.category.description}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={clearCategorySelection}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                Înapoi la Categorii
              </Button>
            </div>
          </div>
        )}

        {/* Global Search Results */}
        {!selectedCategory && hasActiveFilters() && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-6 p-6 bg-white/10 backdrop-blur-sm rounded-2xl border border-white/20">
              <div>
                <h2 className="text-2xl font-bold text-white">
                  Rezultate căutare
                </h2>
                <p className="text-white/80 mt-1">
                  {getAdventuresToDisplay().length} aventur{getAdventuresToDisplay().length !== 1 ? 'i' : 'ă'} găsit{getAdventuresToDisplay().length !== 1 ? 'e' : 'ă'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setSelectedDuration('');
                  setSelectedLocation('');
                  setSelectedDate(null);
                }}
                className="bg-white/20 backdrop-blur-sm border-white/30 text-white hover:bg-white/30"
              >
                Șterge filtrele
              </Button>
            </div>
          </div>
        )}

        {/* Adventures Grid */}
        {(selectedCategory || hasActiveFilters()) && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {getAdventuresToDisplay().map((adventure) => (
              <AdventureCard 
                key={adventure._id}
                slug={adventure.slug || adventure._id?.toString() || ''}
                title={adventure.title}
                description={adventure.description || ''}
                shortDescription={adventure.shortDescription}
                image={adventure.images?.[0] || '/placeholder-adventure.jpg'}
                date={safelyFormatDate(adventure.date, 'dd MMM yyyy')}
                endDate={adventure.endDate 
                  ? safelyFormatDate(adventure.endDate, 'dd MMM yyyy')
                  : safelyFormatDate(
                      (() => {
                        const endDate = new Date(adventure.date);
                        endDate.setDate(endDate.getDate() + 1);
                        return endDate;
                      })(),
                      'dd MMM yyyy'
                    )
                }
                duration={`${adventure.duration.value} ${adventure.duration.unit}`}
                location={adventure.location}
                price={adventure.price}
              />
            ))}
          </div>
        )}

        {/* No Adventures Found */}
        {(selectedCategory || hasActiveFilters()) && getAdventuresToDisplay().length === 0 && (
          <div className="text-center py-12">
            <p className="text-white text-lg">
              Nu am găsit aventuri care să corespundă criteriilor tale de căutare.
            </p>
          </div>
        )}
      </div>
    </div>
  );
} 