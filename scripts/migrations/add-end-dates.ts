import { config } from 'dotenv';
import mongoose from 'mongoose';

// Load environment variables from .env.local
config({ path: '.env.local' });

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Define Adventure schema for migration
const AdventureSchema = new mongoose.Schema(
  {
    title: String,
    images: [String],
    date: Date,
    endDate: Date,
    dates: [Date],
    endDates: [Date],
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

const addEndDates = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Adventure model
    const Adventure = mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema);

    // Find all adventures that don't have endDate set
    const adventures = await Adventure.find({
      $or: [
        { endDate: { $exists: false } },
        { endDate: null }
      ]
    });

    console.log(`Found ${adventures.length} adventures without end dates`);

    // Update each adventure to add end dates
    for (const adventure of adventures) {
      // Add 1 day to the start date to create an end date
      if (adventure.date) {
        const endDate = new Date(adventure.date);
        endDate.setDate(endDate.getDate() + 1);
        endDate.setHours(12, 0, 0, 0); // Set to noon
        adventure.endDate = endDate;
      }

      // If there are additional dates but no endDates, create them
      if (adventure.dates && adventure.dates.length > 0 && 
          (!adventure.endDates || adventure.endDates.length === 0)) {
        adventure.endDates = adventure.dates.map((date: Date) => {
          const endDate = new Date(date);
          endDate.setDate(endDate.getDate() + 1);
          endDate.setHours(12, 0, 0, 0); // Set to noon
          return endDate;
        });
      }

      // Save the updated adventure
      await adventure.save();
      console.log(`Updated adventure: ${adventure.title}`);
    }

    console.log('Migration completed successfully');
    process.exit(0);
  } catch (error) {
    console.error('Error in migration:', error);
    process.exit(1);
  }
};

// Run the migration
addEndDates(); 
