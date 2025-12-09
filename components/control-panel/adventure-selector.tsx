'use client';

import { useState, useEffect } from 'react';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { getAdventures, getAdventuresByCategory } from '@/lib/actions/adventure';
import { IAdventure } from '@/lib/models/adventure';
import { formatPrice, formatDate } from '@/lib/utils';

interface AdventureSelectorProps {
  categoryId?: string | null;
  selectedAdventureIds: string[];
  onSelectionChange: (adventureIds: string[]) => void;
}

interface AdventureWithId extends IAdventure {
  _id: string;
}

export function AdventureSelector({ 
  categoryId, 
  selectedAdventureIds, 
  onSelectionChange 
}: AdventureSelectorProps) {
  const [allAdventures, setAllAdventures] = useState<AdventureWithId[]>([]);
  const [currentCategoryAdventures, setCurrentCategoryAdventures] = useState<AdventureWithId[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchAdventures = async () => {
      setIsLoading(true);
      setError(null);
      
      try {
        // Fetch all adventures
        const allResult = await getAdventures();
        if (!allResult.success) {
          throw new Error(allResult.error);
        }
        
        setAllAdventures(allResult.data);
        
        // If editing an existing category, fetch current adventures
        if (categoryId) {
          const categoryResult = await getAdventuresByCategory(categoryId);
          if (categoryResult.success) {
            setCurrentCategoryAdventures(categoryResult.data);
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load adventures');
      } finally {
        setIsLoading(false);
      }
    };

    fetchAdventures();
  }, [categoryId]);

  // Filter adventures based on search term
  const filteredAdventures = allAdventures.filter(adventure =>
    adventure.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    adventure.location.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Separate current category adventures from others
  const currentAdventures = filteredAdventures.filter(adventure =>
    selectedAdventureIds.includes(adventure._id)
  );

  const availableAdventures = filteredAdventures.filter(adventure =>
    !selectedAdventureIds.includes(adventure._id)
  );

  const handleAdventureToggle = (adventureId: string, isSelected: boolean) => {
    if (isSelected) {
      onSelectionChange([...selectedAdventureIds, adventureId]);
    } else {
      onSelectionChange(selectedAdventureIds.filter(id => id !== adventureId));
    }
  };

  const removeAdventure = (adventureId: string) => {
    onSelectionChange(selectedAdventureIds.filter(id => id !== adventureId));
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Label>Category Adventures</Label>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-muted-foreground">Loading adventures...</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <Label>Category Adventures</Label>
        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-500">{error}</div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Label>Category Adventures</Label>
      
      {/* Selected Adventures */}
      {currentAdventures.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Selected Adventures ({currentAdventures.length})</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {currentAdventures.map(adventure => (
              <div
                key={adventure._id}
                className="flex items-center justify-between p-3 bg-green-50 border border-green-200 rounded-lg"
              >
                <div className="flex-1">
                  <div className="font-medium text-sm text-green-900">{adventure.title}</div>
                  <div className="text-xs text-green-700">
                    {adventure.location} • {formatPrice(adventure.price)}
                    {adventure.date && ` • ${formatDate(adventure.date)}`}
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeAdventure(adventure._id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Search and Available Adventures */}
      <Card>
        <CardHeader>
          <CardTitle className="text-sm">Available Adventures</CardTitle>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
            <Input
              placeholder="Search adventures..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
        <CardContent className="space-y-2 max-h-64 overflow-y-auto">
          {availableAdventures.length === 0 ? (
            <div className="text-center text-muted-foreground py-4">
              {searchTerm ? 'No adventures found matching your search.' : 'All adventures are already selected.'}
            </div>
          ) : (
            availableAdventures.map(adventure => (
              <div
                key={adventure._id}
                className="flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg border"
              >
                <Checkbox
                  id={`adventure-${adventure._id}`}
                  checked={selectedAdventureIds.includes(adventure._id)}
                  onCheckedChange={(checked) => 
                    handleAdventureToggle(adventure._id, checked as boolean)
                  }
                />
                <label
                  htmlFor={`adventure-${adventure._id}`}
                  className="flex-1 cursor-pointer"
                >
                  <div className="font-medium text-sm">{adventure.title}</div>
                  <div className="text-xs text-muted-foreground">
                    {adventure.location} • {formatPrice(adventure.price)}
                    {adventure.date && ` • ${formatDate(adventure.date)}`}
                  </div>
                </label>
              </div>
            ))
          )}
        </CardContent>
      </Card>

      {selectedAdventureIds.length > 0 && (
        <div className="text-sm text-muted-foreground">
          {selectedAdventureIds.length} adventure{selectedAdventureIds.length !== 1 ? 's' : ''} selected
        </div>
      )}
    </div>
  );
} 