import 'dotenv/config';
import mongoose from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Define Adventure schema for migration
const AdventureSchema = new mongoose.Schema(
  {
    title: String,
    images: [String],
    // Old fields
    date: Date,
    endDate: Date,
    dates: [Date],
    endDates: [Date],
    // New field
    newDates: [{
      startDate: Date,
      endDate: Date
    }],
    price: Number,
    includedItems: [String],
    additionalInfo: [String],
    location: String,
    difficulty: String,
    duration: {
      value: Number,
      unit: String,
    },
    shortDescription: String,
    longDescription: String,
    advancePaymentPercentage: Number,
  },
  {
    timestamps: true,
  }
);

const migrateDatesStructure = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Adventure model
    const Adventure = mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema);

    // Find all adventures that need to be migrated
    const adventures = await Adventure.find({});
    console.log(`Found ${adventures.length} adventures to migrate`);

    // Migrate each adventure
    for (const adventure of adventures) {
      console.log(`Migrating adventure: ${adventure.title}`);
      
      // Initialize the new dates array
      const newDates: { startDate: Date; endDate: Date }[] = [];
      
      // Add the main date pair
      if (adventure.date) {
        const endDate = adventure.endDate || new Date(adventure.date);
        if (adventure.endDate) {
          // If there's an explicit end date, use that
          newDates.push({
            startDate: new Date(adventure.date),
            endDate: new Date(adventure.endDate)
          });
        } else {
          // If no end date, create one a day later
          const inferredEndDate = new Date(adventure.date);
          inferredEndDate.setDate(inferredEndDate.getDate() + 1);
          inferredEndDate.setHours(12, 0, 0, 0); // Set to noon
          
          newDates.push({
            startDate: new Date(adventure.date),
            endDate: inferredEndDate
          });
        }
      }
      
      // Add additional dates
      if (adventure.dates && adventure.dates.length > 0) {
        adventure.dates.forEach((additionalDate: Date, index: number) => {
          if (!additionalDate) return; // Skip invalid dates
          
          // Try to find a matching end date
          let additionalEndDate: Date;
          if (adventure.endDates && adventure.endDates[index]) {
            additionalEndDate = new Date(adventure.endDates[index]);
          } else {
            // If no matching end date, create one a day later
            additionalEndDate = new Date(additionalDate);
            additionalEndDate.setDate(additionalEndDate.getDate() + 1);
            additionalEndDate.setHours(12, 0, 0, 0); // Set to noon
          }
          
          newDates.push({
            startDate: new Date(additionalDate),
            endDate: additionalEndDate
          });
        });
      }
      
      // Set the new dates array
      adventure.newDates = newDates;
      
      // Save the updated adventure with both old and new fields 
      // (allows for rollback if necessary)
      await adventure.save();
      console.log(`  - Added ${newDates.length} date pairs`);
    }
    
    // Now that we've safely migrated the data, rename the field in the schema
    // We can't do this with Mongoose, so we need to use the MongoDB driver directly
    const db = mongoose.connection.db;
    if (db) {
      await db.collection('adventures').updateMany(
        {}, // Match all documents
        { 
          $rename: { "newDates": "dates" } 
        }
      );
      console.log('Renamed newDates field to dates');
    } else {
      console.error('Database connection is not available');
    }
    
    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error in migration:', error);
    process.exit(1);
  }
};

migrateDatesStructure(); 