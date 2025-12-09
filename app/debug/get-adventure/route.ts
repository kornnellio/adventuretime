import { NextResponse } from 'next/server';
import dbConnect from '@/lib/db';
import Adventure from '@/lib/models/adventure';

export async function GET() {
  try {
    await dbConnect();
    
    // Find the first adventure in the database
    const adventure = await Adventure.findOne().sort({ createdAt: 1 });
    
    if (!adventure) {
      return NextResponse.json(
        { error: 'No adventures found in the database' },
        { status: 404 }
      );
    }
    
    return NextResponse.json({
      success: true,
      adventureId: adventure._id.toString(),
      title: adventure.title
    });
  } catch (error) {
    console.error('Error fetching adventure:', error);
    return NextResponse.json(
      { error: 'Failed to fetch adventure' },
      { status: 500 }
    );
  }
} 