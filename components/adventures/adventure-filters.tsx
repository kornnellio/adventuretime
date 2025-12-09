'use client';

import { Search, SlidersHorizontal, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { getUniqueAdventureLocations, getUniqueAdventureDurations } from '@/lib/actions/adventure';
import { format } from 'date-fns';
import { ro } from 'date-fns/locale';

interface FilterOption {
  label: string;
  value: string;
}

interface AdventureFiltersProps {
  onSearchChange?: (searchTerm: string) => void;
  onDurationChange?: (duration: string) => void;
  onLocationChange?: (location: string) => void;
  onDateChange?: (date: Date | null) => void;
}

export function AdventureFilters({
  onSearchChange,
  onDurationChange,
  onLocationChange,
  onDateChange
}: AdventureFiltersProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDuration, setSelectedDuration] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  
  // State for dynamic filter options
  const [locations, setLocations] = useState<FilterOption[]>([]);
  const [durations, setDurations] = useState<FilterOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch filter options on component mount
  useEffect(() => {
    async function fetchFilterOptions() {
      setIsLoading(true);
      try {
        // Fetch location options
        const locationsResponse = await getUniqueAdventureLocations();
        if (locationsResponse.success && locationsResponse.data) {
          setLocations(locationsResponse.data);
        }
        
        // Fetch duration options
        const durationsResponse = await getUniqueAdventureDurations();
        if (durationsResponse.success && durationsResponse.data) {
          setDurations(durationsResponse.data);
        } else {
          // Fallback to default durations if fetch fails
          setDurations([
            { label: 'Sub 6 ore', value: 'under-6h' },
            { label: '6-12 ore', value: '6-12h' },
            { label: '1-2 zile', value: '1-2d' },
            { label: '3+ zile', value: '3d-plus' }
          ]);
        }
      } catch (error) {
        console.error('Error fetching filter options:', error);
        // Set default fallback options
        setLocations([]);
        setDurations([
          { label: 'Sub 6 ore', value: 'under-6h' },
          { label: '6-12 ore', value: '6-12h' },
          { label: '1-2 zile', value: '1-2d' },
          { label: '3+ zile', value: '3d-plus' }
        ]);
      } finally {
        setIsLoading(false);
      }
    }
    
    fetchFilterOptions();
  }, []);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    if (onSearchChange) {
      onSearchChange(value);
    }
  };

  const handleDurationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedDuration(value);
    if (onDurationChange) {
      onDurationChange(value);
    }
  };

  const handleLocationChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setSelectedLocation(value);
    if (onLocationChange) {
      onLocationChange(value);
    }
  };
  
  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    if (value) {
      const date = new Date(value);
      setSelectedDate(date);
      if (onDateChange) {
        onDateChange(date);
      }
    } else {
      setSelectedDate(null);
      if (onDateChange) {
        onDateChange(null);
      }
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 shadow-md">
      <div className="flex flex-col space-y-3 sm:space-y-4 lg:flex-row lg:space-y-0 lg:space-x-4">
        {/* Search Bar */}
        <div className="flex-1 relative">
          <input
            type="text"
            placeholder="Caută aventuri..."
            value={searchTerm}
            onChange={handleSearchChange}
            className="w-full pl-10 pr-4 py-2.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm"
          />
          <Search className="absolute left-3 top-3 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
        </div>

        {/* Filters */}
        <div className="flex flex-col space-y-3 sm:flex-row sm:space-y-0 sm:space-x-3 lg:space-x-4">
          {/* Date Filter */}
          <div className="relative flex flex-shrink-0">
            <input
              type="date"
              value={selectedDate ? format(selectedDate, 'yyyy-MM-dd') : ''}
              onChange={handleDateChange}
              className="appearance-none pl-4 pr-10 py-2.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent text-sm min-w-0"
              placeholder="Alege data"
            />
            <Calendar className="absolute right-3 top-3 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
            {selectedDate && (
              <button
                onClick={() => {
                  setSelectedDate(null);
                  if (onDateChange) {
                    onDateChange(null);
                  }
                }}
                className="ml-2 px-2 sm:px-3 py-2.5 sm:py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition duration-200 text-xs sm:text-sm flex-shrink-0"
                aria-label="Șterge filtrul de dată"
                title="Șterge filtrul de dată"
              >
                ✕
              </button>
            )}
          </div>
          
          {/* Duration Filter */}
          <div className="relative min-w-0">
            <select 
              value={selectedDuration}
              onChange={handleDurationChange}
              disabled={isLoading || durations.length === 0}
              className="appearance-none w-full pl-4 pr-10 py-2.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-70 text-sm min-w-0"
            >
              <option value="">Durată</option>
              {durations.map((duration) => (
                <option key={duration.value} value={duration.value}>
                  {duration.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-3 top-3 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          </div>

          {/* Location Filter */}
          <div className="relative min-w-0">
            <select 
              value={selectedLocation}
              onChange={handleLocationChange}
              disabled={isLoading || locations.length === 0}
              className="appearance-none w-full pl-4 pr-10 py-2.5 sm:py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-orange-500 focus:border-transparent disabled:opacity-70 text-sm min-w-0"
            >
              <option value="">Locație</option>
              {locations.map((location) => (
                <option key={location.value} value={location.value}>
                  {location.label}
                </option>
              ))}
            </select>
            <SlidersHorizontal className="absolute right-3 top-3 sm:top-2.5 h-4 w-4 sm:h-5 sm:w-5 text-gray-400 pointer-events-none" />
          </div>
        </div>
      </div>
    </div>
  );
} 