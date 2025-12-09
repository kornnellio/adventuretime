# Adventure Time Seed Scripts

This directory contains scripts for seeding the database with test data.

## Seed Data Script

The `seed-data.ts` script populates the database with dummy adventure and blog data for development and testing purposes.

### What it does

- Connects to the MongoDB database using the connection string from `.env.local`
- Clears existing adventure and blog data
- Generates 10 random adventure entries with realistic data
- Generates 15 random blog posts with formatted content
- Inserts the data into the database

### How to use

Run the script using npm:

```bash
npm run seed
```

This will:
1. Connect to your MongoDB database
2. Clear any existing adventure and blog data
3. Generate and insert new random data
4. Disconnect from the database

### Generated Data

#### Adventures

Each adventure includes:
- Title
- Multiple images
- Future date
- Price
- Included items
- Additional information
- Location (from a list of popular adventure destinations)
- Difficulty level (easy, moderate, hard, or extreme)
- Duration (in hours or days)
- Detailed description
- Advance payment percentage

#### Blog Posts

Each blog post includes:
- Title
- URL-friendly slug
- Featured image
- Author information
- Rich HTML content with headings, paragraphs, lists, and images
- Tags (1-5 random tags from a predefined list)

### Customization

You can modify the script to:
- Change the number of adventures or blog posts generated
- Adjust the data ranges (prices, dates, etc.)
- Modify the content templates
- Add or remove fields

To change the number of items generated, modify these lines in the `seedDatabase` function:

```typescript
const adventures = generateAdventures(10); // Change 10 to your desired number
const blogs = generateBlogs(15); // Change 15 to your desired number
``` 