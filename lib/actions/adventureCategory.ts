'use server';

import dbConnect from '../db';
import AdventureCategory, { IAdventureCategory } from '../models/adventureCategory';
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
export type AdventureCategoryFormData = Omit<IAdventureCategory, 'createdAt' | 'updatedAt' | 'slug'>;

export async function getAdventureCategories() {
  await dbConnect();
  try {
    const categories = await AdventureCategory.find({}).sort({ title: 1 });
    
    console.log(`Found ${categories.length} adventure categories in the database`);
    
    // Fully serialize the data to remove any MongoDB/Mongoose methods
    const safeCategories = JSON.parse(JSON.stringify(categories));
    
    return { success: true, data: safeCategories };
  } catch (error) {
    console.error('Error fetching adventure categories:', error);
    return { success: false, error: 'Failed to fetch adventure categories' };
  }
}

export async function getAdventureCategoryById(id: string) {
  await dbConnect();
  
  try {
    const category = await AdventureCategory.findById(id);
    
    if (!category) {
      return { success: false, error: 'Adventure category not found' };
    }
    
    // Serialize before returning
    const safeCategory = JSON.parse(JSON.stringify(category));
    
    return { success: true, data: safeCategory };
  } catch (error: any) {
    console.error('Error fetching adventure category by ID:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to fetch adventure category' 
    };
  }
}

export async function createAdventureCategory(data: AdventureCategoryFormData) {
  await dbConnect();
  try {
    // Generate initial slug
    let slug = generateSlug(data.title);
    let counter = 1;

    // Check for uniqueness and append counter if necessary
    while (await AdventureCategory.findOne({ slug })) {
      counter++;
      slug = `${generateSlug(data.title)}-${counter}`;
    }

    // Add the unique slug to the data object
    const dataWithSlug = { ...data, slug };

    const category = await AdventureCategory.create(dataWithSlug);
    // Serialize before returning
    const safeCategory = JSON.parse(JSON.stringify(category));
    revalidatePath('/control-panel/adventure-categories');
    return { success: true, data: safeCategory };
  } catch (error: any) {
    console.error('Error creating adventure category:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to create adventure category' 
    };
  }
}

export async function updateAdventureCategory(id: string, data: Partial<AdventureCategoryFormData>) {
  await dbConnect();
  try {
    // If title is being updated, regenerate the slug
    let updateData: Partial<AdventureCategoryFormData> & { slug?: string } = { ...data };
    if (data.title) {
      let slug = generateSlug(data.title);
      let counter = 1;

      // Check for uniqueness and append counter if necessary (excluding current document)
      while (await AdventureCategory.findOne({ slug, _id: { $ne: id } })) {
        counter++;
        slug = `${generateSlug(data.title)}-${counter}`;
      }
      updateData.slug = slug;
    }

    const category = await AdventureCategory.findByIdAndUpdate(
      id,
      { $set: updateData },
      { new: true, runValidators: true }
    );
    
    if (!category) {
      return { success: false, error: 'Adventure category not found' };
    }
    
    // Serialize before returning
    const safeCategory = JSON.parse(JSON.stringify(category));
    
    revalidatePath('/control-panel/adventure-categories');
    revalidatePath(`/control-panel/adventure-categories/${id}`);
    
    return { success: true, data: safeCategory };
  } catch (error: any) {
    console.error('Error updating adventure category:', error);
    return { 
      success: false, 
      error: error.message || 'Failed to update adventure category' 
    };
  }
}

export async function deleteAdventureCategory(id: string) {
  await dbConnect();
  try {
    // First, check if the category exists
    const category = await AdventureCategory.findById(id);
    
    if (!category) {
      return { success: false, error: 'Adventure category not found' };
    }
    
    // Clean up adventures that reference this category
    // Import Adventure model here to avoid circular imports
    const Adventure = (await import('../models/adventure')).default;
    
    // Remove category reference from all adventures
    await Adventure.updateMany(
      { category: id },
      { $unset: { category: 1 } }
    );
    
    // Now delete the category
    const deletedCategory = await AdventureCategory.findByIdAndDelete(id);
    
    // Serialize before returning
    const safeCategory = JSON.parse(JSON.stringify(deletedCategory));
    
    // Revalidate paths to clear cache
    revalidatePath('/control-panel/adventure-categories');
    revalidatePath('/control-panel/adventures');
    revalidatePath('/adventures'); // Clear the main adventures page cache
    
    return { success: true, data: safeCategory };
  } catch (error) {
    console.error('Error deleting adventure category:', error);
    return { success: false, error: 'Failed to delete adventure category' };
  }
} 