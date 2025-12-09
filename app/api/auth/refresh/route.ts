import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../authOptions';

export async function GET() {
  try {
    // Get the current session
    const session = await getServerSession(authOptions);
    
    // Create the response
    const response = NextResponse.json({ 
      authenticated: !!session,
      session: session ? {
        user: session.user,
        expires: session.expires
      } : null
    });
    
    // Add cache control headers to prevent frequent calls
    // Cache for 5 seconds to prevent hammering the endpoint
    response.headers.set('Cache-Control', 'public, max-age=5');
    
    return response;
  } catch (error) {
    console.error('Error refreshing session:', error);
    return NextResponse.json(
      { error: 'Failed to refresh session' },
      { status: 500 }
    );
  }
} 