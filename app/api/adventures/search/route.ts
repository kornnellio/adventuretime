import { NextRequest, NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Adventure from '@/lib/models/adventure';

export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get('q');

  if (!query) {
    return NextResponse.json({ error: 'Search query is required' }, { status: 400 });
  }

  try {
    await dbConnect();
    
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
    
    return NextResponse.json(processedAdventures);
  } catch (error) {
    console.error('Adventure search error:', error);
    return NextResponse.json({ error: 'Failed to search adventures' }, { status: 500 });
  }
} 