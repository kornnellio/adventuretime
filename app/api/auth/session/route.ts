import { getServerSession } from 'next-auth/next';
import { authOptions } from '../authOptions';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return NextResponse.json({ 
        user: null,
        message: 'Not authenticated' 
      });
    }
    
    // Return the session user data
    return NextResponse.json({ 
      user: session.user,
      message: 'Authenticated' 
    });
  } catch (error) {
    console.error('Error fetching session:', error);
    return NextResponse.json(
      { error: 'Failed to fetch session' },
      { status: 500 }
    );
  }
} 