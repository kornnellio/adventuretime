import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' }); // Load .env.local variables

import mongoose from 'mongoose';
import dbConnect from '../lib/db.ts'; // Reverted to .ts extension
import Adventure from '../lib/models/adventure.ts'; // Re-added .js extension as suggested by linter

// Helper function to generate a slug (copied from lib/actions/adventure.ts)
const generateSlug = (title: string): string => {
  if (!title) return `adventure-${Date.now()}`; // Fallback for empty titles
  return title
    .toLowerCase()
    .replace(/[ăâ]/g, 'a')
    .replace(/[î]/g, 'i')
    .replace(/[ș]/g, 's')
    .replace(/[ț]/g, 't')
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

const backfillSlugs = async () => {
  console.log('Connecting to database...');
  await dbConnect();
  console.log('Database connected.');

  try {
    console.log('Finding adventures without slugs...');
    // Find adventures where slug is null, undefined, or an empty string
    const adventuresToUpdate = await Adventure.find({ 
      $or: [
        { slug: { $exists: false } }, 
        { slug: null }, 
        { slug: '' } 
      ]
    });

    console.log(`Found ${adventuresToUpdate.length} adventures to update.`);

    if (adventuresToUpdate.length === 0) {
      console.log('No adventures found needing slugs. Exiting.');
      return;
    }

    let updatedCount = 0;
    for (const adventure of adventuresToUpdate) {
      console.log(`Processing adventure: ${adventure.title} (ID: ${adventure._id})`);
      try {
        let slug = generateSlug(adventure.title);
        let counter = 1;
        let existingAdventure = null;

        // Check for uniqueness and append counter if necessary
        do {
          existingAdventure = await Adventure.findOne({ slug: slug });
          if (existingAdventure && existingAdventure._id.toString() !== adventure._id.toString()) {
            // Slug exists and belongs to a *different* document
            counter++;
            slug = `${generateSlug(adventure.title)}-${counter}`;
            existingAdventure = null; // Reset to check the new slug in the next loop iteration
          } else {
            // Slug is unique or belongs to the current document (which is fine)
            break; // Exit the loop
          }
        } while (counter < 100); // Add a safety limit to prevent infinite loops

        if (counter >= 100) {
          console.warn(`Could not find a unique slug for "${adventure.title}" after 100 attempts. Skipping.`);
          continue;
        }

        // Update the adventure with the unique slug
        adventure.slug = slug;
        await adventure.save();
        updatedCount++;
        console.log(`  Updated with slug: ${slug}`);

      } catch (saveError) {
        console.error(`  Error saving adventure ID ${adventure._id}:`, saveError);
      }
    }

    console.log(`
Backfill complete. 
Successfully updated ${updatedCount} out of ${adventuresToUpdate.length} adventures found.`);

  } catch (error) {
    console.error('An error occurred during the backfill process:', error);
  } finally {
    console.log('Disconnecting from database...');
    await mongoose.disconnect();
    console.log('Database disconnected.');
  }
};

// Run the script
backfillSlugs().catch(err => {
  console.error("Script failed to run:", err);
  process.exit(1);
}); 