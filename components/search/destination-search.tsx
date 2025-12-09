'use client';

import * as React from 'react';
import { Search } from 'lucide-react';
import { Input } from '../ui/input';
import { AdventureCard } from '../adventures/adventure-card';
import { useDebounce } from '@/lib/hooks/use-debounce';
import { searchAdventures } from '@/lib/actions/adventure';
import Link from 'next/link';
import { formatImageUrl } from '@/lib/utils';

interface Adventure {
  slug: string;
  title: string;
  description: string;
  image: string;
  date: string;
  endDate: string;
  duration: string;
  location: string;
  price?: number;
}

interface DestinationSearchProps {
  onSearch?: (searchTerm: string) => void;
}

export function DestinationSearch({ onSearch }: DestinationSearchProps) {
  const [query, setQuery] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(false);
  const [adventures, setAdventures] = React.useState<Adventure[]>([]);
  const [showResults, setShowResults] = React.useState(false);
  const debouncedQuery = useDebounce(query, 300);
  const searchRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  React.useEffect(() => {
    const fetchAdventures = async () => {
      if (!debouncedQuery) {
        setAdventures([]);
        return;
      }

      setIsLoading(true);
      try {
        // Use the server action instead of an API call
        const response = await searchAdventures(debouncedQuery);
        
        if (response.success && response.data) {
          // Map the response data to match the Adventure interface (id -> slug)
          const formattedAdventures = response.data.map((adv: any) => ({
            ...adv,
            slug: adv.id || adv._id, // Use id or _id as slug
            id: undefined, // Remove the original id if necessary
          }));
          setAdventures(formattedAdventures);
        } else {
          console.error('Search failed:', response.error);
          setAdventures([]);
        }
      } catch (error) {
        console.error('Failed to search adventures:', error);
        setAdventures([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdventures();
    
    // Call the onSearch prop with the debounced query
    if (onSearch) {
      onSearch(debouncedQuery);
    }
  }, [debouncedQuery, onSearch]);

  return (
    <div ref={searchRef} className="relative w-full">
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 h-4 w-4 transition-colors group-hover:text-orange-500" />
        <Input
          placeholder="Search destination..."
          className="pl-10 h-9 lg:h-10 text-sm lg:text-base bg-white/5 border-white/10 text-white placeholder:text-gray-500 transition-all duration-200 hover:bg-white/10 focus:bg-white/10 focus:border-orange-500/50 focus:ring-2 focus:ring-orange-500/10 w-full"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowResults(true);
          }}
          onFocus={() => setShowResults(true)}
        />
      </div>

      {showResults && (query || isLoading) && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-card border border-border rounded-lg shadow-2xl overflow-hidden max-h-[60vh] lg:max-h-[80vh] overflow-y-auto z-50">
          {isLoading ? (
            <div className="p-3 lg:p-4 text-center text-gray-400 text-sm">
              Searching adventures...
            </div>
          ) : adventures.length > 0 ? (
            <div className="grid gap-3 lg:gap-4 p-3 lg:p-4">
              {adventures.map((adventure) => (
                <Link key={adventure.slug} href={`/adventures/${adventure.slug}`} onClick={() => setShowResults(false)}>
                  <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors">
                    <div className="w-12 h-12 rounded-md overflow-hidden flex-shrink-0">
                      <img 
                        src={formatImageUrl(adventure.image)} 
                        alt={adventure.title} 
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <h4 className="text-white font-medium text-sm truncate">{adventure.title}</h4>
                      <p className="text-gray-400 text-xs truncate">{adventure.location}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : query ? (
            <div className="p-3 lg:p-4 text-center text-gray-400 text-sm">
              No adventures found for &quot;{query}&quot;
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
} 