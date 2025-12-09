import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

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
    price: Number,
    includedItems: [String],
    additionalInfo: [String],
    location: String,
    difficulty: String,
    duration: {
      value: Number,
      unit: String,
    },
    description: String,
    shortDescription: String,
    longDescription: String,
    advancePaymentPercentage: Number,
  },
  {
    timestamps: true,
  }
);

const migrateDescriptions = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    // Create Adventure model
    const Adventure = mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema);

    // Find all adventures that have a description but are missing shortDescription or longDescription
    const adventures = await Adventure.find({
      description: { $exists: true, $ne: null },
      $or: [
        { shortDescription: { $exists: false } },
        { shortDescription: null },
        { shortDescription: '' },
        { longDescription: { $exists: false } },
        { longDescription: null },
        { longDescription: '' }
      ]
    });

    console.log(`Found ${adventures.length} adventures to migrate`);

    // Update each adventure
    for (const adventure of adventures) {
      // Get the existing description
      const currentDescription = adventure.description;
      
      // Extract first paragraph for short description (if more than one paragraph exists)
      const paragraphs = currentDescription.split(/(?:<\/p>\s*<p>|<br\s*\/?>\s*<br\s*\/?>)/);
      
      // Set shortDescription to first paragraph (or full description if only one paragraph)
      const shortDesc = paragraphs.length > 1 
        ? paragraphs[0] 
        : currentDescription;
        
      // Set longDescription to the full original description
      const longDesc = currentDescription;
      
      // Update the adventure
      await Adventure.updateOne(
        { _id: adventure._id },
        { 
          $set: { 
            shortDescription: shortDesc, 
            longDescription: longDesc 
          }
        }
      );
      
      console.log(`Migrated description for adventure: ${adventure.title}`);
    }

    console.log('Migration completed successfully!');
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error during migration:', error);
    
    // Disconnect from MongoDB
    if (mongoose.connection.readyState !== 0) {
      await mongoose.disconnect();
      console.log('Disconnected from MongoDB');
    }
    
    process.exit(1);
  }
};

// Run the migration
migrateDescriptions(); 