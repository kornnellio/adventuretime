'use server';

import dbConnect from '../db';
import mongoose from 'mongoose';
import Adventure, { IAdventure } from '../models/adventure';
import { revalidatePath } from 'next/cache';

// Helper function to generate a slug
const generateSlug = (title: string): string => {
  return title
    .toLowerCase()
    .replace(/[ăâ]/g, 'a') // Handle Romanian characters
    .replace(/[î]/g, 'i')
    .replace(/[ș]/g, 's')
    .replace(/[ț]/g, 't')
    .replace(/[^\w\s-]/g, '') // Remove non-word characters (excluding spaces and hyphens)
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Trim hyphens from start/end
};

// Define form data types
export type AdventureFormData = Omit<IAdventure, 'createdAt' | 'updatedAt'>;

export async function getAdventures() {
  await dbConnect();
  try {
    // Get all adventures without filtering
    const adventures = await Adventure.find({}).sort({ 
      // Sort by dates array start date if available, otherwise by legacy date
      'dates.0.startDate': 1, 
      date: 1 
    });
    
    // Log the count of adventures for debugging
    console.log(`Found ${adventures.length} adventures in the database`);
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeAdventures = JSON.parse(JSON.stringify(adventures));
    
    return { success: true, data: safeAdventures };
  } catch (error) {
    console.error('Error fetching adventures:', error);
    return { success: false, error: 'Failed to fetch adventures' };
  }
}

export async function getAdventuresByCategories() {
  await dbConnect();
  try {
    // Import the category model here to avoid circular imports
    const AdventureCategory = (await import('../models/adventureCategory')).default;
    
    // Get all adventures with populated category information
    const adventures = await Adventure.find({})
      .populate('category')
      .sort({ 
        'dates.0.startDate': 1, 
        date: 1 
      });
    
    // Get all categories
    const categories = await AdventureCategory.find({}).sort({ title: 1 });
    
    console.log(`Found ${categories.length} categories and ${adventures.length} adventures`);
    
    // Group adventures by category, but only include adventures where category population succeeded
    const categorizedAdventures = categories.map(category => {
      const categoryAdventures = adventures
        .filter(adventure => {
          // Only include adventures that have a successfully populated category
          // and where the category ID matches
          return adventure.category && 
                 adventure.category._id && 
                 adventure.category._id.toString() === category._id.toString();
        })
        .map(adventure => JSON.parse(JSON.stringify(adventure)));
      
      console.log(`Category "${category.title}" has ${categoryAdventures.length} adventures`);
      
      return {
        category: JSON.parse(JSON.stringify(category)),
        adventures: categoryAdventures
      };
    });
    
    // Filter out categories that have no adventures, unless it's the "Uncategorized" group
    const finalCategorizedAdventures = categorizedAdventures.filter(category => 
      category.adventures.length > 0 || category.category._id === 'uncategorized'
    );
    
    // Also include adventures without categories or with invalid category references
    const uncategorizedAdventures = adventures
      .filter(adventure => !adventure.category || !adventure.category._id)
      .map(adventure => JSON.parse(JSON.stringify(adventure)));
    
    console.log(`Found ${uncategorizedAdventures.length} uncategorized adventures`);
    
    // Replace original categorized adventures with the filtered list
    let result = finalCategorizedAdventures;

    // If uncategorized adventures exist, add them to the result
    if (uncategorizedAdventures.length > 0) {
      const uncategorizedGroup = {
        category: {
          _id: 'uncategorized',
          title: 'Alte Aventuri',
          description: 'Aventuri care nu sunt încă organizate în categorii',
          image: '/placeholder-category.jpg',
          slug: 'uncategorized'
        },
        adventures: uncategorizedAdventures
      };
      
      // Check if uncategorized group is already in result, if not add it
      if (!result.find(cat => cat.category._id === 'uncategorized')) {
        result.push(uncategorizedGroup);
      }
    }
    
    console.log(`Returning ${result.length} categories with adventures`);
    
    return { success: true, data: result };
  } catch (error) {
    console.error('Error fetching adventures by categories:', error);
    return { success: false, error: 'Failed to fetch adventures by categories' };
  }
}

export async function getAdventureById(id: string) {
  await dbConnect();
  
  try {
    let adventure;
    
    // Support lookup by both ID and slug
    if (mongoose.Types.ObjectId.isValid(id)) {
      adventure = await Adventure.findById(id);
    } else {
      // Assume it's a slug
      adventure = await Adventure.findOne({ slug: id });
    }
    
    if (!adventure) {
      return { success: false, error: 'Adventure not found' };
    }
    
    // Ensure availableKayakTypes has default values if not already set
    if (!adventure.availableKayakTypes) {
      adventure.availableKayakTypes = {
        caiacSingle: true,
        caiacDublu: false,
        placaSUP: false
      };
    }
    
    // Serialize before returning
    const safeAdventure = JSON.parse(JSON.stringify(adventure));
    
    return { success: true, data: safeAdventure };
  } catch (error: any) {
    console.error('Error fetching adventure by ID:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch adventure' 
    };
  }
}

export async function createAdventure(data: AdventureFormData) {
  await dbConnect();
  try {
    // Generate initial slug
    let slug = generateSlug(data.title);
    let counter = 1;

    // Check for uniqueness and append counter if necessary
    while (await Adventure.findOne({ slug })) {
      counter++;
      slug = `${generateSlug(data.title)}-${counter}`;
    }

    // Add the unique slug to the data object
    const dataWithSlug = { ...data, slug };

    const adventure = await Adventure.create(dataWithSlug);
    // Serialize before returning
    const safeAdventure = JSON.parse(JSON.stringify(adventure));
    revalidatePath('/control-panel/adventures');
    revalidatePath('/adventures'); // Clear the main adventures page cache
    return { success: true, data: safeAdventure };
  } catch (error: any) {
    console.error('Error creating adventure:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create adventure' 
    };
  }
}

export async function updateAdventure(id: string, data: Partial<AdventureFormData>) {
  await dbConnect();
  try {
    // First, get the current adventure to check if recurring settings changed
    const currentAdventure = await Adventure.findById(id);
    if (!currentAdventure) {
      return { success: false, error: 'Adventure not found' };
    }

    // Check if recurring settings have changed
    const wasRecurring = currentAdventure.isRecurring;
    const isNowRecurring = data.isRecurring;
    const recurringPatternChanged = JSON.stringify(currentAdventure.recurringPattern) !== JSON.stringify(data.recurringPattern);

    // If recurring settings changed, we need to handle the dates properly
    if (wasRecurring && !isNowRecurring) {
      // Changed from recurring to non-recurring: keep the provided dates
      console.log('Adventure changed from recurring to non-recurring');
    } else if (!wasRecurring && isNowRecurring) {
      // Changed from non-recurring to recurring: dates should already be generated by the form
      console.log('Adventure changed from non-recurring to recurring');
    } else if (wasRecurring && isNowRecurring && recurringPatternChanged) {
      // Recurring pattern changed: dates should already be regenerated by the form
      console.log('Recurring pattern changed - dates should be regenerated');
    }

    const adventure = await Adventure.findByIdAndUpdate(
      id,
      { $set: data },
      { new: true, runValidators: true }
    );
    
    if (!adventure) {
      return { success: false, error: 'Adventure not found' };
    }
    
    // Serialize before returning
    const safeAdventure = JSON.parse(JSON.stringify(adventure));
    
    revalidatePath('/control-panel/adventures');
    revalidatePath(`/control-panel/adventures/${id}`);
    revalidatePath('/adventures'); // Clear the main adventures page cache
    
    return { success: true, data: safeAdventure };
  } catch (error: any) {
    console.error('Error updating adventure:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update adventure' 
    };
  }
}

/**
 * Update multiple adventures to assign them to a category
 */
export async function updateAdventuresCategory(adventureIds: string[], categoryId: string | null) {
  await dbConnect();
  try {
    const updateData = categoryId ? { category: categoryId } : { $unset: { category: 1 } };
    
    const result = await Adventure.updateMany(
      { _id: { $in: adventureIds } },
      updateData
    );
    
    revalidatePath('/control-panel/adventures');
    revalidatePath('/control-panel/adventure-categories');
    revalidatePath('/adventures'); // Clear the main adventures page cache
    
    return { 
      success: true, 
      data: { 
        matchedCount: result.matchedCount, 
        modifiedCount: result.modifiedCount 
      } 
    };
  } catch (error: any) {
    console.error('Error updating adventures category:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update adventures category' 
    };
  }
}

/**
 * Get adventures by category ID
 */
export async function getAdventuresByCategory(categoryId: string | null) {
  await dbConnect();
  try {
    let adventures;
    
    if (categoryId === null || categoryId === 'uncategorized') {
      // Get adventures without a category
      adventures = await Adventure.find({ 
        $or: [
          { category: { $exists: false } }, 
          { category: null }
        ] 
      }).sort({ 
        'dates.0.startDate': 1, 
        date: 1 
      });
    } else {
      // Get adventures with the specific category
      adventures = await Adventure.find({ category: categoryId }).sort({ 
        'dates.0.startDate': 1, 
        date: 1 
      });
    }
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeAdventures = JSON.parse(JSON.stringify(adventures));
    
    return { success: true, data: safeAdventures };
  } catch (error) {
    console.error('Error fetching adventures by category:', error);
    return { success: false, error: 'Failed to fetch adventures by category' };
  }
}

/**
 * Get adventures by category slug
 */
export async function getAdventuresByCategorySlug(slug: string) {
  await dbConnect();
  try {
    const AdventureCategory = (await import('../models/adventureCategory')).default;

    // Find the category by slug
    const category = await AdventureCategory.findOne({ slug });
    if (!category) {
      return { success: false, error: 'Category not found' };
    }

    // Use the existing function to get adventures by category ID
    const adventuresResult = await getAdventuresByCategory(category._id.toString());
    if (!adventuresResult.success) {
      return adventuresResult; // Propagate the error
    }

    return {
      success: true,
      data: {
        category: JSON.parse(JSON.stringify(category)),
        adventures: adventuresResult.data,
      },
    };
  } catch (error) {
    console.error('Error fetching adventures by category slug:', error);
    return { success: false, error: 'Failed to fetch adventures by category slug' };
  }
}

export async function deleteAdventure(id: string) {
  await dbConnect();
  try {
    const adventure = await Adventure.findByIdAndDelete(id);
    
    if (!adventure) {
      return { success: false, error: 'Adventure not found' };
    }
    
    // Serialize before returning
    const safeAdventure = JSON.parse(JSON.stringify(adventure));
    
    revalidatePath('/control-panel/adventures');
    revalidatePath('/adventures'); // Clear the main adventures page cache
    
    return { success: true, data: safeAdventure };
  } catch (error) {
    console.error('Error deleting adventure:', error);
    return { success: false, error: 'Failed to delete adventure' };
  }
}

/**
 * Get unique adventure locations
 */
export async function getUniqueAdventureLocations() {
  await dbConnect();
  
  try {
    // Get all unique location values from adventures
    const uniqueLocations = await Adventure.distinct('location');
    
    // Format locations into a structure with label and value
    const formattedLocations = uniqueLocations
      .filter(location => Boolean(location)) // Filter out null/empty values
      .map(location => ({
        label: location,
        value: location.toLowerCase()
          .replace(/[^\w\s]/g, '') // Remove special characters
          .replace(/\s+/g, '-') // Replace spaces with hyphens
      }))
      .sort((a, b) => a.label.localeCompare(b.label)); // Sort alphabetically
    
    return { 
      success: true, 
      data: formattedLocations
    };
  } catch (error) {
    console.error('Error fetching unique locations:', error);
    return { 
      success: false, 
      error: 'Could not fetch adventure locations'
    };
  }
}

/**
 * Get unique adventure durations
 */
export async function getUniqueAdventureDurations() {
  await dbConnect();
  
  try {
    // Get all unique duration values from adventures
    const adventures = await Adventure.find({}, 'duration');
    
    // Extract and categorize durations
    const durationCategories = [
      { label: 'Sub 6 ore', value: 'under-6h', min: 0, max: 6, unit: 'hours' },
      { label: '6-12 ore', value: '6-12h', min: 6, max: 12, unit: 'hours' },
      { label: '1-2 zile', value: '1-2d', min: 1, max: 2, unit: 'days' },
      { label: '3+ zile', value: '3d-plus', min: 3, max: Infinity, unit: 'days' }
    ];
    
    // Check which categories exist in the data
    const existingCategories = durationCategories
      .filter(category => {
        return adventures.some(adventure => {
          const { value, unit } = adventure.duration;
          
          if (unit === category.unit) {
            if (unit === 'hours') {
              return value >= category.min && value < category.max;
            } else if (unit === 'days') {
              return value >= category.min && value <= category.max;
            }
          }
          
          return false;
        });
      });
    
    return { 
      success: true, 
      data: existingCategories
    };
  } catch (error) {
    console.error('Error fetching unique durations:', error);
    return { 
      success: false, 
      error: 'Could not fetch adventure durations'
    };
  }
}

/**
 * Search adventures by query string
 */
export async function searchAdventures(query: string) {
  await dbConnect();
  
  if (!query.trim()) {
    return { success: true, data: [] };
  }
  
  try {
    // Create a case-insensitive regex for search
    const searchRegex = new RegExp(query, 'i');
    
    // Search for adventures matching the query in title, description, or location
    const adventures = await Adventure.find({
      $or: [
        { title: { $regex: searchRegex } },
        { description: { $regex: searchRegex } },
        { shortDescription: { $regex: searchRegex } },
        { longDescription: { $regex: searchRegex } },
        { location: { $regex: searchRegex } }
      ]
    }).limit(10); // Limit to 10 results for performance
    
    // Transform data for client consumption
    const processedAdventures = adventures.map(adventure => {
      // Safely get the first image or use a placeholder
      const image = adventure.images && adventure.images.length > 0
        ? adventure.images[0]
        : '/placeholder-adventure.jpg';
      
      // Format duration for display
      const duration = `${adventure.duration.value} ${adventure.duration.unit}`;
      
      // Process dates safely
      const dates = adventure.dates && Array.isArray(adventure.dates) 
        ? adventure.dates.map((date: any) => {
            if (typeof date === 'object' && date.startDate) {
              return date.startDate;
            }
            return date;
          })
        : [];
      
      // Return formatted data
      return {
        id: adventure._id.toString(),
        title: adventure.title,
        description: adventure.shortDescription || adventure.description || '',
        image,
        date: adventure.date || (dates[0] ? dates[0] : null),
        endDate: adventure.endDate || null,
        duration,
        location: adventure.location,
        price: adventure.price
      };
    });
    
    return { success: true, data: processedAdventures };
  } catch (error) {
    console.error('Adventure search error:', error);
    return { success: false, error: 'Failed to search adventures' };
  }
} 