import mongoose from 'mongoose';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { faker } from '@faker-js/faker';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

// Define schemas directly in this file to avoid import issues
const AdventureSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the adventure'],
      trim: true,
    },
    images: {
      type: [String],
      required: [true, 'Please provide at least one image for the adventure'],
    },
    date: {
      type: Date,
      required: [true, 'Please provide a date for the adventure'],
    },
    price: {
      type: Number,
      required: [true, 'Please provide a price for the adventure'],
      min: 0,
    },
    includedItems: {
      type: [String],
      default: [],
    },
    additionalInfo: {
      type: [String],
      default: [],
    },
    location: {
      type: String,
      required: [true, 'Please provide a location for the adventure'],
      trim: true,
    },
    difficulty: {
      type: String,
      enum: ['easy', 'moderate', 'hard', 'extreme'],
      required: [true, 'Please provide a difficulty level for the adventure'],
    },
    duration: {
      value: {
        type: Number,
        required: [true, 'Please provide a duration value'],
        min: 1,
      },
      unit: {
        type: String,
        enum: ['hours', 'days'],
        required: [true, 'Please specify if the duration is in hours or days'],
      },
    },
    shortDescription: {
      type: String,
      required: [true, 'Please provide a short description for the adventure'],
    },
    longDescription: {
      type: String,
      required: [true, 'Please provide a detailed description for the adventure'],
    },
    description: {
      type: String,
      required: false,
    },
    advancePaymentPercentage: {
      type: Number,
      required: [true, 'Please provide the advance payment percentage'],
      min: 0,
      max: 100,
      default: 30,
    },
  },
  {
    timestamps: true,
  }
);

const BlogSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide a title for the blog post'],
      trim: true,
    },
    slug: {
      type: String,
      required: true,
      unique: true,
    },
    image: {
      type: String,
      required: [true, 'Please provide an image for the blog post'],
    },
    author: {
      id: {
        type: String,
        required: [true, 'Author ID is required'],
      },
      name: {
        type: String,
        required: [true, 'Author name is required'],
      },
    },
    content: {
      type: String,
      required: [true, 'Please provide content for the blog post'],
    },
    tags: {
      type: [String],
      default: [],
    },
  },
  {
    timestamps: true,
  }
);

// Create models
const Adventure = mongoose.models.Adventure || mongoose.model('Adventure', AdventureSchema);
const Blog = mongoose.models.Blog || mongoose.model('Blog', BlogSchema);

const MONGODB_URI = process.env.MONGODB_URI as string;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable in .env.local');
}

// Generate random adventure data
const generateAdventures = (count: number) => {
  const difficulties = ['easy', 'moderate', 'hard', 'extreme'];
  const durationUnits = ['hours', 'days'];
  const locations = [
    'Mount Everest Base Camp, Nepal',
    'Grand Canyon, Arizona',
    'Amazon Rainforest, Brazil',
    'Sahara Desert, Morocco',
    'Great Barrier Reef, Australia',
    'Patagonia, Argentina',
    'Machu Picchu, Peru',
    'Serengeti National Park, Tanzania',
    'Banff National Park, Canada',
    'Fjords, Norway'
  ];

  // Define fixed image dimensions for better Next.js Image compatibility
  const imageSizes = [
    { width: 800, height: 600 },
    { width: 900, height: 700 },
    { width: 1000, height: 800 }
  ];

  const adventures = [];

  for (let i = 0; i < count; i++) {
    // Generate image URLs with fixed dimensions
    const adventureImages = imageSizes.map((size, index) => 
      `https://loremflickr.com/${size.width}/${size.height}/nature,adventure,landscape/${faker.number.int({ min: 1000, max: 9999 })}`
    );

    const adventure = {
      title: faker.commerce.productName() + ' Adventure',
      images: adventureImages,
      date: faker.date.future(),
      price: faker.number.int({ min: 100, max: 5000 }),
      includedItems: [
        'Professional guide',
        'Safety equipment',
        'Meals during the adventure',
        'Transportation from meeting point',
        'First aid kit'
      ],
      additionalInfo: [
        'Participants must be at least 18 years old',
        'Basic fitness level required',
        'Bring appropriate clothing and footwear',
        'Personal travel insurance recommended',
        'Subject to weather conditions'
      ],
      location: faker.helpers.arrayElement(locations),
      difficulty: faker.helpers.arrayElement(difficulties) as 'easy' | 'moderate' | 'hard' | 'extreme',
      duration: {
        value: faker.number.int({ min: 1, max: 14 }),
        unit: faker.helpers.arrayElement(durationUnits) as 'hours' | 'days'
      },
      shortDescription: faker.lorem.paragraphs(2),
      longDescription: faker.lorem.paragraphs(5),
      advancePaymentPercentage: faker.number.int({ min: 10, max: 50 })
    };

    adventures.push(adventure);
  }

  return adventures;
};

// Generate random blog data
const generateBlogs = (count: number) => {
  const tags = [
    'adventure', 'travel', 'hiking', 'camping', 'outdoors', 
    'nature', 'wildlife', 'photography', 'tips', 'gear', 
    'survival', 'expedition', 'mountains', 'ocean', 'desert'
  ];

  const blogs = [];

  for (let i = 0; i < count; i++) {
    // Generate 1-5 random tags without duplicates
    const randomTags = faker.helpers.arrayElements(
      tags, 
      faker.number.int({ min: 1, max: 5 })
    );

    const title = faker.lorem.sentence();
    // Generate a slug from the title
    const slug = title
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-') + '-' + faker.string.alphanumeric(6);

    // Use fixed dimensions for blog images
    const featuredImageId = faker.number.int({ min: 1000, max: 9999 });
    const contentImageId = faker.number.int({ min: 1000, max: 9999 });

    const blog = {
      title,
      slug,
      image: `https://loremflickr.com/1200/800/nature,travel/${featuredImageId}`,
      author: {
        id: new mongoose.Types.ObjectId().toString(),
        name: faker.person.fullName()
      },
      content: `
        <h2>${faker.lorem.sentence()}</h2>
        <p>${faker.lorem.paragraphs(2)}</p>
        <h3>${faker.lorem.sentence()}</h3>
        <p>${faker.lorem.paragraphs(1)}</p>
        <img src="https://loremflickr.com/800/600/nature,travel/${contentImageId}" alt="Blog image" width="800" height="600" />
        <p>${faker.lorem.paragraphs(2)}</p>
        <h3>${faker.lorem.sentence()}</h3>
        <ul>
          <li>${faker.lorem.sentence()}</li>
          <li>${faker.lorem.sentence()}</li>
          <li>${faker.lorem.sentence()}</li>
        </ul>
        <p>${faker.lorem.paragraphs(1)}</p>
      `,
      tags: randomTags
    };

    blogs.push(blog);
  }

  return blogs;
};

// Seed the database
const seedDatabase = async () => {
  try {
    // Connect to MongoDB
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');
    
    // Clear existing data
    await Adventure.deleteMany({});
    await Blog.deleteMany({});
    
    console.log('Existing data cleared');

    // Generate and insert new data
    const adventures = generateAdventures(10);
    const blogs = generateBlogs(15);

    await Adventure.insertMany(adventures);
    await Blog.insertMany(blogs);

    console.log('Database seeded successfully!');
    console.log(`Added ${adventures.length} adventures and ${blogs.length} blog posts`);
    
    // Disconnect from MongoDB
    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
    
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    await mongoose.disconnect();
    process.exit(1);
  }
};

// Run the seed function
seedDatabase(); 
